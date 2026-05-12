package users

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/db"
	appMiddleware "github.com/heliobarreira/aprofissional/internal/middleware"
)

type Handler struct {
	supabaseURL string
	supabaseKey string
}

func NewHandler(supabaseURL, supabaseKey string) *Handler {
	return &Handler{supabaseURL: supabaseURL, supabaseKey: supabaseKey}
}

type UserResponse struct {
	ID        string  `json:"id"`
	EmpresaID string  `json:"empresa_id"`
	Nome      string  `json:"nome"`
	Email     string  `json:"email"`
	Perfil    string  `json:"perfil"`
	CriadoEm *string `json:"criado_em,omitempty"`
}

type CreateUserRequest struct {
	Nome   string `json:"nome"`
	Email  string `json:"email"`
	Senha  string `json:"senha"`
	Perfil string `json:"perfil"`
}

type UpdateUserRequest struct {
	Nome   string `json:"nome"`
	Perfil string `json:"perfil"`
}

func toResponse(u db.Usuario) UserResponse {
	resp := UserResponse{
		ID:        u.ID.String(),
		EmpresaID: u.EmpresaID.String(),
		Nome:      u.Nome,
		Email:     u.Email,
		Perfil:    "vendedor",
	}
	if u.Perfil.Valid {
		resp.Perfil = u.Perfil.String
	}
	if u.CriadoEm.Valid {
		t := u.CriadoEm.Time.Format(time.RFC3339)
		resp.CriadoEm = &t
	}
	return resp
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	empresaID, err := uuid.Parse(appMiddleware.GetEmpresaID(r))
	if err != nil {
		jsonError(w, "empresa_id inválido", http.StatusBadRequest)
		return
	}
	q := db.New(appMiddleware.GetDB(r))
	rows, err := q.ListUsuarios(r.Context(), empresaID)
	if err != nil {
		jsonError(w, "erro ao listar usuários", http.StatusInternalServerError)
		return
	}
	result := make([]UserResponse, 0, len(rows))
	for _, u := range rows {
		result = append(result, toResponse(u))
	}
	jsonOK(w, result, http.StatusOK)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	q := db.New(appMiddleware.GetDB(r))
	u, err := q.GetUsuario(r.Context(), id)
	if err != nil {
		jsonError(w, "usuário não encontrado", http.StatusNotFound)
		return
	}
	jsonOK(w, toResponse(u), http.StatusOK)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	empresaID, err := uuid.Parse(appMiddleware.GetEmpresaID(r))
	if err != nil {
		jsonError(w, "empresa_id inválido", http.StatusBadRequest)
		return
	}
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	req.Nome  = strings.TrimSpace(req.Nome)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if req.Nome == "" || req.Email == "" || req.Senha == "" {
		jsonError(w, "nome, email e senha são obrigatórios", http.StatusBadRequest)
		return
	}
	if len(req.Senha) < 6 {
		jsonError(w, "senha deve ter no mínimo 6 caracteres", http.StatusBadRequest)
		return
	}
	validPerfis := map[string]bool{"admin": true, "vendedor": true, "producao": true}
	if req.Perfil == "" {
		req.Perfil = "vendedor"
	}
	if !validPerfis[req.Perfil] {
		jsonError(w, "perfil inválido: use admin, vendedor ou producao", http.StatusBadRequest)
		return
	}

	// Criar no Supabase Auth e obter o ID gerado
	authUID, err := h.createSupabaseUser(r.Context(), req.Email, req.Senha, empresaID.String())
	if err != nil {
		jsonError(w, "erro ao criar usuário no Supabase: "+err.Error(), http.StatusBadRequest)
		return
	}

	userID, err := uuid.Parse(authUID)
	if err != nil {
		jsonError(w, "id retornado pelo Supabase é inválido", http.StatusInternalServerError)
		return
	}

	q := db.New(appMiddleware.GetDB(r))
	u, err := q.CreateUsuario(r.Context(), db.CreateUsuarioParams{
		ID:        userID,
		EmpresaID: empresaID,
		Nome:      req.Nome,
		Email:     req.Email,
		Perfil:    sql.NullString{String: req.Perfil, Valid: true},
	})
	if err != nil {
		// Rollback: remove o usuário do Supabase Auth para não deixar órfão
		_ = h.deleteSupabaseUser(r.Context(), authUID)
		jsonError(w, "erro ao salvar usuário no banco", http.StatusInternalServerError)
		return
	}
	jsonOK(w, toResponse(u), http.StatusCreated)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	req.Nome = strings.TrimSpace(req.Nome)
	if req.Nome == "" {
		jsonError(w, "nome é obrigatório", http.StatusBadRequest)
		return
	}
	validPerfis := map[string]bool{"admin": true, "vendedor": true, "producao": true}
	if req.Perfil == "" {
		req.Perfil = "vendedor"
	}
	if !validPerfis[req.Perfil] {
		jsonError(w, "perfil inválido: use admin, vendedor ou producao", http.StatusBadRequest)
		return
	}
	q := db.New(appMiddleware.GetDB(r))
	u, err := q.UpdateUsuario(r.Context(), db.UpdateUsuarioParams{
		ID:     id,
		Nome:   req.Nome,
		Perfil: sql.NullString{String: req.Perfil, Valid: true},
	})
	if err != nil {
		jsonError(w, "usuário não encontrado", http.StatusNotFound)
		return
	}
	jsonOK(w, toResponse(u), http.StatusOK)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	empresaID, err := uuid.Parse(appMiddleware.GetEmpresaID(r))
	if err != nil {
		jsonError(w, "empresa_id inválido", http.StatusBadRequest)
		return
	}
	q := db.New(appMiddleware.GetDB(r))
	if err := q.DeleteUsuario(r.Context(), db.DeleteUsuarioParams{ID: id, EmpresaID: empresaID}); err != nil {
		jsonError(w, "erro ao remover usuário", http.StatusInternalServerError)
		return
	}
	// Remove também do Supabase Auth (best-effort)
	_ = h.deleteSupabaseUser(r.Context(), id.String())
	w.WriteHeader(http.StatusNoContent)
}

// ---- Supabase Admin API ----

type supabaseAuthUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

func (h *Handler) createSupabaseUser(ctx context.Context, email, password, empresaID string) (string, error) {
	body, _ := json.Marshal(map[string]any{
		"email":         email,
		"password":      password,
		"app_metadata":  map[string]any{"empresa_id": empresaID},
		"email_confirm": true,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		h.supabaseURL+"/auth/v1/admin/users",
		bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+h.supabaseKey)
	req.Header.Set("apikey", h.supabaseKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var errBody map[string]any
		json.NewDecoder(resp.Body).Decode(&errBody) //nolint:errcheck
		msg, _ := errBody["message"].(string)
		if msg == "" {
			msg = fmt.Sprintf("status %d", resp.StatusCode)
		}
		return "", fmt.Errorf("%s", msg)
	}

	var user supabaseAuthUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return "", err
	}
	return user.ID, nil
}

func (h *Handler) deleteSupabaseUser(ctx context.Context, uid string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete,
		h.supabaseURL+"/auth/v1/admin/users/"+uid, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+h.supabaseKey)
	req.Header.Set("apikey", h.supabaseKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	resp.Body.Close()
	return nil
}

// ---- Helpers ----

func jsonOK(w http.ResponseWriter, v any, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v) //nolint:errcheck
}

func jsonError(w http.ResponseWriter, msg string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg}) //nolint:errcheck
}
