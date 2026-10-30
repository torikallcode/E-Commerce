package model

// Order status values as defined in the PRD state machine.
const (
	StatusPendingPayment = "pending_payment"
	StatusPendingReview  = "pending_review"
	StatusPaid           = "paid"
	StatusProcessing     = "processing"
	StatusShipped        = "shipped"
	StatusCompleted      = "completed"
	StatusCancelled      = "cancelled"
	StatusExpired        = "expired"
	StatusFailed         = "failed"
	StatusRefunded       = "refunded"
)

var orderTransitions = map[string][]string{
	StatusPendingPayment: {StatusPaid, StatusPendingReview, StatusCancelled, StatusExpired, StatusFailed},
	StatusPendingReview:  {StatusPaid, StatusCancelled, StatusExpired, StatusFailed},
	StatusPaid:           {StatusProcessing, StatusRefunded},
	StatusProcessing:     {StatusShipped, StatusRefunded},
	StatusShipped:        {StatusCompleted},
	StatusCompleted:      {},
	StatusCancelled:      {},
	StatusExpired:        {},
	StatusFailed:         {},
	StatusRefunded:       {},
}

// CanTransition reports whether an order may move from one status to another.
func CanTransition(from, to string) bool {
	if from == to {
		return false
	}
	for _, allowed := range orderTransitions[from] {
		if allowed == to {
			return true
		}
	}
	return false
}

// IsTerminalStatus reports whether no further transition is possible.
func IsTerminalStatus(status string) bool {
	return len(orderTransitions[status]) == 0
}

// ReleasesStock reports whether entering the target status must return reserved stock.
// Stock is reserved when an order is created and is only released while the order has
// not been paid yet.
func ReleasesStock(from, to string) bool {
	switch to {
	case StatusCancelled, StatusExpired, StatusFailed:
		return from == StatusPendingPayment || from == StatusPendingReview
	default:
		return false
	}
}

// IsPaidLike reports whether the order has been paid (or progressed beyond payment).
func IsPaidLike(status string) bool {
	switch status {
	case StatusPaid, StatusProcessing, StatusShipped, StatusCompleted:
		return true
	default:
		return false
	}
}
