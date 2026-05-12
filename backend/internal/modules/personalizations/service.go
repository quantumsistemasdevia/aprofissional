package personalizations

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/db"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, qtx db.DBTX, itemID uuid.UUID) ([]Personalizacao, error) {
	return s.repo.List(ctx, qtx, itemID)
}

func (s *Service) GetByID(ctx context.Context, qtx db.DBTX, id uuid.UUID) (Personalizacao, error) {
	p, err := s.repo.GetByID(ctx, qtx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return Personalizacao{}, errors.New("personalização não encontrada")
	}
	return p, err
}

func (s *Service) Create(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreatePersonalizacaoRequest) (Personalizacao, error) {
	return s.repo.Create(ctx, qtx, empresaID, req)
}

func (s *Service) Update(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdatePersonalizacaoRequest) (Personalizacao, error) {
	p, err := s.repo.Update(ctx, qtx, id, req)
	if errors.Is(err, sql.ErrNoRows) {
		return Personalizacao{}, errors.New("personalização não encontrada")
	}
	return p, err
}

func (s *Service) Delete(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	return s.repo.Delete(ctx, qtx, id, empresaID)
}
