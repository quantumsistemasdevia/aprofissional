package orders

import "github.com/go-chi/chi/v5"

func RegisterRoutes(r chi.Router, h *Handler) {
	r.Get("/", h.ListPedidos)
	r.Post("/", h.CreatePedido)
	r.Get("/{id}", h.GetPedido)
	r.Put("/{id}", h.UpdatePedido)
	r.Patch("/{id}/status", h.UpdateStatus)
	r.Delete("/{id}", h.DeletePedido)

	// Itens de pedido
	r.Get("/{pedidoID}/items", h.ListItens)
	r.Post("/{pedidoID}/items", h.AddItem)
	r.Get("/{pedidoID}/items/{itemID}", h.GetItem)
	r.Put("/{pedidoID}/items/{itemID}", h.UpdateItem)
	r.Delete("/{pedidoID}/items/{itemID}", h.DeleteItem)

	// Versões de item
	r.Get("/{pedidoID}/items/{itemID}/versoes", h.ListVersoes)

	// PDFs
	r.Get("/{id}/orcamento", h.GerarOrcamento)
	r.Get("/{id}/ficha-producao", h.GerarFichaProducao)
}
