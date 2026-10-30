package repository

import (
	"ecommerce/backend/internal/model"
	"gorm.io/gorm"
)

type OrderItemRepository interface {
	Create(item *model.OrderItem) error
	GetByOrderID(orderID uint) ([]*model.OrderItem, error)
}

type orderItemRepository struct {
	db *gorm.DB
}

func NewOrderItemRepository(db *gorm.DB) OrderItemRepository {
	return newOrderItemRepository(db)
}

func newOrderItemRepository(db *gorm.DB) OrderItemRepository {
	return &orderItemRepository{db: db}
}

func (r *orderItemRepository) Create(item *model.OrderItem) error {
	return r.db.Create(item).Error
}

func (r *orderItemRepository) GetByOrderID(orderID uint) ([]*model.OrderItem, error) {
	var items []*model.OrderItem
	if err := r.db.Where("order_id = ?", orderID).Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}