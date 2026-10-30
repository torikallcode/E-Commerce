package handler

import (
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/service"
	"ecommerce/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	productService  service.ProductService
	categoryService service.CategoryService
}

func NewProductHandler(productService service.ProductService, categoryService service.CategoryService) *ProductHandler {
	return &ProductHandler{productService: productService, categoryService: categoryService}
}

func (h *ProductHandler) List(c *gin.Context) {
	var query dto.ProductListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.BadRequest(c, "Query parameter tidak valid")
		return
	}

	result, err := h.productService.List(query)
	if err != nil {
		respondError(c, err)
		return
	}
	response.Paginated(c, "Daftar produk berhasil diambil", result.Items, result.Page, result.PerPage, result.Total)
}

func (h *ProductHandler) GetBySlug(c *gin.Context) {
	product, err := h.productService.GetBySlug(c.Param("slug"))
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Detail produk berhasil diambil", product)
}

func (h *ProductHandler) ListCategories(c *gin.Context) {
	categories, err := h.categoryService.List()
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Kategori berhasil diambil", categories)
}
