package repository

import "errors"

var (
	// ErrInsufficientStock is returned when a conditional stock decrement fails.
	ErrInsufficientStock = errors.New("stok tidak mencukupi")
	// ErrNoRowsAffected is returned when a conditional update matched no row.
	ErrNoRowsAffected = errors.New("tidak ada data yang diperbarui")
)
