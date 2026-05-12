package customers

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/db"
	"github.com/sqlc-dev/pqtype"
)

type Repository struct{}

func NewRepository() *Repository { return &Repository{} }

func (r *Repository) List(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]Cliente, error) {
	q := db.New(qtx)
	rows, err := q.ListClientes(ctx, empresaID)
	if err != nil {
		return nil, err
	}
	result := make([]Cliente, 0, len(rows))
	for _, row := range rows {
		result = append(result, toCliente(row))
	}
	return result, nil
}

func (r *Repository) GetByID(ctx context.Context, qtx db.DBTX, id uuid.UUID) (Cliente, error) {
	q := db.New(qtx)
	row, err := q.GetCliente(ctx, id)
	if err != nil {
		return Cliente{}, err
	}
	return toCliente(row), nil
}

func (r *Repository) GetByErpID(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, erpID string) (Cliente, error) {
	q := db.New(qtx)
	row, err := q.GetClienteByErpID(ctx, db.GetClienteByErpIDParams{
		EmpresaID: empresaID,
		ErpID:     sql.NullString{String: erpID, Valid: true},
	})
	if err != nil {
		return Cliente{}, err
	}
	return toCliente(row), nil
}

func (r *Repository) Create(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreateClienteRequest) (Cliente, error) {
	q := db.New(qtx)
	row, err := q.CreateCliente(ctx, db.CreateClienteParams{
		ID:          uuid.New(),
		EmpresaID:   empresaID,
		Nome:        req.Nome,
		Tipo:        sql.NullString{String: strVal(req.Tipo), Valid: req.Tipo != nil},
		CpfCnpj:     sql.NullString{String: strVal(req.CpfCnpj), Valid: req.CpfCnpj != nil},
		Email:       sql.NullString{String: strVal(req.Email), Valid: req.Email != nil},
		Telefone:    sql.NullString{String: strVal(req.Telefone), Valid: req.Telefone != nil},
		Endereco:    pqtype.NullRawMessage{RawMessage: req.Endereco, Valid: len(req.Endereco) > 0},
		NomeContato: sql.NullString{String: strVal(req.NomeContato), Valid: req.NomeContato != nil},
		ErpID:       sql.NullString{String: strVal(req.ErpID), Valid: req.ErpID != nil},
	})
	if err != nil {
		return Cliente{}, err
	}
	return toCliente(row), nil
}

func (r *Repository) Update(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdateClienteRequest) (Cliente, error) {
	q := db.New(qtx)
	row, err := q.UpdateCliente(ctx, db.UpdateClienteParams{
		ID:          id,
		Nome:        req.Nome,
		Tipo:        sql.NullString{String: strVal(req.Tipo), Valid: req.Tipo != nil},
		CpfCnpj:     sql.NullString{String: strVal(req.CpfCnpj), Valid: req.CpfCnpj != nil},
		Email:       sql.NullString{String: strVal(req.Email), Valid: req.Email != nil},
		Telefone:    sql.NullString{String: strVal(req.Telefone), Valid: req.Telefone != nil},
		Endereco:    pqtype.NullRawMessage{RawMessage: req.Endereco, Valid: len(req.Endereco) > 0},
		NomeContato: sql.NullString{String: strVal(req.NomeContato), Valid: req.NomeContato != nil},
	})
	if err != nil {
		return Cliente{}, err
	}
	return toCliente(row), nil
}

func (r *Repository) UpdateErpID(ctx context.Context, qtx db.DBTX, id uuid.UUID, erpID string) (Cliente, error) {
	q := db.New(qtx)
	row, err := q.UpdateClienteErpID(ctx, db.UpdateClienteErpIDParams{
		ID:    id,
		ErpID: sql.NullString{String: erpID, Valid: true},
	})
	if err != nil {
		return Cliente{}, err
	}
	return toCliente(row), nil
}

func (r *Repository) Delete(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	q := db.New(qtx)
	return q.DeleteCliente(ctx, db.DeleteClienteParams{ID: id, EmpresaID: empresaID})
}

func toCliente(row db.Cliente) Cliente {
	c := Cliente{
		ID:        row.ID,
		EmpresaID: row.EmpresaID,
		Nome:      row.Nome,
	}
	if row.Tipo.Valid {
		c.Tipo = &row.Tipo.String
	}
	if row.CpfCnpj.Valid {
		c.CpfCnpj = &row.CpfCnpj.String
	}
	if row.Email.Valid {
		c.Email = &row.Email.String
	}
	if row.Telefone.Valid {
		c.Telefone = &row.Telefone.String
	}
	if row.Endereco.Valid {
		c.Endereco = row.Endereco.RawMessage
	}
	if row.NomeContato.Valid {
		c.NomeContato = &row.NomeContato.String
	}
	if row.ErpID.Valid {
		c.ErpID = &row.ErpID.String
	}
	if row.ErpSincronizadoEm.Valid {
		t := row.ErpSincronizadoEm.Time
		c.ErpSincronizadoEm = &t
	}
	if row.CriadoEm.Valid {
		t := row.CriadoEm.Time
		c.CriadoEm = &t
	}
	if row.AtualizadoEm.Valid {
		t := row.AtualizadoEm.Time
		c.AtualizadoEm = &t
	}
	return c
}

func strVal(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// timePtr retorna ponteiro para time.Time ou nil
func timePtr(t time.Time) *time.Time { return &t }
