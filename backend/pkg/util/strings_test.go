package util

import (
	"strings"
	"testing"
	"time"
)

func TestSlugify(t *testing.T) {
	tests := map[string]string{
		"Aurora Wireless Headphone": "aurora-wireless-headphone",
		"  Tas Kanvas  ":            "tas-kanvas",
		"Sepatu & Sandal!":          "sepatu-sandal",
	}
	for input, want := range tests {
		if got := Slugify(input); got != want {
			t.Errorf("Slugify(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestGenerateOrderNumber(t *testing.T) {
	now := time.Date(2026, 10, 30, 12, 0, 0, 0, time.UTC)
	number := GenerateOrderNumber(now)
	if !strings.HasPrefix(number, "ORD-20261030-120000-") {
		t.Fatalf("unexpected order number format: %s", number)
	}
	if len(number) != len("ORD-20261030-120000-")+6 {
		t.Fatalf("unexpected order number length: %s", number)
	}
	if GenerateOrderNumber(now) == number {
		t.Fatal("order numbers should be unique")
	}
}

func TestSanitizeFilename(t *testing.T) {
	if got := SanitizeFilename("../../My Photo!.JPG"); got != "my-photo-.jpg" {
		t.Fatalf("SanitizeFilename returned %q", got)
	}
}
