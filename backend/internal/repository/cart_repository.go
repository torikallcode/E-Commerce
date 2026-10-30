package repository

import (
	"ecommerce/backend/internal/model"

	"gorm.io/gorm"
)

type CartRepository interface {
	GetOrCreateByUserID(userID uint) (*model.Cart, error)
	GetByUserID(userID uint) (*model.Cart, error)
	GetItems(cartID uint) ([]*model.CartItem, error)
	GetItem(cartID uint, productID uint) (*model.CartItem, error)
	AddItem(item *model.CartItem) error
	UpdateItem(item *model.CartItem) error
	DeleteItem(cartID uint, productID uint) error
	Clear(cartID uint) error
}

type cartRepository struct {
	db *gorm.DB
}

func NewCartRepository(db *gorm.DB) CartRepository {
	return newCartRepository(db)
}

func newCartRepository(db *gorm.DB) CartRepository {
	return &cartRepository{db: db}
}

func (r *cartRepository) GetOrCreateByUserID(userID uint) (*model.Cart, error) {
	var cart model.Cart
	err := r.db.Where("user_id = ?", userID).First(&cart).Error
	if err == nil {
		return &cart, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	cart = model.Cart{UserID: userID}
	if err := r.db.Create(&cart).Error; err != nil {
		// Another request may have created the cart concurrently.
		if findErr := r.db.Where("user_id = ?", userID).First(&cart).Error; findErr == nil {
			return &cart, nil
		}
		return nil, err
	}
	return &cart, nil
}

func (r *cartRepository) GetByUserID(userID uint) (*model.Cart, error) {
	var cart model.Cart
	if err := r.db.Where("user_id = ?", userID).First(&cart).Error; err != nil {
		return nil, err
	}
	return &cart, nil
}

func (r *cartRepository) GetItems(cartID uint) ([]*model.CartItem, error) {
	var items []*model.CartItem
	if err := r.db.Where("cart_id = ?", cartID).Order("id ASC").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *cartRepository) GetItem(cartID uint, productID uint) (*model.CartItem, error) {
	var item model.CartItem
	if err := r.db.Where("cart_id = ? AND product_id = ?", cartID, productID).First(&item).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *cartRepository) AddItem(item *model.CartItem) error {
	return r.db.Create(item).Error
}

func (r *cartRepository) UpdateItem(item *model.CartItem) error {
	return r.db.Save(item).Error
}

func (r *cartRepository) DeleteItem(cartID uint, productID uint) error {
	return r.db.Where("cart_id = ? AND product_id = ?", cartID, productID).
		Delete(&model.CartItem{}).Error
}

func (r *cartRepository) Clear(cartID uint) error {
	return r.db.Where("cart_id = ?", cartID).Delete(&model.CartItem{}).Error
}
