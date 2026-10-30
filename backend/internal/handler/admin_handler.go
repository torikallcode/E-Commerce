package handler

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/service"
	"ecommerce/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	dashboardService service.DashboardService
	productService   service.ProductService
	categoryService  service.CategoryService
	orderService     service.OrderService
	uploadDir        string
}

func NewAdminHandler(
	dashboardService service.DashboardService,
	productService service.ProductService,
	categoryService service.CategoryService,
	orderService service.OrderService,
	uploadDir string,
) *AdminHandler {
	return &AdminHandler{
		dashboardService: dashboardService,
		productService:   productService,
		categoryService:  categoryService,
		orderService:     orderService,
		uploadDir:        uploadDir,
	}
}

func (h *AdminHandler) DashboardSummary(c *gin.Context) {
	summary, err := h.dashboardService.GetSummary()
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Ringkasan dashboard berhasil diambil", summary)
}

func (h *AdminHandler) ListUsers(c *gin.Context) {
	page := parseQueryInt(c, "page", 1)
	perPage := parseQueryInt(c, "per_page", 20)

	users, total, err := h.dashboardService.ListUsers(page, perPage)
	if err != nil {
		respondError(c, err)
		return
	}
	response.Paginated(c, "Daftar pengguna berhasil diambil", users, page, perPage, total)
}

func (h *AdminHandler) ListProducts(c *gin.Context) {
	var query dto.ProductListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.BadRequest(c, "Query parameter tidak valid")
		return
	}
	result, err := h.productService.ListAdmin(query)
	if err != nil {
		respondError(c, err)
		return
	}
	response.Paginated(c, "Daftar produk admin berhasil diambil", result.Items, result.Page, result.PerPage, result.Total)
}

func (h *AdminHandler) CreateProduct(c *gin.Context) {
	var req dto.ProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}
	product, err := h.productService.Create(&req)
	if err != nil {
		respondError(c, err)
		return
	}
	response.Created(c, "Produk berhasil dibuat", product)
}

func (h *AdminHandler) UpdateProduct(c *gin.Context) {
	id := parseUintParam(c, "id")
	if id == 0 {
		response.BadRequest(c, "ID produk tidak valid")
		return
	}
	var req dto.ProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}
	product, err := h.productService.Update(id, &req)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Produk berhasil diperbarui", product)
}

func (h *AdminHandler) DeleteProduct(c *gin.Context) {
	id := parseUintParam(c, "id")
	if id == 0 {
		response.BadRequest(c, "ID produk tidak valid")
		return
	}
	if err := h.productService.Delete(id); err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Produk berhasil dihapus", nil)
}

func (h *AdminHandler) UploadProductImage(c *gin.Context) {
	productID := parseUintParam(c, "id")
	if productID == 0 {
		response.BadRequest(c, "ID produk tidak valid")
		return
	}

	sortOrder, _ := strconv.Atoi(c.PostForm("sort_order"))

	file, err := c.FormFile("file")
	if err == nil {
		if file.Size > 5*1024*1024 {
			response.BadRequest(c, "Ukuran gambar maksimal 5MB")
			return
		}

		ext := strings.ToLower(filepath.Ext(file.Filename))
		allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
		if !allowed[ext] {
			response.BadRequest(c, "Format gambar harus JPG, PNG, WEBP, atau GIF")
			return
		}

		dir := filepath.Join(h.uploadDir, "products")
		if err := os.MkdirAll(dir, 0o755); err != nil {
			response.InternalServerError(c, "Gagal menyiapkan direktori upload")
			return
		}

		filename := fmt.Sprintf("%d-%d%s", productID, time.Now().UnixNano(), ext)
		if err := c.SaveUploadedFile(file, filepath.Join(dir, filename)); err != nil {
			response.InternalServerError(c, "Gagal menyimpan gambar")
			return
		}

		image, err := h.productService.AddImage(productID, "/uploads/products/"+filename, sortOrder)
		if err != nil {
			respondError(c, err)
			return
		}
		response.Created(c, "Gambar produk berhasil diunggah", image)
		return
	}

	var req dto.ProductImageUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "File atau URL gambar wajib diisi")
		return
	}
	image, err := h.productService.AddImage(productID, req.URL, req.SortOrder)
	if err != nil {
		respondError(c, err)
		return
	}
	response.Created(c, "Gambar produk berhasil ditambahkan", image)
}

func (h *AdminHandler) DeleteProductImage(c *gin.Context) {
	productID := parseUintParam(c, "id")
	imageID := parseUintParam(c, "image_id")
	if productID == 0 || imageID == 0 {
		response.BadRequest(c, "ID tidak valid")
		return
	}
	if err := h.productService.DeleteImage(productID, imageID); err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Gambar produk berhasil dihapus", nil)
}

func (h *AdminHandler) ListCategories(c *gin.Context) {
	categories, err := h.categoryService.List()
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Daftar kategori admin berhasil diambil", categories)
}

func (h *AdminHandler) CreateCategory(c *gin.Context) {
	var req dto.CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}
	category, err := h.categoryService.Create(&req)
	if err != nil {
		respondError(c, err)
		return
	}
	response.Created(c, "Kategori berhasil dibuat", category)
}

func (h *AdminHandler) UpdateCategory(c *gin.Context) {
	id := parseUintParam(c, "id")
	if id == 0 {
		response.BadRequest(c, "ID kategori tidak valid")
		return
	}
	var req dto.CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}
	category, err := h.categoryService.Update(id, &req)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Kategori berhasil diperbarui", category)
}

func (h *AdminHandler) DeleteCategory(c *gin.Context) {
	id := parseUintParam(c, "id")
	if id == 0 {
		response.BadRequest(c, "ID kategori tidak valid")
		return
	}
	if err := h.categoryService.Delete(id); err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Kategori berhasil dihapus", nil)
}

func (h *AdminHandler) ListOrders(c *gin.Context) {
	page := parseQueryInt(c, "page", 1)
	perPage := parseQueryInt(c, "per_page", 20)
	result, err := h.orderService.ListAll(c.Query("status"), c.Query("q"), page, perPage)
	if err != nil {
		respondError(c, err)
		return
	}
	response.Paginated(c, "Daftar pesanan admin berhasil diambil", result.Items, result.Page, result.PerPage, result.Total)
}

func (h *AdminHandler) GetOrder(c *gin.Context) {
	id := parseUintParam(c, "id")
	if id == 0 {
		response.BadRequest(c, "ID pesanan tidak valid")
		return
	}
	order, err := h.orderService.GetByIDAdmin(id)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Detail pesanan berhasil diambil", order)
}

func (h *AdminHandler) UpdateOrderStatus(c *gin.Context) {
	id := parseUintParam(c, "id")
	if id == 0 {
		response.BadRequest(c, "ID pesanan tidak valid")
		return
	}
	var req dto.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}
	if err := h.orderService.UpdateStatus(id, &req); err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Status pesanan berhasil diperbarui", nil)
}
