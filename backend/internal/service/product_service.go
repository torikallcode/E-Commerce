package service

import (
	"errors"
	"strconv"

	"ecommerce/backend/internal/apperror"
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/model"
	"ecommerce/backend/internal/repository"
	"ecommerce/backend/pkg/util"

	"gorm.io/gorm"
)

type ProductService interface {
	Create(req *dto.ProductRequest) (*dto.ProductResponse, error)
	GetByID(id uint) (*dto.ProductResponse, error)
	GetBySlug(slug string) (*dto.ProductResponse, error)
	List(query dto.ProductListQuery) (*dto.ProductListResponse, error)
	ListAdmin(query dto.ProductListQuery) (*dto.ProductListResponse, error)
	Update(id uint, req *dto.ProductRequest) (*dto.ProductResponse, error)
	Delete(id uint) error
	AddImage(productID uint, url string, sortOrder int) (*dto.ProductImageResponse, error)
	DeleteImage(productID uint, imageID uint) error
	DecrementStock(productID uint, quantity int) error
	IncrementStock(productID uint, quantity int) error
}

type productService struct {
	productRepo  repository.ProductRepository
	categoryRepo repository.CategoryRepository
}

func NewProductService(productRepo repository.ProductRepository, categoryRepo repository.CategoryRepository) ProductService {
	return &productService{productRepo: productRepo, categoryRepo: categoryRepo}
}

func (s *productService) Create(req *dto.ProductRequest) (*dto.ProductResponse, error) {
	if err := s.validateProduct(req, 0); err != nil {
		return nil, err
	}

	product := &model.Product{
		CategoryID:  req.CategoryID,
		Name:        req.Name,
		Slug:        s.resolveSlug(req),
		Description: req.Description,
		Price:       req.Price,
		Stock:       req.Stock,
		IsActive:    req.IsActive,
	}
	if err := s.productRepo.Create(product); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal membuat produk", 500, err)
	}
	return s.toResponse(product, nil), nil
}

func (s *productService) GetByID(id uint) (*dto.ProductResponse, error) {
	product, err := s.productRepo.GetByID(id)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Produk tidak ditemukan", 404, err)
	}
	images, _ := s.productRepo.GetImages(product.ID)
	return s.toResponse(product, images), nil
}

func (s *productService) GetBySlug(slug string) (*dto.ProductResponse, error) {
	product, err := s.productRepo.GetBySlug(slug)
	if err != nil || !product.IsActive {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Produk tidak ditemukan", 404, err)
	}
	images, _ := s.productRepo.GetImages(product.ID)
	return s.toResponse(product, images), nil
}

func (s *productService) List(query dto.ProductListQuery) (*dto.ProductListResponse, error) {
	return s.list(query, false)
}

func (s *productService) ListAdmin(query dto.ProductListQuery) (*dto.ProductListResponse, error) {
	return s.list(query, true)
}

func (s *productService) list(query dto.ProductListQuery, admin bool) (*dto.ProductListResponse, error) {
	page, perPage := normalizePagination(query.Page, query.PerPage)

	repoQuery := repository.ProductListQuery{
		Q:        query.Q,
		Category: query.Category,
		Sort:     query.Sort,
		Page:     page,
		PerPage:  perPage,
		Offset:   (page - 1) * perPage,
	}

	if query.MinPrice != "" {
		if minPrice, err := strconv.ParseFloat(query.MinPrice, 64); err == nil {
			repoQuery.MinPrice = &minPrice
		}
	}
	if query.MaxPrice != "" {
		if maxPrice, err := strconv.ParseFloat(query.MaxPrice, 64); err == nil {
			repoQuery.MaxPrice = &maxPrice
		}
	}

	var (
		products []*model.Product
		total    int64
		err      error
	)
	if admin {
		products, total, err = s.productRepo.ListAdmin(repoQuery)
	} else {
		products, total, err = s.productRepo.List(repoQuery)
	}
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil daftar produk", 500, err)
	}

	items := make([]dto.ProductResponse, len(products))
	for i, p := range products {
		// Include the gallery so cards can show the primary image without a
		// second request. Lists are paginated, keeping this bounded.
		images, _ := s.productRepo.GetImages(p.ID)
		items[i] = *s.toResponse(p, images)
	}

	return &dto.ProductListResponse{
		Items:      items,
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: totalPages(total, perPage),
	}, nil
}

