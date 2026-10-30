-- +migrate Up
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    midtrans_order_id VARCHAR(100) NOT NULL UNIQUE,
    snap_token VARCHAR(500) NULL,
    snap_redirect_url VARCHAR(500) NULL,
    payment_type VARCHAR(50) NULL,
    transaction_id VARCHAR(100) NULL,
    transaction_status VARCHAR(50) NULL,
    fraud_status VARCHAR(50) NULL,
    gross_amount DECIMAL(12,2) NOT NULL,
    signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
    raw_notification JSON NULL,
    paid_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_payments_order_id (order_id),
    INDEX idx_payments_midtrans_order_id (midtrans_order_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- +migrate Down
DROP TABLE IF EXISTS payments;