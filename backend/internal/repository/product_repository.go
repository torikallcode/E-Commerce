package repository

import (
	"ecommerce/backend/internal/model"

	"gorm.io/gorm"
)

type ProductRepository interface {
	Create(product *model.Product) error
	GetByID(id uint) (*model.Product, error)
	GetBySlug(slug string) (*model.Product, error)
	List(query ProductListQuery) ([]*model.Product, int64, error)
	ListAdmin(query ProductListQuery) ([]*model.Product, int64, error)
	Count() (int64, error)
	CountByCategory(categoryID uint) (int64, error)
	Update(product *model.Product) error
	Delete(id uint) error
	DecrementStock(productID uint, quantity int) error
	IncrementStock(productID uint, quantity int) error
	AddImage(image *model.ProductImage) error
	DeleteImage(id uint, productID uint) error
	GetImages(productID uint) ([]*model.ProductImage, error)
	TopSelling(limit int) ([]TopProduct, error)
}

type ProductListQuery struct {
	Q        string
	Category string
	MinPrice *float64
	MaxPrice *float64
	Sort     string
	Page     int
	PerPage  int
	Offset   int
}

type TopProduct struct {
	ProductID   uint    `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    int64   `json:"quantity"`
	Revenue     float64 `json:"revenue"`
}

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return newProductRepository(db)
}

func newProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) Create(product *model.Product) error {
	return r.db.Create(product).Error
}

func (r *productRepository) GetByID(id uint) (*model.Product, error) {
	var product model.Product
	if err := r.db.First(&product, id).Error; err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) GetBySlug(slug string) (*model.Product, error) {
	var product model.Product
	if err := r.db.Where("slug = ?", slug).First(&product).Error; err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) List(query ProductListQuery) ([]*model.Product, int64, error) {
	return r.list(query, true)
}

func (r *productRepository) ListAdmin(query ProductListQuery) ([]*model.Product, int64, error) {
	return r.list(query, false)
}

func (r *productRepository) list(query ProductListQuery, onlyActive bool) ([]*model.Product, int64, error) {
	var products []*model.Product
	var total int64

	db := r.db.Model(&model.Product{})
	if onlyActive {
		db = db.Where("is_active = ?", true)
	}

	if query.Q != "" {
		db = db.Where("name LIKE ?", "%"+query.Q+"%")
	}
	if query.Category != "" {
		db = db.Where("category_id = ?", query.Category)
	}
	if query.MinPrice != nil {
		db = db.Where("price >= ?", *query.MinPrice)
	}
	if query.MaxPrice != nil {
		db = db.Where("price <= ?", *query.MaxPrice)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	switch query.Sort {
	case "price_asc":
		db = db.Order("price ASC")
	case "price_desc":
		db = db.Order("price DESC")
	case "name_asc":
		db = db.Order("name ASC")
	case "oldest":
		db = db.Order("created_at ASC")
	default:
		db = db.Order("created_at DESC")
	}

	if query.Page > 0 && query.PerPage > 0 {
		db = db.Limit(query.PerPage).Offset(query.Offset)
	}

	if err := db.Find(&products).Error; err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

func (r *productRepository) Update(product *model.Product) error {
	return r.db.Save(product).Error
}

func (r *productRepository) Delete(id uint) error {
	return r.db.Delete(&model.Product{}, id).Error
}

func (r *productRepository) DecrementStock(productID uint, quantity int) error {
	result := r.db.Model(&model.Product{}).
		Where("id = ? AND stock >= ?", productID, quantity).
		Update("stock", gorm.Expr("stock - ?", quantity))
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrInsufficientStock
	}
	return nil
}

func (r *productRepository) IncrementStock(productID uint, quantity int) error {
	return r.db.Model(&model.Product{}).Where("id = ?", productID).
		Update("stock", gorm.Expr("stock + ?", quantity)).Error
}

func (r *productRepository) Count() (int64, error) {
	var count int64
	if err := r.db.Model(&model.Product{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *productRepository) CountByCategory(categoryID uint) (int64, error) {
	var count int64
	if err := r.db.Model(&model.Product{}).Where("category_id = ?", categoryID).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *productRepository) AddImage(image *model.ProductImage) error {
	return r.db.Create(image).Error
}

func (r *productRepository) DeleteImage(id uint, productID uint) error {
	result := r.db.Where("id = ? AND product_id = ?", id, productID).Delete(&model.ProductImage{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNoRowsAffected
	}
	return nil
}

func (r *productRepository) GetImages(productID uint) ([]*model.ProductImage, error) {
	var images []*model.ProductImage
	if err := r.db.Where("product_id = ?", productID).Order("sort_order ASC, id ASC").Find(&images).Error; err != nil {
		return nil, err
	}
	return images, nil
}

func (r *productRepository) TopSelling(limit int) ([]TopProduct, error) {
	var results []TopProduct
	err := r.db.Model(&model.OrderItem{}).
		Select("order_items.product_id, order_items.product_name, SUM(order_items.quantity) AS quantity, SUM(order_items.subtotal) AS revenue").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("orders.status IN ?", []string{model.StatusPaid, model.StatusProcessing, model.StatusShipped, model.StatusCompleted}).
		Group("order_items.product_id, order_items.product_name").
		Order("quantity DESC").
		Limit(limit).
		Scan(&results).Error
	if err != nil {
		return nil, err
	}
	return results, nil
}
