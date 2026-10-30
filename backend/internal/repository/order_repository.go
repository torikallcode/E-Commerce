package repository

import (
	"ecommerce/backend/internal/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type OrderRepository interface {
	Create(order *model.Order) error
	GetByID(id uint) (*model.Order, error)
	GetByIDForUpdate(id uint) (*model.Order, error)
	GetByOrderNumber(orderNumber string) (*model.Order, error)
	GetByOrderNumberForUpdate(orderNumber string) (*model.Order, error)
	ListByUserID(userID uint, status string, page, perPage int) ([]*model.Order, int64, error)
	ListAll(status, q string, page, perPage int) ([]*model.Order, int64, error)
	Update(order *model.Order) error
	UpdateStatus(id uint, from, to, trackingNumber string) (bool, error)
	Delete(id uint) error
	CountByStatus(status string) (int64, error)
	CountTotal() (int64, error)
	SumRevenue() (float64, error)
	GetExpiredPending(limit int) ([]*model.Order, error)
}

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return newOrderRepository(db)
}

func newOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) Create(order *model.Order) error {
	return r.db.Create(order).Error
}

func (r *orderRepository) GetByID(id uint) (*model.Order, error) {
	var order model.Order
	if err := r.db.First(&order, id).Error; err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) GetByIDForUpdate(id uint) (*model.Order, error) {
	var order model.Order
	if err := r.db.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, id).Error; err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) GetByOrderNumber(orderNumber string) (*model.Order, error) {
	var order model.Order
	if err := r.db.Where("order_number = ?", orderNumber).First(&order).Error; err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) GetByOrderNumberForUpdate(orderNumber string) (*model.Order, error) {
	var order model.Order
	if err := r.db.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("order_number = ?", orderNumber).First(&order).Error; err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) ListByUserID(userID uint, status string, page, perPage int) ([]*model.Order, int64, error) {
	var orders []*model.Order
	var total int64

	db := r.db.Model(&model.Order{}).Where("user_id = ?", userID)
	if status != "" {
		db = db.Where("status = ?", status)
	}
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	if err := db.Order("created_at DESC").Limit(perPage).Offset(offset).Find(&orders).Error; err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

func (r *orderRepository) ListAll(status, q string, page, perPage int) ([]*model.Order, int64, error) {
	var orders []*model.Order
	var total int64

	db := r.db.Model(&model.Order{})
	if status != "" {
		db = db.Where("status = ?", status)
	}
	if q != "" {
		db = db.Where("order_number LIKE ?", "%"+q+"%")
	}
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	if err := db.Order("created_at DESC").Limit(perPage).Offset(offset).Find(&orders).Error; err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

func (r *orderRepository) Update(order *model.Order) error {
	return r.db.Save(order).Error
}

func (r *orderRepository) UpdateStatus(id uint, from, to, trackingNumber string) (bool, error) {
	updates := map[string]interface{}{"status": to}
	if trackingNumber != "" {
		updates["tracking_number"] = trackingNumber
	}
	result := r.db.Model(&model.Order{}).
		Where("id = ? AND status = ?", id, from).
		Updates(updates)
	if result.Error != nil {
		return false, result.Error
	}
	return result.RowsAffected > 0, nil
}

func (r *orderRepository) Delete(id uint) error {
	return r.db.Delete(&model.Order{}, id).Error
}

func (r *orderRepository) CountByStatus(status string) (int64, error) {
	var count int64
	if err := r.db.Model(&model.Order{}).Where("status = ?", status).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *orderRepository) CountTotal() (int64, error) {
	var count int64
	if err := r.db.Model(&model.Order{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *orderRepository) SumRevenue() (float64, error) {
	var revenue float64
	err := r.db.Model(&model.Order{}).
		Where("status IN ?", []string{
			model.StatusPaid,
			model.StatusProcessing,
			model.StatusShipped,
			model.StatusCompleted,
		}).
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&revenue).Error
	if err != nil {
		return 0, err
	}
	return revenue, nil
}

func (r *orderRepository) GetExpiredPending(limit int) ([]*model.Order, error) {
	var orders []*model.Order
	db := r.db.Where("status = ? AND payment_expires_at IS NOT NULL AND payment_expires_at < NOW()", model.StatusPendingPayment)
	if limit > 0 {
		db = db.Limit(limit)
	}
	if err := db.Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}
