package dto

// PaymentNotificationRequest represents the Midtrans webhook notification payload
type PaymentNotificationRequest struct {
	OrderID           string `json:"order_id" binding:"required"`
	StatusCode        string `json:"status_code" binding:"required"`
	GrossAmount       string `json:"gross_amount" binding:"required"`
	SignatureKey      string `json:"signature_key" binding:"required"`
	TransactionStatus string `json:"transaction_status" binding:"required"`
	FraudStatus       string `json:"fraud_status,omitempty"`
	TransactionID     string `json:"transaction_id,omitempty"`
	PaymentType       string `json:"payment_type,omitempty"`
	MerchantID        string `json:"merchant_id,omitempty"`
	Currency          string `json:"currency,omitempty"`
	// RawPayload is assigned by the HTTP handler. It is excluded from JSON
	// binding so the original webhook body can be retained for audit.
	RawPayload string `json:"-"`
}

// PaymentStatusResponse represents the payment status response
type PaymentStatusResponse struct {
	OrderNumber       string  `json:"order_number"`
	OrderStatus       string  `json:"order_status"`
	TransactionStatus string  `json:"transaction_status"`
	FraudStatus       string  `json:"fraud_status,omitempty"`
	PaymentType       string  `json:"payment_type,omitempty"`
	PaidAt            *string `json:"paid_at,omitempty"`
	ExpiresAt         *string `json:"expires_at,omitempty"`
}
