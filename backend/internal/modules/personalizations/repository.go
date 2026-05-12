package personalizations

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/db"
)

type Repository struct{}

func NewRepository() *Repository { return &Repository{} }

func (r *Repository) List(ctx context.Context, qtx db.DBTX, itemID uuid.UUID) ([]Personalizacao, error) {
	q := db.New(qtx)
	rows, err := q.ListPersonalizacoesPorItem(ctx, itemID)
	if err != nil {
		return nil, err
	}
	result := make([]Personalizacao, 0, len(rows))
	for _, row := range rows {
		result = append(result, toPersonalizacao(row))
	}
	return result, nil
}

func (r *Repository) GetByID(ctx context.Context, qtx db.DBTX, id uuid.UUID) (Personalizacao, error) {
	q := db.New(qtx)
	row, err := q.GetPersonalizacao(ctx, id)
	if err != nil {
		return Personalizacao{}, err
	}
	return toPersonalizacao(row), nil
}

func (r *Repository) Create(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, req CreatePersonalizacaoRequest) (Personalizacao, error) {
	cores := coresParam(req.Cores)

	const query = `
		INSERT INTO personalizacoes (
			id, empresa_id, item_pedido_id, tipo, cores, tipo_conteudo,
			url_imagem, texto_conteudo, texto_fonte, lado, localizacao,
			canvas_x, canvas_y, canvas_escala, canvas_rotacao,
			canvas_largura, canvas_altura, observacao
		) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
		RETURNING id, empresa_id, item_pedido_id, tipo, cores, tipo_conteudo,
			url_imagem, texto_conteudo, texto_fonte, lado, localizacao,
			canvas_x, canvas_y, canvas_escala, canvas_rotacao,
			canvas_largura, canvas_altura, observacao, deletado_em`

	row := qtx.QueryRowContext(ctx, query,
		uuid.New(),
		empresaID,
		req.ItemPedidoID,
		sql.NullString{String: strVal(req.Tipo), Valid: req.Tipo != nil},
		cores,
		sql.NullString{String: strVal(req.TipoConteudo), Valid: req.TipoConteudo != nil},
		sql.NullString{String: strVal(req.UrlImagem), Valid: req.UrlImagem != nil},
		sql.NullString{String: strVal(req.TextoConteudo), Valid: req.TextoConteudo != nil},
		sql.NullString{String: strVal(req.TextoFonte), Valid: req.TextoFonte != nil},
		sql.NullString{String: strVal(req.Lado), Valid: req.Lado != nil},
		sql.NullString{String: strVal(req.Localizacao), Valid: req.Localizacao != nil},
		sql.NullFloat64{Float64: f64Val(req.CanvasX), Valid: req.CanvasX != nil},
		sql.NullFloat64{Float64: f64Val(req.CanvasY), Valid: req.CanvasY != nil},
		sql.NullFloat64{Float64: f64Val(req.CanvasEscala), Valid: req.CanvasEscala != nil},
		sql.NullFloat64{Float64: f64Val(req.CanvasRotacao), Valid: req.CanvasRotacao != nil},
		sql.NullInt32{Int32: i32Val(req.CanvasLargura), Valid: req.CanvasLargura != nil},
		sql.NullInt32{Int32: i32Val(req.CanvasAltura), Valid: req.CanvasAltura != nil},
		sql.NullString{String: strVal(req.Observacao), Valid: req.Observacao != nil},
	)
	return scanPersonalizacao(row)
}

func (r *Repository) Update(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdatePersonalizacaoRequest) (Personalizacao, error) {
	cores := coresParam(req.Cores)

	const query = `
		UPDATE personalizacoes SET
			tipo = $2, cores = $3::jsonb, tipo_conteudo = $4, url_imagem = $5,
			texto_conteudo = $6, texto_fonte = $7, lado = $8, localizacao = $9,
			canvas_x = $10, canvas_y = $11, canvas_escala = $12, canvas_rotacao = $13,
			canvas_largura = $14, canvas_altura = $15, observacao = $16
		WHERE id = $1 AND deletado_em IS NULL
		RETURNING id, empresa_id, item_pedido_id, tipo, cores, tipo_conteudo,
			url_imagem, texto_conteudo, texto_fonte, lado, localizacao,
			canvas_x, canvas_y, canvas_escala, canvas_rotacao,
			canvas_largura, canvas_altura, observacao, deletado_em`

	row := qtx.QueryRowContext(ctx, query,
		id,
		sql.NullString{String: strVal(req.Tipo), Valid: req.Tipo != nil},
		cores,
		sql.NullString{String: strVal(req.TipoConteudo), Valid: req.TipoConteudo != nil},
		sql.NullString{String: strVal(req.UrlImagem), Valid: req.UrlImagem != nil},
		sql.NullString{String: strVal(req.TextoConteudo), Valid: req.TextoConteudo != nil},
		sql.NullString{String: strVal(req.TextoFonte), Valid: req.TextoFonte != nil},
		sql.NullString{String: strVal(req.Lado), Valid: req.Lado != nil},
		sql.NullString{String: strVal(req.Localizacao), Valid: req.Localizacao != nil},
		sql.NullFloat64{Float64: f64Val(req.CanvasX), Valid: req.CanvasX != nil},
		sql.NullFloat64{Float64: f64Val(req.CanvasY), Valid: req.CanvasY != nil},
		sql.NullFloat64{Float64: f64Val(req.CanvasEscala), Valid: req.CanvasEscala != nil},
		sql.NullFloat64{Float64: f64Val(req.CanvasRotacao), Valid: req.CanvasRotacao != nil},
		sql.NullInt32{Int32: i32Val(req.CanvasLargura), Valid: req.CanvasLargura != nil},
		sql.NullInt32{Int32: i32Val(req.CanvasAltura), Valid: req.CanvasAltura != nil},
		sql.NullString{String: strVal(req.Observacao), Valid: req.Observacao != nil},
	)
	return scanPersonalizacao(row)
}

