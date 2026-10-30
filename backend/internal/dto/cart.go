package dto

// CartItemRequest represents the add/update cart item request body
type CartItemRequest struct {
	ProductID uint `json:"product_id" binding:"required,gt=0"`
	Quantity  int  `json:"quantity" binding:"required,gt=0"`
}

// UpdateCartItemRequest represents an update cart item request body
type UpdateCartItemRequest struct {
	Quantity int `json:"quantity" binding:"required,gt=0"`
}

// CartItemResponse represents a cart item response
type CartItemResponse struct {
	ID          uint    `json:"id"`
	ProductID   uint    `json:"product_id"`
	ProductName string  `json:"product_name"`
	Price       float64 `json:"price"`
	Quantity    int     `json:"quantity"`
	Subtotal    float64 `json:"subtotal"`
	ImageURL    string  `json:"image_url,omitempty"`
	Stock       int     `json:"stock,omitempty"`
}

// CartResponse represents the cart response body
type CartResponse struct {
	ID        uint               `json:"id"`
	UserID    uint               `json:"user_id"`
	Items     []CartItemResponse `json:"items"`
	Subtotal  float64            `json:"subtotal"`
	ItemCount int                `json:"item_count"`
}
