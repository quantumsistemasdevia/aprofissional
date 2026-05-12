package orders

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/db"
)

type Repository struct{}

func NewRepository() *Repository { return &Repository{} }

// ---- Pedidos ----

func (r *Repository) ListPedidos(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) ([]Pedido, error) {
	q := db.New(qtx)
	rows, err := q.ListPedidos(ctx, empresaID)
	if err != nil {
		return nil, err
	}
	result := make([]Pedido, 0, len(rows))
	for _, row := range rows {
		result = append(result, toPedido(row))
	}
	return result, nil
}

func (r *Repository) GetPedido(ctx context.Context, qtx db.DBTX, id uuid.UUID) (Pedido, error) {
	q := db.New(qtx)
	row, err := q.GetPedido(ctx, id)
	if err != nil {
		return Pedido{}, err
	}
	return toPedido(row), nil
}

func (r *Repository) CreatePedido(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID, numero int32, req CreatePedidoRequest, criadoPorStr string) (Pedido, error) {
	q := db.New(qtx)

	var clienteID uuid.NullUUID
	if req.ClienteID != nil {
		clienteID = uuid.NullUUID{UUID: *req.ClienteID, Valid: true}
	}
	var vendedorID uuid.NullUUID
	if req.VendedorID != nil {
		vendedorID = uuid.NullUUID{UUID: *req.VendedorID, Valid: true}
	}
	var criadoPor uuid.NullUUID
	if criadoPorStr != "" {
		uid, err := uuid.Parse(criadoPorStr)
		if err == nil {
			criadoPor = uuid.NullUUID{UUID: uid, Valid: true}
		}
	}

	status := "orcamento"
	if req.Status != nil {
		status = *req.Status
	}

	var previsaoEntrega sql.NullTime
	if req.PrevisaoEntrega != nil {
		previsaoEntrega = sql.NullTime{Time: *req.PrevisaoEntrega, Valid: true}
	}

	row, err := q.CreatePedido(ctx, db.CreatePedidoParams{
		ID:              uuid.New(),
		EmpresaID:       empresaID,
		Numero:          numero,
		ClienteID:       clienteID,
		VendedorID:      vendedorID,
		CriadoPor:       criadoPor,
		Status:          sql.NullString{String: status, Valid: true},
		Observacoes:     sql.NullString{String: strVal(req.Observacoes), Valid: req.Observacoes != nil},
		FormaPagamento:  sql.NullString{String: strVal(req.FormaPagamento), Valid: req.FormaPagamento != nil},
		PrevisaoEntrega: previsaoEntrega,
	})
	if err != nil {
		return Pedido{}, err
	}
	return toPedido(row), nil
}

func (r *Repository) UpdatePedidoStatus(ctx context.Context, qtx db.DBTX, id uuid.UUID, status string) (Pedido, error) {
	q := db.New(qtx)
	row, err := q.UpdatePedidoStatus(ctx, db.UpdatePedidoStatusParams{
		ID:     id,
		Status: sql.NullString{String: status, Valid: true},
	})
	if err != nil {
		return Pedido{}, err
	}
	return toPedido(row), nil
}

func (r *Repository) UpdatePedido(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdatePedidoRequest) (Pedido, error) {
	var clienteID uuid.NullUUID
	if req.ClienteID != nil {
		clienteID = uuid.NullUUID{UUID: *req.ClienteID, Valid: true}
	}
	var vendedorID uuid.NullUUID
	if req.VendedorID != nil {
		vendedorID = uuid.NullUUID{UUID: *req.VendedorID, Valid: true}
	}
	var previsaoEntrega sql.NullTime
	if req.PrevisaoEntrega != nil {
		previsaoEntrega = sql.NullTime{Time: *req.PrevisaoEntrega, Valid: true}
	}

	const query = `
		UPDATE pedidos SET
			cliente_id = $2, vendedor_id = $3, previsao_entrega = $4,
			observacoes = $5, forma_pagamento = $6, atualizado_em = NOW()
		WHERE id = $1`

	_, err := qtx.ExecContext(ctx, query,
		id, clienteID, vendedorID, previsaoEntrega,
		sql.NullString{String: strVal(req.Observacoes), Valid: req.Observacoes != nil},
		sql.NullString{String: strVal(req.FormaPagamento), Valid: req.FormaPagamento != nil},
	)
	if err != nil {
		return Pedido{}, err
	}
	return r.GetPedido(ctx, qtx, id)
}

func (r *Repository) DeletePedido(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	q := db.New(qtx)
	return q.DeletePedido(ctx, db.DeletePedidoParams{ID: id, EmpresaID: empresaID})
}

