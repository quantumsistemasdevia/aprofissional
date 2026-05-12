package catalog

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

// ---- Produtos ----

func (s *Service) ListProdutos(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]Produto, error) {
	return s.repo.ListProdutos(ctx, qtx, empresaID)
}

func (s *Service) GetProduto(ctx context.Context, qtx db.DBTX, id uuid.UUID) (Produto, error) {
	p, err := s.repo.GetProduto(ctx, qtx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return Produto{}, errors.New("produto não encontrado")
	}
	return p, err
}

func (s *Service) CreateProduto(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreateProdutoRequest) (Produto, error) {
	if req.Nome == "" {
		return Produto{}, errors.New("nome é obrigatório")
	}
	return s.repo.CreateProduto(ctx, qtx, empresaID, req)
}

func (s *Service) UpdateProduto(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdateProdutoRequest) (Produto, error) {
	if req.Nome == "" {
		return Produto{}, errors.New("nome é obrigatório")
	}
	p, err := s.repo.UpdateProduto(ctx, qtx, id, req)
	if errors.Is(err, sql.ErrNoRows) {
		return Produto{}, errors.New("produto não encontrado")
	}
	return p, err
}

func (s *Service) DeleteProduto(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	return s.repo.DeleteProduto(ctx, qtx, id, empresaID)
}

// ---- Modelos ----

func (s *Service) ListModelos(ctx context.Context, qtx db.DBTX, empresaID, produtoID uuid.UUID) ([]Modelo, error) {
	return s.repo.ListModelos(ctx, qtx, empresaID, produtoID)
}

func (s *Service) GetModelo(ctx context.Context, qtx db.DBTX, id uuid.UUID) (Modelo, error) {
	m, err := s.repo.GetModelo(ctx, qtx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return Modelo{}, errors.New("modelo não encontrado")
	}
	return m, err
}

func (s *Service) CreateModelo(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreateModeloRequest) (Modelo, error) {
	if req.Nome == "" {
		return Modelo{}, errors.New("nome é obrigatório")
	}
	return s.repo.CreateModelo(ctx, qtx, empresaID, req)
}

func (s *Service) UpdateModelo(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdateModeloRequest) (Modelo, error) {
	if req.Nome == "" {
		return Modelo{}, errors.New("nome é obrigatório")
	}
	m, err := s.repo.UpdateModelo(ctx, qtx, id, req)
	if errors.Is(err, sql.ErrNoRows) {
		return Modelo{}, errors.New("modelo não encontrado")
	}
	return m, err
}

func (s *Service) DeleteModelo(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	return s.repo.DeleteModelo(ctx, qtx, id, empresaID)
}

// ---- Materias Primas ----

func (s *Service) ListMateriasPrimas(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]MateriaPrima, error) {
	return s.repo.ListMateriasPrimas(ctx, qtx, empresaID)
}

func (s *Service) GetMateriaPrima(ctx context.Context, qtx db.DBTX, id uuid.UUID) (MateriaPrima, error) {
	mp, err := s.repo.GetMateriaPrima(ctx, qtx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return MateriaPrima{}, errors.New("matéria-prima não encontrada")
	}
	return mp, err
}

func (s *Service) CreateMateriaPrima(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreateMateriaPrimaRequest) (MateriaPrima, error) {
	if req.Nome == "" {
		return MateriaPrima{}, errors.New("nome é obrigatório")
	}
	return s.repo.CreateMateriaPrima(ctx, qtx, empresaID, req)
}

func (s *Service) UpdateMateriaPrima(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdateMateriaPrimaRequest) (MateriaPrima, error) {
	if req.Nome == "" {
		return MateriaPrima{}, errors.New("nome é obrigatório")
	}
	mp, err := s.repo.UpdateMateriaPrima(ctx, qtx, id, req)
	if errors.Is(err, sql.ErrNoRows) {
		return MateriaPrima{}, errors.New("matéria-prima não encontrada")
	}
	return mp, err
}

func (s *Service) DeleteMateriaPrima(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	return s.repo.DeleteMateriaPrima(ctx, qtx, id, empresaID)
}
