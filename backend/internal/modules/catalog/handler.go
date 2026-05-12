package catalog

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
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

// ---- Produtos ----

func (h *Handler) ListProdutos(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	list, err := h.svc.ListProdutos(r.Context(), middleware.GetDB(r), empresaID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, list, http.StatusOK)
}

func (h *Handler) GetProduto(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	p, err := h.svc.GetProduto(r.Context(), middleware.GetDB(r), id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusNotFound)
		return
	}
	jsonResponse(w, p, http.StatusOK)
}

func (h *Handler) CreateProduto(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	var req CreateProdutoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	p, err := h.svc.CreateProduto(r.Context(), middleware.GetDB(r), empresaID, req)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, p, http.StatusCreated)
}

func (h *Handler) UpdateProduto(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req UpdateProdutoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	p, err := h.svc.UpdateProduto(r.Context(), middleware.GetDB(r), id, req)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, p, http.StatusOK)
}

func (h *Handler) DeleteProduto(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	if err := h.svc.DeleteProduto(r.Context(), middleware.GetDB(r), id, empresaID); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---- Modelos ----

func (h *Handler) ListModelos(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	produtoID, err := uuid.Parse(chi.URLParam(r, "produtoID"))
	if err != nil {
		jsonError(w, "produto_id inválido", http.StatusBadRequest)
		return
	}
	list, err := h.svc.ListModelos(r.Context(), middleware.GetDB(r), empresaID, produtoID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, list, http.StatusOK)
}

func (h *Handler) GetModelo(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	m, err := h.svc.GetModelo(r.Context(), middleware.GetDB(r), id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusNotFound)
		return
	}
	jsonResponse(w, m, http.StatusOK)
}

func (h *Handler) CreateModelo(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	var req CreateModeloRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	m, err := h.svc.CreateModelo(r.Context(), middleware.GetDB(r), empresaID, req)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, m, http.StatusCreated)
}

func (h *Handler) UpdateModelo(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req UpdateModeloRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	m, err := h.svc.UpdateModelo(r.Context(), middleware.GetDB(r), id, req)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, m, http.StatusOK)
}

func (h *Handler) DeleteModelo(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	if err := h.svc.DeleteModelo(r.Context(), middleware.GetDB(r), id, empresaID); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---- Materias Primas ----

func (h *Handler) ListMateriasPrimas(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	list, err := h.svc.ListMateriasPrimas(r.Context(), middleware.GetDB(r), empresaID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, list, http.StatusOK)
}

func (h *Handler) GetMateriaPrima(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	mp, err := h.svc.GetMateriaPrima(r.Context(), middleware.GetDB(r), id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusNotFound)
		return
	}
	jsonResponse(w, mp, http.StatusOK)
}

func (h *Handler) CreateMateriaPrima(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	var req CreateMateriaPrimaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	mp, err := h.svc.CreateMateriaPrima(r.Context(), middleware.GetDB(r), empresaID, req)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, mp, http.StatusCreated)
}

func (h *Handler) UpdateMateriaPrima(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req UpdateMateriaPrimaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	mp, err := h.svc.UpdateMateriaPrima(r.Context(), middleware.GetDB(r), id, req)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, mp, http.StatusOK)
}

