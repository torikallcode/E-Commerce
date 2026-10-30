package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"ecommerce/backend/internal/config"
	"ecommerce/backend/internal/handler"
	"ecommerce/backend/internal/model"
	"ecommerce/backend/internal/repository"
	"ecommerce/backend/internal/router"
	"ecommerce/backend/internal/service"
	"ecommerce/backend/pkg/database"
	"ecommerce/backend/pkg/hash"
	"ecommerce/backend/pkg/jwt"
	"ecommerce/backend/pkg/mailer"
	"ecommerce/backend/pkg/midtrans"
	"ecommerce/backend/pkg/util"

	"gorm.io/gorm"
)

func main() {
	cfg, err := config.Load(envFile())
	if err != nil {
		log.Fatalf("Gagal memuat konfigurasi: %v", err)
	}

	hash.Cost = cfg.Hash.Cost

	dbCfg := database.Config{
		Host:     cfg.Database.Host,
		Port:     cfg.Database.Port,
		User:     cfg.Database.User,
		Password: cfg.Database.Password,
		Name:     cfg.Database.Name,
	}
	if err := database.EnsureDatabase(dbCfg); err != nil {
		log.Printf("Peringatan: gagal memastikan database ada: %v", err)
	}

	db, err := database.New(dbCfg)
	if err != nil {
		log.Fatalf("Gagal terhubung ke database: %v", err)
	}

	if dir := migrationsDir(); dir != "" {
		if err := database.Migrate(db, dir); err != nil {
			log.Fatalf("Gagal menjalankan migrasi: %v", err)
		}
	} else {
		log.Println("Peringatan: direktori migrations tidak ditemukan, migrasi dilewati")
	}

	seedAdmin(db, cfg)
	if cfg.App.Env == "development" {
		seedDemoCatalog(db)
	}

	jwtManager := jwt.NewManager(
		cfg.JWT.AccessSecret,
		cfg.JWT.RefreshSecret,
		cfg.JWT.AccessExpiry,
		cfg.JWT.RefreshExpiry,
	)

	gateway := midtrans.NewClient(cfg.Midtrans.ServerKey, cfg.Midtrans.ClientKey, cfg.Midtrans.Production)
	mailerClient := mailer.NewClient(
		cfg.Mailer.Host,
		cfg.Mailer.Port,
		cfg.Mailer.User,
		cfg.Mailer.Password,
		cfg.Mailer.From,
	)

	uow := repository.NewUnitOfWork(db)
	userRepo := repository.NewUserRepository(db)
	refreshTokenRepo := repository.NewRefreshTokenRepository(db)
	addressRepo := repository.NewAddressRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	productRepo := repository.NewProductRepository(db)
	cartRepo := repository.NewCartRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	orderItemRepo := repository.NewOrderItemRepository(db)
	paymentRepo := repository.NewPaymentRepository(db)

	authService := service.NewAuthService(userRepo, refreshTokenRepo, jwtManager, cfg.JWT.RefreshExpiry)
	productService := service.NewProductService(productRepo, categoryRepo)
	categoryService := service.NewCategoryService(categoryRepo, productRepo)
	cartService := service.NewCartService(cartRepo, productRepo)
	orderService := service.NewOrderService(
		uow, orderRepo, orderItemRepo, cartRepo, productRepo, paymentRepo,
		addressRepo, userRepo, gateway, cfg.Order, cfg.App.FrontendURL,
		mailerClient, cfg.Mailer.Enabled,
	)
	addressService := service.NewAddressService(addressRepo)
	paymentService := service.NewPaymentService(uow, orderRepo, orderItemRepo, paymentRepo, productRepo, gateway)
	dashboardService := service.NewDashboardService(orderRepo, userRepo, productRepo)

	authHandler := handler.NewAuthHandler(authService)
	productHandler := handler.NewProductHandler(productService, categoryService)
	cartHandler := handler.NewCartHandler(cartService)
	orderHandler := handler.NewOrderHandler(orderService)
	addressHandler := handler.NewAddressHandler(addressService)
	devMode := !gateway.Enabled() && cfg.App.Env != "production"
	paymentHandler := handler.NewPaymentHandler(paymentService, devMode)
	adminHandler := handler.NewAdminHandler(dashboardService, productService, categoryService, orderService, cfg.App.UploadDir)

	r := router.Setup(
		cfg, authHandler, productHandler, cartHandler, orderHandler,
		addressHandler, paymentHandler, adminHandler, jwtManager,
	)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go paymentService.RunExpiryWorker(ctx, time.Minute)

	srv := &http.Server{
		Addr:              ":" + cfg.App.Port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("Server berjalan di %s (env=%s, midtrans=%v, dev payment=%v)",
			srv.Addr, cfg.App.Env, gateway.Enabled(), devMode)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Gagal memulai server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Menghentikan server...")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("Gagal menghentikan server dengan graceful shutdown: %v", err)
	}
	log.Println("Server berhenti")
}

