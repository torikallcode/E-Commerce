# Product Requirements Document (PRD)
## Website E-Commerce

| Item | Detail |
|---|---|
| Versi | 1.0 (Draft) |
| Tanggal | 30 Oktober 2026 |
| Status | Draft untuk review |
| Tech Stack | React.js, Vite, Tailwind CSS, Golang, Gin, MySQL, Midtrans |
| Arsitektur Backend | Layered Architecture |

---

## 1. Ringkasan Produk

### 1.1 Latar Belakang
Pelaku usaha membutuhkan platform penjualan online yang dapat dikelola sendiri, cepat, dan mendukung pembayaran lokal (QRIS, Virtual Account, e-wallet, kartu kredit). Dokumen ini mendefinisikan kebutuhan produk dan rencana pengembangan website e-commerce dari nol hingga siap rilis.

### 1.2 Tujuan
- Menyediakan website e-commerce yang memungkinkan pelanggan menelusuri produk, memasukkan ke keranjang, checkout, dan membayar secara online.
- Menyediakan dashboard admin untuk mengelola produk, kategori, pesanan, dan pengguna.
- Mengintegrasikan pembayaran melalui Midtrans dengan status pesanan yang tersinkron otomatis.
- Membangun codebase yang rapi, mudah diuji, dan mudah dikembangkan melalui layered architecture.

### 1.3 Sasaran Terukur (Success Metrics)
| Metrik | Target |
|---|---|
| Waktu muat halaman utama (LCP) | < 2,5 detik |
| Waktu respons API (p95) | < 300 ms |
| Tingkat keberhasilan sinkronisasi webhook pembayaran | ≥ 99,5% |
| Konversi checkout (keranjang → bayar) | ≥ 2% pada 3 bulan pertama |
| Uptime | ≥ 99,5% |

### 1.4 Di Luar Cakupan (Out of Scope) untuk MVP
- Aplikasi mobile native
- Multi-vendor / marketplace
- Multi-bahasa dan multi-mata uang
- Program loyalitas dan poin
- Integrasi kurir otomatis (cek ongkir via API) — direncanakan fase 2

---

## 2. Target Pengguna dan Peran

| Peran | Deskripsi | Kebutuhan Utama |
|---|---|---|
| Guest | Pengunjung belum login | Melihat produk, mencari, mendaftar |
| Customer | Pelanggan terdaftar | Belanja, checkout, bayar, lacak pesanan |
| Admin | Pengelola toko | Kelola produk, stok, pesanan, laporan |

---

## 3. Kebutuhan Fungsional

Prioritas: **P0** = wajib MVP, **P1** = penting, **P2** = nice to have.

### 3.1 Autentikasi dan Akun
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-AUTH-01 | Registrasi dengan nama, email, dan password | P0 |
| FR-AUTH-02 | Login dengan email dan password (JWT access token + refresh token) | P0 |
| FR-AUTH-03 | Logout dan pencabutan refresh token | P0 |
| FR-AUTH-04 | Role-based access control (customer, admin) | P0 |
| FR-AUTH-05 | Lupa dan reset password via email | P1 |
| FR-AUTH-06 | Verifikasi email | P2 |
| FR-AUTH-07 | Kelola profil dan buku alamat | P0 |

### 3.2 Katalog Produk
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-CAT-01 | Daftar produk dengan pagination | P0 |
| FR-CAT-02 | Filter berdasarkan kategori, rentang harga | P0 |
| FR-CAT-03 | Pencarian produk berdasarkan nama | P0 |
| FR-CAT-04 | Pengurutan (terbaru, harga naik/turun) | P1 |
| FR-CAT-05 | Halaman detail produk (galeri gambar, deskripsi, stok, harga) | P0 |
| FR-CAT-06 | Varian produk (ukuran, warna) | P2 |
| FR-CAT-07 | Ulasan dan rating produk | P2 |