func (r *Repository) Delete(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	q := db.New(qtx)
	return q.DeletePersonalizacao(ctx, db.DeletePersonalizacaoParams{ID: id, EmpresaID: empresaID})
}

// coresParam converts a json.RawMessage to a plain string for use as a SQL
// parameter with ::jsonb cast. Passing a Go string (not pqtype.NullRawMessage)
// is required when using pgx/v5 with QueryExecModeSimpleProtocol.
func coresParam(raw json.RawMessage) interface{} {
	if len(raw) == 0 {
		return nil
	}
	s := string(raw)
	// Treat bare JSON null as SQL NULL
	if s == "null" || s == "[]" {
		return nil
	}
	return s
}

func scanPersonalizacao(row *sql.Row) (Personalizacao, error) {
	var (
		p             Personalizacao
		tipo          sql.NullString
		cores         []byte
		tipoConteudo  sql.NullString
		urlImagem     sql.NullString
		textoConteudo sql.NullString
		textoFonte    sql.NullString
		lado          sql.NullString
		localizacao   sql.NullString
		canvasX       sql.NullFloat64
		canvasY       sql.NullFloat64
		canvasEscala  sql.NullFloat64
		canvasRotacao sql.NullFloat64
		canvasLargura sql.NullInt32
		canvasAltura  sql.NullInt32
		observacao    sql.NullString
		deletadoEm    sql.NullTime
	)
	err := row.Scan(
		&p.ID, &p.EmpresaID, &p.ItemPedidoID,
		&tipo, &cores, &tipoConteudo,
		&urlImagem, &textoConteudo, &textoFonte,
		&lado, &localizacao,
		&canvasX, &canvasY, &canvasEscala, &canvasRotacao,
		&canvasLargura, &canvasAltura,
		&observacao, &deletadoEm,
	)
	if err != nil {
		return Personalizacao{}, err
	}
	if tipo.Valid {
		p.Tipo = &tipo.String
	}
	if len(cores) > 0 {
		p.Cores = json.RawMessage(cores)
	}
	if tipoConteudo.Valid {
		p.TipoConteudo = &tipoConteudo.String
	}
	if urlImagem.Valid {
		p.UrlImagem = &urlImagem.String
	}
	if textoConteudo.Valid {
		p.TextoConteudo = &textoConteudo.String
	}
	if textoFonte.Valid {
		p.TextoFonte = &textoFonte.String
	}
	if lado.Valid {
		p.Lado = &lado.String
	}
	if localizacao.Valid {
		p.Localizacao = &localizacao.String
	}
	if canvasX.Valid {
		p.CanvasX = &canvasX.Float64
	}
	if canvasY.Valid {
		p.CanvasY = &canvasY.Float64
	}
	if canvasEscala.Valid {
		p.CanvasEscala = &canvasEscala.Float64
	}
	if canvasRotacao.Valid {
		p.CanvasRotacao = &canvasRotacao.Float64
	}
	if canvasLargura.Valid {
		p.CanvasLargura = &canvasLargura.Int32
	}
	if canvasAltura.Valid {
		p.CanvasAltura = &canvasAltura.Int32
	}
	if observacao.Valid {
		p.Observacao = &observacao.String
	}
	return p, nil
}

func toPersonalizacao(row db.Personalizaco) Personalizacao {
	p := Personalizacao{ID: row.ID, EmpresaID: row.EmpresaID, ItemPedidoID: row.ItemPedidoID}
	if row.Tipo.Valid {
		p.Tipo = &row.Tipo.String
	}
	if row.Cores.Valid {
		p.Cores = row.Cores.RawMessage
	}
	if row.TipoConteudo.Valid {
		p.TipoConteudo = &row.TipoConteudo.String
	}
	if row.UrlImagem.Valid {
		p.UrlImagem = &row.UrlImagem.String
	}
	if row.TextoConteudo.Valid {
		p.TextoConteudo = &row.TextoConteudo.String
	}
	if row.TextoFonte.Valid {
		p.TextoFonte = &row.TextoFonte.String
	}
	if row.Lado.Valid {
		p.Lado = &row.Lado.String
	}
	if row.Localizacao.Valid {
		p.Localizacao = &row.Localizacao.String
	}
	if row.CanvasX.Valid {
		p.CanvasX = &row.CanvasX.Float64
	}
	if row.CanvasY.Valid {
		p.CanvasY = &row.CanvasY.Float64
	}
	if row.CanvasEscala.Valid {
		p.CanvasEscala = &row.CanvasEscala.Float64
	}
	if row.CanvasRotacao.Valid {
		p.CanvasRotacao = &row.CanvasRotacao.Float64
	}
	if row.CanvasLargura.Valid {
		p.CanvasLargura = &row.CanvasLargura.Int32
	}
	if row.CanvasAltura.Valid {
		p.CanvasAltura = &row.CanvasAltura.Int32
	}
	if row.Observacao.Valid {
		p.Observacao = &row.Observacao.String
	}
	return p
}

func strVal(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func f64Val(f *float64) float64 {
	if f == nil {
		return 0
	}
	return *f
}

func i32Val(i *int32) int32 {
	if i == nil {
		return 0
	}
	return *i
}
