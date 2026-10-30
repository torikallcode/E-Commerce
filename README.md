# E-Commerce Platform

Website penjualan online berbasis React + Vite + Tailwind (frontend) dan Go + Gin + GORM (backend) dengan integrasi pembayaran Midtrans.

## Arsitektur

```
backend/       # Go + Gin + GORM + Midtrans
frontend/      # React 19 + React Router 7 + TanStack Query 5 + Zustand 5 + Axios + RHF + Zod + Tailwind 3.4
```

## Struktur Folder

```
e-commerce/
├── backend/           # Backend Go
│   ├── cmd/api/       # Entry point
│   ├── internal/      # Logika bisnis, repo, handler
│   ├── pkg/           # Utilitas (hash, jwt, midtrans, response)
│   ├── migrations/    # File migrasi SQL
│   ├── docs/          # OpenAPI dokumentasi
│   ├── Dockerfile
│   └── go.mod
├── frontend/          # Frontend React
│   ├── src/           # Sumber React
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml # Setup MySQL + Backend + Frontend
├── prd.md             # Product Requirements Document
└── go.mod
```

## Persyaratan

- Docker & Docker Compose (opsional, untuk development dengan container)
- Go 1.26+ (untuk development backend tanpa Docker)
- Node.js 22+ & npm (untuk development frontend tanpa Docker)
- MySQL 9.1+ (harus tersedia, bisa melalui docker-compose)

## Development (tanpa Docker)

### Backend

```bash
# 1. Konfigurasi environment
cp backend/.env.example backend/.env
# Edit .env sesuai konfigurasi lokal

# 2. Pastikan MySQL running dan database ecommerce tersedia

# 3. Migrasi database (migrasi akan auto-create jika DB belum ada)
go run ./cmd/api  # atau: go -run ./backend/cmd/api

# 4. Atau jalankan dengan migrate
go run ./backend/pkg/database/migrate.go
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # menjalankan di http://localhost:5173
```

## Docker Development

```bash
# 1. Build dan jalankan semua layanan
docker-compose up -d --build

# 2. Lihat log backend
docker-compose logs -f backend

# 3. Akses aplikasi
#   - Frontend: http://localhost:5173
#   - Backend API: http://localhost:8080/api/v1
#   - MySQL: 127.0.0.1:3306 (user: root, password: test)
```

## Akun Default

Setelah migrasi atau seeds, akun default tersedia:

| Peran | Email | Password |
|-------|-------|----------|
| Admin | admin@example.com | admin12345 |
| Customer | customer@example.com | customer12345 |

## Skrip QA

Skrip otentikasi uji akhir (E2E) tersedia di `%TEMP%\opencode\qa-flow.mjs`. Jalankan melalui browser automation untuk memverifikasi alur lengkap dari login hingga admin status update.

## Script pembayaran development

Jika `MIDTRANS_IS_PRODUCTION=false` dan environment bukan production, endpoint simulasi pembayaran tersedia:

```
POST /api/v1/dev/payments/:order_number/settle
```

Endpoint ini akan mengubah status pembayaran menjadi `settled` dan status pesanan menjadi `paid` tanpa perlu Midtrans.

## Tersedia juga

- Health check: `GET /healthz`
- Dokumentasi API lengkap: `backend/docs/openapi.yaml`
- Migrasi database: `backend/pkg/database/migrate.go`