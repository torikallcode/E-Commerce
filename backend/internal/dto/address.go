package dto

// AddressRequest represents the address create/update request body
type AddressRequest struct {
	RecipientName string `json:"recipient_name" binding:"required,min=2,max=100"`
	Phone         string `json:"phone" binding:"required,min=5,max=20"`
	AddressLine   string `json:"address_line" binding:"required,min=5,max=255"`
	City          string `json:"city" binding:"required,min=2,max=100"`
	Province      string `json:"province" binding:"required,min=2,max=100"`
	PostalCode    string `json:"postal_code" binding:"required,min=3,max=20"`
	IsDefault     bool   `json:"is_default"`
}

// AddressResponse represents the address response body
type AddressResponse struct {
	ID            uint   `json:"id"`
	RecipientName string `json:"recipient_name"`
	Phone         string `json:"phone"`
	AddressLine   string `json:"address_line"`
	City          string `json:"city"`
	Province      string `json:"province"`
	PostalCode    string `json:"postal_code"`
	IsDefault     bool   `json:"is_default"`
}
