package catalog

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/db"
)

type Repository struct{}

func NewRepository() *Repository { return &Repository{} }

// ---- Produtos ----

func (r *Repository) ListProdutos(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]Produto, error) {
	q := db.New(qtx)
	rows, err := q.ListProdutos(ctx, empresaID)
	if err != nil {
		return nil, err
	}
	result := make([]Produto, 0, len(rows))
	for _, row := range rows {
		result = append(result, toProduto(row))
	}
	return result, nil
}

func (r *Repository) GetProduto(ctx context.Context, qtx db.DBTX, id uuid.UUID) (Produto, error) {
	q := db.New(qtx)
	row, err := q.GetProduto(ctx, id)
	if err != nil {
		return Produto{}, err
	}
	return toProduto(row), nil
}

func (r *Repository) CreateProduto(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreateProdutoRequest) (Produto, error) {
	q := db.New(qtx)
	row, err := q.CreateProduto(ctx, db.CreateProdutoParams{
		ID:        uuid.New(),
		EmpresaID: empresaID,
		Nome:      req.Nome,
		Descricao: sql.NullString{String: strVal(req.Descricao), Valid: req.Descricao != nil},
		UrlImagem: sql.NullString{String: strVal(req.UrlImagem), Valid: req.UrlImagem != nil},
	})
	if err != nil {
		return Produto{}, err
	}
	return toProduto(row), nil
}

func (r *Repository) UpdateProduto(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdateProdutoRequest) (Produto, error) {
	q := db.New(qtx)
	row, err := q.UpdateProduto(ctx, db.UpdateProdutoParams{
		ID:               id,
		Nome:             req.Nome,
		Descricao:        sql.NullString{String: strVal(req.Descricao), Valid: req.Descricao != nil},
		UrlImagem:        sql.NullString{String: strVal(req.UrlImagem), Valid: req.UrlImagem != nil},
		ConsumoPorUnidade: sql.NullFloat64{Float64: floatVal(req.ConsumoPorUnidade), Valid: req.ConsumoPorUnidade != nil},
		UnidadeConsumo:   sql.NullString{String: strVal(req.UnidadeConsumo), Valid: req.UnidadeConsumo != nil},
	})
	if err != nil {
		return Produto{}, err
	}
	return toProduto(row), nil
}

func (r *Repository) DeleteProduto(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	q := db.New(qtx)
	return q.DeleteProduto(ctx, db.DeleteProdutoParams{ID: id, EmpresaID: empresaID})
}

// ---- Modelos ----

func (r *Repository) ListModelos(ctx context.Context, qtx db.DBTX, empresaID, produtoID uuid.UUID) ([]Modelo, error) {
	q := db.New(qtx)
	rows, err := q.ListModelos(ctx, db.ListModelosParams{EmpresaID: empresaID, ProdutoID: produtoID})
	if err != nil {
		return nil, err
	}
	result := make([]Modelo, 0, len(rows))
	for _, row := range rows {
		result = append(result, toModelo(row))
	}
	return result, nil
}

func (r *Repository) GetModelo(ctx context.Context, qtx db.DBTX, id uuid.UUID) (Modelo, error) {
	q := db.New(qtx)
	row, err := q.GetModelo(ctx, id)
	if err != nil {
		return Modelo{}, err
	}
	return toModelo(row), nil
}

func (r *Repository) CreateModelo(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreateModeloRequest) (Modelo, error) {
	q := db.New(qtx)
	row, err := q.CreateModelo(ctx, db.CreateModeloParams{
		ID:              uuid.New(),
		EmpresaID:       empresaID,
		ProdutoID:       req.ProdutoID,
		Nome:            req.Nome,
		UrlImagemFrente: sql.NullString{String: strVal(req.UrlImagemFrente), Valid: req.UrlImagemFrente != nil},
		UrlImagemVerso:  sql.NullString{String: strVal(req.UrlImagemVerso), Valid: req.UrlImagemVerso != nil},
		Tipo:            sql.NullString{String: strVal(req.Tipo), Valid: req.Tipo != nil},
		Gola:            sql.NullString{String: strVal(req.Gola), Valid: req.Gola != nil},
		Mangas:          sql.NullString{String: strVal(req.Mangas), Valid: req.Mangas != nil},
		Barras:          sql.NullString{String: strVal(req.Barras), Valid: req.Barras != nil},
		Recortes:        sql.NullString{String: strVal(req.Recortes), Valid: req.Recortes != nil},
		Bolsos:          sql.NullString{String: strVal(req.Bolsos), Valid: req.Bolsos != nil},
		Acabamento:      sql.NullString{String: strVal(req.Acabamento), Valid: req.Acabamento != nil},
	})
	if err != nil {
		return Modelo{}, err
	}
	return toModelo(row), nil
}

