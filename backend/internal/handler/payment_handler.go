package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"ecommerce/backend/internal/apperror"
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/service"
	"ecommerce/backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

type PaymentHandler struct {
	paymentService service.PaymentService
	devMode        bool
}

func NewPaymentHandler(paymentService service.PaymentService, devMode bool) *PaymentHandler {
	return &PaymentHandler{paymentService: paymentService, devMode: devMode}
}

func (h *PaymentHandler) Notification(c *gin.Context) {
	var req dto.PaymentNotificationRequest

	// This endpoint is unauthenticated, so cap its request body. Keep the
	// original JSON too: audit data must contain all fields Midtrans sent, not
	// only the subset represented by the DTO.
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1<<20)
	raw, err := c.GetRawData()
	if err != nil {
		response.BadRequest(c, "Payload notifikasi terlalu besar atau tidak dapat dibaca")
		return
	}
	if !json.Valid(raw) || binding.JSON.BindBody(raw, &req) != nil {
		c.JSON(400, gin.H{"success": false, "message": "Payload notifikasi tidak valid"})
		return
	}
	req.RawPayload = string(raw)

	if err := h.paymentService.HandleNotification(&req); err != nil {
		// Invalid signatures are explicitly rejected. Once signature validation
		// succeeds, a processing failure is logged/audited and acknowledged to
		// avoid repeated side effects; the reconciliation worker handles it.
		var appErr *apperror.AppError
		if errors.As(err, &appErr) && appErr.HTTPCode == http.StatusUnauthorized {
			respondError(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "Notification could not be processed"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Notification received"})
}

func (h *PaymentHandler) GetStatus(c *gin.Context) {
	orderNumber := c.Param("order_number")
	if orderNumber == "" {
		response.BadRequest(c, "Order number diperlukan")
		return
	}

	status, err := h.paymentService.GetPaymentStatus(currentUserID(c), orderNumber)
	if err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Status pembayaran berhasil diambil", status)
}

// DevSettle simulates settlement when Midtrans is not configured (development only).
func (h *PaymentHandler) DevSettle(c *gin.Context) {
	if !h.devMode {
		response.NotFound(c, "Endpoint tidak tersedia")
		return
	}

	orderNumber := c.Param("order_number")
	if orderNumber == "" {
		response.BadRequest(c, "Order number diperlukan")
		return
	}

	if err := h.paymentService.DevSettle(currentUserID(c), orderNumber); err != nil {
		respondError(c, err)
		return
	}
	response.OK(c, "Pembayaran simulasi berhasil", nil)
}
