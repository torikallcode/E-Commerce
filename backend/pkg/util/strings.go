package util

import (
	"crypto/rand"
	"encoding/hex"
	"regexp"
	"strings"
	"time"
	"unicode"
)

var nonSlug = regexp.MustCompile(`[^a-z0-9]+`)

// Slugify converts an arbitrary string into a URL friendly slug.
func Slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	for _, r := range s {
		switch {
		case unicode.IsLetter(r) || unicode.IsDigit(r):
			b.WriteRune(r)
		default:
			b.WriteRune(' ')
		}
	}
	slug := nonSlug.ReplaceAllString(b.String(), "-")
	return strings.Trim(slug, "-")
}

// GenerateOrderNumber returns a unique, human readable order number.
func GenerateOrderNumber(now time.Time) string {
	b := make([]byte, 3)
	if _, err := rand.Read(b); err != nil {
		return "ORD-" + now.Format("20060102-150405")
	}
	return "ORD-" + now.Format("20060102-150405") + "-" + strings.ToUpper(hex.EncodeToString(b))
}

// SanitizeFilename keeps only safe characters for an uploaded file name and
// strips any directory components to prevent path traversal.
func SanitizeFilename(name string) string {
	name = strings.ReplaceAll(name, "\\", "/")
	if idx := strings.LastIndex(name, "/"); idx >= 0 {
		name = name[idx+1:]
	}
	name = strings.ToLower(strings.TrimSpace(name))

	var b strings.Builder
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '.' || r == '-' || r == '_' {
			b.WriteRune(r)
		} else {
			b.WriteRune('-')
		}
	}

	cleaned := strings.Trim(b.String(), ".-_")
	if cleaned == "" {
		return "file"
	}
	return cleaned
}
