package service

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"strings"
	"time"

	"ecommerce/backend/internal/apperror"
	"ecommerce/backend/internal/dto"
	"ecommerce/backend/internal/model"
	"ecommerce/backend/internal/repository"
	"ecommerce/backend/pkg/hash"
	"ecommerce/backend/pkg/jwt"
)

type AuthService interface {
	Register(req *dto.RegisterRequest) (*dto.AuthResponse, error)
	Login(req *dto.LoginRequest) (*dto.AuthResponse, error)
	Refresh(req *dto.RefreshRequest) (*dto.AuthResponse, error)
	Logout(userID uint) error
	GetProfile(userID uint) (*dto.UserResponse, error)
	UpdateProfile(userID uint, req *dto.UpdateProfileRequest) (*dto.UserResponse, error)
}

type authService struct {
	userRepo         repository.UserRepository
	refreshTokenRepo repository.RefreshTokenRepository
	jwtManager       *jwt.Manager
	refreshExpiry    time.Duration
}

func NewAuthService(
	userRepo repository.UserRepository,
	refreshTokenRepo repository.RefreshTokenRepository,
	jwtManager *jwt.Manager,
	refreshExpiry time.Duration,
) AuthService {
	return &authService{
		userRepo:         userRepo,
		refreshTokenRepo: refreshTokenRepo,
		jwtManager:       jwtManager,
		refreshExpiry:    refreshExpiry,
	}
}

func (s *authService) Register(req *dto.RegisterRequest) (*dto.AuthResponse, error) {
	email := normalizeEmail(req.Email)

	if _, err := s.userRepo.GetByEmail(email); err == nil {
		return nil, apperror.New(apperror.ErrCodeConflict, "Email sudah terdaftar", 409, nil)
	}

	passwordHash, err := hash.Hash(req.Password)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mengenkripsi password", 500, err)
	}

	user := &model.User{
		Name:     strings.TrimSpace(req.Name),
		Email:    email,
		Password: passwordHash,
		Role:     "customer",
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal membuat user", 500, err)
	}

	return s.generateTokens(user)
}

func (s *authService) Login(req *dto.LoginRequest) (*dto.AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(normalizeEmail(req.Email))
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeUnauthorized, "Email atau password salah", 401, err)
	}

	if err := hash.Check(user.Password, req.Password); err != nil {
		return nil, apperror.New(apperror.ErrCodeUnauthorized, "Email atau password salah", 401, err)
	}

	return s.generateTokens(user)
}

func (s *authService) Refresh(req *dto.RefreshRequest) (*dto.AuthResponse, error) {
	claims, err := s.jwtManager.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeUnauthorized, "Refresh token tidak valid", 401, err)
	}

	token, err := s.refreshTokenRepo.GetByUserID(claims.UserID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeUnauthorized, "Refresh token tidak valid", 401, err)
	}

	if time.Now().After(token.ExpiresAt) {
		return nil, apperror.New(apperror.ErrCodeUnauthorized, "Refresh token sudah kedaluwarsa", 401, nil)
	}

	if !refreshTokenMatches(token.TokenHash, req.RefreshToken) {
		return nil, apperror.New(apperror.ErrCodeUnauthorized, "Refresh token tidak valid", 401, nil)
	}

	if err := s.refreshTokenRepo.Revoke(claims.UserID); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mencabut refresh token", 500, err)
	}

	user, err := s.userRepo.GetByID(claims.UserID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "User tidak ditemukan", 404, err)
	}

	return s.generateTokens(user)
}

func (s *authService) Logout(userID uint) error {
	if err := s.refreshTokenRepo.Revoke(userID); err != nil {
		return apperror.New(apperror.ErrCodeInternal, "Gagal logout", 500, err)
	}
	return nil
}

func (s *authService) GetProfile(userID uint) (*dto.UserResponse, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "User tidak ditemukan", 404, err)
	}
	return toUserResponse(user), nil
}

func (s *authService) UpdateProfile(userID uint, req *dto.UpdateProfileRequest) (*dto.UserResponse, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeNotFound, "User tidak ditemukan", 404, err)
	}

	email := normalizeEmail(req.Email)
	existing, err := s.userRepo.GetByEmail(email)
	if err == nil && existing.ID != userID {
		return nil, apperror.New(apperror.ErrCodeConflict, "Email sudah digunakan user lain", 409, nil)
	}

	user.Name = strings.TrimSpace(req.Name)
	user.Email = email
	if err := s.userRepo.Update(user); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal memperbarui profil", 500, err)
	}

	return toUserResponse(user), nil
}

func (s *authService) generateTokens(user *model.User) (*dto.AuthResponse, error) {
	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal membuat access token", 500, err)
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal membuat refresh token", 500, err)
	}

	tokenHash := hashRefreshToken(refreshToken)

	if err := s.refreshTokenRepo.Revoke(user.ID); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal mencabut token lama", 500, err)
	}

	refreshTokenModel := &model.RefreshToken{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(s.refreshExpiry),
	}
	if err := s.refreshTokenRepo.Create(refreshTokenModel); err != nil {
		return nil, apperror.New(apperror.ErrCodeInternal, "Gagal menyimpan refresh token", 500, err)
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         toUserResponse(user),
	}, nil
}

func toUserResponse(user *model.User) *dto.UserResponse {
	return &dto.UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
	}
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// hashRefreshToken derives a fixed-length digest so refresh tokens (JWTs,
// whose length exceeds bcrypt's 72-byte limit) can be stored safely.
func hashRefreshToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func refreshTokenMatches(storedHash, token string) bool {
	computed := hashRefreshToken(token)
	return subtle.ConstantTimeCompare([]byte(storedHash), []byte(computed)) == 1
}
