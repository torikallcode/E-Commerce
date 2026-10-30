package handler

import (
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/service"
	"ecommerce/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type CartHandler struct {
	cartService service.CartService
}

func NewCartHandler(cartService service.CartService) *CartHandler {
	return &CartHandler{cartService: cartService}
}

func (h *CartHandler) GetCart(c *gin.Context) {
	cart, err := h.cartService.GetCart(currentUserID(c))
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Keranjang berhasil diambil", cart)
}

func (h *CartHandler) AddItem(c *gin.Context) {
	var req dto.CartItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}

	cart, err := h.cartService.AddItem(currentUserID(c), &req)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Item berhasil ditambahkan ke keranjang", cart)
}

func (h *CartHandler) UpdateItem(c *gin.Context) {
	productID := parseUintParam(c, "product_id")
	if productID == 0 {
		response.BadRequest(c, "Product ID tidak valid")
		return
	}

	var req dto.UpdateCartItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}

	cart, err := h.cartService.UpdateItem(currentUserID(c), productID, req.Quantity)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Item keranjang berhasil diperbarui", cart)
}

func (h *CartHandler) RemoveItem(c *gin.Context) {
	productID := parseUintParam(c, "product_id")
	if productID == 0 {
		response.BadRequest(c, "Product ID tidak valid")
		return
	}

	cart, err := h.cartService.RemoveItem(currentUserID(c), productID)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Item berhasil dihapus dari keranjang", cart)
}
