package reports

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/middleware"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) PedidosPorPeriodo(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	inicio, fim, ok := parsePeriodo(w, r)
	if !ok {
		return
	}
	result, err := h.svc.PedidosPorPeriodo(r.Context(), middleware.GetDB(r), empresaID, inicio, fim)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, result, http.StatusOK)
}

func (h *Handler) ProdutosMaisVendidos(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	limite, _ := strconv.Atoi(r.URL.Query().Get("limite"))
	result, err := h.svc.ProdutosMaisVendidos(r.Context(), middleware.GetDB(r), empresaID, limite)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, result, http.StatusOK)
}

func (h *Handler) PersonalizacoesMaisUsadas(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	result, err := h.svc.PersonalizacoesMaisUsadas(r.Context(), middleware.GetDB(r), empresaID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, result, http.StatusOK)
}

func (h *Handler) PedidosPorVendedor(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	result, err := h.svc.PedidosPorVendedor(r.Context(), middleware.GetDB(r), empresaID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, result, http.StatusOK)
}

func (h *Handler) PontualidadeEntregas(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	inicio, fim, ok := parsePeriodo(w, r)
	if !ok {
		return
	}
	result, err := h.svc.PontualidadeEntregas(r.Context(), middleware.GetDB(r), empresaID, inicio, fim)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, []PontualidadeRow{result}, http.StatusOK)
}

func (h *Handler) DesempenhoPorEtapa(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	result, err := h.svc.DesempenhoPorEtapa(r.Context(), middleware.GetDB(r), empresaID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, result, http.StatusOK)
}

// ---- Helpers ----

// parsePeriodo lê data_inicio e data_fim da query string.
// Se omitidos, usa os últimos 30 dias como padrão.
func parsePeriodo(w http.ResponseWriter, r *http.Request) (time.Time, time.Time, bool) {
	now := time.Now()
	inicioStr := r.URL.Query().Get("data_inicio")
	fimStr := r.URL.Query().Get("data_fim")

	inicio := now.AddDate(0, 0, -30)
	fim := now

	if inicioStr != "" {
		t, err := time.Parse("2006-01-02", inicioStr)
		if err != nil {
			jsonError(w, "formato inválido para data_inicio (use 2006-01-02)", http.StatusBadRequest)
			return time.Time{}, time.Time{}, false
		}
		inicio = t
	}
	if fimStr != "" {
		t, err := time.Parse("2006-01-02", fimStr)
		if err != nil {
			jsonError(w, "formato inválido para data_fim (use 2006-01-02)", http.StatusBadRequest)
			return time.Time{}, time.Time{}, false
		}
		fim = t
	}
	fim = fim.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
	return inicio, fim, true
}

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
