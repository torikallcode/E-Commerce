package midtrans

import (
	"crypto/sha512"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
	"github.com/midtrans/midtrans-go/snap"
)

// ErrNotConfigured is returned when Midtrans credentials are not set.
var ErrNotConfigured = errors.New("midtrans belum dikonfigurasi")

// SnapItem is a single line item sent to Midtrans.
type SnapItem struct {
	ID       string
	Name     string
	Price    int64
	Quantity int32
}

// SnapInput contains the data required to create a Snap transaction.
type SnapInput struct {
	OrderID       string
	GrossAmount   int64
	Items         []SnapItem
	CustomerName  string
	CustomerEmail string
	CustomerPhone string
	FinishURL     string
	ExpiryMinutes int64
}

// SnapResult is the result of a Snap transaction creation.
type SnapResult struct {
	Token       string
	RedirectURL string
}

// StatusResult is a normalized Midtrans transaction status.
type StatusResult struct {
	OrderID           string
	TransactionID     string
	TransactionStatus string
	FraudStatus       string
	PaymentType       string
	GrossAmount       string
	StatusCode        string
	SignatureKey      string
}

// Gateway abstracts the Midtrans API so services can be unit tested with fakes.
type Gateway interface {
	Enabled() bool
	CreateSnapTransaction(input SnapInput) (*SnapResult, error)
	GetStatus(orderID string) (*StatusResult, error)
	ExpireTransaction(orderID string) error
	VerifySignature(orderID, statusCode, grossAmount, signature string) bool
}

// Client is the concrete Midtrans gateway implementation.
type Client struct {
	serverKey  string
	clientKey  string
	production bool
	snap       snap.Client
	core       coreapi.Client
}

func NewClient(serverKey, clientKey string, production bool) *Client {
	env := midtrans.Sandbox
	if production {
		env = midtrans.Production
	}

	c := &Client{
		serverKey:  serverKey,
		clientKey:  clientKey,
		production: production,
	}
	c.snap.New(serverKey, env)
	c.core.New(serverKey, env)
	return c
}

func (c *Client) Enabled() bool {
	return c != nil && c.serverKey != "" && !strings.Contains(c.serverKey, "your-server-key")
}

func (c *Client) ClientKey() string {
	if c == nil {
		return ""
	}
	return c.clientKey
}

func (c *Client) Production() bool {
	return c != nil && c.production
}

func (c *Client) CreateSnapTransaction(input SnapInput) (*SnapResult, error) {
	if !c.Enabled() {
		return nil, ErrNotConfigured
	}

	items := make([]midtrans.ItemDetails, 0, len(input.Items))
	for _, item := range input.Items {
		items = append(items, midtrans.ItemDetails{
			ID:    item.ID,
			Name:  truncate(item.Name, 50),
			Price: item.Price,
			Qty:   item.Quantity,
		})
	}

	req := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  input.OrderID,
			GrossAmt: input.GrossAmount,
		},
		CustomerDetail: &midtrans.CustomerDetails{
			FName: input.CustomerName,
			Email: input.CustomerEmail,
			Phone: input.CustomerPhone,
		},
	}
	if len(items) > 0 {
		req.Items = &items
	}
	if input.ExpiryMinutes > 0 {
		req.Expiry = &snap.ExpiryDetails{
			Unit:     "minute",
			Duration: input.ExpiryMinutes,
		}
	}
	if input.FinishURL != "" {
		req.Callbacks = &snap.Callbacks{Finish: input.FinishURL}
	}

	resp, mErr := c.snap.CreateTransaction(req)
	if mErr != nil {
		return nil, fmt.Errorf("midtrans snap: %s", mErr.GetMessage())
	}

	return &SnapResult{Token: resp.Token, RedirectURL: resp.RedirectURL}, nil
}

func (c *Client) GetStatus(orderID string) (*StatusResult, error) {
	if !c.Enabled() {
		return nil, ErrNotConfigured
	}

	resp, mErr := c.core.CheckTransaction(orderID)
	if mErr != nil {
		return nil, fmt.Errorf("midtrans status: %s", mErr.GetMessage())
	}

	return &StatusResult{
		OrderID:           resp.OrderID,
		TransactionID:     resp.TransactionID,
		TransactionStatus: resp.TransactionStatus,
		FraudStatus:       resp.FraudStatus,
		PaymentType:       resp.PaymentType,
		GrossAmount:       resp.GrossAmount,
		StatusCode:        resp.StatusCode,
		SignatureKey:      resp.SignatureKey,
	}, nil
}

func (c *Client) ExpireTransaction(orderID string) error {
	if !c.Enabled() {
		return ErrNotConfigured
	}
	if _, mErr := c.core.ExpireTransaction(orderID); mErr != nil {
		return fmt.Errorf("midtrans expire: %s", mErr.GetMessage())
	}
	return nil
}

// VerifySignature validates a Midtrans notification signature:
// SHA512(order_id + status_code + gross_amount + server_key).
func (c *Client) VerifySignature(orderID, statusCode, grossAmount, signature string) bool {
	if c == nil {
		return false
	}
	return VerifySignature(c.serverKey, orderID, statusCode, grossAmount, signature)
}

func VerifySignature(serverKey, orderID, statusCode, grossAmount, signature string) bool {
	if serverKey == "" || signature == "" {
		return false
	}
	raw := orderID + statusCode + grossAmount + serverKey
	sum := sha512.Sum512([]byte(raw))
	expected := hex.EncodeToString(sum[:])
	return subtle.ConstantTimeCompare([]byte(strings.ToLower(expected)), []byte(strings.ToLower(signature))) == 1
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max]
}
