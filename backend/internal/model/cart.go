package model

import (
	"time"
)

type Cart struct {
	ID        uint      `gorm:"primaryKey;uniqueIndex" json:"id"`
	UserID    uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Cart) TableName() string {
	return "carts"
}
