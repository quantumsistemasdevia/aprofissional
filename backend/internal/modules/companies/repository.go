package companies

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/db"
	"github.com/sqlc-dev/pqtype"
)

type Repository struct {
	sqlDB *sql.DB
}

func NewRepository(sqlDB *sql.DB) *Repository {
	return &Repository{sqlDB: sqlDB}
}

func (r *Repository) Create(ctx context.Context, req CreateEmpresaRequest) (Empresa, error) {
	q := db.New(r.sqlDB)
	row, err := q.CreateEmpresa(ctx, db.CreateEmpresaParams{
		ID:    uuid.New(),
		Nome:  req.Nome,
		Slug:  req.Slug,
		Cnpj:  sql.NullString{String: strVal(req.CNPJ), Valid: req.CNPJ != nil},
		Email: sql.NullString{String: strVal(req.Email), Valid: req.Email != nil},
		Telefone: sql.NullString{
			String: strVal(req.Telefone),
			Valid:  req.Telefone != nil,
		},
		ConfigErp:         pqtype.NullRawMessage{RawMessage: req.ConfigERP, Valid: len(req.ConfigERP) > 0},
		ConfigNotificacao: pqtype.NullRawMessage{RawMessage: req.ConfigNotificacao, Valid: len(req.ConfigNotificacao) > 0},
	})
	if err != nil {
		return Empresa{}, err
	}
	return toEmpresa(row), nil
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (Empresa, error) {
	q := db.New(r.sqlDB)
	row, err := q.GetEmpresa(ctx, id)
	if err != nil {
		return Empresa{}, err
	}
	return toEmpresa(row), nil
}

func (r *Repository) GetBySlug(ctx context.Context, slug string) (Empresa, error) {
	q := db.New(r.sqlDB)
	row, err := q.GetEmpresaBySlug(ctx, slug)
	if err != nil {
		return Empresa{}, err
	}
	return toEmpresa(row), nil
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req UpdateEmpresaRequest) (Empresa, error) {
	q := db.New(r.sqlDB)
	row, err := q.UpdateEmpresa(ctx, db.UpdateEmpresaParams{
		ID:       id,
		Nome:     req.Nome,
		Cnpj:     sql.NullString{String: strVal(req.CNPJ), Valid: req.CNPJ != nil},
		Email:    sql.NullString{String: strVal(req.Email), Valid: req.Email != nil},
		Telefone: sql.NullString{String: strVal(req.Telefone), Valid: req.Telefone != nil},
		ConfigErp:         pqtype.NullRawMessage{RawMessage: req.ConfigERP, Valid: len(req.ConfigERP) > 0},
		ConfigNotificacao: pqtype.NullRawMessage{RawMessage: req.ConfigNotificacao, Valid: len(req.ConfigNotificacao) > 0},
	})
	if err != nil {
		return Empresa{}, err
	}
	return toEmpresa(row), nil
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	q := db.New(r.sqlDB)
	return q.DeleteEmpresa(ctx, id)
}

func toEmpresa(row db.Empresa) Empresa {
	e := Empresa{
		ID:   row.ID,
		Nome: row.Nome,
		Slug: row.Slug,
	}
	if row.Cnpj.Valid {
		e.CNPJ = &row.Cnpj.String
	}
	if row.Email.Valid {
		e.Email = &row.Email.String
	}
	if row.Telefone.Valid {
		e.Telefone = &row.Telefone.String
	}
	if row.ConfigErp.Valid {
		e.ConfigERP = row.ConfigErp.RawMessage
	}
	if row.ConfigNotificacao.Valid {
		e.ConfigNotificacao = row.ConfigNotificacao.RawMessage
	}
	if row.CriadoEm.Valid {
		t := row.CriadoEm.Time
		e.CriadoEm = &t
	}
	return e
}

func strVal(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
