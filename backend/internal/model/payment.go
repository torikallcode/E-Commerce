package model

import (
	"time"
)

type Payment struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	OrderID          uint      `gorm:"index;not null" json:"order_id"`
	MidtransOrderID  string    `gorm:"size:100;uniqueIndex;not null" json:"midtrans_order_id"`
	SnapToken        string    `gorm:"size:500" json:"-"`
	SnapRedirectURL  string    `gorm:"size:500" json:"snap_redirect_url,omitempty"`
	PaymentType      string    `gorm:"size:50" json:"payment_type,omitempty"`
	TransactionID    string    `gorm:"size:100" json:"transaction_id,omitempty"`
	TransactionStatus string   `gorm:"size:50" json:"transaction_status,omitempty"`
	FraudStatus      string    `gorm:"size:50" json:"fraud_status,omitempty"`
	GrossAmount      float64   `gorm:"type:decimal(12,2);not null" json:"gross_amount"`
	SignatureValid   bool      `gorm:"default:false" json:"signature_valid"`
	RawNotification  string    `gorm:"type:json" json:"-"`
	PaidAt           *time.Time `gorm:"default:null" json:"paid_at,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func (Payment) TableName() string {
	return "payments"
}
