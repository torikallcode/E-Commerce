package model

import (
	"time"
)

type PaymentNotification struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	MidtransOrderID string   `gorm:"size:100;index;not null" json:"midtrans_order_id"`
	Payload        string    `gorm:"type:text;not null" json:"payload"`
	ReceivedAt     time.Time `json:"received_at"`
}

func (PaymentNotification) TableName() string {
	return "payment_notifications"
}
