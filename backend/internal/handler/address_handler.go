package handler

import (
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/service"
	"ecommerce/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type AddressHandler struct {
	addressService service.AddressService
}

func NewAddressHandler(addressService service.AddressService) *AddressHandler {
	return &AddressHandler{addressService: addressService}
}

func (h *AddressHandler) List(c *gin.Context) {
	addresses, err := h.addressService.List(currentUserID(c))
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Daftar alamat berhasil diambil", addresses)
}

func (h *AddressHandler) Create(c *gin.Context) {
	var req dto.AddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}

	address, err := h.addressService.Create(currentUserID(c), &req)
	if err != nil {
		respondError(c, err)
		return
	}
	response.Created(c, "Alamat berhasil ditambahkan", address)
}

func (h *AddressHandler) GetByID(c *gin.Context) {
	id := parseUintParam(c, "id")
	if id == 0 {
		response.BadRequest(c, "ID alamat tidak valid")
		return
	}

	address, err := h.addressService.GetByID(currentUserID(c), id)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Alamat berhasil diambil", address)
}

func (h *AddressHandler) Update(c *gin.Context) {
	id := parseUintParam(c, "id")
	if id == 0 {
		response.BadRequest(c, "ID alamat tidak valid")
		return
	}

	var req dto.AddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}

	address, err := h.addressService.Update(currentUserID(c), id, &req)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Alamat berhasil diperbarui", address)
}

func (h *AddressHandler) Delete(c *gin.Context) {
	id := parseUintParam(c, "id")
	if id == 0 {
		response.BadRequest(c, "ID alamat tidak valid")
		return
	}

	if err := h.addressService.Delete(currentUserID(c), id); err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Alamat berhasil dihapus", nil)
}

func (h *AddressHandler) SetDefault(c *gin.Context) {
	id := parseUintParam(c, "id")
	if id == 0 {
		response.BadRequest(c, "ID alamat tidak valid")
		return
	}

	if err := h.addressService.SetDefault(currentUserID(c), id); err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Alamat default berhasil diatur", nil)
}
