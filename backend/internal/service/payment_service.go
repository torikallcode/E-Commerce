package service

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"math"
	"strconv"
	"time"

	"ecommerce/backend/internal/apperror"
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/model"
	"ecommerce/backend/internal/repository"
	"ecommerce/backend/pkg/midtrans"
)

type PaymentService interface {
	HandleNotification(req *dto.PaymentNotificationRequest) error
	GetPaymentStatus(userID uint, orderNumber string) (*dto.PaymentStatusResponse, error)
	ExpirePendingOrders() (int, error)
	DevSettle(userID uint, orderNumber string) error
	RunExpiryWorker(ctx context.Context, interval time.Duration)
}

type paymentService struct {
	uow           repository.UnitOfWork
	orderRepo     repository.OrderRepository
	orderItemRepo repository.OrderItemRepository
	paymentRepo   repository.PaymentRepository
	productRepo   repository.ProductRepository
	gateway       midtrans.Gateway
}

func NewPaymentService(
	uow repository.UnitOfWork,
	orderRepo repository.OrderRepository,
	orderItemRepo repository.OrderItemRepository,
	paymentRepo repository.PaymentRepository,
	productRepo repository.ProductRepository,
	gateway midtrans.Gateway,
) PaymentService {
	return &paymentService{
		uow:           uow,
		orderRepo:     orderRepo,
		orderItemRepo: orderItemRepo,
		paymentRepo:   paymentRepo,
		productRepo:   productRepo,
		gateway:       gateway,
	}
}

// MapMidtransStatus maps a Midtrans transaction status to an order status.
// An empty result means the order status must not change.
func MapMidtransStatus(transactionStatus, fraudStatus string) string {
	switch transactionStatus {
	case "pending":
		return ""
	case "capture":
		switch fraudStatus {
		case "accept":
			return model.StatusPaid
		case "challenge":
			return model.StatusPendingReview
		default:
			return ""
		}
	case "settlement":
		return model.StatusPaid
	case "deny":
		return model.StatusFailed
	case "cancel":
		return model.StatusCancelled
	case "expire":
		return model.StatusExpired
	case "refund", "partial_refund":
		return model.StatusRefunded
	default:
		return ""
	}
}

func (s *paymentService) HandleNotification(req *dto.PaymentNotificationRequest) error {
	raw := []byte(req.RawPayload)
	if len(raw) == 0 {
		// Non-HTTP callers, such as a future reconciliation job, do not have a
		// raw request body. Keep their audit record useful as well.
		raw, _ = json.Marshal(req)
	}

	// Always persist the raw notification for audit purposes, even when invalid.
	if err := s.paymentRepo.CreateNotification(&model.PaymentNotification{
		MidtransOrderID: req.OrderID,
		Payload:         string(raw),
		ReceivedAt:      time.Now(),
	}); err != nil {
		log.Printf("payment: gagal menyimpan audit notifikasi %s: %v", req.OrderID, err)
	}

	if s.gateway == nil || !s.gateway.VerifySignature(req.OrderID, req.StatusCode, req.GrossAmount, req.SignatureKey) {
		return apperror.New(apperror.ErrCodeUnauthorized, "Signature notifikasi tidak valid", 401, nil)
	}

	err := s.uow.Do(func(tx *repository.TxRepos) error {
		payment, err := tx.Payments.GetByMidtransOrderIDForUpdate(req.OrderID)
		if err != nil {
			return apperror.New(apperror.ErrCodeNotFound, "Data pembayaran tidak ditemukan", 404, err)
		}

		grossAmount, err := strconv.ParseFloat(req.GrossAmount, 64)
		if err != nil || math.Abs(grossAmount-payment.GrossAmount) > 0.01 {
			return apperror.New(apperror.ErrCodePayment, "Nominal pembayaran tidak sesuai", 400, nil)
		}

		payment.SignatureValid = true
		payment.RawNotification = string(raw)
		payment.TransactionID = req.TransactionID
		payment.PaymentType = req.PaymentType
		payment.TransactionStatus = req.TransactionStatus
		payment.FraudStatus = req.FraudStatus
		payment.GrossAmount = grossAmount

		return s.applyStatus(tx, payment, MapMidtransStatus(req.TransactionStatus, req.FraudStatus))
	})
	if err != nil {
		var appErr *apperror.AppError
		if errors.As(err, &appErr) {
			return appErr
		}
		return apperror.New(apperror.ErrCodeInternal, "Gagal memproses notifikasi pembayaran", 500, err)
	}
	return nil
}

