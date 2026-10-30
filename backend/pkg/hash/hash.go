package hash

import (
	"golang.org/x/crypto/bcrypt"
)

// Cost is the bcrypt cost factor
var Cost = bcrypt.DefaultCost

// Hash generates a bcrypt hash from a plain text password
func Hash(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), Cost)
	return string(bytes), err
}

// Check compares a plain text password with a hashed password
func Check(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}
