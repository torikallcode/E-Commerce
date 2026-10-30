package dto

// CategoryRequest represents the category create/update request body
type CategoryRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Slug     string `json:"slug" binding:"omitempty,min=2,max=100"`
	ParentID *uint  `json:"parent_id,omitempty"`
}

// CategoryResponse represents the category response body
type CategoryResponse struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	Slug     string `json:"slug"`
	ParentID *uint  `json:"parent_id,omitempty"`
}