func (r *Repository) UpdateModelo(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdateModeloRequest) (Modelo, error) {
	q := db.New(qtx)
	row, err := q.UpdateModelo(ctx, db.UpdateModeloParams{
		ID:              id,
		Nome:            req.Nome,
		UrlImagemFrente: sql.NullString{String: strVal(req.UrlImagemFrente), Valid: req.UrlImagemFrente != nil},
		UrlImagemVerso:  sql.NullString{String: strVal(req.UrlImagemVerso), Valid: req.UrlImagemVerso != nil},
		Tipo:            sql.NullString{String: strVal(req.Tipo), Valid: req.Tipo != nil},
		Gola:            sql.NullString{String: strVal(req.Gola), Valid: req.Gola != nil},
		Mangas:          sql.NullString{String: strVal(req.Mangas), Valid: req.Mangas != nil},
		Barras:          sql.NullString{String: strVal(req.Barras), Valid: req.Barras != nil},
		Recortes:        sql.NullString{String: strVal(req.Recortes), Valid: req.Recortes != nil},
		Bolsos:          sql.NullString{String: strVal(req.Bolsos), Valid: req.Bolsos != nil},
		Acabamento:      sql.NullString{String: strVal(req.Acabamento), Valid: req.Acabamento != nil},
	})
	if err != nil {
		return Modelo{}, err
	}
	return toModelo(row), nil
}

func (r *Repository) DeleteModelo(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	q := db.New(qtx)
	return q.DeleteModelo(ctx, db.DeleteModeloParams{ID: id, EmpresaID: empresaID})
}

// ---- Materias Primas ----

func (r *Repository) ListMateriasPrimas(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]MateriaPrima, error) {
	q := db.New(qtx)
	rows, err := q.ListMateriasPrimas(ctx, empresaID)
	if err != nil {
		return nil, err
	}
	result := make([]MateriaPrima, 0, len(rows))
	for _, row := range rows {
		result = append(result, toMateriaPrima(row))
	}
	return result, nil
}

func (r *Repository) GetMateriaPrima(ctx context.Context, qtx db.DBTX, id uuid.UUID) (MateriaPrima, error) {
	q := db.New(qtx)
	row, err := q.GetMateriaPrima(ctx, id)
	if err != nil {
		return MateriaPrima{}, err
	}
	return toMateriaPrima(row), nil
}

func (r *Repository) CreateMateriaPrima(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreateMateriaPrimaRequest) (MateriaPrima, error) {
	q := db.New(qtx)
	row, err := q.CreateMateriaPrima(ctx, db.CreateMateriaPrimaParams{
		ID:         uuid.New(),
		EmpresaID:  empresaID,
		Nome:       req.Nome,
		Tipo:       sql.NullString{String: strVal(req.Tipo), Valid: req.Tipo != nil},
		Cor:        sql.NullString{String: strVal(req.Cor), Valid: req.Cor != nil},
		Composicao: sql.NullString{String: strVal(req.Composicao), Valid: req.Composicao != nil},
		Preco:      sql.NullString{String: strVal(req.Preco), Valid: req.Preco != nil},
	})
	if err != nil {
		return MateriaPrima{}, err
	}
	return toMateriaPrima(row), nil
}

