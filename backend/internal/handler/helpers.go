package handler

import (
	"errors"
	"strconv"

	"ecommerce/backend/internal/apperror"
	"ecommerce/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

// respondError converts an application error into a consistent HTTP response.
// Unknown errors are logged by the middleware and hidden from the client.
func respondError(c *gin.Context, err error) {
	var appErr *apperror.AppError
	if errors.As(err, &appErr) {
		response.Error(c, appErr.HTTPCode, appErr.Message)
		return
	}
	response.InternalServerError(c, "Terjadi kesalahan pada server")
}

func currentUserID(c *gin.Context) uint {
	value, exists := c.Get("user_id")
	if !exists {
		return 0
	}
	id, _ := value.(uint)
	return id
}

func currentUserRole(c *gin.Context) string {
	value, _ := c.Get("user_role")
	role, _ := value.(string)
	return role
}

func parseUintParam(c *gin.Context, name string) uint {
	value, err := strconv.ParseUint(c.Param(name), 10, 64)
	if err != nil {
		return 0
	}
	return uint(value)
}

func parseQueryInt(c *gin.Context, key string, defaultValue int) int {
	value, err := strconv.Atoi(c.Query(key))
	if err != nil || value <= 0 {
		return defaultValue
	}
	return value
}
