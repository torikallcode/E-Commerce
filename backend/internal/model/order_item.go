package model

import (
	"time"
)

type OrderItem struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	OrderID    uint      `gorm:"index;not null" json:"order_id"`
	ProductID  uint      `gorm:"index;not null" json:"product_id"`
	ProductName string   `gorm:"size:255;not null" json:"product_name"`
	Price      float64   `gorm:"type:decimal(12,2);not null" json:"price"`
	Quantity   int       `gorm:"not null;default:1" json:"quantity"`
	Subtotal   float64   `gorm:"type:decimal(12,2);not null" json:"subtotal"`
	CreatedAt  time.Time `json:"created_at"`
}

func (OrderItem) TableName() string {
	return "order_items"
}
