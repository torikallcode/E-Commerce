package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"time"

	"ecommerce/backend/internal/apperror"
	"ecommerce/backend/internal/config"
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/model"
	"ecommerce/backend/internal/repository"
	"ecommerce/backend/pkg/mailer"
	"ecommerce/backend/pkg/midtrans"
	"ecommerce/backend/pkg/util"

	"gorm.io/gorm"
)

type OrderService interface {
	Checkout(userID uint, req *dto.CheckoutRequest) (*dto.OrderResponse, error)
	ListByUserID(userID uint, status string, page, perPage int) (*dto.OrderListResponse, error)
	GetByID(userID uint, orderNumber string) (*dto.OrderResponse, error)
	Cancel(userID uint, orderNumber string) error
	ListAll(status, q string, page, perPage int) (*dto.OrderListResponse, error)
	GetByIDAdmin(id uint) (*dto.OrderResponse, error)
	UpdateStatus(id uint, req *dto.UpdateOrderStatusRequest) error
}

type orderService struct {
	uow          repository.UnitOfWork
	orderRepo    repository.OrderRepository
	orderItemRepo repository.OrderItemRepository
	cartRepo     repository.CartRepository
	productRepo  repository.ProductRepository
	paymentRepo  repository.PaymentRepository
	addressRepo  repository.AddressRepository
	userRepo     repository.UserRepository
	gateway      midtrans.Gateway
	cfg          config.OrderConfig
	frontendURL  string
	mailer       *mailer.Client
	mailerEnabled bool
}

func NewOrderService(
	uow repository.UnitOfWork,
	orderRepo repository.OrderRepository,
	orderItemRepo repository.OrderItemRepository,
	cartRepo repository.CartRepository,
	productRepo repository.ProductRepository,
	paymentRepo repository.PaymentRepository,
	addressRepo repository.AddressRepository,
	userRepo repository.UserRepository,
	gateway midtrans.Gateway,
	cfg config.OrderConfig,
	frontendURL string,
	mailerClient *mailer.Client,
	mailerEnabled bool,
) OrderService {
	return &orderService{
		uow:           uow,
		orderRepo:     orderRepo,
		orderItemRepo: orderItemRepo,
		cartRepo:      cartRepo,
		productRepo:   productRepo,
		paymentRepo:   paymentRepo,
		addressRepo:   addressRepo,
		userRepo:      userRepo,
		gateway:       gateway,
		cfg:           cfg,
		frontendURL:   frontendURL,
		mailer:        mailerClient,
		mailerEnabled: mailerEnabled,
	}
}

