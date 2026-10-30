package service

import (
	"errors"

	"ecommerce/backend/internal/apperror"
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/model"
	"ecommerce/backend/internal/repository"
	"ecommerce/backend/pkg/util"

	"gorm.io/gorm"
)

type CategoryService interface {
	Create(req *dto.CategoryRequest) (*dto.CategoryResponse, error)
	List() ([]*dto.CategoryResponse, error)
	Update(id uint, req *dto.CategoryRequest) (*dto.CategoryResponse, error)
	Delete(id uint) error
}

type categoryService struct {
	categoryRepo repository.CategoryRepository
	productRepo  repository.ProductRepository
}

func NewCategoryService(categoryRepo repository.CategoryRepository, productRepo repository.ProductRepository) CategoryService {
	return &categoryService{categoryRepo: categoryRepo, productRepo: productRepo}
}

func (s *categoryService) Create(req *dto.CategoryRequest) (*dto.CategoryResponse, error) {
	slug := util.Slugify(req.Slug)
	if slug == "" {
		slug = util.Slugify(req.Name)
	}
	if _, err := s.categoryRepo.GetBySlug(slug); err == nil {
		return nil, apperror.New(apperror.ErrCodeConflict, "Slug kategori sudah digunakan", 409, nil)
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal memeriksa slug kategori", 500, err)
	}

	category := &model.Category{
		Name:     req.Name,
		Slug:     slug,
		ParentID: req.ParentID,
	}
	if err := s.categoryRepo.Create(category); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal membuat kategori", 500, err)
	}
	return toCategoryResponse(category), nil
}

func (s *categoryService) List() ([]*dto.CategoryResponse, error) {
	categories, err := s.categoryRepo.List()
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil daftar kategori", 500, err)
	}
	responses := make([]*dto.CategoryResponse, len(categories))
	for i, c := range categories {
		responses[i] = toCategoryResponse(c)
	}
	return responses, nil
}

func (s *categoryService) Update(id uint, req *dto.CategoryRequest) (*dto.CategoryResponse, error) {
	category, err := s.categoryRepo.GetByID(id)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Kategori tidak ditemukan", 404, err)
	}

	slug := util.Slugify(req.Slug)
	if slug == "" {
		slug = util.Slugify(req.Name)
	}
	if existing, err := s.categoryRepo.GetBySlug(slug); err == nil && existing.ID != id {
		return nil, apperror.New(apperror.ErrCodeConflict, "Slug kategori sudah digunakan", 409, nil)
	}

	category.Name = req.Name
	category.Slug = slug
	category.ParentID = req.ParentID
	if err := s.categoryRepo.Update(category); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal memperbarui kategori", 500, err)
	}
	return toCategoryResponse(category), nil
}

func (s *categoryService) Delete(id uint) error {
	if _, err := s.categoryRepo.GetByID(id); err != nil {
		return apperror.New(apperror.ErrCodeNotFound, "Kategori tidak ditemukan", 404, err)
	}
	count, err := s.productRepo.CountByCategory(id)
	if err != nil {
		return apperror.New(apperror.ErrCodeInternal, "Gagal memeriksa produk kategori", 500, err)
	}
	if count > 0 {
		return apperror.New(apperror.ErrCodeConflict, "Kategori tidak dapat dihapus karena masih memiliki produk", 409, nil)
	}
	if err := s.categoryRepo.Delete(id); err != nil {
		return apperror.New(apperror.ErrCodeInternal, "Gagal menghapus kategori", 500, err)
	}
	return nil
}

func toCategoryResponse(c *model.Category) *dto.CategoryResponse {
	return &dto.CategoryResponse{
		ID:       c.ID,
		Name:     c.Name,
		Slug:     c.Slug,
		ParentID: c.ParentID,
	}
}
