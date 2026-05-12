package reports

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type Service struct{}

func NewService() *Service { return &Service{} }

// PedidosPorPeriodo retorna totais de pedidos agrupados por dia no período.
func (s *Service) PedidosPorPeriodo(ctx context.Context, qtx *sql.Tx, empresaID uuid.UUID, inicio, fim time.Time) ([]PedidoPeriodoRow, error) {
	query := `
		SELECT
			DATE(criado_em) AS data,
			COUNT(*) AS quantidade,
			COALESCE(SUM(CAST(total AS DECIMAL)), 0) AS total
		FROM pedidos
		WHERE empresa_id = $1
			AND criado_em >= $2
			AND criado_em <= $3
			AND deletado_em IS NULL
		GROUP BY DATE(criado_em)
		ORDER BY data
	`
	rows, err := qtx.QueryContext(ctx, query, empresaID, inicio, fim)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []PedidoPeriodoRow
	for rows.Next() {
		var row PedidoPeriodoRow
		if err := rows.Scan(&row.Data, &row.Quantidade, &row.Total); err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, rows.Err()
}

// ProdutosMaisVendidos retorna os produtos com maior volume de vendas.
func (s *Service) ProdutosMaisVendidos(ctx context.Context, qtx *sql.Tx, empresaID uuid.UUID, limite int) ([]ProdutoVendidoRow, error) {
	if limite <= 0 {
		limite = 10
	}
	query := `
		SELECT
			p.id::text AS produto_id,
			p.nome AS nome_produto,
			COALESCE(SUM(ip.quantidade), 0)::int AS quantidade,
			COALESCE(SUM(CAST(ip.total AS DECIMAL)), 0) AS total_vendas
		FROM produtos p
		LEFT JOIN itens_pedido ip ON ip.produto_id = p.id AND ip.deletado_em IS NULL
		WHERE p.empresa_id = $1 AND p.deletado_em IS NULL
		GROUP BY p.id, p.nome
		ORDER BY quantidade DESC
		LIMIT $2
	`
	rows, err := qtx.QueryContext(ctx, query, empresaID, limite)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []ProdutoVendidoRow
	for rows.Next() {
		var row ProdutoVendidoRow
		if err := rows.Scan(&row.ProdutoID, &row.NomeProduto, &row.Quantidade, &row.TotalVendas); err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, rows.Err()
}

// PersonalizacoesMaisUsadas retorna os tipos/localizações de personalização mais usados.
func (s *Service) PersonalizacoesMaisUsadas(ctx context.Context, qtx *sql.Tx, empresaID uuid.UUID) ([]PersonalizacaoUsadaRow, error) {
	query := `
		SELECT
			COALESCE(tipo, 'N/A') AS tipo,
			COALESCE(localizacao, 'N/A') AS localizacao,
			COUNT(*) AS quantidade
		FROM personalizacoes
		WHERE empresa_id = $1 AND deletado_em IS NULL
		GROUP BY tipo, localizacao
		ORDER BY quantidade DESC
	`
	rows, err := qtx.QueryContext(ctx, query, empresaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []PersonalizacaoUsadaRow
	for rows.Next() {
		var row PersonalizacaoUsadaRow
		if err := rows.Scan(&row.Tipo, &row.Localizacao, &row.Quantidade); err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, rows.Err()
}

// PedidosPorVendedor retorna totais de pedidos agrupados por vendedor.
func (s *Service) PedidosPorVendedor(ctx context.Context, qtx *sql.Tx, empresaID uuid.UUID) ([]VendedorPedidoRow, error) {
	query := `
		SELECT
			COALESCE(u.id::text, 'sem_vendedor') AS vendedor_id,
			COALESCE(u.nome, 'Sem Vendedor') AS nome_vendedor,
			COUNT(p.id) AS total_pedidos,
			COALESCE(SUM(CAST(p.total AS DECIMAL)), 0) AS total_valor
		FROM pedidos p
		LEFT JOIN usuarios u ON u.id = p.vendedor_id
		WHERE p.empresa_id = $1 AND p.deletado_em IS NULL
		GROUP BY u.id, u.nome
		ORDER BY total_pedidos DESC
	`
	rows, err := qtx.QueryContext(ctx, query, empresaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []VendedorPedidoRow
	for rows.Next() {
		var row VendedorPedidoRow
		if err := rows.Scan(&row.VendedorID, &row.NomeVendedor, &row.TotalPedidos, &row.TotalValor); err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, rows.Err()
}

// PontualidadeEntregas calcula percentual de pedidos entregues no prazo no período informado.
func (s *Service) PontualidadeEntregas(ctx context.Context, qtx *sql.Tx, empresaID uuid.UUID, inicio, fim time.Time) (PontualidadeRow, error) {
	query := `
		SELECT
			COUNT(*) AS total_pedidos,
			COALESCE(SUM(CASE WHEN data_entrega <= previsao_entrega THEN 1 ELSE 0 END), 0) AS entregues_no_prazo,
			COALESCE(SUM(CASE WHEN data_entrega > previsao_entrega THEN 1 ELSE 0 END), 0) AS entregues_atrasados
		FROM pedidos
		WHERE empresa_id = $1
			AND status = 'entregue'
			AND data_entrega IS NOT NULL
			AND previsao_entrega IS NOT NULL
			AND deletado_em IS NULL
			AND data_entrega >= $2
			AND data_entrega <= $3
	`
	var row PontualidadeRow
	var total, noPrazo, atrasados int
	err := qtx.QueryRowContext(ctx, query, empresaID, inicio, fim).Scan(&total, &noPrazo, &atrasados)
	if err != nil {
		return row, err
	}
	row.TotalPedidos = total
	row.EntreguesNoPrazo = noPrazo
	row.EntreguesAtrasados = atrasados
	if total > 0 {
		row.TaxaPontualidade = float64(noPrazo) / float64(total) * 100
	}
	return row, nil
}

// DesempenhoPorEtapa calcula taxa de conclusão por tipo de etapa.
func (s *Service) DesempenhoPorEtapa(ctx context.Context, qtx *sql.Tx, empresaID uuid.UUID) ([]DesempenhoEtapaRow, error) {
	query := `
		SELECT
			c.id::text AS config_etapa_id,
			c.nome AS nome_etapa,
			COUNT(e.id) AS total_etapas,
			SUM(CASE WHEN e.status = 'concluido' AND (e.previsao_conclusao IS NULL OR e.finalizado_em::date <= e.previsao_conclusao) THEN 1 ELSE 0 END) AS concluidas_no_prazo
		FROM configs_etapa_producao c
		LEFT JOIN etapas_producao e ON e.config_etapa_id = c.id AND e.deletado_em IS NULL
		WHERE c.empresa_id = $1 AND c.deletado_em IS NULL
		GROUP BY c.id, c.nome
		ORDER BY c.ordem
	`
	rows, err := qtx.QueryContext(ctx, query, empresaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []DesempenhoEtapaRow
	for rows.Next() {
		var row DesempenhoEtapaRow
		if err := rows.Scan(&row.ConfigEtapaID, &row.NomeEtapa, &row.TotalEtapas, &row.ConcluidasNoPrazo); err != nil {
			return nil, err
		}
		if row.TotalEtapas > 0 {
			row.TaxaConclusao = float64(row.ConcluidasNoPrazo) / float64(row.TotalEtapas) * 100
		}
		result = append(result, row)
	}
	return result, rows.Err()
}
