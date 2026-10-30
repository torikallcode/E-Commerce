package dto

import "time"

// CheckoutRequest represents the checkout request body
type CheckoutRequest struct {
	AddressID uint   `json:"address_id" binding:"required,gt=0"`
	Note      string `json:"note,omitempty" binding:"max=500"`
}

// AddressSnapshot is the immutable copy of the shipping address stored on an order.
type AddressSnapshot struct {
	RecipientName string `json:"recipient_name"`
	Phone         string `json:"phone"`
	AddressLine   string `json:"address_line"`
	City          string `json:"city"`
	Province      string `json:"province"`
	PostalCode    string `json:"postal_code"`
}

// OrderResponse represents the order response body
type OrderResponse struct {
	ID               uint                `json:"id"`
	OrderNumber      string              `json:"order_number"`
	UserID           uint                `json:"user_id"`
	AddressSnapshot  *AddressSnapshot    `json:"address_snapshot"`
	Subtotal         float64             `json:"subtotal"`
	ShippingCost     float64             `json:"shipping_cost"`
	TotalAmount      float64             `json:"total_amount"`
	Status           string              `json:"status"`
	PaymentExpiresAt *time.Time          `json:"payment_expires_at,omitempty"`
	TrackingNumber   string              `json:"tracking_number,omitempty"`
	CreatedAt        time.Time           `json:"created_at"`
	UpdatedAt        time.Time           `json:"updated_at"`
	Items            []OrderItemResponse `json:"items"`
	SnapToken        string              `json:"snap_token,omitempty"`
	SnapRedirectURL  string              `json:"snap_redirect_url,omitempty"`
	PaymentStatus    string              `json:"payment_status,omitempty"`
	PaymentType      string              `json:"payment_type,omitempty"`
	DevMode          bool                `json:"dev_mode,omitempty"`
}

// OrderItemResponse represents an order item response
type OrderItemResponse struct {
	ID          uint    `json:"id"`
	ProductID   uint    `json:"product_id"`
	ProductName string  `json:"product_name"`
	Price       float64 `json:"price"`
	Quantity    int     `json:"quantity"`
	Subtotal    float64 `json:"subtotal"`
}

// OrderListResponse represents a paginated order list response
type OrderListResponse struct {
	Items      []OrderResponse `json:"items"`
	Page       int             `json:"page"`
	PerPage    int             `json:"per_page"`
	Total      int64           `json:"total"`
	TotalPages int             `json:"total_pages"`
}

// CancelOrderRequest represents the cancel order request
type CancelOrderRequest struct{}

// UpdateOrderStatusRequest represents the admin order status update request
type UpdateOrderStatusRequest struct {
	Status         string `json:"status" binding:"required,oneof=pending_payment pending_review paid processing shipped completed cancelled expired failed refunded"`
	TrackingNumber string `json:"tracking_number,omitempty" binding:"max=100"`
}
