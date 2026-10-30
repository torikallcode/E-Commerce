package dto

import "time"

// ProductRequest represents the product create/update request body
type ProductRequest struct {
	CategoryID  uint    `json:"category_id" binding:"required"`
	Name        string  `json:"name" binding:"required,min=2,max=255"`
	Slug        string  `json:"slug" binding:"omitempty,min=2,max=255"`
	Description string  `json:"description"`
	Price       float64 `json:"price" binding:"gte=0"`
	Stock       int     `json:"stock" binding:"gte=0"`
	IsActive    bool    `json:"is_active"`
}

// ProductResponse represents the product response body
type ProductResponse struct {
	ID           uint                  `json:"id"`
	CategoryID   uint                  `json:"category_id"`
	Name         string                `json:"name"`
	Slug         string                `json:"slug"`
	Description  string                `json:"description"`
	Price        float64               `json:"price"`
	Stock        int                   `json:"stock"`
	IsActive     bool                  `json:"is_active"`
	CategoryName string                `json:"category_name,omitempty"`
	Images       []ProductImageResponse `json:"images,omitempty"`
	CreatedAt    time.Time             `json:"created_at"`
	UpdatedAt    time.Time             `json:"updated_at"`
}

// ProductImageResponse represents a product image response
type ProductImageResponse struct {
	ID        uint   `json:"id"`
	ProductID uint   `json:"product_id"`
	URL       string `json:"url"`
	SortOrder int    `json:"sort_order"`
}

// ProductImageUploadRequest represents the product image upload request
type ProductImageUploadRequest struct {
	URL       string `json:"url" binding:"required"`
	SortOrder int    `json:"sort_order"`
}

// ProductListQuery represents query parameters for listing products
type ProductListQuery struct {
	Q        string `form:"q"`
	Category string `form:"category"`
	MinPrice string `form:"min_price"`
	MaxPrice string `form:"max_price"`
	Sort     string `form:"sort"`
	Page     int    `form:"page"`
	PerPage  int    `form:"per_page"`
}

// ProductListResponse represents the paginated product list response
type ProductListResponse struct {
	Items      []ProductResponse `json:"items"`
	Page       int               `json:"page"`
	PerPage    int               `json:"per_page"`
	Total      int64             `json:"total"`
	TotalPages int               `json:"total_pages"`
}