### 3.3 Keranjang Belanja
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-CART-01 | Tambah, ubah jumlah, dan hapus item keranjang | P0 |
| FR-CART-02 | Keranjang tersimpan di server untuk user login | P0 |
| FR-CART-03 | Validasi stok saat menambah item dan saat checkout | P0 |
| FR-CART-04 | Ringkasan subtotal | P0 |

### 3.4 Checkout dan Pesanan
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-ORD-01 | Pilih atau tambah alamat pengiriman | P0 |
| FR-ORD-02 | Pembuatan pesanan dari keranjang dengan snapshot harga dan nama produk | P0 |
| FR-ORD-03 | Pengurangan stok secara atomik (transaksi database) | P0 |
| FR-ORD-04 | Riwayat dan detail pesanan pelanggan | P0 |
| FR-ORD-05 | Pembatalan otomatis pesanan yang tidak dibayar sampai batas waktu (expiry) dan stok dikembalikan | P0 |
| FR-ORD-06 | Biaya pengiriman flat atau berdasarkan wilayah | P1 |
| FR-ORD-07 | Kode voucher / diskon | P2 |

### 3.5 Pembayaran (Midtrans)
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-PAY-01 | Membuat transaksi Midtrans Snap dan mengembalikan `snap token` / `redirect_url` | P0 |
| FR-PAY-02 | Menampilkan Snap popup di frontend | P0 |
| FR-PAY-03 | Endpoint webhook (HTTP notification) untuk menerima status pembayaran | P0 |
| FR-PAY-04 | Verifikasi `signature_key` webhook (SHA512 dari `order_id + status_code + gross_amount + server_key`) | P0 |
| FR-PAY-05 | Pemetaan status Midtrans ke status pesanan (lihat bagian 7.3) | P0 |
| FR-PAY-06 | Webhook idempoten (notifikasi duplikat tidak menyebabkan efek ganda) | P0 |
| FR-PAY-07 | Cek status transaksi manual ke API Midtrans sebagai cadangan jika webhook terlambat | P1 |
| FR-PAY-08 | Dukungan refund / pembatalan transaksi dari admin | P2 |

### 3.6 Dashboard Admin
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-ADM-01 | CRUD produk (termasuk upload gambar) | P0 |
| FR-ADM-02 | CRUD kategori | P0 |
| FR-ADM-03 | Manajemen stok | P0 |
| FR-ADM-04 | Daftar pesanan, filter status, dan ubah status pengiriman (diproses, dikirim, selesai) + input nomor resi | P0 |
| FR-ADM-05 | Daftar pengguna | P1 |
| FR-ADM-06 | Ringkasan penjualan (total pesanan, pendapatan, produk terlaris) | P1 |
| FR-ADM-07 | Notifikasi email pesanan baru | P2 |

### 3.7 Notifikasi
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-NOT-01 | Email konfirmasi pesanan dan pembayaran berhasil | P1 |
| FR-NOT-02 | Email pembaruan status pengiriman | P2 |

---

## 4. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| Performa | API p95 < 300 ms; gunakan index database dan pagination; lazy loading gambar di frontend |
| Keamanan | Hash password dengan bcrypt; JWT dengan masa berlaku pendek; validasi input; prepared statement (anti SQL injection); CORS terkonfigurasi; rate limiting pada login dan endpoint publik; HTTPS wajib; server key Midtrans hanya di backend |
| Skalabilitas | Backend stateless sehingga dapat di-scale horizontal; koneksi DB menggunakan pool |
| Reliabilitas | Backup database harian; transaksi DB untuk operasi kritis (order, stok, pembayaran) |
| Observabilitas | Structured logging (request id, level), health check endpoint, pencatatan semua payload webhook |
| Aksesibilitas dan UX | Responsif (mobile first), kontras warna memadai, navigasi keyboard pada komponen utama |
| Maintainability | Layered architecture, linting (golangci-lint, ESLint), unit dan integration test, dokumentasi API (OpenAPI/Swagger) |
| Kepatuhan | Data kartu tidak pernah disimpan di sistem sendiri (ditangani Midtrans) |

---

## 5. Arsitektur Sistem

### 5.1 Gambaran Umum

