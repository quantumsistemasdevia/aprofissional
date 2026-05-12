package middleware

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// AuthOnlyMiddleware valida o JWT (EC ou HMAC, igual ao AuthMiddleware) mas
// não exige o claim app_metadata.empresa_id. Usado em rotas pré-seleção de empresa.
func AuthOnlyMiddleware(jwtSecret string, supabaseURL string) func(http.Handler) http.Handler {
	var ecKey *ecdsa.PublicKey
	if supabaseURL != "" {
		key, err := fetchECPublicKey(supabaseURL)
		if err != nil {
			log.Printf("[AUTH_ONLY] aviso: não foi possível carregar chave JWKS: %v", err)
		} else {
			ecKey = key
			log.Println("[AUTH_ONLY] chave EC P-256 carregada do Supabase JWKS")
		}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
				switch t.Method.(type) {
				case *jwt.SigningMethodECDSA:
					if ecKey == nil {
						return nil, fmt.Errorf("chave EC não disponível")
					}
					return ecKey, nil
				case *jwt.SigningMethodHMAC:
					return []byte(jwtSecret), nil
				default:
					return nil, fmt.Errorf("algoritmo inesperado: %v", t.Header["alg"])
				}
			})

			if err != nil || !token.Valid {
				log.Printf("[AUTH_ONLY] token inválido: %v", err)
				http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(*Claims)
			if !ok || claims.Sub == "" {
				http.Error(w, `{"error":"invalid claims"}`, http.StatusUnauthorized)
				return
			}

			ctx := r.Context()
			ctx = context.WithValue(ctx, keyUserID, claims.Sub)
			ctx = context.WithValue(ctx, keyUserEmail, claims.Email)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
