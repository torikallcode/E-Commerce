package model

import (
	"time"
)

type Order struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	OrderNumber     string    `gorm:"size:50;uniqueIndex;not null" json:"order_number"`
	UserID          uint      `gorm:"index;not null" json:"user_id"`
	AddressSnapshot string    `gorm:"type:json;not null" json:"address_snapshot"`
	Subtotal        float64   `gorm:"type:decimal(12,2);not null" json:"subtotal"`
	ShippingCost    float64   `gorm:"type:decimal(12,2);not null;default:0" json:"shipping_cost"`
	TotalAmount     float64   `gorm:"type:decimal(12,2);not null" json:"total_amount"`
	Status          string    `gorm:"size:50;not null;default:'pending_payment'" json:"status"`
	PaymentExpiresAt *time.Time `gorm:"default:null" json:"payment_expires_at,omitempty"`
	TrackingNumber  string    `gorm:"size:100;default:null" json:"tracking_number,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (Order) TableName() string {
	return "orders"
}
