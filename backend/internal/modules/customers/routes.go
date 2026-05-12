package customers

import "github.com/go-chi/chi/v5"

func RegisterRoutes(r chi.Router, h *Handler) {
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Get("/search-erp", h.SearchERP)
	r.Post("/sync-erp/{erpID}", h.SyncFromERP)
	r.Get("/{id}", h.GetByID)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	r.Post("/{id}/sync-erp", h.SyncBidirecional)
}