func (s *orderService) Checkout(userID uint, req *dto.CheckoutRequest) (*dto.OrderResponse, error) {
	address, err := s.addressRepo.GetByID(req.AddressID, userID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeBadRequest, "Alamat pengiriman tidak ditemukan", 400, err)
	}

	cart, err := s.cartRepo.GetByUserID(userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.New(apperror.ErrCodeBadRequest, "Keranjang belanja kosong", 400, nil)
	}
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil keranjang", 500, err)
	}

	cartItems, err := s.cartRepo.GetItems(cart.ID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil item keranjang", 500, err)
	}
	if len(cartItems) == 0 {
		return nil, apperror.New(apperror.ErrCodeBadRequest, "Keranjang belanja kosong", 400, nil)
	}

	snapshotBytes, err := json.Marshal(dto.AddressSnapshot{
		RecipientName: address.RecipientName,
		Phone:         address.Phone,
		AddressLine:   address.AddressLine,
		City:          address.City,
		Province:      address.Province,
		PostalCode:    address.PostalCode,
	})
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal menyimpan alamat pengiriman", 500, err)
	}

	now := time.Now()
	orderNumber := util.GenerateOrderNumber(now)
	var (
		order      *model.Order
		orderItems []*model.OrderItem
		payment    *model.Payment
	)

	err = s.uow.Do(func(tx *repository.TxRepos) error {
		subtotal := float64(0)
		pendingItems := make([]*model.OrderItem, 0, len(cartItems))

		for _, cartItem := range cartItems {
			product, err := tx.Products.GetByID(cartItem.ProductID)
			if err != nil {
				return apperror.New(apperror.ErrCodeBadRequest, "Produk dalam keranjang tidak ditemukan", 400, err)
			}
			if !product.IsActive {
				return apperror.New(apperror.ErrCodeBadRequest, fmt.Sprintf("Produk %s sudah tidak tersedia", product.Name), 400, nil)
			}
			if cartItem.Quantity <= 0 {
				return apperror.New(apperror.ErrCodeBadRequest, "Jumlah produk tidak valid", 400, nil)
			}

			unitPrice := math.Round(product.Price)
			lineTotal := unitPrice * float64(cartItem.Quantity)
			subtotal += lineTotal

			pendingItems = append(pendingItems, &model.OrderItem{
				ProductID:   product.ID,
				ProductName: product.Name,
				Price:       unitPrice,
				Quantity:    cartItem.Quantity,
				Subtotal:    lineTotal,
			})
		}

		shippingCost := s.calculateShipping(subtotal)
		total := subtotal + shippingCost

		expiresAt := now.Add(s.cfg.PaymentExpiry)
		order = &model.Order{
			OrderNumber:      orderNumber,
			UserID:           userID,
			AddressSnapshot:  string(snapshotBytes),
			Subtotal:         subtotal,
			ShippingCost:     shippingCost,
			TotalAmount:      total,
			Status:           model.StatusPendingPayment,
			PaymentExpiresAt: &expiresAt,
		}
		if err := tx.Orders.Create(order); err != nil {
			return apperror.New(apperror.ErrCodeInternal, "Gagal membuat pesanan", 500, err)
		}

		for _, item := range pendingItems {
			if err := tx.Products.DecrementStock(item.ProductID, item.Quantity); err != nil {
				if errors.Is(err, repository.ErrInsufficientStock) {
					return apperror.New(apperror.ErrCodeBadRequest,
						fmt.Sprintf("Stok produk %s tidak mencukupi", item.ProductName), 400, nil)
				}
				return apperror.New(apperror.ErrCodeInternal, "Gagal mengurangi stok produk", 500, err)
			}
			item.OrderID = order.ID
			if err := tx.OrderItems.Create(item); err != nil {
				return apperror.New(apperror.ErrCodeInternal, "Gagal menyimpan item pesanan", 500, err)
			}
		}

		payment = &model.Payment{
			OrderID:          order.ID,
			MidtransOrderID:  order.OrderNumber,
			GrossAmount:      total,
			SnapToken:        "",
			RawNotification:  "[]",
		}
		if err := tx.Payments.Create(payment); err != nil {
			return apperror.New(apperror.ErrCodeInternal, "Gagal membuat data pembayaran", 500, err)
		}

		if err := tx.Carts.Clear(cart.ID); err != nil {
			return apperror.New(apperror.ErrCodeInternal, "Gagal mengosongkan keranjang", 500, err)
		}

		orderItems = pendingItems
		return nil
	})
	if err != nil {
		var appErr *apperror.AppError
		if errors.As(err, &appErr) {
			return nil, appErr
		}
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal membuat pesanan", 500, err)
	}

	response := s.buildOrderResponse(order, orderItems, payment)

	if s.gateway != nil && s.gateway.Enabled() {
		snapItems := make([]midtrans.SnapItem, 0, len(orderItems)+1)
		for _, item := range orderItems {
			snapItems = append(snapItems, midtrans.SnapItem{
				ID:       fmt.Sprintf("P-%d", item.ProductID),
				Name:     item.ProductName,
				Price:    int64(math.Round(item.Price)),
				Quantity: int32(item.Quantity),
			})
		}
		if order.ShippingCost > 0 {
			snapItems = append(snapItems, midtrans.SnapItem{
				ID:       "SHIPPING",
				Name:     "Ongkos Kirim",
				Price:    int64(math.Round(order.ShippingCost)),
				Quantity: 1,
			})
		}

		user, _ := s.userRepo.GetByID(userID)
		var email string
		if user != nil {
			email = user.Email
		}

		result, snapErr := s.gateway.CreateSnapTransaction(midtrans.SnapInput{
			OrderID:       order.OrderNumber,
			GrossAmount:   int64(math.Round(order.TotalAmount)),
			Items:         snapItems,
			CustomerName:  address.RecipientName,
			CustomerEmail: email,
			CustomerPhone: address.Phone,
			FinishURL:     s.frontendURL + "/orders/" + order.OrderNumber,
			ExpiryMinutes: int64(s.cfg.PaymentExpiry.Minutes()),
		})
		if snapErr != nil {
			log.Printf("checkout: gagal membuat transaksi midtrans untuk %s: %v", order.OrderNumber, snapErr)
			s.failOrder(order)
			return nil, apperror.New(apperror.ErrCodePayment, "Gagal membuat transaksi pembayaran, silakan coba lagi", 502, snapErr)
		}

		payment.SnapToken = result.Token
		payment.SnapRedirectURL = result.RedirectURL
		if err := s.paymentRepo.Update(payment); err != nil {
			log.Printf("checkout: gagal menyimpan snap token untuk %s: %v", order.OrderNumber, err)
		}
		response.SnapToken = result.Token
		response.SnapRedirectURL = result.RedirectURL
	} else {
		// Development fallback: allow the flow to be exercised without Midtrans credentials.
		response.DevMode = true
		response.SnapRedirectURL = fmt.Sprintf("%s/payment/demo?order=%s", s.frontendURL, order.OrderNumber)
	}

	s.sendOrderEmail(order, "pending_payment")
	return response, nil
}

