package production

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/middleware"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// ---- Ordens ----

func (h *Handler) ListOrdens(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	list, err := h.svc.ListOrdens(r.Context(), middleware.GetDB(r), empresaID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, list, http.StatusOK)
}

func (h *Handler) GetOrdem(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	o, err := h.svc.GetOrdem(r.Context(), middleware.GetDB(r), id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusNotFound)
		return
	}
	jsonResponse(w, o, http.StatusOK)
}

func (h *Handler) CreateOrdem(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	var body struct {
		PedidoID        uuid.UUID  `json:"pedido_id"`
		Status          *string    `json:"status,omitempty"`
		PrevisaoEntrega *time.Time `json:"previsao_entrega,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	req := CreateOrdemRequest{PedidoID: body.PedidoID, Status: body.Status}
	o, err := h.svc.CreateOrdem(r.Context(), middleware.GetDB(r), empresaID, req, body.PrevisaoEntrega)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, o, http.StatusCreated)
}

func (h *Handler) UpdateOrdemStatus(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req UpdateOrdemStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	o, err := h.svc.UpdateOrdemStatus(r.Context(), middleware.GetDB(r), id, req.Status)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, o, http.StatusOK)
}

func (h *Handler) DeleteOrdem(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	if err := h.svc.DeleteOrdem(r.Context(), middleware.GetDB(r), id, empresaID); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---- Etapas ----

func (h *Handler) ListEtapas(w http.ResponseWriter, r *http.Request) {
	ordemID, err := uuid.Parse(chi.URLParam(r, "ordemID"))
	if err != nil {
		jsonError(w, "ordem_id inválido", http.StatusBadRequest)
		return
	}
	list, err := h.svc.ListEtapas(r.Context(), middleware.GetDB(r), ordemID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, list, http.StatusOK)
}

func (h *Handler) GetEtapa(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "etapaID"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	e, err := h.svc.GetEtapa(r.Context(), middleware.GetDB(r), id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusNotFound)
		return
	}
	jsonResponse(w, e, http.StatusOK)
}

func (h *Handler) UpdateEtapaStatus(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "etapaID"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req UpdateEtapaStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	e, err := h.svc.UpdateEtapaStatus(r.Context(), middleware.GetDB(r), id, req.Status)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, e, http.StatusOK)
}

// ---- Dashboard ----

func (h *Handler) DashboardEtapas(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	items, err := h.svc.DashboardEtapas(r.Context(), middleware.GetDB(r), empresaID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, items, http.StatusOK)
}

// ---- Configs ----

func (h *Handler) ListConfigs(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	list, err := h.svc.ListConfigs(r.Context(), middleware.GetDB(r), empresaID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, list, http.StatusOK)
}

func (h *Handler) GetConfig(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	c, err := h.svc.GetConfig(r.Context(), middleware.GetDB(r), id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusNotFound)
		return
	}
	jsonResponse(w, c, http.StatusOK)
}

func (h *Handler) CreateConfig(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	var req CreateConfigRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	c, err := h.svc.CreateConfig(r.Context(), middleware.GetDB(r), empresaID, req)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, c, http.StatusCreated)
}

func (h *Handler) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req UpdateConfigRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	c, err := h.svc.UpdateConfig(r.Context(), middleware.GetDB(r), id, req)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, c, http.StatusOK)
}

func (h *Handler) DeleteConfig(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	if err := h.svc.DeleteConfig(r.Context(), middleware.GetDB(r), id, empresaID); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---- Helpers ----

func mustEmpresaID(w http.ResponseWriter, r *http.Request) uuid.UUID {
	id, err := uuid.Parse(middleware.GetEmpresaID(r))
	if err != nil {
		jsonError(w, "empresa_id inválido", http.StatusBadRequest)
		return uuid.Nil
	}
	return id
}

func jsonResponse(w http.ResponseWriter, data any, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data) //nolint:errcheck
}

func jsonError(w http.ResponseWriter, msg string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg}) //nolint:errcheck
}
