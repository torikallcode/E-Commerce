package repository

import (
	"gorm.io/gorm"
)

// TxRepos exposes repository implementations bound to a single database transaction.
type TxRepos struct {
	Users        UserRepository
	RefreshToken RefreshTokenRepository
	Addresses    AddressRepository
	Categories   CategoryRepository
	Products     ProductRepository
	Carts        CartRepository
	Orders       OrderRepository
	OrderItems   OrderItemRepository
	Payments     PaymentRepository
}

// UnitOfWork runs a function inside a database transaction. The transaction is
// committed when the function returns nil and rolled back otherwise.
type UnitOfWork interface {
	Do(fn func(tx *TxRepos) error) error
}

type unitOfWork struct {
	db *gorm.DB
}

func NewUnitOfWork(db *gorm.DB) UnitOfWork {
	return &unitOfWork{db: db}
}

func (u *unitOfWork) Do(fn func(tx *TxRepos) error) error {
	return u.db.Transaction(func(tx *gorm.DB) error {
		return fn(&TxRepos{
			Users:        newUserRepository(tx),
			RefreshToken: newRefreshTokenRepository(tx),
			Addresses:    newAddressRepository(tx),
			Categories:   newCategoryRepository(tx),
			Products:     newProductRepository(tx),
			Carts:        newCartRepository(tx),
			Orders:       newOrderRepository(tx),
			OrderItems:   newOrderItemRepository(tx),
			Payments:     newPaymentRepository(tx),
		})
	})
}