```
┌──────────────────────┐        HTTPS/JSON        ┌───────────────────────────┐
│  Frontend (SPA)      │ ───────────────────────► │  Backend (Go + Gin)       │
│  React + Vite + TW   │ ◄─────────────────────── │  Layered Architecture     │
└──────────┬───────────┘                          └──────┬──────────┬─────────┘
           │ Snap.js (popup)                             │          │
           ▼                                              ▼          ▼
┌──────────────────────┐   HTTP notification      ┌────────────┐  ┌──────────────┐
│  Midtrans Snap       │ ────────────────────────►│  MySQL     │  │ File storage │
│  (Payment Gateway)   │   (webhook ke backend)   │            │  │ (gambar)     │
└──────────────────────┘                          └────────────┘  └──────────────┘
```

### 5.2 Layered Architecture (Backend)

Aturan dependensi: layer atas hanya boleh bergantung pada layer di bawahnya, dan komunikasi antar layer melalui **interface** agar mudah di-mock saat pengujian.

```
Request ─► [ Middleware ] ─► [ Handler / Controller ] ─► [ Service ] ─► [ Repository ] ─► MySQL
                                   │                          │               │
                                   └────── DTO ───────────────┴─── Model / Entity
```

| Layer | Tanggung Jawab | Tidak Boleh |
|---|---|---|
| **Handler (Presentation)** | Parsing request, validasi input dasar, memanggil service, memformat response HTTP | Berisi logika bisnis, mengakses DB langsung |
| **Service (Business Logic)** | Aturan bisnis, orkestrasi antar repository, manajemen transaksi, integrasi Midtrans | Mengetahui detail HTTP (Gin context) |
| **Repository (Data Access)** | Query ke MySQL, mapping ke model | Berisi aturan bisnis |
| **Model / Entity** | Struktur data domain dan tabel | Berisi logika akses data |
| **DTO** | Struktur request dan response API (terpisah dari model) | — |
| **Middleware** | Auth JWT, RBAC, logging, CORS, rate limit, recovery | — |
| **Infrastructure / Pkg** | Config, koneksi DB, client Midtrans, mailer, util (hash, jwt, response) | — |

### 5.3 Struktur Folder Backend

```
backend/
├── cmd/
│   └── api/
│       └── main.go                # Entry point, dependency wiring
├── internal/
│   ├── config/                    # Load env/config
│   ├── dto/                       # Request & response structs
│   ├── model/                     # Entity (User, Product, Order, ...)
│   ├── repository/                # Interface + implementasi (MySQL)
│   │   ├── user_repository.go
│   │   ├── product_repository.go
│   │   ├── cart_repository.go
│   │   ├── order_repository.go
│   │   └── payment_repository.go
│   ├── service/                   # Interface + implementasi bisnis
│   │   ├── auth_service.go
│   │   ├── product_service.go
│   │   ├── cart_service.go
│   │   ├── order_service.go
│   │   └── payment_service.go     # Integrasi Midtrans
│   ├── handler/                   # Gin handlers
│   ├── middleware/                # auth, rbac, cors, logger, ratelimit
│   ├── router/                    # Registrasi route
│   └── apperror/                  # Error terstandar
├── pkg/
│   ├── database/                  # Koneksi MySQL
│   ├── midtrans/                  # Wrapper client Midtrans
│   ├── jwt/
│   ├── hash/
│   ├── mailer/
│   └── response/                  # Format response JSON
├── migrations/                    # File SQL migrasi
├── docs/                          # OpenAPI/Swagger
├── .env.example
├── Dockerfile
└── go.mod
```

### 5.4 Struktur Folder Frontend