func (s *orderService) ListByUserID(userID uint, status string, page, perPage int) (*dto.OrderListResponse, error) {
	page, perPage = normalizePagination(page, perPage)
	orders, total, err := s.orderRepo.ListByUserID(userID, status, page, perPage)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil daftar pesanan", 500, err)
	}

	items := make([]dto.OrderResponse, 0, len(orders))
	for _, order := range orders {
		orderItems, _ := s.orderItemRepo.GetByOrderID(order.ID)
		payment, _ := s.paymentRepo.GetByOrderID(order.ID)
		items = append(items, *s.buildOrderResponse(order, orderItems, payment))
	}

	return &dto.OrderListResponse{
		Items:      items,
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: totalPages(total, perPage),
	}, nil
}

func (s *orderService) GetByID(userID uint, orderNumber string) (*dto.OrderResponse, error) {
	order, err := s.orderRepo.GetByOrderNumber(orderNumber)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Pesanan tidak ditemukan", 404, err)
	}
	if order.UserID != userID {
		// Do not reveal the existence of another user's order (IDOR protection).
		return nil, apperror.New(apperror.ErrCodeNotFound, "Pesanan tidak ditemukan", 404, nil)
	}

	items, err := s.orderItemRepo.GetByOrderID(order.ID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil item pesanan", 500, err)
	}
	payment, _ := s.paymentRepo.GetByOrderID(order.ID)
	return s.buildOrderResponse(order, items, payment), nil
}

