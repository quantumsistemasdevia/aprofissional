package catalog

import "github.com/go-chi/chi/v5"

func RegisterRoutes(r chi.Router, h *Handler) {
	// Produtos
	r.Route("/produtos", func(r chi.Router) {
		r.Get("/", h.ListProdutos)
		r.Post("/", h.CreateProduto)
		r.Get("/{id}", h.GetProduto)
		r.Put("/{id}", h.UpdateProduto)
		r.Delete("/{id}", h.DeleteProduto)
	})

	// Modelos (por produto)
	r.Route("/produtos/{produtoID}/modelos", func(r chi.Router) {
		r.Get("/", h.ListModelos)
		r.Post("/", h.CreateModelo)
	})
	r.Route("/modelos", func(r chi.Router) {
		r.Get("/{id}", h.GetModelo)
		r.Put("/{id}", h.UpdateModelo)
		r.Delete("/{id}", h.DeleteModelo)
	})

	// Opções configuráveis (Modelo, Gola, Mangas, Barras, Recortes, Bolsos, Acabamento)
	r.Route("/opcoes", func(r chi.Router) {
		r.Get("/", h.ListOpcoes)
		r.Post("/", h.CreateOpcao)
		r.Put("/{id}", h.UpdateOpcao)
		r.Delete("/{id}", h.DeleteOpcao)
	})

	// Materias Primas
	r.Route("/materias-primas", func(r chi.Router) {
		r.Get("/", h.ListMateriasPrimas)
		r.Post("/", h.CreateMateriaPrima)
		r.Get("/{id}", h.GetMateriaPrima)
		r.Put("/{id}", h.UpdateMateriaPrima)
		r.Delete("/{id}", h.DeleteMateriaPrima)
	})

	// Tamanhos
	r.Route("/tamanhos", func(r chi.Router) {
		r.Get("/", h.ListTamanhos)
		r.Post("/", h.CreateTamanho)
		r.Put("/{id}", h.UpdateTamanho)
		r.Delete("/{id}", h.DeleteTamanho)
	})

	// Fornecedores
	r.Route("/fornecedores", func(r chi.Router) {
		r.Get("/", h.ListFornecedores)
		r.Post("/", h.CreateFornecedor)
		r.Put("/{id}", h.UpdateFornecedor)
		r.Delete("/{id}", h.DeleteFornecedor)
	})
}
