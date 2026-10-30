package middleware

import (
	"ecommerce/backend/internal/apperror"
	"ecommerce/backend/pkg/jwt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(jwtManager *jwt.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			apperrorResponse(c, apperror.New(apperror.ErrCodeUnauthorized, "Token akses diperlukan", 401, nil))
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			apperrorResponse(c, apperror.New(apperror.ErrCodeUnauthorized, "Format token tidak valid", 401, nil))
			c.Abort()
			return
		}

		claims, err := jwtManager.ValidateAccessToken(parts[1])
		if err != nil {
			apperrorResponse(c, apperror.New(apperror.ErrCodeUnauthorized, "Token tidak valid atau kadaluarsa", 401, err))
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}

func RBACMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("user_role")
		if !exists {
			apperrorResponse(c, apperror.New(apperror.ErrCodeUnauthorized, "Role tidak ditemukan", 401, nil))
			c.Abort()
			return
		}

		userRole, ok := role.(string)
		if !ok {
			apperrorResponse(c, apperror.New(apperror.ErrCodeInternal, "Role tidak valid", 500, nil))
			c.Abort()
			return
		}

		for _, r := range allowedRoles {
			if userRole == r {
				c.Next()
				return
			}
		}

		apperrorResponse(c, apperror.New(apperror.ErrCodeForbidden, "Akses ditolak", 403, nil))
		c.Abort()
	}
}

func apperrorResponse(c *gin.Context, appErr *apperror.AppError) {
	c.JSON(appErr.HTTPCode, gin.H{
		"success": false,
		"message": appErr.Message,
		"code":    appErr.Code,
	})
}

var _ = http.StatusOK