func (s *paymentService) GetPaymentStatus(userID uint, orderNumber string) (*dto.PaymentStatusResponse, error) {
	order, err := s.orderRepo.GetByOrderNumber(orderNumber)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Pesanan tidak ditemukan", 404, err)
	}
	if order.UserID != userID {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Pesanan tidak ditemukan", 404, nil)
	}

	payment, err := s.paymentRepo.GetByOrderID(order.ID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Data pembayaran tidak ditemukan", 404, err)
	}

	resp := &dto.PaymentStatusResponse{
		OrderNumber:       order.OrderNumber,
		OrderStatus:       order.Status,
		TransactionStatus: payment.TransactionStatus,
		FraudStatus:       payment.FraudStatus,
		PaymentType:       payment.PaymentType,
	}
	if payment.PaidAt != nil {
		paid := payment.PaidAt.Format(time.RFC3339)
		resp.PaidAt = &paid
	}
	if order.PaymentExpiresAt != nil {
		expires := order.PaymentExpiresAt.Format(time.RFC3339)
		resp.ExpiresAt = &expires
	}
	return resp, nil
}

// ExpirePendingOrders marks unpaid orders past their expiry as expired and returns
// their reserved stock. If Midtrans is configured, the transaction status is
// re-checked first so a late settlement is not incorrectly expired.
func (s *paymentService) ExpirePendingOrders() (int, error) {
	orders, err := s.orderRepo.GetExpiredPending(50)
	if err != nil {
		return 0, err
	}

	expired := 0
	for _, order := range orders {
		if s.gateway != nil && s.gateway.Enabled() {
			if status, err := s.gateway.GetStatus(order.OrderNumber); err == nil && status != nil {
				target := MapMidtransStatus(status.TransactionStatus, status.FraudStatus)
				if target == model.StatusPaid || target == model.StatusPendingReview || target == model.StatusFailed ||
					target == model.StatusCancelled || target == model.StatusExpired || target == model.StatusRefunded {
					if err := s.syncFromGateway(order.OrderNumber, status); err != nil {
						log.Printf("expiry: gagal sinkronisasi status %s: %v", order.OrderNumber, err)
					} else {
						expired++
					}
					continue
				}
			}
		}

		if err := s.expireOrder(order.OrderNumber); err != nil {
			log.Printf("expiry: gagal mengakhiri pesanan %s: %v", order.OrderNumber, err)
			continue
		}
		expired++
	}
	return expired, nil
}

func (s *paymentService) syncFromGateway(orderNumber string, status *midtrans.StatusResult) error {
	return s.uow.Do(func(tx *repository.TxRepos) error {
		payment, err := tx.Payments.GetByMidtransOrderIDForUpdate(orderNumber)
		if err != nil {
			return err
		}
		payment.TransactionID = status.TransactionID
		payment.PaymentType = status.PaymentType
		payment.TransactionStatus = status.TransactionStatus
		payment.FraudStatus = status.FraudStatus
		return s.applyStatus(tx, payment, MapMidtransStatus(status.TransactionStatus, status.FraudStatus))
	})
}

