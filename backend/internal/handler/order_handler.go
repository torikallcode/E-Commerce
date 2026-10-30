package handler

import (
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/service"
	"ecommerce/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	orderService service.OrderService
}

func NewOrderHandler(orderService service.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
}

func (h *OrderHandler) Checkout(c *gin.Context) {
	var req dto.CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}

	order, err := h.orderService.Checkout(currentUserID(c), &req)
	if err != nil {
		respondError(c, err)
		return
	}
	response.Created(c, "Pesanan berhasil dibuat", order)
}

func (h *OrderHandler) ListByUser(c *gin.Context) {
	page := parseQueryInt(c, "page", 1)
	perPage := parseQueryInt(c, "per_page", 20)
	status := c.Query("status")

	orders, err := h.orderService.ListByUserID(currentUserID(c), status, page, perPage)
	if err != nil {
		respondError(c, err)
		return
	}
	response.Paginated(c, "Daftar pesanan berhasil diambil", orders.Items, orders.Page, orders.PerPage, orders.Total)
}

func (h *OrderHandler) GetByID(c *gin.Context) {
	orderNumber := c.Param("order_number")
	if orderNumber == "" {
		response.BadRequest(c, "Order number diperlukan")
		return
	}

	order, err := h.orderService.GetByID(currentUserID(c), orderNumber)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Detail pesanan berhasil diambil", order)
}

func (h *OrderHandler) Cancel(c *gin.Context) {
	orderNumber := c.Param("order_number")
	if orderNumber == "" {
		response.BadRequest(c, "Order number diperlukan")
		return
	}

	if err := h.orderService.Cancel(currentUserID(c), orderNumber); err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Pesanan berhasil dibatalkan", nil)
}
