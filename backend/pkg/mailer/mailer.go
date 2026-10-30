package mailer

import (
	"fmt"
	"net/smtp"
)

// Client holds SMTP configuration
type Client struct {
	host     string
	port     string
	username string
	password string
	from     string
}

func NewClient(host, port, username, password, from string) *Client {
	return &Client{
		host:     host,
		port:     port,
		username: username,
		password: password,
		from:     from,
	}
}

// Send sends an email via SMTP
func (c *Client) Send(to, subject, body string) error {
	auth := smtp.PlainAuth("", c.username, c.password, c.host)
	msg := []byte("From: " + c.from + "\r\n" +
		"To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-version: 1.0;\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\";\r\n\r\n" +
		body + "\r\n")

	addr := fmt.Sprintf("%s:%s", c.host, c.port)
	return smtp.SendMail(addr, auth, c.from, []string{to}, msg)
}

// SendOrderConfirmation sends an order confirmation email
func (c *Client) SendOrderConfirmation(to, orderNumber, status string) error {
	subject := "Konfirmasi Pesanan - " + orderNumber
	body := fmt.Sprintf(`<html><body>
		<h2>Terima kasih telah berbelanja!</h2>
		<p>Pesanan Anda <strong>%s</strong> telah dibuat dengan status: <strong>%s</strong>.</p>
		<p>Kami akan memproses pesanan Anda segera.</p>
	</body></html>`, orderNumber, status)
	return c.Send(to, subject, body)
}

// SendPaymentNotification sends a payment status email
func (c *Client) SendPaymentNotification(to, orderNumber, status string) error {
	subject := "Pembaruan Pembayaran - " + orderNumber
	body := fmt.Sprintf(`<html><body>
		<h2>Pembaruan Pembayaran Pesanan</h2>
		<p>Pesanan <strong>%s</strong> kini berstatus pembayaran: <strong>%s</strong>.</p>
	</body></html>`, orderNumber, status)
	return c.Send(to, subject, body)
}