func (h *Handler) DeleteMateriaPrima(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	if err := h.svc.DeleteMateriaPrima(r.Context(), middleware.GetDB(r), id, empresaID); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---- Helpers ----

// ---- Catálogo de Opções (Modelo, Gola, Mangas, Barras, Recortes, Bolsos, Acabamento) ----

var categoriasValidas = map[string]bool{
	"modelo": true, "gola": true, "mangas": true,
	"barras": true, "recortes": true, "bolsos": true, "acabamento": true, "cor": true,
}

type CatalogoOpcao struct {
	ID            string   `json:"id"`
	Categoria     string   `json:"categoria"`
	Nome          string   `json:"nome"`
	Descricao     *string  `json:"descricao,omitempty"`
	CorHex        *string  `json:"cor_hex,omitempty"`
	Ordem         int      `json:"ordem"`
	Ativa         bool     `json:"ativa"`
	CriadoEm      *string  `json:"criado_em,omitempty"`
	Proporcao     *float64 `json:"proporcao,omitempty"`
	TipoProporcao *string  `json:"tipo_proporcao,omitempty"`
}

type CreateOpcaoRequest struct {
	Categoria     string   `json:"categoria"`
	Nome          string   `json:"nome"`
	Descricao     *string  `json:"descricao,omitempty"`
	CorHex        *string  `json:"cor_hex,omitempty"`
	Ordem         int      `json:"ordem"`
	Proporcao     *float64 `json:"proporcao,omitempty"`
	TipoProporcao *string  `json:"tipo_proporcao,omitempty"`
}

type UpdateOpcaoRequest struct {
	Nome          string   `json:"nome"`
	Descricao     *string  `json:"descricao,omitempty"`
	CorHex        *string  `json:"cor_hex,omitempty"`
	Ordem         int      `json:"ordem"`
	Proporcao     *float64 `json:"proporcao,omitempty"`
	TipoProporcao *string  `json:"tipo_proporcao,omitempty"`
}

func (h *Handler) ListOpcoes(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	categoria := r.URL.Query().Get("categoria")
	if !categoriasValidas[categoria] {
		jsonError(w, "categoria inválida", http.StatusBadRequest)
		return
	}
	qtx := middleware.GetDB(r)
	rows, err := qtx.QueryContext(r.Context(), `
		SELECT id, categoria, nome, descricao, cor_hex, ordem, ativa, criado_em, proporcao, tipo_proporcao
		FROM catalogo_opcoes
		WHERE empresa_id = $1 AND categoria = $2 AND deletado_em IS NULL
		ORDER BY ordem, nome
	`, empresaID, categoria)
	if err != nil {
		jsonError(w, "erro ao listar opções", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	result := make([]CatalogoOpcao, 0)
	for rows.Next() {
		var o CatalogoOpcao
		var desc, corHex, tipoProp sql.NullString
		var criadoEm sql.NullTime
		var proporcao sql.NullFloat64
		if err := rows.Scan(&o.ID, &o.Categoria, &o.Nome, &desc, &corHex, &o.Ordem, &o.Ativa, &criadoEm, &proporcao, &tipoProp); err != nil {
			continue
		}
		if desc.Valid {
			o.Descricao = &desc.String
		}
		if corHex.Valid {
			o.CorHex = &corHex.String
		}
		if criadoEm.Valid {
			t := criadoEm.Time.Format(time.RFC3339)
			o.CriadoEm = &t
		}
		if proporcao.Valid {
			o.Proporcao = &proporcao.Float64
		}
		if tipoProp.Valid {
			o.TipoProporcao = &tipoProp.String
		}
		result = append(result, o)
	}
	jsonResponse(w, result, http.StatusOK)
}

func (h *Handler) CreateOpcao(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	var req CreateOpcaoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	req.Nome = strings.TrimSpace(req.Nome)
	if req.Nome == "" {
		jsonError(w, "nome é obrigatório", http.StatusBadRequest)
		return
	}
	if !categoriasValidas[req.Categoria] {
		jsonError(w, "categoria inválida", http.StatusBadRequest)
		return
	}
	qtx := middleware.GetDB(r)
	id := uuid.New()
	var desc, corHex, tipoProp sql.NullString
	var proporcao sql.NullFloat64
	if req.Descricao != nil {
		desc = sql.NullString{String: *req.Descricao, Valid: true}
	}
	if req.CorHex != nil && *req.CorHex != "" {
		corHex = sql.NullString{String: *req.CorHex, Valid: true}
	}
	if req.Proporcao != nil {
		proporcao = sql.NullFloat64{Float64: *req.Proporcao, Valid: true}
	}
	if req.TipoProporcao != nil && *req.TipoProporcao != "" {
		tipoProp = sql.NullString{String: *req.TipoProporcao, Valid: true}
	}
	_, err := qtx.ExecContext(r.Context(), `
		INSERT INTO catalogo_opcoes (id, empresa_id, categoria, nome, descricao, cor_hex, ordem, proporcao, tipo_proporcao)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, id, empresaID, req.Categoria, req.Nome, desc, corHex, req.Ordem, proporcao, tipoProp)
	if err != nil {
		jsonError(w, "erro ao criar opção", http.StatusInternalServerError)
		return
	}
	o := CatalogoOpcao{
		ID: id.String(), Categoria: req.Categoria, Nome: req.Nome,
		Descricao: req.Descricao, CorHex: req.CorHex, Ordem: req.Ordem, Ativa: true,
		Proporcao: req.Proporcao, TipoProporcao: req.TipoProporcao,
	}
	jsonResponse(w, o, http.StatusCreated)
}

func (h *Handler) UpdateOpcao(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req UpdateOpcaoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	req.Nome = strings.TrimSpace(req.Nome)
	if req.Nome == "" {
		jsonError(w, "nome é obrigatório", http.StatusBadRequest)
		return
	}
	var desc, corHex, tipoProp sql.NullString
	var proporcao sql.NullFloat64
	if req.Descricao != nil {
		desc = sql.NullString{String: *req.Descricao, Valid: true}
	}
	if req.CorHex != nil && *req.CorHex != "" {
		corHex = sql.NullString{String: *req.CorHex, Valid: true}
	}
	if req.Proporcao != nil {
		proporcao = sql.NullFloat64{Float64: *req.Proporcao, Valid: true}
	}
	if req.TipoProporcao != nil && *req.TipoProporcao != "" {
		tipoProp = sql.NullString{String: *req.TipoProporcao, Valid: true}
	}
	qtx := middleware.GetDB(r)
	var o CatalogoOpcao
	var descOut, corHexOut, tipoPropOut sql.NullString
	var propOut sql.NullFloat64
	err = qtx.QueryRowContext(r.Context(), `
		UPDATE catalogo_opcoes
		SET nome = $2, descricao = $3, cor_hex = $4, ordem = $5, proporcao = $6, tipo_proporcao = $7
		WHERE id = $1 AND deletado_em IS NULL
		RETURNING id, categoria, nome, descricao, cor_hex, ordem, ativa, proporcao, tipo_proporcao
	`, id, req.Nome, desc, corHex, req.Ordem, proporcao, tipoProp).Scan(
		&o.ID, &o.Categoria, &o.Nome, &descOut, &corHexOut, &o.Ordem, &o.Ativa, &propOut, &tipoPropOut,
	)
	if err != nil {
		jsonError(w, "opção não encontrada", http.StatusNotFound)
		return
	}
	if descOut.Valid {
		o.Descricao = &descOut.String
	}
	if corHexOut.Valid {
		o.CorHex = &corHexOut.String
	}
	if propOut.Valid {
		o.Proporcao = &propOut.Float64
	}
	if tipoPropOut.Valid {
		o.TipoProporcao = &tipoPropOut.String
	}
	jsonResponse(w, o, http.StatusOK)
}

func (h *Handler) DeleteOpcao(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	qtx := middleware.GetDB(r)
	if _, err := qtx.ExecContext(r.Context(), `
		UPDATE catalogo_opcoes SET deletado_em = NOW() WHERE id = $1 AND deletado_em IS NULL
	`, id); err != nil {
		jsonError(w, "erro ao remover opção", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---- Tamanhos ----

type Tamanho struct {
	ID    string `json:"id"`
	Grupo string `json:"grupo"`
	Nome  string `json:"nome"`
	Ordem int    `json:"ordem"`
	Ativo bool   `json:"ativo"`
}

type CreateTamanhoRequest struct {
	Grupo string `json:"grupo"`
	Nome  string `json:"nome"`
	Ordem int    `json:"ordem"`
}

func (h *Handler) ListTamanhos(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	grupo := r.URL.Query().Get("grupo")
	qtx := middleware.GetDB(r)
	var rows *sql.Rows
	var err error
	if grupo != "" {
		rows, err = qtx.QueryContext(r.Context(), `
			SELECT id, grupo, nome, ordem, ativo FROM catalogo_tamanhos
			WHERE empresa_id = $1 AND grupo = $2 AND deletado_em IS NULL
			ORDER BY ordem, nome
		`, empresaID, grupo)
	} else {
		rows, err = qtx.QueryContext(r.Context(), `
			SELECT id, grupo, nome, ordem, ativo FROM catalogo_tamanhos
			WHERE empresa_id = $1 AND deletado_em IS NULL
			ORDER BY grupo, ordem, nome
		`, empresaID)
	}
	if err != nil {
		jsonError(w, "erro ao listar tamanhos", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	result := make([]Tamanho, 0)
	for rows.Next() {
		var t Tamanho
		if err := rows.Scan(&t.ID, &t.Grupo, &t.Nome, &t.Ordem, &t.Ativo); err != nil {
			continue
		}
		result = append(result, t)
	}
	jsonResponse(w, result, http.StatusOK)
}

func (h *Handler) CreateTamanho(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	var req CreateTamanhoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	req.Grupo = strings.TrimSpace(req.Grupo)
	req.Nome = strings.TrimSpace(req.Nome)
	if req.Nome == "" || req.Grupo == "" {
		jsonError(w, "grupo e nome são obrigatórios", http.StatusBadRequest)
		return
	}
	id := uuid.New()
	if _, err := middleware.GetDB(r).ExecContext(r.Context(), `
		INSERT INTO catalogo_tamanhos (id, empresa_id, grupo, nome, ordem)
		VALUES ($1, $2, $3, $4, $5)
	`, id, empresaID, req.Grupo, req.Nome, req.Ordem); err != nil {
		jsonError(w, "erro ao criar tamanho", http.StatusInternalServerError)
		return
	}
	jsonResponse(w, Tamanho{ID: id.String(), Grupo: req.Grupo, Nome: req.Nome, Ordem: req.Ordem, Ativo: true}, http.StatusCreated)
}

func (h *Handler) UpdateTamanho(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req CreateTamanhoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	req.Grupo = strings.TrimSpace(req.Grupo)
	req.Nome = strings.TrimSpace(req.Nome)
	if req.Nome == "" || req.Grupo == "" {
		jsonError(w, "grupo e nome são obrigatórios", http.StatusBadRequest)
		return
	}
	var t Tamanho
	err = middleware.GetDB(r).QueryRowContext(r.Context(), `
		UPDATE catalogo_tamanhos SET grupo = $2, nome = $3, ordem = $4
		WHERE id = $1 AND deletado_em IS NULL
		RETURNING id, grupo, nome, ordem, ativo
	`, id, req.Grupo, req.Nome, req.Ordem).Scan(&t.ID, &t.Grupo, &t.Nome, &t.Ordem, &t.Ativo)
	if err != nil {
		jsonError(w, "tamanho não encontrado", http.StatusNotFound)
		return
	}
	jsonResponse(w, t, http.StatusOK)
}

func (h *Handler) DeleteTamanho(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	if _, err := middleware.GetDB(r).ExecContext(r.Context(), `
		UPDATE catalogo_tamanhos SET deletado_em = NOW() WHERE id = $1 AND deletado_em IS NULL
	`, id); err != nil {
		jsonError(w, "erro ao remover tamanho", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---- Fornecedores ----

type Fornecedor struct {
	ID       string  `json:"id"`
	Nome     string  `json:"nome"`
	Contato  *string `json:"contato,omitempty"`
	Telefone *string `json:"telefone,omitempty"`
	Email    *string `json:"email,omitempty"`
	Ativo    bool    `json:"ativo"`
}

type CreateFornecedorRequest struct {
	Nome     string  `json:"nome"`
	Contato  *string `json:"contato,omitempty"`
	Telefone *string `json:"telefone,omitempty"`
	Email    *string `json:"email,omitempty"`
}

func (h *Handler) ListFornecedores(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	rows, err := middleware.GetDB(r).QueryContext(r.Context(), `
		SELECT id, nome, contato, telefone, email, ativo FROM fornecedores
		WHERE empresa_id = $1 AND deletado_em IS NULL
		ORDER BY nome
	`, empresaID)
	if err != nil {
		jsonError(w, "erro ao listar fornecedores", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	result := make([]Fornecedor, 0)
	for rows.Next() {
		var f Fornecedor
		var contato, telefone, email sql.NullString
		if err := rows.Scan(&f.ID, &f.Nome, &contato, &telefone, &email, &f.Ativo); err != nil {
			continue
		}
		if contato.Valid {
			f.Contato = &contato.String
		}
		if telefone.Valid {
			f.Telefone = &telefone.String
		}
		if email.Valid {
			f.Email = &email.String
		}
		result = append(result, f)
	}
	jsonResponse(w, result, http.StatusOK)
}

func (h *Handler) CreateFornecedor(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	var req CreateFornecedorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	req.Nome = strings.TrimSpace(req.Nome)
	if req.Nome == "" {
		jsonError(w, "nome é obrigatório", http.StatusBadRequest)
		return
	}
	id := uuid.New()
	contato := sql.NullString{String: strNilVal(req.Contato), Valid: req.Contato != nil && *req.Contato != ""}
	telefone := sql.NullString{String: strNilVal(req.Telefone), Valid: req.Telefone != nil && *req.Telefone != ""}
	email := sql.NullString{String: strNilVal(req.Email), Valid: req.Email != nil && *req.Email != ""}
	if _, err := middleware.GetDB(r).ExecContext(r.Context(), `
		INSERT INTO fornecedores (id, empresa_id, nome, contato, telefone, email)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, id, empresaID, req.Nome, contato, telefone, email); err != nil {
		jsonError(w, "erro ao criar fornecedor", http.StatusInternalServerError)
		return
	}
	jsonResponse(w, Fornecedor{ID: id.String(), Nome: req.Nome, Contato: req.Contato, Telefone: req.Telefone, Email: req.Email, Ativo: true}, http.StatusCreated)
}

func (h *Handler) UpdateFornecedor(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req CreateFornecedorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	req.Nome = strings.TrimSpace(req.Nome)
	if req.Nome == "" {
		jsonError(w, "nome é obrigatório", http.StatusBadRequest)
		return
	}
	contato := sql.NullString{String: strNilVal(req.Contato), Valid: req.Contato != nil && *req.Contato != ""}
	telefone := sql.NullString{String: strNilVal(req.Telefone), Valid: req.Telefone != nil && *req.Telefone != ""}
	email := sql.NullString{String: strNilVal(req.Email), Valid: req.Email != nil && *req.Email != ""}
	var f Fornecedor
	var contatoOut, telefoneOut, emailOut sql.NullString
	err = middleware.GetDB(r).QueryRowContext(r.Context(), `
		UPDATE fornecedores SET nome = $2, contato = $3, telefone = $4, email = $5
		WHERE id = $1 AND deletado_em IS NULL
		RETURNING id, nome, contato, telefone, email, ativo
	`, id, req.Nome, contato, telefone, email).Scan(&f.ID, &f.Nome, &contatoOut, &telefoneOut, &emailOut, &f.Ativo)
	if err != nil {
		jsonError(w, "fornecedor não encontrado", http.StatusNotFound)
		return
	}
	if contatoOut.Valid {
		f.Contato = &contatoOut.String
	}
	if telefoneOut.Valid {
		f.Telefone = &telefoneOut.String
	}
	if emailOut.Valid {
		f.Email = &emailOut.String
	}
	jsonResponse(w, f, http.StatusOK)
}

func (h *Handler) DeleteFornecedor(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	if _, err := middleware.GetDB(r).ExecContext(r.Context(), `
		UPDATE fornecedores SET deletado_em = NOW() WHERE id = $1 AND deletado_em IS NULL
	`, id); err != nil {
		jsonError(w, "erro ao remover fornecedor", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func strNilVal(s *string) string {
	if s == nil {
		return ""
	}
	return *s
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