```
frontend/
├── public/
├── src/
│   ├── api/                # Axios instance & fungsi pemanggilan API
│   ├── assets/
│   ├── components/         # Komponen UI reusable (Button, Input, Modal, Card)
│   ├── features/           # Modul per fitur
│   │   ├── auth/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   └── admin/
│   ├── hooks/
│   ├── layouts/            # MainLayout, AdminLayout
│   ├── pages/
│   ├── routes/             # React Router + ProtectedRoute
│   ├── store/              # State global (Zustand/Redux Toolkit)
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

### 5.5 Library yang Disarankan

| Area | Library |
|---|---|
| Frontend routing | React Router |
| Data fetching dan cache | TanStack Query |
| State global | Zustand (ringan) atau Redux Toolkit |
| HTTP client | Axios |
| Form dan validasi | React Hook Form + Zod |
| Backend ORM / DB | GORM atau sqlx (pilih satu, konsisten) |
| Migrasi | golang-migrate |
| Validasi | go-playground/validator |
| JWT | golang-jwt/jwt |
| Midtrans | midtrans/midtrans-go (SDK resmi) |
| Logging | zerolog atau zap |
| Testing | testify, sqlmock/testcontainers |

---

## 6. Desain Database (MySQL)

### 6.1 Daftar Tabel

| Tabel | Kolom Utama |
|---|---|
| `users` | id, name, email (unique), password_hash, role (`customer`/`admin`), created_at, updated_at |
| `refresh_tokens` | id, user_id, token_hash, expires_at, revoked_at |
| `addresses` | id, user_id, recipient_name, phone, address_line, city, province, postal_code, is_default |
| `categories` | id, name, slug (unique), parent_id (nullable) |
| `products` | id, category_id, name, slug (unique), description, price (DECIMAL 12,2), stock, is_active, created_at, updated_at |
| `product_images` | id, product_id, url, sort_order |
| `carts` | id, user_id (unique) |
| `cart_items` | id, cart_id, product_id, quantity |
| `orders` | id, order_number (unique), user_id, address_snapshot (JSON), subtotal, shipping_cost, total_amount, status, payment_expires_at, tracking_number, created_at, updated_at |
| `order_items` | id, order_id, product_id, product_name, price, quantity, subtotal |
| `payments` | id, order_id, midtrans_order_id (unique), snap_token, payment_type, transaction_id, transaction_status, fraud_status, gross_amount, signature_valid, raw_notification (JSON), paid_at, created_at, updated_at |
| `payment_notifications` | id, midtrans_order_id, payload (JSON), received_at (log audit webhook) |

### 6.2 Relasi Utama
- `users` 1—N `addresses`, `orders`; 1—1 `carts`
- `categories` 1—N `products`
- `products` 1—N `product_images`
- `orders` 1—N `order_items`; 1—N `payments`

### 6.3 Catatan Desain
- Gunakan **DECIMAL** untuk uang, bukan FLOAT.
- `order_items` menyimpan snapshot nama dan harga agar riwayat tidak berubah saat produk diedit.
- Index pada: `products(slug, category_id, is_active)`, `orders(user_id, status, created_at)`, `payments(midtrans_order_id)`.
- Gunakan `SELECT ... FOR UPDATE` atau update bersyarat (`UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`) untuk mencegah stok minus saat checkout bersamaan.

---

## 7. Integrasi Pembayaran Midtrans

### 7.1 Alur Pembayaran (Snap)

1. Customer menekan **Checkout**; frontend memanggil `POST /api/v1/orders`.
2. Service membuat pesanan berstatus `pending_payment` dan mengurangi stok dalam satu transaksi DB.
3. Service membuat transaksi Snap ke Midtrans (`order_id` unik, `gross_amount`, detail item, data customer, `expiry`), lalu menyimpan `snap_token` di tabel `payments`.
4. Backend mengembalikan `snap_token` ke frontend.
5. Frontend membuka popup dengan `window.snap.pay(snap_token)`.
6. Customer membayar di Midtrans.
7. Midtrans mengirim **HTTP notification** ke `POST /api/v1/payments/midtrans/notification`.
8. Backend memverifikasi `signature_key`, (opsional) memverifikasi ulang status ke API Midtrans, lalu memperbarui `payments` dan `orders` secara idempoten.
9. Frontend menampilkan status berdasarkan data dari backend (polling ringan atau redirect ke halaman status pesanan). **Callback di sisi frontend tidak boleh dijadikan sumber kebenaran status bayar.**

### 7.2 Aturan Keamanan Pembayaran
- `Server Key` hanya berada di backend (environment variable), `Client Key` boleh di frontend.
- Total transaksi dihitung ulang di server dari data database, bukan dari input client.
- Verifikasi signature pada setiap notifikasi; tolak jika tidak valid.
- Endpoint webhook tidak memakai autentikasi JWT, tetapi dilindungi verifikasi signature.
- Daftarkan URL notifikasi di Midtrans Dashboard (Settings → Payment → Notification URL) dengan HTTPS.
- Simpan raw payload notifikasi untuk audit.
- Pengembangan menggunakan **Sandbox**; produksi hanya setelah pengujian lengkap.

### 7.3 Pemetaan Status

| `transaction_status` Midtrans | Kondisi Tambahan | Status Order | Tindakan |
|---|---|---|---|
| `pending` | — | `pending_payment` | Tidak ada perubahan |
| `capture` | `fraud_status = accept` | `paid` | Tandai lunas |
| `capture` | `fraud_status = challenge` | `pending_review` | Tunggu keputusan manual |
| `settlement` | — | `paid` | Tandai lunas |
| `deny` | — | `failed` | Kembalikan stok |
| `cancel` | — | `cancelled` | Kembalikan stok |
| `expire` | — | `expired` | Kembalikan stok |
| `refund` / `partial_refund` | — | `refunded` | Catat, proses sesuai kebijakan |

### 7.4 Status Pesanan (State Machine)

```
pending_payment ──► paid ──► processing ──► shipped ──► completed
      │
      ├──► expired
      ├──► cancelled
      └──► failed
