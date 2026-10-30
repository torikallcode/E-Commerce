package router

import (
	"net/http"

	"ecommerce/backend/internal/config"
	"ecommerce/backend/internal/handler"
	"ecommerce/backend/internal/middleware"
	"ecommerce/backend/pkg/jwt"
	"ecommerce/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

func Setup(
	cfg *config.Config,
	authHandler *handler.AuthHandler,
	productHandler *handler.ProductHandler,
	cartHandler *handler.CartHandler,
	orderHandler *handler.OrderHandler,
	addressHandler *handler.AddressHandler,
	paymentHandler *handler.PaymentHandler,
	adminHandler *handler.AdminHandler,
	jwtManager *jwt.Manager,
) *gin.Engine {
	r := gin.New()
	r.MaxMultipartMemory = 8 << 20 // 8 MB

	r.Use(middleware.LoggingMiddleware())
	r.Use(middleware.RecoveryMiddleware())
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.CORS(cfg.App.CORSOrigins))
	r.Use(middleware.RateLimitMiddleware(cfg.App.RateLimit))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "env": cfg.App.Env})
	})

	// Uploaded product images
	r.Static("/uploads", cfg.App.UploadDir)

	r.NoRoute(func(c *gin.Context) {
		response.NotFound(c, "Endpoint tidak ditemukan")
	})

	api := r.Group("/api/v1")
	{
		// Auth (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", middleware.RateLimitMiddleware(10), authHandler.Register)
			auth.POST("/login", middleware.RateLimitMiddleware(10), authHandler.Login)
			auth.POST("/refresh", middleware.RateLimitMiddleware(20), authHandler.Refresh)
			auth.POST("/logout", middleware.AuthMiddleware(jwtManager), authHandler.Logout)
		}

		// Profile (customer/admin)
		me := api.Group("/me", middleware.AuthMiddleware(jwtManager))
		{
			me.GET("", authHandler.GetProfile)
			me.PUT("", authHandler.UpdateProfile)
		}

		// Addresses (customer)
		addresses := api.Group("/addresses", middleware.AuthMiddleware(jwtManager))
		{
			addresses.GET("", addressHandler.List)
			addresses.POST("", addressHandler.Create)
			addresses.GET("/:id", addressHandler.GetByID)
			addresses.PUT("/:id", addressHandler.Update)
			addresses.DELETE("/:id", addressHandler.Delete)
			addresses.POST("/:id/set-default", addressHandler.SetDefault)
		}

		// Products (public read)
		products := api.Group("/products")
		{
			products.GET("", productHandler.List)
			products.GET("/:slug", productHandler.GetBySlug)
		}
		api.GET("/categories", productHandler.ListCategories)

		// Cart (customer)
		cart := api.Group("/cart", middleware.AuthMiddleware(jwtManager))
		{
			cart.GET("", cartHandler.GetCart)
			cart.POST("/items", cartHandler.AddItem)
			cart.PUT("/items/:product_id", cartHandler.UpdateItem)
			cart.DELETE("/items/:product_id", cartHandler.RemoveItem)
		}

		// Orders (customer)
		orders := api.Group("/orders", middleware.AuthMiddleware(jwtManager))
		{
			orders.POST("", orderHandler.Checkout)
			orders.GET("", orderHandler.ListByUser)
			orders.GET("/:order_number", orderHandler.GetByID)
			orders.GET("/:order_number/payment-status", paymentHandler.GetStatus)
			orders.POST("/:order_number/cancel", orderHandler.Cancel)
		}

		// Payment webhook (public, protected by signature verification)
		api.POST("/payments/midtrans/notification", paymentHandler.Notification)

		// Development-only payment simulation. The handler returns 404 unless
		// Midtrans is not configured and the app runs in development mode.
		if cfg.App.Env != "production" {
			dev := api.Group("/dev", middleware.AuthMiddleware(jwtManager))
			dev.POST("/payments/:order_number/settle", paymentHandler.DevSettle)
		}
	}

	// Admin routes
	admin := api.Group("/admin", middleware.AuthMiddleware(jwtManager), middleware.RBACMiddleware("admin"))
	{
		admin.GET("/dashboard/summary", adminHandler.DashboardSummary)
		admin.GET("/users", adminHandler.ListUsers)

		adminProducts := admin.Group("/products")
		{
			adminProducts.GET("", adminHandler.ListProducts)
			adminProducts.POST("", adminHandler.CreateProduct)
			adminProducts.PUT("/:id", adminHandler.UpdateProduct)
			adminProducts.DELETE("/:id", adminHandler.DeleteProduct)
			adminProducts.POST("/:id/images", adminHandler.UploadProductImage)
			adminProducts.DELETE("/:id/images/:image_id", adminHandler.DeleteProductImage)
		}

		adminCategories := admin.Group("/categories")
		{
			adminCategories.GET("", adminHandler.ListCategories)
			adminCategories.POST("", adminHandler.CreateCategory)
			adminCategories.PUT("/:id", adminHandler.UpdateCategory)
			adminCategories.DELETE("/:id", adminHandler.DeleteCategory)
		}

		adminOrders := admin.Group("/orders")
		{
			adminOrders.GET("", adminHandler.ListOrders)
			adminOrders.GET("/:id", adminHandler.GetOrder)
			adminOrders.PATCH("/:id/status", adminHandler.UpdateOrderStatus)
		}
	}

	return r
}
