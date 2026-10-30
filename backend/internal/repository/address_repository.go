package repository

import (
	"ecommerce/backend/internal/model"

	"gorm.io/gorm"
)

type AddressRepository interface {
	Create(address *model.Address) error
	GetByID(id uint, userID uint) (*model.Address, error)
	GetDefault(userID uint) (*model.Address, error)
	ListByUserID(userID uint) ([]*model.Address, error)
	Update(address *model.Address) error
	Delete(id uint, userID uint) error
	SetDefault(userID uint, addressID uint) error
}

type addressRepository struct {
	db *gorm.DB
}

func NewAddressRepository(db *gorm.DB) AddressRepository {
	return newAddressRepository(db)
}

func newAddressRepository(db *gorm.DB) AddressRepository {
	return &addressRepository{db: db}
}

func (r *addressRepository) Create(address *model.Address) error {
	return r.db.Create(address).Error
}

func (r *addressRepository) GetByID(id uint, userID uint) (*model.Address, error) {
	var address model.Address
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&address).Error; err != nil {
		return nil, err
	}
	return &address, nil
}

func (r *addressRepository) GetDefault(userID uint) (*model.Address, error) {
	var address model.Address
	if err := r.db.Where("user_id = ? AND is_default = ?", userID, true).First(&address).Error; err != nil {
		return nil, err
	}
	return &address, nil
}

func (r *addressRepository) ListByUserID(userID uint) ([]*model.Address, error) {
	var addresses []*model.Address
	if err := r.db.Where("user_id = ?", userID).
		Order("is_default DESC, created_at DESC").Find(&addresses).Error; err != nil {
		return nil, err
	}
	return addresses, nil
}

func (r *addressRepository) Update(address *model.Address) error {
	return r.db.Save(address).Error
}

func (r *addressRepository) Delete(id uint, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Address{}).Error
}

func (r *addressRepository) SetDefault(userID uint, addressID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.Address{}).Where("user_id = ?", userID).
			Update("is_default", false).Error; err != nil {
			return err
		}
		return tx.Model(&model.Address{}).Where("id = ? AND user_id = ?", addressID, userID).
			Update("is_default", true).Error
	})
}