paid ──► refunded
```

Transisi hanya boleh sesuai diagram di atas; transisi tidak valid ditolak oleh service.

### 7.5 Penanganan Idempotensi dan Kegagalan
- Gunakan `midtrans_order_id` unik; proses notifikasi di dalam transaksi DB dan abaikan jika status baru tidak lebih maju dari status saat ini.
- Pengembalian stok hanya dilakukan sekali (cek status sebelumnya).
- Job terjadwal (cron/goroutine ticker) memeriksa pesanan `pending_payment` yang melewati `payment_expires_at` dan menyinkronkan ke API Midtrans sebelum membatalkan.
- Backend selalu membalas HTTP 200 setelah notifikasi valid diproses agar Midtrans tidak mengirim ulang berlebihan.

---

## 8. Spesifikasi API (Ringkasan)

Base URL: `/api/v1` — Format response JSON konsisten:

```json
{ "success": true, "message": "OK", "data": {}, "meta": { "page": 1, "per_page": 20, "total": 100 } }
```

### 8.1 Auth
| Method | Endpoint | Akses |
|---|---|---|
| POST | `/auth/register` | Publik |
| POST | `/auth/login` | Publik |
| POST | `/auth/refresh` | Publik |
| POST | `/auth/logout` | Customer |
| GET | `/me` | Customer |
| PUT | `/me` | Customer |

### 8.2 Alamat
| Method | Endpoint | Akses |
|---|---|---|
| GET/POST | `/addresses` | Customer |
| PUT/DELETE | `/addresses/:id` | Customer |

### 8.3 Katalog
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/products?q=&category=&min_price=&max_price=&sort=&page=` | Publik |
| GET | `/products/:slug` | Publik |
| GET | `/categories` | Publik |

