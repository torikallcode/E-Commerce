package repository

import (
	"ecommerce/backend/internal/model"
	"gorm.io/gorm"
	"time"
)

type RefreshTokenRepository interface {
	Create(token *model.RefreshToken) error
	GetByUserID(userID uint) (*model.RefreshToken, error)
	GetByTokenHash(tokenHash string) (*model.RefreshToken, error)
	Revoke(userID uint) error
	DeleteExpired() error
}

type refreshTokenRepository struct {
	db *gorm.DB
}

func NewRefreshTokenRepository(db *gorm.DB) RefreshTokenRepository {
	return newRefreshTokenRepository(db)
}

func newRefreshTokenRepository(db *gorm.DB) RefreshTokenRepository {
	return &refreshTokenRepository{db: db}
}

func (r *refreshTokenRepository) Create(token *model.RefreshToken) error {
	return r.db.Create(token).Error
}

func (r *refreshTokenRepository) GetByUserID(userID uint) (*model.RefreshToken, error) {
	var token model.RefreshToken
	if err := r.db.Where("user_id = ? AND revoked_at IS NULL", userID).First(&token).Error; err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *refreshTokenRepository) GetByTokenHash(tokenHash string) (*model.RefreshToken, error) {
	var token model.RefreshToken
	if err := r.db.Where("token_hash = ? AND revoked_at IS NULL", tokenHash).First(&token).Error; err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *refreshTokenRepository) Revoke(userID uint) error {
	return r.db.Model(&model.RefreshToken{}).Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", time.Now()).Error
}

func (r *refreshTokenRepository) DeleteExpired() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&model.RefreshToken{}).Error
}