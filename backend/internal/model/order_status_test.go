package model

import "testing"

func TestCanTransition(t *testing.T) {
	valid := [][2]string{
		{StatusPendingPayment, StatusPaid},
		{StatusPendingPayment, StatusCancelled},
		{StatusPendingPayment, StatusExpired},
		{StatusPendingPayment, StatusFailed},
		{StatusPendingPayment, StatusPendingReview},
		{StatusPendingReview, StatusPaid},
		{StatusPaid, StatusProcessing},
		{StatusProcessing, StatusShipped},
		{StatusShipped, StatusCompleted},
		{StatusPaid, StatusRefunded},
		{StatusProcessing, StatusRefunded},
	}
	for _, pair := range valid {
		if !CanTransition(pair[0], pair[1]) {
			t.Errorf("expected transition %s -> %s to be allowed", pair[0], pair[1])
		}
	}

	invalid := [][2]string{
		{StatusPendingPayment, StatusShipped},
		{StatusPendingPayment, StatusCompleted},
		{StatusPaid, StatusPendingPayment},
		{StatusShipped, StatusProcessing},
		{StatusCompleted, StatusRefunded},
		{StatusCancelled, StatusPaid},
		{StatusPaid, StatusPaid},
	}
	for _, pair := range invalid {
		if CanTransition(pair[0], pair[1]) {
			t.Errorf("expected transition %s -> %s to be rejected", pair[0], pair[1])
		}
	}
}

func TestReleasesStock(t *testing.T) {
	if !ReleasesStock(StatusPendingPayment, StatusExpired) {
		t.Fatal("expiring an unpaid order must release stock")
	}
	if !ReleasesStock(StatusPendingReview, StatusCancelled) {
		t.Fatal("cancelling a pending review order must release stock")
	}
	if ReleasesStock(StatusPaid, StatusCancelled) {
		t.Fatal("paid orders must not release stock on cancellation")
	}
	if ReleasesStock(StatusPaid, StatusRefunded) {
		t.Fatal("refund must not automatically release stock")
	}
}

func TestIsTerminalStatus(t *testing.T) {
	for _, status := range []string{StatusCompleted, StatusCancelled, StatusExpired, StatusFailed, StatusRefunded} {
		if !IsTerminalStatus(status) {
			t.Errorf("expected %s to be terminal", status)
		}
	}
	if IsTerminalStatus(StatusPaid) {
		t.Error("paid must not be terminal")
	}
}
