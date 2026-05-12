package production

import "github.com/go-chi/chi/v5"

func RegisterRoutes(r chi.Router, h *Handler) {
	r.Get("/dashboard", h.DashboardEtapas)

	// Ordens de produção
	r.Route("/ordens", func(r chi.Router) {
		r.Get("/", h.ListOrdens)
		r.Post("/", h.CreateOrdem)
		r.Get("/{id}", h.GetOrdem)
		r.Patch("/{id}/status", h.UpdateOrdemStatus)
		r.Delete("/{id}", h.DeleteOrdem)

		// Etapas de uma ordem
		r.Get("/{ordemID}/etapas", h.ListEtapas)
		r.Get("/{ordemID}/etapas/{etapaID}", h.GetEtapa)
		r.Patch("/{ordemID}/etapas/{etapaID}/status", h.UpdateEtapaStatus)
	})

	// Configurações de etapas
	r.Route("/configs", func(r chi.Router) {
		r.Get("/", h.ListConfigs)
		r.Post("/", h.CreateConfig)
		r.Get("/{id}", h.GetConfig)
		r.Put("/{id}", h.UpdateConfig)
		r.Delete("/{id}", h.DeleteConfig)
	})
}
