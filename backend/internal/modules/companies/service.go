package companies

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, req CreateEmpresaRequest) (Empresa, error) {
	if req.Nome == "" || req.Slug == "" {
		return Empresa{}, errors.New("nome e slug são obrigatórios")
	}
	return s.repo.Create(ctx, req)
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (Empresa, error) {
	emp, err := s.repo.GetByID(ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return Empresa{}, errors.New("empresa não encontrada")
	}
	return emp, err
}

func (s *Service) GetBySlug(ctx context.Context, slug string) (Empresa, error) {
	emp, err := s.repo.GetBySlug(ctx, slug)
	if errors.Is(err, sql.ErrNoRows) {
		return Empresa{}, errors.New("empresa não encontrada")
	}
	return emp, err
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateEmpresaRequest) (Empresa, error) {
	if req.Nome == "" {
		return Empresa{}, errors.New("nome é obrigatório")
	}
	emp, err := s.repo.Update(ctx, id, req)
	if errors.Is(err, sql.ErrNoRows) {
		return Empresa{}, errors.New("empresa não encontrada")
	}
	return emp, err
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
