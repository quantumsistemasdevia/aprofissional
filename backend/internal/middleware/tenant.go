package middleware

import (
	"context"
	"database/sql"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
)

func TenantMiddleware(pool *pgxpool.Pool) func(http.Handler) http.Handler {
	sqlDB := stdlib.OpenDBFromPool(pool)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			empresaID := GetEmpresaID(r)
			if empresaID == "" {
				http.Error(w, `{"error":"empresa not found"}`, http.StatusForbidden)
				return
			}

			tx, err := sqlDB.BeginTx(r.Context(), nil)
			if err != nil {
				http.Error(w, `{"error":"database error"}`, http.StatusInternalServerError)
				return
			}
			defer tx.Rollback() //nolint:errcheck

			if _, err = tx.ExecContext(r.Context(),
				"SELECT set_config('app.current_empresa_id', $1, true)", empresaID); err != nil {
				log.Printf("[TENANT] erro ao definir empresa_id=%s: %v", empresaID, err)
				http.Error(w, `{"error":"tenant setup error"}`, http.StatusInternalServerError)
				return
			}

			// Injetar a transação (já com SET LOCAL) — garante que RLS se aplica às queries do handler
			ctx := context.WithValue(r.Context(), keyDB, tx)
			rw := &responseWriter{ResponseWriter: w}
			next.ServeHTTP(rw, r.WithContext(ctx))

			if rw.status < 400 {
				if err := tx.Commit(); err != nil {
					log.Printf("[TENANT] erro ao commitar transação: %v", err)
				}
			}
		})
	}
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if rw.status == 0 {
		rw.status = http.StatusOK
	}
	return rw.ResponseWriter.Write(b)
}

// GetDB retorna a transação com tenant configurado (SET LOCAL aplicado).
// Handlers devem usar esta função para obter o DBTX para passar às queries SQLC.
func GetDB(r *http.Request) *sql.Tx {
	v, _ := r.Context().Value(keyDB).(*sql.Tx)
	return v
}

// GetConn mantido por compatibilidade — retorna nil (use GetDB em vez disso).
func GetConn(r *http.Request) *pgxpool.Conn {
	return nil
}
