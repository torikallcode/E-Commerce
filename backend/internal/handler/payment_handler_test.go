package handler

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"ecommerce/backend/internal/apperror"
	"ecommerce/backend/internal/dto"

	"github.com/gin-gonic/gin"
)

type paymentServiceStub struct {
	received *dto.PaymentNotificationRequest
	err      error
}

func (s *paymentServiceStub) HandleNotification(req *dto.PaymentNotificationRequest) error {
	s.received = req
	return s.err
}

func (s *paymentServiceStub) GetPaymentStatus(uint, string) (*dto.PaymentStatusResponse, error) {
	return nil, nil
}

func (s *paymentServiceStub) ExpirePendingOrders() (int, error) { return 0, nil }

func (s *paymentServiceStub) DevSettle(uint, string) error { return nil }

func (s *paymentServiceStub) RunExpiryWorker(context.Context, time.Duration) {}

func TestPaymentNotificationPreservesOriginalPayload(t *testing.T) {
	gin.SetMode(gin.TestMode)
	stub := &paymentServiceStub{}
	h := NewPaymentHandler(stub, false)
	body := []byte(`{"order_id":"ORDER-1","status_code":"200","gross_amount":"15000.00","signature_key":"valid","transaction_status":"settlement","custom_gateway_field":{"bank":"bca"}}`)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/payments/midtrans/notification", bytes.NewReader(body))
	h.Notification(c)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", w.Code, http.StatusOK, w.Body.String())
	}
	if stub.received == nil {
		t.Fatal("payment service was not called")
	}
	if stub.received.RawPayload != string(body) {
		t.Fatalf("raw payload = %q, want exact request body %q", stub.received.RawPayload, string(body))
	}
}

func TestPaymentNotificationRejectsInvalidSignature(t *testing.T) {
	gin.SetMode(gin.TestMode)
	stub := &paymentServiceStub{err: apperror.New(apperror.ErrCodeUnauthorized, "Signature notifikasi tidak valid", http.StatusUnauthorized, nil)}
	h := NewPaymentHandler(stub, false)
	body := []byte(`{"order_id":"ORDER-1","status_code":"200","gross_amount":"15000.00","signature_key":"invalid","transaction_status":"settlement"}`)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/payments/midtrans/notification", bytes.NewReader(body))
	h.Notification(c)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d; body=%s", w.Code, http.StatusUnauthorized, w.Body.String())
	}
}
