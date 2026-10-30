package apperror

import "fmt"

// AppError represents a standardized application error
type AppError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Err     error  `json:"-"`
	HTTPCode int   `json:"-"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s (%v)", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// New creates a new AppError
func New(code, message string, httpCode int, err error) *AppError {
	return &AppError{
		Code:     code,
		Message:  message,
		Err:      err,
		HTTPCode: httpCode,
	}
}

// Common error codes
const (
	ErrCodeValidation      = "VALIDATION_ERROR"
	ErrCodeNotFound        = "NOT_FOUND"
	ErrCodeUnauthorized    = "UNAUTHORIZED"
	ErrCodeForbidden       = "FORBIDDEN"
	ErrCodeInternal        = "INTERNAL_SERVER_ERROR"
	ErrCodeConflict        = "CONFLICT"
	ErrCodeTooManyRequests = "TOO_MANY_REQUESTS"
	ErrCodePayment         = "PAYMENT_ERROR"
	ErrCodeBadRequest      = "BAD_REQUEST"
)
