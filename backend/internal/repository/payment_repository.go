package repository

import (
	"ecommerce/backend/internal/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PaymentRepository interface {
	Create(payment *model.Payment) error
	GetByID(id uint) (*model.Payment, error)
	GetByMidtransOrderID(midtransOrderID string) (*model.Payment, error)
	GetByMidtransOrderIDForUpdate(midtransOrderID string) (*model.Payment, error)
	GetByOrderID(orderID uint) (*model.Payment, error)
	Update(payment *model.Payment) error
	CreateNotification(notif *model.PaymentNotification) error
}

type paymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) PaymentRepository {
	return newPaymentRepository(db)
}

func newPaymentRepository(db *gorm.DB) PaymentRepository {
	return &paymentRepository{db: db}
}

func (r *paymentRepository) Create(payment *model.Payment) error {
	return r.db.Create(payment).Error
}

func (r *paymentRepository) GetByID(id uint) (*model.Payment, error) {
	var payment model.Payment
	if err := r.db.First(&payment, id).Error; err != nil {
		return nil, err
	}
	return &payment, nil
}

func (r *paymentRepository) GetByMidtransOrderID(midtransOrderID string) (*model.Payment, error) {
	var payment model.Payment
	if err := r.db.Where("midtrans_order_id = ?", midtransOrderID).First(&payment).Error; err != nil {
		return nil, err
	}
	return &payment, nil
}

func (r *paymentRepository) GetByMidtransOrderIDForUpdate(midtransOrderID string) (*model.Payment, error) {
	var payment model.Payment
	if err := r.db.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("midtrans_order_id = ?", midtransOrderID).First(&payment).Error; err != nil {
		return nil, err
	}
	return &payment, nil
}

func (r *paymentRepository) GetByOrderID(orderID uint) (*model.Payment, error) {
	var payment model.Payment
	if err := r.db.Where("order_id = ?", orderID).Order("id DESC").First(&payment).Error; err != nil {
		return nil, err
	}
	return &payment, nil
}

func (r *paymentRepository) Update(payment *model.Payment) error {
	return r.db.Save(payment).Error
}

func (r *paymentRepository) CreateNotification(notif *model.PaymentNotification) error {
	return r.db.Create(notif).Error
}
