package reports

import "github.com/go-chi/chi/v5"

func RegisterRoutes(r chi.Router, h *Handler) {
	r.Get("/pedidos-periodo", h.PedidosPorPeriodo)
	r.Get("/produtos-mais-vendidos", h.ProdutosMaisVendidos)
	r.Get("/personalizacoes-usadas", h.PersonalizacoesMaisUsadas)
	r.Get("/por-vendedor", h.PedidosPorVendedor)
	r.Get("/pontualidade", h.PontualidadeEntregas)
	r.Get("/desempenho-etapa", h.DesempenhoPorEtapa)
}