func (s *paymentService) expireOrder(orderNumber string) error {
	return s.uow.Do(func(tx *repository.TxRepos) error {
		order, err := tx.Orders.GetByOrderNumberForUpdate(orderNumber)
		if err != nil {
			return err
		}
		if order.Status != model.StatusPendingPayment {
			return nil
		}

		items, err := tx.OrderItems.GetByOrderID(order.ID)
		if err != nil {
			return err
		}
		for _, item := range items {
			if err := tx.Products.IncrementStock(item.ProductID, item.Quantity); err != nil {
				return err
			}
		}

		updated, err := tx.Orders.UpdateStatus(order.ID, model.StatusPendingPayment, model.StatusExpired, "")
		if err != nil {
			return err
		}
		if !updated {
			return repository.ErrNoRowsAffected
		}

		if payment, err := tx.Payments.GetByOrderID(order.ID); err == nil {
			payment.TransactionStatus = "expire"
			_ = tx.Payments.Update(payment)
		}
		return nil
	})
}

func (s *paymentService) applyStatus(tx *repository.TxRepos, payment *model.Payment, target string) error {
	if target == "" {
		return tx.Payments.Update(payment)
	}

	order, err := tx.Orders.GetByIDForUpdate(payment.OrderID)
	if err != nil {
		return apperror.New(apperror.ErrCodeNotFound, "Pesanan tidak ditemukan", 404, err)
	}

	// Idempotency: the same (or an older) notification must not apply twice.
	if order.Status == target || !model.CanTransition(order.Status, target) {
		return tx.Payments.Update(payment)
	}

	if model.ReleasesStock(order.Status, target) {
		items, err := tx.OrderItems.GetByOrderID(order.ID)
		if err != nil {
			return err
		}
		for _, item := range items {
			if err := tx.Products.IncrementStock(item.ProductID, item.Quantity); err != nil {
				return err
			}
		}
	}

	updated, err := tx.Orders.UpdateStatus(order.ID, order.Status, target, "")
	if err != nil {
		return err
	}
	if !updated {
		// Another process already moved the order; keep the payment update consistent.
		return tx.Payments.Update(payment)
	}

	if target == model.StatusPaid {
		now := time.Now()
		payment.PaidAt = &now
	}
	return tx.Payments.Update(payment)
}

// DevSettle simulates a successful payment. It must only be registered when
// Midtrans is not configured and the app runs in development mode.
func (s *paymentService) DevSettle(userID uint, orderNumber string) error {
	return s.uow.Do(func(tx *repository.TxRepos) error {
		order, err := tx.Orders.GetByOrderNumberForUpdate(orderNumber)
		if err != nil {
			return apperror.New(apperror.ErrCodeNotFound, "Pesanan tidak ditemukan", 404, err)
		}
		if order.UserID != userID {
			return apperror.New(apperror.ErrCodeNotFound, "Pesanan tidak ditemukan", 404, nil)
		}
		if order.Status == model.StatusPaid {
			return nil
		}
		if order.Status != model.StatusPendingPayment {
			return apperror.New(apperror.ErrCodeBadRequest, "Pesanan tidak dapat dibayar pada status ini", 400, nil)
		}

		payment, err := tx.Payments.GetByOrderID(order.ID)
		if err != nil {
			return apperror.New(apperror.ErrCodeNotFound, "Data pembayaran tidak ditemukan", 404, err)
		}

		updated, err := tx.Orders.UpdateStatus(order.ID, model.StatusPendingPayment, model.StatusPaid, "")
		if err != nil {
			return err
		}
		if !updated {
			return apperror.New(apperror.ErrCodeConflict, "Status pesanan telah berubah", 409, nil)
		}

		now := time.Now()
		payment.TransactionStatus = "settlement"
		payment.PaymentType = "development"
		payment.PaidAt = &now
		payment.SignatureValid = true
		return tx.Payments.Update(payment)
	})
}

func (s *paymentService) RunExpiryWorker(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			count, err := s.ExpirePendingOrders()
			if err != nil {
				log.Printf("expiry worker: %v", err)
			} else if count > 0 {
				log.Printf("expiry worker: %d pesanan diproses", count)
			}
		}
	}
}
