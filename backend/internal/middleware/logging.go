package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// LoggingMiddleware logs every request with a request id, latency and status.
func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = newRequestID()
		}
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)

		c.Next()

		latency := time.Since(start)
		log.Printf(
			`request_id=%s method=%s path=%s status=%d latency=%s ip=%s`,
			requestID, c.Request.Method, c.Request.URL.Path, c.Writer.Status(), latency, c.ClientIP(),
		)
	}
}

// SecurityHeaders adds a small set of hardening headers to every response.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	}
}

func newRequestID() string {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return time.Now().Format("20060102150405")
	}
	return hex.EncodeToString(b)
}

func RecoveryMiddleware() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		log.Printf("panic request_id=%s path=%s: %v", c.GetString("request_id"), c.Request.URL.Path, recovered)
		c.AbortWithStatusJSON(500, gin.H{
			"success": false,
			"message": "Terjadi kesalahan pada server",
		})
	})
}
