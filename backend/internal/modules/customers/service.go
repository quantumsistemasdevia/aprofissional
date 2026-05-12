package customers

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/db"
	"github.com/heliobarreira/aprofissional/internal/erp"
)

type Service struct {
	repo      *Repository
	erpClient erp.ERPClient
}

func NewService(repo *Repository, erpClient erp.ERPClient) *Service {
	return &Service{repo: repo, erpClient: erpClient}
}

func (s *Service) List(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]Cliente, error) {
	return s.repo.List(ctx, qtx, empresaID)
}

func (s *Service) GetByID(ctx context.Context, qtx db.DBTX, id uuid.UUID) (Cliente, error) {
	c, err := s.repo.GetByID(ctx, qtx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return Cliente{}, errors.New("cliente não encontrado")
	}
	return c, err
}

func (s *Service) Create(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreateClienteRequest) (Cliente, error) {
	if req.Nome == "" {
		return Cliente{}, errors.New("nome é obrigatório")
	}
	return s.repo.Create(ctx, qtx, empresaID, req)
}

func (s *Service) Update(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdateClienteRequest) (Cliente, error) {
	if req.Nome == "" {
		return Cliente{}, errors.New("nome é obrigatório")
	}
	c, err := s.repo.Update(ctx, qtx, id, req)
	if errors.Is(err, sql.ErrNoRows) {
		return Cliente{}, errors.New("cliente não encontrado")
	}
	return c, err
}

func (s *Service) Delete(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	return s.repo.Delete(ctx, qtx, id, empresaID)
}

// SearchERP busca clientes no ERP externo pelo termo de busca.
func (s *Service) SearchERP(ctx context.Context, query string) ([]erp.ERPCustomer, error) {
	return s.erpClient.SearchCustomers(ctx, query)
}

// SyncBidirecional sincroniza um cliente local para o ERP externo.
// Se o cliente já tem erp_id, atualiza no ERP; senão, cria no ERP e salva o erp_id localmente.
func (s *Service) SyncBidirecional(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) (Cliente, error) {
	c, err := s.repo.GetByID(ctx, qtx, id)
	if err != nil {
		return Cliente{}, err
	}

	erpData := erp.ERPCustomer{
		Nome:     c.Nome,
		Tipo:     strVal(c.Tipo),
		CpfCnpj:  strVal(c.CpfCnpj),
		Email:    strVal(c.Email),
		Telefone: strVal(c.Telefone),
	}

	if c.ErpID != nil && *c.ErpID != "" {
		erpData.ERPID = *c.ErpID
		_, err = s.erpClient.UpdateCustomer(ctx, *c.ErpID, erpData)
		if err != nil {
			return Cliente{}, err
		}
		return c, nil
	}

	// Create in ERP then save the erp_id back
	created, err := s.erpClient.CreateCustomer(ctx, erpData)
	if err != nil {
		return Cliente{}, err
	}
	return s.repo.UpdateErpID(ctx, qtx, id, created.ERPID)
}

// SyncFromERP sincroniza um cliente do ERP para o banco local.
func (s *Service) SyncFromERP(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, erpID string) (Cliente, error) {
	erpCustomer, err := s.erpClient.GetCustomer(ctx, erpID)
	if err != nil {
		return Cliente{}, err
	}

	// Verificar se já existe cliente com esse erp_id
	existing, err := s.repo.GetByErpID(ctx, qtx, empresaID, erpID)
	if err == nil {
		// Atualizar existente
		tipo := erpCustomer.Tipo
		email := erpCustomer.Email
		telefone := erpCustomer.Telefone
		cpfCnpj := erpCustomer.CpfCnpj
		return s.repo.Update(ctx, qtx, existing.ID, UpdateClienteRequest{
			Nome:     erpCustomer.Nome,
			Tipo:     &tipo,
			CpfCnpj:  &cpfCnpj,
			Email:    &email,
			Telefone: &telefone,
		})
	}

	// Criar novo
	tipo := erpCustomer.Tipo
	email := erpCustomer.Email
	telefone := erpCustomer.Telefone
	cpfCnpj := erpCustomer.CpfCnpj
	now := time.Now()
	_ = now
	return s.repo.Create(ctx, qtx, empresaID, CreateClienteRequest{
		Nome:     erpCustomer.Nome,
		Tipo:     &tipo,
		CpfCnpj:  &cpfCnpj,
		Email:    &email,
		Telefone: &telefone,
		ErpID:    &erpID,
	})
}