func (r *Repository) NextNumero(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) (int32, error) {
	q := db.New(qtx)
	num, err := q.InitNumeroPedido(ctx, empresaID)
	if err != nil {
		return 0, fmt.Errorf("erro ao gerar número: %w", err)
	}
	return num, nil
}

// ---- Itens ----

func (r *Repository) ListItens(ctx context.Context, qtx db.DBTX, pedidoID uuid.UUID) ([]ItemPedido, error) {
	const query = `
		SELECT id, empresa_id, pedido_id, produto_id, modelo_id, materia_prima_id, fornecedor_id,
			cor, tamanhos_quantidades, quantidade, preco_unitario,
			tipo_desconto, desconto, total, especificacoes_modelo,
			preview_frente_url, preview_verso_url,
			consumo_por_unidade, unidade_consumo, produto_pronto,
			criado_em, atualizado_em, deletado_em
		FROM itens_pedido
		WHERE pedido_id = $1 AND deletado_em IS NULL
		ORDER BY criado_em`

	rows, err := qtx.QueryContext(ctx, query, pedidoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []ItemPedido
	for rows.Next() {
		item, err := scanItem(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, nil
}

func (r *Repository) GetItem(ctx context.Context, qtx db.DBTX, id uuid.UUID) (ItemPedido, error) {
	const query = `
		SELECT id, empresa_id, pedido_id, produto_id, modelo_id, materia_prima_id, fornecedor_id,
			cor, tamanhos_quantidades, quantidade, preco_unitario,
			tipo_desconto, desconto, total, especificacoes_modelo,
			preview_frente_url, preview_verso_url,
			consumo_por_unidade, unidade_consumo, produto_pronto,
			criado_em, atualizado_em, deletado_em
		FROM itens_pedido
		WHERE id = $1 AND deletado_em IS NULL`

	row := qtx.QueryRowContext(ctx, query, id)
	return scanItemRow(row)
}

func (r *Repository) CreateItem(ctx context.Context, qtx db.DBTX, empresaID, pedidoID uuid.UUID, req CreateItemPedidoRequest) (ItemPedido, error) {
	tipoDesconto := ""
	if req.TipoDesconto != nil {
		tipoDesconto = *req.TipoDesconto
	}
	total := CalcularTotal(req.Quantidade, req.PrecoUnitario, tipoDesconto, req.Desconto)
	totalStr := fmt.Sprintf("%.2f", total)
	precoStr := fmt.Sprintf("%.2f", req.PrecoUnitario)
	descontoStr := fmt.Sprintf("%.2f", req.Desconto)
	qty := int32(req.Quantidade)

	var modeloID uuid.NullUUID
	if req.ModeloID != nil {
		modeloID = uuid.NullUUID{UUID: *req.ModeloID, Valid: true}
	}
	var mpID uuid.NullUUID
	if req.MateriaPrimaID != nil {
		mpID = uuid.NullUUID{UUID: *req.MateriaPrimaID, Valid: true}
	}
	var fornID uuid.NullUUID
	if req.FornecedorID != nil {
		fornID = uuid.NullUUID{UUID: *req.FornecedorID, Valid: true}
	}

	tamanhos := sanitizeJSON(req.TamanhosQuantidades)
	specs := sanitizeJSON(req.EspecificacoesModelo)

	frenteURL := sql.NullString{String: "", Valid: false}
	if req.PreviewFrenteURL != nil && *req.PreviewFrenteURL != "" {
		frenteURL = sql.NullString{String: *req.PreviewFrenteURL, Valid: true}
	}
	versoURL := sql.NullString{String: "", Valid: false}
	if req.PreviewVersoURL != nil && *req.PreviewVersoURL != "" {
		versoURL = sql.NullString{String: *req.PreviewVersoURL, Valid: true}
	}

	// Snapshot consumo do produto no momento do pedido
	var consumo sql.NullFloat64
	var unidade sql.NullString
	_ = qtx.QueryRowContext(ctx,
		`SELECT consumo_por_unidade, unidade_consumo FROM produtos WHERE id = $1 AND deletado_em IS NULL`,
		req.ProdutoID,
	).Scan(&consumo, &unidade)

	produtoPronto := req.ProdutoPronto != nil && *req.ProdutoPronto
	statusCompra := "nao_comprado"
	if produtoPronto {
		statusCompra = "comprado"
	}

	const query = `
		INSERT INTO itens_pedido (
			id, empresa_id, pedido_id, produto_id, modelo_id, materia_prima_id, fornecedor_id,
			cor, tamanhos_quantidades, quantidade, preco_unitario,
			tipo_desconto, desconto, total, especificacoes_modelo,
			preview_frente_url, preview_verso_url,
			consumo_por_unidade, unidade_consumo,
			produto_pronto, status_compra
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, $14, $15::jsonb, $16, $17, $18, $19, $20, $21)
		RETURNING id, empresa_id, pedido_id, produto_id, modelo_id, materia_prima_id, fornecedor_id,
			cor, tamanhos_quantidades, quantidade, preco_unitario,
			tipo_desconto, desconto, total, especificacoes_modelo,
			preview_frente_url, preview_verso_url,
			consumo_por_unidade, unidade_consumo, produto_pronto,
			criado_em, atualizado_em, deletado_em`

	row := qtx.QueryRowContext(ctx, query,
		uuid.New(),
		empresaID,
		pedidoID,
		req.ProdutoID,
		modeloID,
		mpID,
		fornID,
		sql.NullString{String: strVal(req.Cor), Valid: req.Cor != nil},
		string(tamanhos),
		sql.NullInt32{Int32: qty, Valid: true},
		sql.NullString{String: precoStr, Valid: true},
		sql.NullString{String: tipoDesconto, Valid: tipoDesconto != ""},
		sql.NullString{String: descontoStr, Valid: req.Desconto > 0},
		sql.NullString{String: totalStr, Valid: true},
		string(specs),
		frenteURL,
		versoURL,
		consumo,
		unidade,
		produtoPronto,
		statusCompra,
	)
	return scanItemRow(row)
}

func (r *Repository) UpdateItem(ctx context.Context, qtx db.DBTX, id uuid.UUID, req UpdateItemPedidoRequest) (ItemPedido, error) {
	tipoDesconto := ""
	if req.TipoDesconto != nil {
		tipoDesconto = *req.TipoDesconto
	}
	total := CalcularTotal(req.Quantidade, req.PrecoUnitario, tipoDesconto, req.Desconto)
	totalStr := fmt.Sprintf("%.2f", total)
	precoStr := fmt.Sprintf("%.2f", req.PrecoUnitario)
	descontoStr := fmt.Sprintf("%.2f", req.Desconto)
	qty := int32(req.Quantidade)

	var modeloID uuid.NullUUID
	if req.ModeloID != nil {
		modeloID = uuid.NullUUID{UUID: *req.ModeloID, Valid: true}
	}
	var mpID uuid.NullUUID
	if req.MateriaPrimaID != nil {
		mpID = uuid.NullUUID{UUID: *req.MateriaPrimaID, Valid: true}
	}
	var fornID uuid.NullUUID
	if req.FornecedorID != nil {
		fornID = uuid.NullUUID{UUID: *req.FornecedorID, Valid: true}
	}

	tamanhos := sanitizeJSON(req.TamanhosQuantidades)
	specs := sanitizeJSON(req.EspecificacoesModelo)

	var frenteURL sql.NullString
	if req.PreviewFrenteURL != nil && *req.PreviewFrenteURL != "" {
		frenteURL = sql.NullString{String: *req.PreviewFrenteURL, Valid: true}
	}
	var versoURL sql.NullString
	if req.PreviewVersoURL != nil && *req.PreviewVersoURL != "" {
		versoURL = sql.NullString{String: *req.PreviewVersoURL, Valid: true}
	}

	// Re-snapshot consumo do produto (pode ter mudado o produto_id)
	var consumo sql.NullFloat64
	var unidade sql.NullString
	_ = qtx.QueryRowContext(ctx,
		`SELECT consumo_por_unidade, unidade_consumo FROM produtos WHERE id = $1 AND deletado_em IS NULL`,
		req.ProdutoID,
	).Scan(&consumo, &unidade)

	produtoPronto := req.ProdutoPronto != nil && *req.ProdutoPronto
	statusCompra := "nao_comprado"
	if produtoPronto {
		statusCompra = "comprado"
	}

	const query = `
		UPDATE itens_pedido SET
			produto_id = $2, modelo_id = $3, materia_prima_id = $4, fornecedor_id = $5, cor = $6,
			tamanhos_quantidades = $7::jsonb, quantidade = $8, preco_unitario = $9,
			tipo_desconto = $10, desconto = $11, total = $12,
			especificacoes_modelo = $13::jsonb,
			preview_frente_url = COALESCE($14, preview_frente_url),
			preview_verso_url = COALESCE($15, preview_verso_url),
			consumo_por_unidade = $16, unidade_consumo = $17,
			produto_pronto = $18, status_compra = $19,
			atualizado_em = NOW()
		WHERE id = $1 AND deletado_em IS NULL
		RETURNING id, empresa_id, pedido_id, produto_id, modelo_id, materia_prima_id, fornecedor_id,
			cor, tamanhos_quantidades, quantidade, preco_unitario,
			tipo_desconto, desconto, total, especificacoes_modelo,
			preview_frente_url, preview_verso_url,
			consumo_por_unidade, unidade_consumo, produto_pronto,
			criado_em, atualizado_em, deletado_em`

	row := qtx.QueryRowContext(ctx, query,
		id,
		req.ProdutoID,
		modeloID,
		mpID,
		fornID,
		sql.NullString{String: strVal(req.Cor), Valid: req.Cor != nil},
		string(tamanhos),
		sql.NullInt32{Int32: qty, Valid: true},
		sql.NullString{String: precoStr, Valid: true},
		sql.NullString{String: tipoDesconto, Valid: tipoDesconto != ""},
		sql.NullString{String: descontoStr, Valid: req.Desconto > 0},
		sql.NullString{String: totalStr, Valid: true},
		string(specs),
		frenteURL,
		versoURL,
		consumo,
		unidade,
		produtoPronto,
		statusCompra,
	)
	return scanItemRow(row)
}

func (r *Repository) DeleteItem(ctx context.Context, qtx db.DBTX, id, empresaID uuid.UUID) error {
	q := db.New(qtx)
	return q.DeleteItemPedido(ctx, db.DeleteItemPedidoParams{ID: id, EmpresaID: empresaID})
}

func (r *Repository) RecalcularTotal(ctx context.Context, qtx db.DBTX, pedidoID uuid.UUID) error {
	const query = `
		UPDATE pedidos
		SET total = (
			SELECT COALESCE(SUM(total), 0)
			FROM itens_pedido
			WHERE pedido_id = $1 AND deletado_em IS NULL
		),
		atualizado_em = NOW()
		WHERE id = $1 AND deletado_em IS NULL
	`
	_, err := qtx.ExecContext(ctx, query, pedidoID)
	return err
}

func (r *Repository) SetDataEntrega(ctx context.Context, qtx db.DBTX, id uuid.UUID) error {
	const query = `
		UPDATE pedidos
		SET data_entrega = CURRENT_DATE, atualizado_em = NOW()
		WHERE id = $1 AND deletado_em IS NULL AND data_entrega IS NULL
	`
	_, err := qtx.ExecContext(ctx, query, id)
	return err
}

// ---- Versoes ----

func (r *Repository) CreateVersao(ctx context.Context, qtx db.DBTX, itemID uuid.UUID, snapshot json.RawMessage, alteradoPorStr string) (VersaoItemPedido, error) {
	q := db.New(qtx)

	ultima, err := q.GetUltimaVersao(ctx, itemID)
	var nextVersao int32 = 1
	if err == nil {
		nextVersao = ultima.NumeroVersao + 1
	}

	var alteradoPor uuid.NullUUID
	if alteradoPorStr != "" {
		uid, err := uuid.Parse(alteradoPorStr)
		if err == nil {
			alteradoPor = uuid.NullUUID{UUID: uid, Valid: true}
		}
	}

	row, err := q.CreateVersaoItem(ctx, db.CreateVersaoItemParams{
		ID:           uuid.New(),
		ItemPedidoID: itemID,
		NumeroVersao: nextVersao,
		Snapshot:     snapshot,
		AlteradoPor:  alteradoPor,
	})
	if err != nil {
		return VersaoItemPedido{}, err
	}
	return toVersao(row), nil
}

func (r *Repository) ListVersoes(ctx context.Context, qtx db.DBTX, itemID uuid.UUID) ([]VersaoItemPedido, error) {
	q := db.New(qtx)
	rows, err := q.ListVersoesPorItem(ctx, itemID)
	if err != nil {
		return nil, err
	}
	result := make([]VersaoItemPedido, 0, len(rows))
	for _, row := range rows {
		result = append(result, toVersao(row))
	}
	return result, nil
}

// ---- Helpers ----

func toPedido(row db.Pedido) Pedido {
	p := Pedido{ID: row.ID, EmpresaID: row.EmpresaID, Numero: row.Numero}
	if row.ClienteID.Valid {
		p.ClienteID = &row.ClienteID.UUID
	}
	if row.VendedorID.Valid {
		p.VendedorID = &row.VendedorID.UUID
	}
	if row.CriadoPor.Valid {
		p.CriadoPor = &row.CriadoPor.UUID
	}
	if row.Status.Valid {
		p.Status = &row.Status.String
	}
	if row.Observacoes.Valid {
		p.Observacoes = &row.Observacoes.String
	}
	if row.Total.Valid {
		p.Total = &row.Total.String
	}
	if row.FormaPagamento.Valid {
		p.FormaPagamento = &row.FormaPagamento.String
	}
	if row.PrevisaoEntrega.Valid {
		t := row.PrevisaoEntrega.Time
		p.PrevisaoEntrega = &t
	}
	if row.DataEntrega.Valid {
		t := row.DataEntrega.Time
		p.DataEntrega = &t
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


func toVersao(row db.VersoesItemPedido) VersaoItemPedido {
	v := VersaoItemPedido{
		ID:           row.ID,
		ItemPedidoID: row.ItemPedidoID,
		NumeroVersao: row.NumeroVersao,
		Snapshot:     row.Snapshot,
	}
	if row.AlteradoPor.Valid {
		v.AlteradoPor = &row.AlteradoPor.UUID
	}
	if row.CriadoEm.Valid {
		t := row.CriadoEm.Time
		v.CriadoEm = &t
	}
	return v
}

func strVal(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func sanitizeJSON(raw json.RawMessage) json.RawMessage {
	if len(raw) == 0 {
		return json.RawMessage(`{}`)
	}
	var v interface{}
	if err := json.Unmarshal(raw, &v); err != nil {
		return json.RawMessage(`{}`)
	}
	result, err := json.Marshal(v)
	if err != nil {
		return json.RawMessage(`{}`)
	}
	return result
}

type scanner interface {
	Scan(dest ...any) error
}

func scanItem(row scanner) (ItemPedido, error) {
	var (
		item         ItemPedido
		modeloID     uuid.NullUUID
		materiaPrima uuid.NullUUID
		fornecedor   uuid.NullUUID
		cor          sql.NullString
		tamanhos     []byte
		quantidade   sql.NullInt32
		preco        sql.NullString
		tipoDesc     sql.NullString
		desconto     sql.NullString
		total        sql.NullString
		specs        []byte
		frenteURL    sql.NullString
		versoURL     sql.NullString
		consumo      sql.NullFloat64
		unidade      sql.NullString
		produtoPronto sql.NullBool
		criadoEm     sql.NullTime
		atualizadoEm sql.NullTime
		deletadoEm   sql.NullTime
	)

	err := row.Scan(
		&item.ID, &item.EmpresaID, &item.PedidoID, &item.ProdutoID, &modeloID,
		&materiaPrima, &fornecedor, &cor, &tamanhos, &quantidade, &preco,
		&tipoDesc, &desconto, &total, &specs,
		&frenteURL, &versoURL,
		&consumo, &unidade, &produtoPronto,
		&criadoEm, &atualizadoEm, &deletadoEm,
	)
	if err != nil {
		return ItemPedido{}, err
	}

	if modeloID.Valid {
		item.ModeloID = &modeloID.UUID
	}
	if materiaPrima.Valid {
		item.MateriaPrimaID = &materiaPrima.UUID
	}
	if fornecedor.Valid {
		item.FornecedorID = &fornecedor.UUID
	}
	if cor.Valid {
		item.Cor = &cor.String
	}
	if len(tamanhos) > 0 {
		item.TamanhosQuantidades = tamanhos
	}
	if quantidade.Valid {
		item.Quantidade = &quantidade.Int32
	}
	if preco.Valid {
		item.PrecoUnitario = &preco.String
	}
	if tipoDesc.Valid {
		item.TipoDesconto = &tipoDesc.String
	}
	if desconto.Valid {
		item.Desconto = &desconto.String
	}
	if total.Valid {
		item.Total = &total.String
	}
	if len(specs) > 0 {
		item.EspecificacoesModelo = specs
	}
	if frenteURL.Valid {
		item.PreviewFrenteURL = &frenteURL.String
	}
	if versoURL.Valid {
		item.PreviewVersoURL = &versoURL.String
	}
	if consumo.Valid {
		item.ConsumoPorUnidade = &consumo.Float64
	}
	if unidade.Valid {
		item.UnidadeConsumo = &unidade.String
	}
	if produtoPronto.Valid {
		item.ProdutoPronto = &produtoPronto.Bool
	}
	if criadoEm.Valid {
		t := criadoEm.Time
		item.CriadoEm = &t
	}
	if atualizadoEm.Valid {
		t := atualizadoEm.Time
		item.AtualizadoEm = &t
	}
	return item, nil
}

func scanItemRow(row *sql.Row) (ItemPedido, error) {
	return scanItem(row)
}