### 8.4 Keranjang
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/cart` | Customer |
| POST | `/cart/items` | Customer |
| PUT | `/cart/items/:id` | Customer |
| DELETE | `/cart/items/:id` | Customer |

### 8.5 Pesanan dan Pembayaran
| Method | Endpoint | Akses |
|---|---|---|
| POST | `/orders` (checkout, mengembalikan snap token) | Customer |
| GET | `/orders` | Customer |
| GET | `/orders/:order_number` | Customer |
| POST | `/orders/:order_number/cancel` | Customer |
| POST | `/payments/midtrans/notification` | Webhook Midtrans |
| GET | `/orders/:order_number/payment-status` | Customer |

### 8.6 Admin
| Method | Endpoint |
|---|---|
| GET/POST | `/admin/products` |
| PUT/DELETE | `/admin/products/:id` |
| POST | `/admin/products/:id/images` |
| GET/POST/PUT/DELETE | `/admin/categories` |
| GET | `/admin/orders` |
| GET | `/admin/orders/:id` |
| PATCH | `/admin/orders/:id/status` |
| GET | `/admin/users` |
| GET | `/admin/dashboard/summary` |

---

## 9. Kebutuhan UI/UX

### 9.1 Halaman Pelanggan
1. Beranda (banner, kategori, produk unggulan)
2. Daftar produk (filter, pencarian, pagination)
3. Detail produk
4. Keranjang
5. Checkout (alamat, ringkasan, tombol bayar)
6. Status pembayaran / terima kasih
7. Riwayat pesanan dan detail pesanan
8. Login, registrasi, lupa password
9. Profil dan alamat

### 9.2 Halaman Admin
1. Login admin
2. Dashboard ringkasan
3. Manajemen produk dan kategori
4. Manajemen pesanan
5. Daftar pengguna

### 9.3 Prinsip Desain
- Mobile first dengan Tailwind (breakpoint `sm`, `md`, `lg`, `xl`).
- Design token (warna, tipografi, spacing) didefinisikan di `tailwind.config.js`.
- Komponen reusable: Button, Input, Select, Modal, Toast, Skeleton loader, Pagination, Badge status.
- Selalu tampilkan state loading, kosong, dan error.

---

## 10. Strategi Pengujian

| Jenis | Cakupan | Tools |
|---|---|---|
| Unit test | Service layer (mock repository), util, validasi, pemetaan status Midtrans | `testing`, testify, mockery/gomock |
| Integration test | Repository dengan MySQL nyata, handler end-to-end | testcontainers / DB test |
| Test pembayaran | Skenario sandbox Midtrans: sukses, pending, expire, deny, notifikasi duplikat, signature salah | Midtrans Sandbox + simulator |
| Frontend | Komponen dan alur utama | Vitest + React Testing Library |
| E2E | Daftar → belanja → checkout → bayar sandbox | Playwright |
| Keamanan | Cek OWASP Top 10 dasar, uji otorisasi (IDOR pada pesanan), rate limit | Manual + tooling |

Target cakupan: service layer ≥ 70%.

---

## 11. Deployment dan DevOps

- **Environment**: development, staging (Midtrans Sandbox), production (Midtrans Production).
- **Containerization**: Docker untuk backend, MySQL, dan frontend build (Nginx).
- **CI/CD** (GitHub Actions): lint → test → build → deploy.
- **Konfigurasi** via environment variable: `DB_*`, `JWT_SECRET`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_ENV`, `APP_URL`, `SMTP_*`.
- **Reverse proxy + HTTPS** (Nginx/Caddy + Let's Encrypt).
- **Backup**: dump MySQL harian dengan retensi minimal 7 hari.
- **Monitoring**: health check `/healthz`, log terpusat, alert error rate.

---

## 12. Rencana Pengembangan (Roadmap)

Estimasi untuk tim kecil (1–2 backend, 1–2 frontend, 1 QA paruh waktu).

| Fase | Durasi | Deliverable |
|---|---|---|
| **0. Persiapan** | Minggu 1 | Finalisasi PRD, desain UI (wireframe), setup repo, CI, skema DB awal, akun Midtrans Sandbox |
| **1. Fondasi** | Minggu 2–3 | Struktur layered backend, config, koneksi DB, migrasi, middleware; setup React + Vite + Tailwind, layout, routing; autentikasi dan RBAC |
| **2. Katalog** | Minggu 4–5 | CRUD produk dan kategori (admin), upload gambar, daftar/detail/cari/filter produk (customer) |
| **3. Keranjang dan Checkout** | Minggu 6–7 | Keranjang, alamat, pembuatan pesanan dengan transaksi stok |
| **4. Pembayaran** | Minggu 8–9 | Integrasi Midtrans Snap, webhook + verifikasi signature, idempotensi, expiry job, pengujian skenario sandbox |
| **5. Admin dan Notifikasi** | Minggu 10 | Manajemen pesanan, update status/resi, dashboard ringkasan, email |
| **6. QA dan Hardening** | Minggu 11 | Pengujian menyeluruh, perbaikan bug, optimasi performa, review keamanan |
| **7. Rilis** | Minggu 12 | Deploy staging → production, ganti ke key Production Midtrans, UAT, go-live, monitoring |

### Milestone
- **M1** (akhir minggu 3): Login dan layout siap
- **M2** (akhir minggu 5): Katalog lengkap
- **M3** (akhir minggu 7): Checkout dapat membuat pesanan
- **M4** (akhir minggu 9): Pembayaran Sandbox end-to-end berhasil
- **M5** (akhir minggu 12): Go-live

---

## 13. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Webhook Midtrans terlambat / gagal | Status pesanan tidak sinkron | Cek status manual ke API Midtrans; job rekonsiliasi berkala; logging payload |
| Race condition stok | Stok minus / oversell | Update stok bersyarat dalam transaksi DB |
| Notifikasi duplikat | Stok dikembalikan ganda | Idempotensi berbasis status dan `midtrans_order_id` |
| Manipulasi harga dari client | Kerugian finansial | Hitung total di server dari data DB |
| Kebocoran server key | Penyalahgunaan akun payment | Simpan di env/secret manager; jangan commit; rotasi bila bocor |
| Scope creep | Jadwal molor | Pegang prioritas P0 untuk MVP; fitur P2 masuk fase berikutnya |
| IDOR pada data pesanan | Kebocoran data pelanggan | Selalu filter query berdasarkan `user_id` dari token |
| Performa query produk | Lambat saat data bertambah | Index, pagination, caching (Redis pada fase lanjut) |

---

## 14. Asumsi dan Dependensi

**Asumsi**
- Mata uang tunggal (IDR) dan satu bahasa (Indonesia) pada MVP.
- Ongkos kirim menggunakan tarif flat/manual pada MVP.
- Gambar produk disimpan di disk/objek storage sederhana (S3-compatible dapat ditambahkan kemudian).

**Dependensi**
- Akun Midtrans (Sandbox lalu Production) dengan proses verifikasi bisnis.
- Domain, sertifikat HTTPS, dan server/VPS.
- Layanan SMTP untuk email transaksional.

---

## 15. Pertanyaan Terbuka

1. Apakah dibutuhkan fitur voucher/diskon pada MVP?
2. Metode pembayaran Midtrans apa saja yang diaktifkan (VA, QRIS, e-wallet, kartu kredit)?
3. Bagaimana kebijakan retur dan refund?
4. Apakah ongkir perlu terintegrasi dengan API kurir (RajaOngkir/Biteship) sejak awal?
5. Apakah satu produk memiliki varian (ukuran/warna) sejak MVP?
6. Target jumlah produk dan trafik awal (untuk menentukan kebutuhan infrastruktur)?

---

## 16. Kriteria Penerimaan MVP

- [ ] Customer dapat registrasi, login, dan mengelola alamat.
- [ ] Customer dapat mencari, memfilter, dan melihat detail produk.
- [ ] Customer dapat mengelola keranjang dan melakukan checkout.
- [ ] Pembayaran melalui Midtrans Snap berhasil dan status pesanan berubah otomatis melalui webhook.
- [ ] Pesanan yang kedaluwarsa dibatalkan otomatis dan stok dikembalikan.
- [ ] Admin dapat mengelola produk, kategori, dan status pesanan.
- [ ] Webhook dengan signature tidak valid ditolak dan notifikasi duplikat tidak menimbulkan efek ganda.
- [ ] Semua skenario uji pembayaran Sandbox lulus.
- [ ] Tidak ada kerentanan keamanan kritis yang terbuka.
- [ ] Aplikasi ter-deploy di production dengan HTTPS dan backup aktif.