func (s *orderService) Cancel(userID uint, orderNumber string) error {
	var cancelled bool

	err := s.uow.Do(func(tx *repository.TxRepos) error {
		order, err := tx.Orders.GetByOrderNumberForUpdate(orderNumber)
		if err != nil {
			return apperror.New(apperror.ErrCodeNotFound, "Pesanan tidak ditemukan", 404, err)
		}
		if order.UserID != userID {
			return apperror.New(apperror.ErrCodeNotFound, "Pesanan tidak ditemukan", 404, nil)
		}
		if order.Status != model.StatusPendingPayment {
			return apperror.New(apperror.ErrCodeBadRequest, "Pesanan hanya dapat dibatalkan sebelum dibayar", 400, nil)
		}

		items, err := tx.OrderItems.GetByOrderID(order.ID)
		if err != nil {
			return apperror.New(apperror.ErrCodeInternal, "Gagal mengambil item pesanan", 500, err)
		}
		for _, item := range items {
			if err := tx.Products.IncrementStock(item.ProductID, item.Quantity); err != nil {
				return apperror.New(apperror.ErrCodeInternal, "Gagal mengembalikan stok produk", 500, err)
			}
		}

		updated, err := tx.Orders.UpdateStatus(order.ID, model.StatusPendingPayment, model.StatusCancelled, "")
		if err != nil {
			return apperror.New(apperror.ErrCodeInternal, "Gagal membatalkan pesanan", 500, err)
		}
		if !updated {
			return apperror.New(apperror.ErrCodeConflict, "Status pesanan telah berubah, silakan muat ulang", 409, nil)
		}

		if payment, err := tx.Payments.GetByOrderID(order.ID); err == nil {
			payment.TransactionStatus = "cancel"
			_ = tx.Payments.Update(payment)
		}
		cancelled = true
		return nil
	})
	if err != nil {
		var appErr *apperror.AppError
		if errors.As(err, &appErr) {
			return appErr
		}
		return apperror.New(apperror.ErrCodeInternal, "Gagal membatalkan pesanan", 500, err)
	}

	if cancelled && s.gateway != nil && s.gateway.Enabled() {
		_ = s.gateway.ExpireTransaction(orderNumber)
	}
	return nil
}

func (s *orderService) ListAll(status, q string, page, perPage int) (*dto.OrderListResponse, error) {
	page, perPage = normalizePagination(page, perPage)
	orders, total, err := s.orderRepo.ListAll(status, q, page, perPage)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil daftar pesanan", 500, err)
	}

	items := make([]dto.OrderResponse, 0, len(orders))
	for _, order := range orders {
		orderItems, _ := s.orderItemRepo.GetByOrderID(order.ID)
		payment, _ := s.paymentRepo.GetByOrderID(order.ID)
		items = append(items, *s.buildOrderResponse(order, orderItems, payment))
	}

	return &dto.OrderListResponse{
		Items:      items,
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: totalPages(total, perPage),
	}, nil
}

func (s *orderService) GetByIDAdmin(id uint) (*dto.OrderResponse, error) {
	order, err := s.orderRepo.GetByID(id)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Pesanan tidak ditemukan", 404, err)
	}
	items, err := s.orderItemRepo.GetByOrderID(order.ID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil item pesanan", 500, err)
	}
	payment, _ := s.paymentRepo.GetByOrderID(order.ID)
	return s.buildOrderResponse(order, items, payment), nil
}

func (s *orderService) UpdateStatus(id uint, req *dto.UpdateOrderStatusRequest) error {
	err := s.uow.Do(func(tx *repository.TxRepos) error {
		order, err := tx.Orders.GetByIDForUpdate(id)
		if err != nil {
			return apperror.New(apperror.ErrCodeNotFound, "Pesanan tidak ditemukan", 404, err)
		}
		if order.Status == req.Status {
			return nil
		}
		if !model.CanTransition(order.Status, req.Status) {
			return apperror.New(apperror.ErrCodeBadRequest,
				fmt.Sprintf("Transisi status dari %s ke %s tidak diizinkan", order.Status, req.Status), 400, nil)
		}
		if req.Status == model.StatusShipped && req.TrackingNumber == "" {
			return apperror.New(apperror.ErrCodeBadRequest, "Nomor resi wajib diisi saat pesanan dikirim", 400, nil)
		}

		if model.ReleasesStock(order.Status, req.Status) {
			items, err := tx.OrderItems.GetByOrderID(order.ID)
			if err != nil {
				return apperror.New(apperror.ErrCodeInternal, "Gagal mengambil item pesanan", 500, err)
			}
			for _, item := range items {
				if err := tx.Products.IncrementStock(item.ProductID, item.Quantity); err != nil {
					return apperror.New(apperror.ErrCodeInternal, "Gagal mengembalikan stok produk", 500, err)
				}
			}
		}

		updated, err := tx.Orders.UpdateStatus(order.ID, order.Status, req.Status, req.TrackingNumber)
		if err != nil {
			return apperror.New(apperror.ErrCodeInternal, "Gagal memperbarui status pesanan", 500, err)
		}
		if !updated {
			return apperror.New(apperror.ErrCodeConflict, "Status pesanan telah berubah, silakan muat ulang", 409, nil)
		}
		return nil
	})
	if err != nil {
		var appErr *apperror.AppError
		if errors.As(err, &appErr) {
			return appErr
		}
		return apperror.New(apperror.ErrCodeInternal, "Gagal memperbarui status pesanan", 500, err)
	}
	return nil
}

