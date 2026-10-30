-- +migrate Up
CREATE TABLE IF NOT EXISTS payment_notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    midtrans_order_id VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payment_notifications_midtrans_order_id (midtrans_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- +migrate Down
DROP TABLE IF EXISTS payment_notifications;