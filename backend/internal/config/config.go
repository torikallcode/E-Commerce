package config

import (
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	App      AppConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Hash     HashConfig
	Midtrans MidtransConfig
	Mailer   MailerConfig
	Order    OrderConfig
	Admin    AdminConfig
}

type AppConfig struct {
	Name        string
	Env         string
	Port        string
	URL         string
	FrontendURL string
	CORSOrigins []string
	UploadDir   string
	RateLimit   int
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

type JWTConfig struct {
	AccessSecret  string
	RefreshSecret string
	AccessExpiry  time.Duration
	RefreshExpiry time.Duration
}

type HashConfig struct {
	Cost int
}

type MidtransConfig struct {
	ServerKey  string
	ClientKey  string
	Production bool
}

type MailerConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	From     string
	Enabled  bool
}

type OrderConfig struct {
	ShippingFlat    float64
	FreeShippingMin float64
	PaymentExpiry   time.Duration
}

type AdminConfig struct {
	Name     string
	Email    string
	Password string
}

// Load reads configuration from the given env file (best effort) and the process env.
func Load(path string) (*Config, error) {
	if path != "" {
		_ = godotenv.Load(path)
	}

	accessExpiry, err := time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
	if err != nil {
		accessExpiry = 15 * time.Minute
	}

	refreshExpiry, err := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "720h"))
	if err != nil {
		refreshExpiry = 720 * time.Hour
	}

	paymentExpiry, err := time.ParseDuration(getEnv("PAYMENT_EXPIRY", "24h"))
	if err != nil {
		paymentExpiry = 24 * time.Hour
	}

	bcryptCost, err := strconv.Atoi(getEnv("BCRYPT_COST", "10"))
	if err != nil || bcryptCost < 4 {
		bcryptCost = 10
	}

	rateLimit, err := strconv.Atoi(getEnv("RATE_LIMIT_PER_MINUTE", "120"))
	if err != nil || rateLimit < 1 {
		rateLimit = 120
	}

	origins := []string{getEnv("FRONTEND_URL", "http://localhost:5173")}
	if raw := getEnv("CORS_ORIGINS", ""); raw != "" {
		origins = origins[:0]
		for _, o := range strings.Split(raw, ",") {
			if trimmed := strings.TrimSpace(o); trimmed != "" {
				origins = append(origins, trimmed)
			}
		}
	}

	mailerHost := getEnv("SMTP_HOST", "")
	mailerEnabled := getEnvBool("SMTP_ENABLED", mailerHost != "" && mailerHost != "localhost")

	return &Config{
		App: AppConfig{
			Name:        getEnv("APP_NAME", "e-commerce"),
			Env:         getEnv("APP_ENV", "development"),
			Port:        getEnv("APP_PORT", "8080"),
			URL:         getEnv("APP_URL", "http://localhost:8080"),
			FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
			CORSOrigins: origins,
			UploadDir:   getEnv("UPLOAD_DIR", "uploads"),
			RateLimit:   rateLimit,
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "3306"),
			User:     getEnv("DB_USER", "root"),
			Password: getEnv("DB_PASS", "password"),
			Name:     getEnv("DB_NAME", "ecommerce"),
		},
		JWT: JWTConfig{
			AccessSecret:  getEnv("JWT_ACCESS_SECRET", "your-access-secret-change-me"),
			RefreshSecret: getEnv("JWT_REFRESH_SECRET", "your-refresh-secret-change-me"),
			AccessExpiry:  accessExpiry,
			RefreshExpiry: refreshExpiry,
		},
		Hash: HashConfig{Cost: bcryptCost},
		Midtrans: MidtransConfig{
			ServerKey:  getEnv("MIDTRANS_SERVER_KEY", ""),
			ClientKey:  getEnv("MIDTRANS_CLIENT_KEY", ""),
			Production: getEnvBool("MIDTRANS_IS_PRODUCTION", false),
		},
		Mailer: MailerConfig{
			Host:     mailerHost,
			Port:     getEnv("SMTP_PORT", "587"),
			User:     getEnv("SMTP_USER", ""),
			Password: getEnv("SMTP_PASS", ""),
			From:     getEnv("SMTP_FROM", "noreply@localhost"),
			Enabled:  mailerEnabled,
		},
		Order: OrderConfig{
			ShippingFlat:    getEnvFloat("SHIPPING_FLAT", 15000),
			FreeShippingMin: getEnvFloat("FREE_SHIPPING_MIN", 0),
			PaymentExpiry:   paymentExpiry,
		},
		Admin: AdminConfig{
			Name:     getEnv("ADMIN_NAME", "Administrator"),
			Email:    getEnv("ADMIN_EMAIL", "admin@example.com"),
			Password: getEnv("ADMIN_PASSWORD", ""),
		},
	}, nil
}

func getEnv(key, defaultValue string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	val := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	if val == "" {
		return defaultValue
	}
	return val == "true" || val == "1" || val == "yes"
}

func getEnvFloat(key string, defaultValue float64) float64 {
	val := strings.TrimSpace(os.Getenv(key))
	if val == "" {
		return defaultValue
	}
	parsed, err := strconv.ParseFloat(val, 64)
	if err != nil {
		return defaultValue
	}
	return parsed
}
