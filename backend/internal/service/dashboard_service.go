package service

import (
	"ecommerce/backend/internal/apperror"
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/repository"
)

type DashboardService interface {
	GetSummary() (*dto.DashboardSummaryResponse, error)
	ListUsers(page, perPage int) ([]*dto.AdminUserResponse, int64, error)
}

type dashboardService struct {
	orderRepo   repository.OrderRepository
	userRepo    repository.UserRepository
	productRepo repository.ProductRepository
}

func NewDashboardService(
	orderRepo repository.OrderRepository,
	userRepo repository.UserRepository,
	productRepo repository.ProductRepository,
) DashboardService {
	return &dashboardService{
		orderRepo:   orderRepo,
		userRepo:    userRepo,
		productRepo: productRepo,
	}
}

func (s *dashboardService) GetSummary() (*dto.DashboardSummaryResponse, error) {
	totalOrders, err := s.orderRepo.CountTotal()
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal menghitung total pesanan", 500, err)
	}
	totalRevenue, err := s.orderRepo.SumRevenue()
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal menghitung pendapatan", 500, err)
	}
	totalProducts, err := s.productRepo.Count()
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal menghitung produk", 500, err)
	}
	totalCustomers, err := s.userRepo.CountByRole("customer")
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal menghitung pelanggan", 500, err)
	}

	pendingOrders, _ := s.orderRepo.CountByStatus("pending_payment")
	paidOrders, _ := s.orderRepo.CountByStatus("paid")
	shippedOrders, _ := s.orderRepo.CountByStatus("shipped")
	completedOrders, _ := s.orderRepo.CountByStatus("completed")

	topProducts, _ := s.productRepo.TopSelling(5)
	top := make([]dto.TopProductSummary, 0, len(topProducts))
	for _, p := range topProducts {
		top = append(top, dto.TopProductSummary{
			ProductID:   p.ProductID,
			ProductName: p.ProductName,
			Quantity:    p.Quantity,
			Revenue:     p.Revenue,
		})
	}

	return &dto.DashboardSummaryResponse{
		TotalOrders:     totalOrders,
		TotalRevenue:    totalRevenue,
		TotalProducts:   totalProducts,
		TotalCustomers:  totalCustomers,
		PendingOrders:   pendingOrders,
		PaidOrders:      paidOrders,
		ShippedOrders:   shippedOrders,
		CompletedOrders: completedOrders,
		TopProducts:     top,
	}, nil
}

func (s *dashboardService) ListUsers(page, perPage int) ([]*dto.AdminUserResponse, int64, error) {
	page, perPage = normalizePagination(page, perPage)
	users, total, err := s.userRepo.List(page, perPage)
	if err != nil {
		return nil, 0, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil daftar pengguna", 500, err)
	}

	responses := make([]*dto.AdminUserResponse, 0, len(users))
	for _, user := range users {
		responses = append(responses, &dto.AdminUserResponse{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
		})
	}
	return responses, total, nil
}
