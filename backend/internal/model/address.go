package model

import (
	"time"
)

type Address struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	RecipientName string   `gorm:"size:100;not null" json:"recipient_name"`
	Phone        string    `gorm:"size:20;not null" json:"phone"`
	AddressLine  string    `gorm:"size:255;not null" json:"address_line"`
	City         string    `gorm:"size:100;not null" json:"city"`
	Province     string    `gorm:"size:100;not null" json:"province"`
	PostalCode   string    `gorm:"size:20;not null" json:"postal_code"`
	IsDefault    bool      `gorm:"default:false" json:"is_default"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (Address) TableName() string {
	return "addresses"
}
