package auth

import (
	"encoding/json"
	"net/http"

	"github.com/heliobarreira/aprofissional/internal/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
)

type empresaResponse struct {
	ID   string  `json:"id"`
	Nome string  `json:"nome"`
	Slug string  `json:"slug"`
	CNPJ *string `json:"cnpj"`
}

// MinhasEmpresas retorna todas as empresas às quais o usuário autenticado pertence,
// buscando pelo e-mail do JWT sem precisar de empresa_id selecionada.
func MinhasEmpresas(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := middleware.GetUserEmail(r)
		if email == "" {
			http.Error(w, `{"error":"email not found in token"}`, http.StatusUnauthorized)
			return
		}

		rows, err := pool.Query(r.Context(), `
			SELECT e.id, e.nome, e.slug, e.cnpj
			FROM empresas e
			JOIN usuarios u ON u.empresa_id = e.id
			WHERE u.email = $1
			  AND u.deletado_em IS NULL
			  AND e.deletado_em IS NULL
			ORDER BY e.nome
		`, email)
		if err != nil {
			http.Error(w, `{"error":"database error"}`, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		empresas := []empresaResponse{}
		for rows.Next() {
			var e empresaResponse
			if err := rows.Scan(&e.ID, &e.Nome, &e.Slug, &e.CNPJ); err != nil {
				http.Error(w, `{"error":"scan error"}`, http.StatusInternalServerError)
				return
			}
			empresas = append(empresas, e)
		}

		if err := rows.Err(); err != nil {
			http.Error(w, `{"error":"rows error"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"empresas": empresas})
	}
}
