package handler

import (
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/service"
	"ecommerce/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}

	authResp, err := h.authService.Register(&req)
	if err != nil {
		respondError(c, err)
		return
	}
	response.Created(c, "Registrasi berhasil", authResp)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}

	authResp, err := h.authService.Login(&req)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Login berhasil", authResp)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}

	authResp, err := h.authService.Refresh(&req)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Token berhasil diperbarui", authResp)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	userID := currentUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "User tidak teridentifikasi")
		return
	}

	if err := h.authService.Logout(userID); err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Logout berhasil", nil)
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	profile, err := h.authService.GetProfile(currentUserID(c))
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Profil berhasil diambil", profile)
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Request tidak valid: "+err.Error())
		return
	}

	profile, err := h.authService.UpdateProfile(currentUserID(c), &req)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Profil berhasil diperbarui", profile)
}
