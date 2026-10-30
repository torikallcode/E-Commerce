package midtrans

import "testing"

func TestVerifySignature(t *testing.T) {
	serverKey := "server-key"
	orderID := "ORD-1"
	statusCode := "200"
	grossAmount := "10000.00"
	validSignature := "482d0508fb9c17893043cc302959da4a9d531f9d855d833a8e9c9d3d234e0c0e86a1a19b23c57586ea7d0d97aa071c5a33d025e6ea030efd023a3e5b730f42d5"

	if !VerifySignature(serverKey, orderID, statusCode, grossAmount, validSignature) {
		t.Fatal("expected valid signature to be accepted")
	}
	if VerifySignature(serverKey, orderID, statusCode, grossAmount, "deadbeef") {
		t.Fatal("expected invalid signature to be rejected")
	}
	if VerifySignature("", orderID, statusCode, grossAmount, validSignature) {
		t.Fatal("expected empty server key to be rejected")
	}
}

func TestClientEnabled(t *testing.T) {
	if (&Client{serverKey: ""}).Enabled() {
		t.Fatal("client without server key must be disabled")
	}
	if (&Client{serverKey: "sb-server-your-server-key"}).Enabled() {
		t.Fatal("client with placeholder key must be disabled")
	}
	if !(&Client{serverKey: "SB-Mid-server-abc"}).Enabled() {
		t.Fatal("client with a server key must be enabled")
	}
}
