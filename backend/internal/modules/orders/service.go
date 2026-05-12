package orders

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/db"
)

// ProductionCreator evita import circular entre os módulos orders e production.
type ProductionCreator interface {
	CreateOrdemFromPedido(ctx context.Context, qtx db.DBTX, empresaID, pedidoID uuid.UUID, previsaoEntrega *time.Time) error
}

type Service struct {
	repo       *Repository
	production ProductionCreator
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) SetProduction(p ProductionCreator) {
	s.production = p
}

func (s *Service) ListPedidos(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]Pedido, error) {
	return s.repo.ListPedidos(ctx, qtx, empresaID)
}

func (s *Service) GetPedido(ctx context.Context, qtx db.DBTX, id uuid.UUID) (Pedido, error) {
	p, err := s.repo.GetPedido(ctx, qtx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return Pedido{}, errors.New("pedido não encontrado")
	}
	return p, err
}

func (s *Service) CreatePedido(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreatePedidoRequest, criadoPor string) (Pedido, error) {
	numero, err := s.repo.NextNumero(ctx, qtx, empresaID)
	if err != nil {
		return Pedido{}, err
	}
	return s.repo.CreatePedido(ctx, qtx, empresaID, numero, req, criadoPor)
}

func (s *Service) UpdateStatus(ctx context.Context, qtx db.DBTX, id uuid.UUID, status string) (Pedido, error) {
	validStatuses := map[string]bool{
		"orcamento": true, "aprovado": true, "producao": true,
		"finalizado": true, "entregue": true,
	}
	if !validStatuses[status] {
		return Pedido{}, errors.New("status inválido")
	}

	p, err := s.repo.UpdatePedidoStatus(ctx, qtx, id, status)
	if errors.Is(err, sql.ErrNoRows) {
		return Pedido{}, errors.New("pedido não encontrado")
	}
	if err != nil {
		return Pedido{}, err
	}

	// Criar ordem de produção automaticamente ao mover para "producao"
	if status == "producao" && s.production != nil {
		_ = s.production.CreateOrdemFromPedido(ctx, qtx, p.EmpresaID, p.ID, p.PrevisaoEntrega)
	}
	// Registrar data de entrega real ao marcar como entregue
	if status == "entregue" {
		_ = s.repo.SetDataEntrega(ctx, qtx, p.ID)
	}

	return p, nil
}

func (s *Service) UpdatePedido(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdatePedidoRequest) (Pedido, error) {
	return s.repo.UpdatePedido(ctx, qtx, id, req)
}

func (s *Service) DeletePedido(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	return s.repo.DeletePedido(ctx, qtx, id, empresaID)
}

// ---- Itens ----

func (s *Service) ListItens(ctx context.Context, qtx db.DBTX, pedidoID uuid.UUID) ([]ItemPedido, error) {
	return s.repo.ListItens(ctx, qtx, pedidoID)
}

func (s *Service) GetItem(ctx context.Context, qtx db.DBTX, id uuid.UUID) (ItemPedido, error) {
	item, err := s.repo.GetItem(ctx, qtx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return ItemPedido{}, errors.New("item não encontrado")
	}
	return item, err
}

func (s *Service) AddItem(ctx context.Context, qtx db.DBTX, empresaID, pedidoID uuid.UUID, req CreateItemPedidoRequest) (ItemPedido, error) {
	if req.Quantidade <= 0 {
		return ItemPedido{}, errors.New("quantidade deve ser maior que zero")
	}
	item, err := s.repo.CreateItem(ctx, qtx, empresaID, pedidoID, req)
	if err != nil {
		return ItemPedido{}, err
	}
	_ = s.repo.RecalcularTotal(ctx, qtx, pedidoID)
	return item, nil
}

func (s *Service) UpdateItem(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdateItemPedidoRequest, alteradoPor string) (ItemPedido, error) {
	if req.Quantidade <= 0 {
		return ItemPedido{}, errors.New("quantidade deve ser maior que zero")
	}

	current, err := s.repo.GetItem(ctx, qtx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ItemPedido{}, errors.New("item não encontrado")
		}
		return ItemPedido{}, err
	}

	snapshot, _ := json.Marshal(current)
	if _, err := s.repo.CreateVersao(ctx, qtx, id, snapshot, alteradoPor); err != nil {
		_ = err
	}

	updated, err := s.repo.UpdateItem(ctx, qtx, id, req)
	if err != nil {
		return ItemPedido{}, err
	}
	_ = s.repo.RecalcularTotal(ctx, qtx, updated.PedidoID)
	return updated, nil
}

func (s *Service) DeleteItem(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	item, err := s.repo.GetItem(ctx, qtx, id)
	if err != nil {
		return s.repo.DeleteItem(ctx, qtx, id, empresaID)
	}
	if err := s.repo.DeleteItem(ctx, qtx, id, empresaID); err != nil {
		return err
	}
	_ = s.repo.RecalcularTotal(ctx, qtx, item.PedidoID)
	return nil
}

func (s *Service) ListVersoes(ctx context.Context, qtx db.DBTX, itemID uuid.UUID) ([]VersaoItemPedido, error) {
	return s.repo.ListVersoes(ctx, qtx, itemID)
}
