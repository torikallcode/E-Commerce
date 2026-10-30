package middleware

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type rateLimiter struct {
	visitors map[string]*visitor
	mu       sync.Mutex
}

type visitor struct {
	times []time.Time
	seen  time.Time
}

var limiter = &rateLimiter{visitors: make(map[string]*visitor)}

// RateLimitMiddleware allows at most requestsPerMinute requests per client IP.
func RateLimitMiddleware(requestsPerMinute int) gin.HandlerFunc {
	if requestsPerMinute <= 0 {
		requestsPerMinute = 120
	}

	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now()

		limiter.mu.Lock()
		cleanupLocked(now)

		entry, ok := limiter.visitors[ip]
		if !ok {
			entry = &visitor{}
			limiter.visitors[ip] = entry
		}
		entry.seen = now

		valid := entry.times[:0]
		for _, t := range entry.times {
			if now.Sub(t) < time.Minute {
				valid = append(valid, t)
			}
		}
		entry.times = valid

		if len(entry.times) >= requestsPerMinute {
			limiter.mu.Unlock()
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(429, gin.H{"success": false, "message": "Terlalu banyak request"})
			return
		}
		entry.times = append(entry.times, now)
		limiter.mu.Unlock()

		c.Next()
	}
}

func cleanupLocked(now time.Time) {
	for ip, entry := range limiter.visitors {
		if now.Sub(entry.seen) > 5*time.Minute {
			delete(limiter.visitors, ip)
		}
	}
}
