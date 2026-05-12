package dashboard

import (
	"encoding/json"
	"net/http"
	"time"

	appMiddleware "github.com/heliobarreira/aprofissional/internal/middleware"
	"github.com/google/uuid"
)

type Handler struct{}

func NewHandler() *Handler { return &Handler{} }

type Stats struct {
	PedidosAbertos     int `json:"pedidosAbertos"`
	PedidosProducao    int `json:"pedidosProducao"`
	PedidosFinalizados int `json:"pedidosFinalizados"`
	ClientesAtivos     int `json:"clientesAtivos"`
}

type PedidoRecente struct {
	Numero          int32      `json:"numero"`
	ClienteNome     *string    `json:"cliente_nome"`
	Status          *string    `json:"status"`
	PrevisaoEntrega *time.Time `json:"previsao_entrega"`
}

func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	empresaIDStr := appMiddleware.GetEmpresaID(r)
	empresaID, err := uuid.Parse(empresaIDStr)
	if err != nil {
		http.Error(w, `{"error":"empresa_id inválido"}`, http.StatusBadRequest)
		return
	}

	qtx := appMiddleware.GetDB(r)

	var stats Stats

	row := qtx.QueryRowContext(r.Context(), `
		SELECT
			COUNT(*) FILTER (WHERE status IN ('orcamento','aprovado')) AS abertos,
			COUNT(*) FILTER (WHERE status = 'producao') AS producao,
			COUNT(*) FILTER (WHERE status IN ('finalizado','entregue')) AS finalizados
		FROM pedidos
		WHERE empresa_id = $1 AND deletado_em IS NULL
	`, empresaID)
	if err := row.Scan(&stats.PedidosAbertos, &stats.PedidosProducao, &stats.PedidosFinalizados); err != nil {
		http.Error(w, `{"error":"erro ao buscar pedidos"}`, http.StatusInternalServerError)
		return
	}

	rowC := qtx.QueryRowContext(r.Context(), `
		SELECT COUNT(*) FROM clientes WHERE empresa_id = $1 AND deletado_em IS NULL
	`, empresaID)
	if err := rowC.Scan(&stats.ClientesAtivos); err != nil {
		http.Error(w, `{"error":"erro ao buscar clientes"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats) //nolint:errcheck
}

func (h *Handler) GetPedidosRecentes(w http.ResponseWriter, r *http.Request) {
	empresaIDStr := appMiddleware.GetEmpresaID(r)
	empresaID, err := uuid.Parse(empresaIDStr)
	if err != nil {
		http.Error(w, `{"error":"empresa_id inválido"}`, http.StatusBadRequest)
		return
	}

	qtx := appMiddleware.GetDB(r)

	rows, err := qtx.QueryContext(r.Context(), `
		SELECT p.numero, c.nome AS cliente_nome, p.status, p.previsao_entrega
		FROM pedidos p
		LEFT JOIN clientes c ON c.id = p.cliente_id
		WHERE p.empresa_id = $1 AND p.deletado_em IS NULL
		ORDER BY p.criado_em DESC
		LIMIT 10
	`, empresaID)
	if err != nil {
		http.Error(w, `{"error":"erro ao buscar pedidos recentes"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	pedidos := make([]PedidoRecente, 0)
	for rows.Next() {
		var p PedidoRecente
		if err := rows.Scan(&p.Numero, &p.ClienteNome, &p.Status, &p.PrevisaoEntrega); err != nil {
			http.Error(w, `{"error":"erro ao processar pedidos"}`, http.StatusInternalServerError)
			return
		}
		pedidos = append(pedidos, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pedidos) //nolint:errcheck
}
