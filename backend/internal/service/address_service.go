package service

import (
	"ecommerce/backend/internal/apperror"
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/model"
	"ecommerce/backend/internal/repository"
)

type AddressService interface {
	Create(userID uint, req *dto.AddressRequest) (*dto.AddressResponse, error)
	List(userID uint) ([]*dto.AddressResponse, error)
	GetByID(userID uint, id uint) (*dto.AddressResponse, error)
	Update(userID uint, id uint, req *dto.AddressRequest) (*dto.AddressResponse, error)
	Delete(userID uint, id uint) error
	SetDefault(userID uint, id uint) error
}

type addressService struct {
	addressRepo repository.AddressRepository
}

func NewAddressService(addressRepo repository.AddressRepository) AddressService {
	return &addressService{addressRepo: addressRepo}
}

func (s *addressService) Create(userID uint, req *dto.AddressRequest) (*dto.AddressResponse, error) {
	address := &model.Address{
		UserID:         userID,
		RecipientName:  req.RecipientName,
		Phone:          req.Phone,
		AddressLine:    req.AddressLine,
		City:           req.City,
		Province:       req.Province,
		PostalCode:     req.PostalCode,
		IsDefault:      req.IsDefault,
	}
	if err := s.addressRepo.Create(address); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal membuat alamat", 500, err)
	}
	return s.toResponse(address), nil
}

func (s *addressService) List(userID uint) ([]*dto.AddressResponse, error) {
	addresses, err := s.addressRepo.ListByUserID(userID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengambil alamat", 500, err)
	}
	responses := make([]*dto.AddressResponse, len(addresses))
	for i, a := range addresses {
		responses[i] = s.toResponse(a)
	}
	return responses, nil
}

func (s *addressService) GetByID(userID uint, id uint) (*dto.AddressResponse, error) {
	address, err := s.addressRepo.GetByID(id, userID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Alamat tidak ditemukan", 404, err)
	}
	return s.toResponse(address), nil
}

func (s *addressService) Update(userID uint, id uint, req *dto.AddressRequest) (*dto.AddressResponse, error) {
	address, err := s.addressRepo.GetByID(id, userID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "Alamat tidak ditemukan", 404, err)
	}
	address.RecipientName = req.RecipientName
	address.Phone = req.Phone
	address.AddressLine = req.AddressLine
	address.City = req.City
	address.Province = req.Province
	address.PostalCode = req.PostalCode
	address.IsDefault = req.IsDefault
	if err := s.addressRepo.Update(address); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal memperbarui alamat", 500, err)
	}
	return s.toResponse(address), nil
}

func (s *addressService) Delete(userID uint, id uint) error {
	if err := s.addressRepo.Delete(id, userID); err != nil {
		return apperror.New(apperror.ErrCodeInternal, "Gagal menghapus alamat", 500, err)
	}
	return nil
}

func (s *addressService) SetDefault(userID uint, id uint) error {
	if err := s.addressRepo.SetDefault(userID, id); err != nil {
		return apperror.New(apperror.ErrCodeInternal, "Gagal mengatur alamat default", 500, err)
	}
	return nil
}

func (s *addressService) toResponse(a *model.Address) *dto.AddressResponse {
	return &dto.AddressResponse{
		ID:           a.ID,
		RecipientName: a.RecipientName,
		Phone:        a.Phone,
		AddressLine:  a.AddressLine,
		City:         a.City,
		Province:     a.Province,
		PostalCode:   a.PostalCode,
		IsDefault:    a.IsDefault,
	}
}
