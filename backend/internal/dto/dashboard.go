package dto

import "time"

// DashboardSummaryResponse represents the admin dashboard summary
type DashboardSummaryResponse struct {
	TotalOrders     int64              `json:"total_orders"`
	TotalRevenue    float64            `json:"total_revenue"`
	TotalProducts   int64              `json:"total_products"`
	TotalCustomers  int64              `json:"total_customers"`
	PendingOrders   int64              `json:"pending_orders"`
	PaidOrders      int64              `json:"paid_orders"`
	ShippedOrders   int64              `json:"shipped_orders"`
	CompletedOrders int64              `json:"completed_orders"`
	TopProducts     []TopProductSummary `json:"top_products"`
}

// TopProductSummary is a best-selling product row on the dashboard.
type TopProductSummary struct {
	ProductID   uint    `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    int64   `json:"quantity"`
	Revenue     float64 `json:"revenue"`
}

// AdminUserResponse is a user row in the admin user list.
type AdminUserResponse struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}