func (s *orderService) calculateShipping(subtotal float64) float64 {
	if s.cfg.FreeShippingMin > 0 && subtotal >= s.cfg.FreeShippingMin {
		return 0
	}
	return s.cfg.ShippingFlat
}

func (s *orderService) failOrder(order *model.Order) {
	err := s.uow.Do(func(tx *repository.TxRepos) error {
		current, err := tx.Orders.GetByIDForUpdate(order.ID)
		if err != nil {
			return err
		}
		if current.Status != model.StatusPendingPayment {
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
		_, err = tx.Orders.UpdateStatus(order.ID, model.StatusPendingPayment, model.StatusFailed, "")
		return err
	})
	if err != nil {
		log.Printf("checkout: gagal melakukan kompensasi pesanan %s: %v", order.OrderNumber, err)
	}
}

func (s *orderService) buildOrderResponse(order *model.Order, items []*model.OrderItem, payment *model.Payment) *dto.OrderResponse {
	resp := &dto.OrderResponse{
		ID:               order.ID,
		OrderNumber:      order.OrderNumber,
		UserID:           order.UserID,
		Subtotal:         order.Subtotal,
		ShippingCost:     order.ShippingCost,
		TotalAmount:      order.TotalAmount,
		Status:           order.Status,
		PaymentExpiresAt: order.PaymentExpiresAt,
		TrackingNumber:   order.TrackingNumber,
		CreatedAt:        order.CreatedAt,
		UpdatedAt:        order.UpdatedAt,
		Items:            make([]dto.OrderItemResponse, 0, len(items)),
	}

	var snapshot dto.AddressSnapshot
	if err := json.Unmarshal([]byte(order.AddressSnapshot), &snapshot); err == nil {
		resp.AddressSnapshot = &snapshot
	}
	for _, item := range items {
		resp.Items = append(resp.Items, dto.OrderItemResponse{
			ID:          item.ID,
			ProductID:   item.ProductID,
			ProductName: item.ProductName,
			Price:       item.Price,
			Quantity:    item.Quantity,
			Subtotal:    item.Subtotal,
		})
	}

	if payment != nil {
		resp.PaymentStatus = payment.TransactionStatus
		resp.PaymentType = payment.PaymentType
		resp.SnapToken = payment.SnapToken
		resp.SnapRedirectURL = payment.SnapRedirectURL
	}
	return resp
}

func (s *orderService) sendOrderEmail(order *model.Order, status string) {
	if !s.mailerEnabled || s.mailer == nil {
		return
	}
	user, err := s.userRepo.GetByID(order.UserID)
	if err != nil {
		return
	}
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("mailer: panic saat mengirim email pesanan %s: %v", order.OrderNumber, r)
			}
		}()
		if err := s.mailer.SendOrderConfirmation(user.Email, order.OrderNumber, status); err != nil {
			log.Printf("mailer: gagal mengirim email pesanan %s: %v", order.OrderNumber, err)
		}
	}()
}
