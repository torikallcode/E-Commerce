package service

import (
	"testing"

	"ecommerce/backend/internal/model"
)

func TestMapMidtransStatus(t *testing.T) {
	tests := []struct {
		name      string
		txStatus  string
		fraud     string
		wantOrder string
	}{
		{"pending", "pending", "", ""},
		{"capture accept", "capture", "accept", model.StatusPaid},
		{"capture challenge", "capture", "challenge", model.StatusPendingReview},
		{"capture other", "capture", "deny", ""},
		{"settlement", "settlement", "", model.StatusPaid},
		{"deny", "deny", "", model.StatusFailed},
		{"cancel", "cancel", "", model.StatusCancelled},
		{"expire", "expire", "", model.StatusExpired},
		{"refund", "refund", "", model.StatusRefunded},
		{"partial refund", "partial_refund", "", model.StatusRefunded},
		{"unknown", "authorize", "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := MapMidtransStatus(tt.txStatus, tt.fraud)
			if got != tt.wantOrder {
				t.Fatalf("MapMidtransStatus(%q, %q) = %q, want %q", tt.txStatus, tt.fraud, got, tt.wantOrder)
			}
		})
	}
}