func (r *Repository) UpdateMateriaPrima(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdateMateriaPrimaRequest) (MateriaPrima, error) {
	q := db.New(qtx)
	row, err := q.UpdateMateriaPrima(ctx, db.UpdateMateriaPrimaParams{
		ID:         id,
		Nome:       req.Nome,
		Tipo:       sql.NullString{String: strVal(req.Tipo), Valid: req.Tipo != nil},
		Cor:        sql.NullString{String: strVal(req.Cor), Valid: req.Cor != nil},
		Composicao: sql.NullString{String: strVal(req.Composicao), Valid: req.Composicao != nil},
		Preco:      sql.NullString{String: strVal(req.Preco), Valid: req.Preco != nil},
	})
	if err != nil {
		return MateriaPrima{}, err
	}
	return toMateriaPrima(row), nil
}

func (r *Repository) DeleteMateriaPrima(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	q := db.New(qtx)
	return q.DeleteMateriaPrima(ctx, db.DeleteMateriaPrimaParams{ID: id, EmpresaID: empresaID})
}

// ---- Helpers ----

func toProduto(row db.Produto) Produto {
	p := Produto{ID: row.ID, EmpresaID: row.EmpresaID, Nome: row.Nome}
	if row.Descricao.Valid {
		p.Descricao = &row.Descricao.String
	}
	if row.UrlImagem.Valid {
		p.UrlImagem = &row.UrlImagem.String
	}
	if row.ConsumoPorUnidade.Valid {
		p.ConsumoPorUnidade = &row.ConsumoPorUnidade.Float64
	}
	if row.UnidadeConsumo.Valid {
		p.UnidadeConsumo = &row.UnidadeConsumo.String
	}
	if row.CriadoEm.Valid {
		t := row.CriadoEm.Time
		p.CriadoEm = &t
	}
	if row.AtualizadoEm.Valid {
		t := row.AtualizadoEm.Time
		p.AtualizadoEm = &t
	}
	return p
}

func toModelo(row db.Modelo) Modelo {
	m := Modelo{ID: row.ID, EmpresaID: row.EmpresaID, ProdutoID: row.ProdutoID, Nome: row.Nome}
	if row.UrlImagemFrente.Valid {
		m.UrlImagemFrente = &row.UrlImagemFrente.String
	}
	if row.UrlImagemVerso.Valid {
		m.UrlImagemVerso = &row.UrlImagemVerso.String
	}
	if row.Tipo.Valid {
		m.Tipo = &row.Tipo.String
	}
	if row.Gola.Valid {
		m.Gola = &row.Gola.String
	}
	if row.Mangas.Valid {
		m.Mangas = &row.Mangas.String
	}
	if row.Barras.Valid {
		m.Barras = &row.Barras.String
	}
	if row.Recortes.Valid {
		m.Recortes = &row.Recortes.String
	}
	if row.Bolsos.Valid {
		m.Bolsos = &row.Bolsos.String
	}
	if row.Acabamento.Valid {
		m.Acabamento = &row.Acabamento.String
	}
	if row.CriadoEm.Valid {
		t := row.CriadoEm.Time
		m.CriadoEm = &t
	}
	if row.AtualizadoEm.Valid {
		t := row.AtualizadoEm.Time
		m.AtualizadoEm = &t
	}
	return m
}

func toMateriaPrima(row db.MateriasPrima) MateriaPrima {
	mp := MateriaPrima{ID: row.ID, EmpresaID: row.EmpresaID, Nome: row.Nome}
	if row.Tipo.Valid {
		mp.Tipo = &row.Tipo.String
	}
	if row.Cor.Valid {
		mp.Cor = &row.Cor.String
	}
	if row.Composicao.Valid {
		mp.Composicao = &row.Composicao.String
	}
	if row.Preco.Valid {
		mp.Preco = &row.Preco.String
	}
	if row.CriadoEm.Valid {
		t := row.CriadoEm.Time
		mp.CriadoEm = &t
	}
	if row.AtualizadoEm.Valid {
		t := row.AtualizadoEm.Time
		mp.AtualizadoEm = &t
	}
	return mp
}

func strVal(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func floatVal(f *float64) float64 {
	if f == nil {
		return 0
	}
	return *f
}
