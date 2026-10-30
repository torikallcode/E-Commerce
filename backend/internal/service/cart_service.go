package service

import (
	"errors"

	"ecommerce/backend/internal/apperror"
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/model"
	"ecommerce/backend/internal/repository"

	"gorm.io/gorm"
)

type CartService interface {
	GetCart(userID uint) (*dto.CartResponse, error)
	AddItem(userID uint, req *dto.CartItemRequest) (*dto.CartResponse, error)
	UpdateItem(userID uint, productID uint, quantity int) (*dto.CartResponse, error)
	RemoveItem(userID uint, productID uint) (*dto.CartResponse, error)
	Clear(userID uint) error
}

type cartService struct {
	cartRepo    repository.CartRepository
	productRepo repository.ProductRepository
}

func NewCartService(cartRepo repository.CartRepository, productRepo repository.ProductRepository) CartService {
	return &cartService{cartRepo: cartRepo, productRepo: productRepo}
}

func (s *cartService) GetCart(userID uint) (*dto.CartResponse, error) {
	cart, err := s.cartRepo.GetOrCreateByUserID(userID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil keranjang", 500, err)
	}
	items, err := s.cartRepo.GetItems(cart.ID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil item keranjang", 500, err)
	}
	return s.buildCartResponse(cart, items)
}

func (s *cartService) AddItem(userID uint, req *dto.CartItemRequest) (*dto.CartResponse, error) {
	if req.Quantity <= 0 {
		return nil, apperror.New(apperror.ErrCodeBadRequest, "Jumlah harus lebih dari 0", 400, nil)
	}

	product, err := s.getAvailableProduct(req.ProductID)
	if err != nil {
		return nil, err
	}

	cart, err := s.cartRepo.GetOrCreateByUserID(userID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mendapatkan keranjang", 500, err)
	}

	item, err := s.cartRepo.GetItem(cart.ID, req.ProductID)
	if err == nil {
		newQty := item.Quantity + req.Quantity
		if product.Stock < newQty {
			return nil, apperror.New(apperror.ErrCodeBadRequest, "Stok tidak mencukupi", 400, nil)
		}
		item.Quantity = newQty
		if err := s.cartRepo.UpdateItem(item); err != nil {
			return nil, apperror.New(apperror.ErrCodeInternal, "Gagal memperbarui item keranjang", 500, err)
		}
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		newItem := &model.CartItem{
			CartID:    cart.ID,
			ProductID: req.ProductID,
			Quantity:  req.Quantity,
		}
		if err := s.cartRepo.AddItem(newItem); err != nil {
			return nil, apperror.New(apperror.ErrCodeInternal, "Gagal menambah item ke keranjang", 500, err)
		}
	} else {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal memeriksa item keranjang", 500, err)
	}

	return s.GetCart(userID)
}

func (s *cartService) UpdateItem(userID uint, productID uint, quantity int) (*dto.CartResponse, error) {
	if quantity <= 0 {
		return nil, apperror.New(apperror.ErrCodeBadRequest, "Jumlah harus lebih dari 0", 400, nil)
	}

	product, err := s.getAvailableProduct(productID)
	if err != nil {
		return nil, err
	}
	if product.Stock < quantity {
		return nil, apperror.New(apperror.ErrCodeBadRequest, "Stok tidak mencukupi", 400, nil)
	}

	cart, err := s.cartRepo.GetOrCreateByUserID(userID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mendapatkan keranjang", 500, err)
	}

	item, err := s.cartRepo.GetItem(cart.ID, productID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Produk tidak ada dalam keranjang", 404, nil)
	}
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil item keranjang", 500, err)
	}

	item.Quantity = quantity
	if err := s.cartRepo.UpdateItem(item); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal memperbarui item", 500, err)
	}
	return s.GetCart(userID)
}

func (s *cartService) RemoveItem(userID uint, productID uint) (*dto.CartResponse, error) {
	cart, err := s.cartRepo.GetOrCreateByUserID(userID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mendapatkan keranjang", 500, err)
	}
	if err := s.cartRepo.DeleteItem(cart.ID, productID); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal menghapus item", 500, err)
	}
	return s.GetCart(userID)
}

func (s *cartService) Clear(userID uint) error {
	cart, err := s.cartRepo.GetByUserID(userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	}
	if err != nil {
		return apperror.New(apperror.ErrCodeInternal, "Gagal mendapatkan keranjang", 500, err)
	}
	return s.cartRepo.Clear(cart.ID)
}

func (s *cartService) getAvailableProduct(productID uint) (*model.Product, error) {
	product, err := s.productRepo.GetByID(productID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Produk tidak ditemukan", 404, err)
	}
	if !product.IsActive {
		return nil, apperror.New(apperror.ErrCodeBadRequest, "Produk tidak tersedia", 400, nil)
	}
	return product, nil
}

func (s *cartService) buildCartResponse(cart *model.Cart, items []*model.CartItem) (*dto.CartResponse, error) {
	itemResponses := make([]dto.CartItemResponse, 0, len(items))
	subtotal := float64(0)
	totalQuantity := 0

	for _, item := range items {
		product, err := s.productRepo.GetByID(item.ProductID)
		if err != nil {
			// Skip products that were deleted after being added to the cart.
			continue
		}
		itemSubtotal := product.Price * float64(item.Quantity)
		subtotal += itemSubtotal
		totalQuantity += item.Quantity

		imageURL := ""
		if images, err := s.productRepo.GetImages(product.ID); err == nil && len(images) > 0 {
			imageURL = images[0].URL
		}

		itemResponses = append(itemResponses, dto.CartItemResponse{
			ID:          item.ID,
			ProductID:   item.ProductID,
			ProductName: product.Name,
			Price:       product.Price,
			Quantity:    item.Quantity,
			Subtotal:    itemSubtotal,
			ImageURL:    imageURL,
			Stock:       product.Stock,
		})
	}

	return &dto.CartResponse{
		ID:        cart.ID,
		UserID:    cart.UserID,
		Items:     itemResponses,
		Subtotal:  subtotal,
		ItemCount: totalQuantity,
	}, nil
}