func envFile() string {
	for _, candidate := range []string{".env", ".env.example"} {
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	return ".env"
}

func migrationsDir() string {
	for _, candidate := range []string{"migrations", filepath.Join("backend", "migrations")} {
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			return candidate
		}
	}
	return ""
}

func seedAdmin(db *gorm.DB, cfg *config.Config) {
	if cfg.Admin.Password == "" {
		log.Println("ADMIN_PASSWORD kosong; seeding admin dilewati")
		return
	}

	var existing model.User
	err := db.Where("email = ?", cfg.Admin.Email).First(&existing).Error
	if err == nil {
		return
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("Gagal memeriksa admin: %v", err)
		return
	}

	passwordHash, err := hash.Hash(cfg.Admin.Password)
	if err != nil {
		log.Printf("Gagal membuat hash password admin: %v", err)
		return
	}

	admin := &model.User{
		Name:     cfg.Admin.Name,
		Email:    cfg.Admin.Email,
		Password: passwordHash,
		Role:     "admin",
	}
	if err := db.Create(admin).Error; err != nil {
		log.Printf("Gagal membuat admin awal: %v", err)
		return
	}
	log.Printf("Admin awal dibuat: %s", cfg.Admin.Email)
}

type demoCategory struct {
	Name     string
	Slug     string
	Products []demoProduct
}

type demoProduct struct {
	Name        string
	Slug        string
	Description string
	Price       float64
	Stock       int
}

func seedDemoCatalog(db *gorm.DB) {
	var count int64
	if err := db.Model(&model.Product{}).Count(&count).Error; err != nil || count > 0 {
		return
	}

	demo := []demoCategory{
		{
			Name: "Elektronik",
			Slug: "elektronik",
			Products: []demoProduct{
				{Name: "Aurora Wireless Headphone", Slug: "aurora-wireless-headphone", Description: "Headphone nirkabel dengan noise cancelling dan baterai 30 jam.", Price: 899000, Stock: 25},
				{Name: "Nimbus Smart Watch", Slug: "nimbus-smart-watch", Description: "Jam pintar dengan pemantau detak jantung dan GPS.", Price: 1249000, Stock: 18},
				{Name: "Volt Power Bank 20000mAh", Slug: "volt-power-bank-20000mah", Description: "Power bank cepat dengan dua port USB-C dan pengisian 65W.", Price: 399000, Stock: 60},
			},
		},
		{
			Name: "Fashion",
			Slug: "fashion",
			Products: []demoProduct{
				{Name: "Kanvas Everyday Tote", Slug: "kanvas-everyday-tote", Description: "Tas kanvas tebal dengan kompartemen laptop 14 inci.", Price: 249000, Stock: 40},
				{Name: "Linen Oversized Shirt", Slug: "linen-oversized-shirt", Description: "Kemeja linen adem dengan potongan oversized.", Price: 329000, Stock: 35},
			},
		},
		{
			Name: "Rumah Tangga",
			Slug: "rumah-tangga",
			Products: []demoProduct{
				{Name: "Terra Ceramic Mug Set", Slug: "terra-ceramic-mug-set", Description: "Set 4 mug keramik buatan tangan, aman untuk dishwasher.", Price: 189000, Stock: 50},
				{Name: "Sora Aroma Diffuser", Slug: "sora-aroma-diffuser", Description: "Diffuser ultrasonik dengan lampu ambient dan timer.", Price: 279000, Stock: 30},
			},
		},
	}

	for _, category := range demo {
		c := &model.Category{Name: category.Name, Slug: category.Slug}
		if err := db.Create(c).Error; err != nil {
			log.Printf("Gagal membuat kategori demo %s: %v", category.Name, err)
			continue
		}
		for _, p := range category.Products {
			product := &model.Product{
				CategoryID:  c.ID,
				Name:        p.Name,
				Slug:        p.Slug,
				Description: p.Description,
				Price:       p.Price,
				Stock:       p.Stock,
				IsActive:    true,
			}
			if err := db.Create(product).Error; err != nil {
				log.Printf("Gagal membuat produk demo %s: %v", p.Name, err)
				continue
			}
			image := &model.ProductImage{
				ProductID: product.ID,
				URL:       fmt.Sprintf("https://picsum.photos/seed/%s/800/800", util.Slugify(p.Slug)),
				SortOrder: 0,
			}
			_ = db.Create(image).Error
		}
	}
	log.Println("Katalog demo dibuat")
}