func (s *productService) Update(id uint, req *dto.ProductRequest) (*dto.ProductResponse, error) {
	product, err := s.productRepo.GetByID(id)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Produk tidak ditemukan", 404, err)
	}

	if err := s.validateProduct(req, id); err != nil {
		return nil, err
	}

	product.CategoryID = req.CategoryID
	product.Name = req.Name
	product.Slug = s.resolveSlug(req)
	product.Description = req.Description
	product.Price = req.Price
	product.Stock = req.Stock
	product.IsActive = req.IsActive

	if err := s.productRepo.Update(product); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal memperbarui produk", 500, err)
	}
	images, _ := s.productRepo.GetImages(product.ID)
	return s.toResponse(product, images), nil
}

func (s *productService) Delete(id uint) error {
	if _, err := s.productRepo.GetByID(id); err != nil {
		return apperror.New(apperror.ErrCodeNotFound, "Produk tidak ditemukan", 404, err)
	}
	if err := s.productRepo.Delete(id); err != nil {
		return apperror.New(apperror.ErrCodeConflict, "Produk tidak dapat dihapus karena sudah memiliki riwayat pesanan", 409, err)
	}
	return nil
}

func (s *productService) AddImage(productID uint, url string, sortOrder int) (*dto.ProductImageResponse, error) {
	if _, err := s.productRepo.GetByID(productID); err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Produk tidak ditemukan", 404, err)
	}
	if url == "" {
		return nil, apperror.New(apperror.ErrCodeBadRequest, "URL gambar wajib diisi", 400, nil)
	}

	image := &model.ProductImage{ProductID: productID, URL: url, SortOrder: sortOrder}
	if err := s.productRepo.AddImage(image); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal menyimpan gambar produk", 500, err)
	}
	return &dto.ProductImageResponse{
		ID:        image.ID,
		ProductID: image.ProductID,
		URL:       image.URL,
		SortOrder: image.SortOrder,
	}, nil
}

func (s *productService) DeleteImage(productID uint, imageID uint) error {
	if err := s.productRepo.DeleteImage(imageID, productID); err != nil {
		if errors.Is(err, repository.ErrNoRowsAffected) {
			return apperror.New(apperror.ErrCodeNotFound, "Gambar tidak ditemukan", 404, err)
		}
		return apperror.New(apperror.ErrCodeInternal, "Gagal menghapus gambar", 500, err)
	}
	return nil
}

func (s *productService) DecrementStock(productID uint, quantity int) error {
	return s.productRepo.DecrementStock(productID, quantity)
}

func (s *productService) IncrementStock(productID uint, quantity int) error {
	return s.productRepo.IncrementStock(productID, quantity)
}

func (s *productService) validateProduct(req *dto.ProductRequest, currentID uint) error {
	if req.Price < 0 {
		return apperror.New(apperror.ErrCodeBadRequest, "Harga tidak boleh negatif", 400, nil)
	}
	if req.Stock < 0 {
		return apperror.New(apperror.ErrCodeBadRequest, "Stok tidak boleh negatif", 400, nil)
	}
	if _, err := s.categoryRepo.GetByID(req.CategoryID); err != nil {
		return apperror.New(apperror.ErrCodeBadRequest, "Kategori tidak ditemukan", 400, err)
	}

	slug := s.resolveSlug(req)
	existing, err := s.productRepo.GetBySlug(slug)
	if err == nil && existing.ID != currentID {
		return apperror.New(apperror.ErrCodeConflict, "Slug produk sudah digunakan", 409, nil)
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return apperror.New(apperror.ErrCodeInternal, "Gagal memeriksa slug produk", 500, err)
	}
	return nil
}

func (s *productService) resolveSlug(req *dto.ProductRequest) string {
	if req.Slug != "" {
		return util.Slugify(req.Slug)
	}
	return util.Slugify(req.Name)
}

func (s *productService) toResponse(p *model.Product, images []*model.ProductImage) *dto.ProductResponse {
	resp := &dto.ProductResponse{
		ID:          p.ID,
		CategoryID:  p.CategoryID,
		Name:        p.Name,
		Slug:        p.Slug,
		Description: p.Description,
		Price:       p.Price,
		Stock:       p.Stock,
		IsActive:    p.IsActive,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
	if images != nil {
		resp.Images = make([]dto.ProductImageResponse, len(images))
		for i, img := range images {
			resp.Images[i] = dto.ProductImageResponse{
				ID:        img.ID,
				ProductID: img.ProductID,
				URL:       img.URL,
				SortOrder: img.SortOrder,
			}
		}
	}
	return resp
}

func normalizePagination(page, perPage int) (int, int) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	return page, perPage
}

func totalPages(total int64, perPage int) int {
	if perPage <= 0 {
		return 0
	}
	return int((total + int64(perPage) - 1) / int64(perPage))
}
