package middleware

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	keyUserID    contextKey = "user_id"
	keyUserEmail contextKey = "user_email"
	keyEmpresaID contextKey = "empresa_id"
	keyDB        contextKey = "db"
)

type AppMetadata struct {
	EmpresaID string `json:"empresa_id"`
	Perfil    string `json:"perfil"`
}

type Claims struct {
	Sub         string      `json:"sub"`
	Email       string      `json:"email"`
	AppMetadata AppMetadata `json:"app_metadata"`
	jwt.RegisteredClaims
}

type jwk struct {
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
}

type jwks struct {
	Keys []jwk `json:"keys"`
}

func fetchECPublicKey(supabaseURL string) (*ecdsa.PublicKey, error) {
	url := strings.TrimRight(supabaseURL, "/") + "/auth/v1/.well-known/jwks.json"
	resp, err := http.Get(url) //nolint:noctx
	if err != nil {
		return nil, fmt.Errorf("buscar jwks: %w", err)
	}
	defer resp.Body.Close()

	var ks jwks
	if err := json.NewDecoder(resp.Body).Decode(&ks); err != nil {
		return nil, fmt.Errorf("decodificar jwks: %w", err)
	}
	for _, k := range ks.Keys {
		if k.Kty == "EC" && k.Crv == "P-256" {
			xb, err := base64.RawURLEncoding.DecodeString(k.X)
			if err != nil {
				return nil, err
			}
			yb, err := base64.RawURLEncoding.DecodeString(k.Y)
			if err != nil {
				return nil, err
			}
			return &ecdsa.PublicKey{
				Curve: elliptic.P256(),
				X:     new(big.Int).SetBytes(xb),
				Y:     new(big.Int).SetBytes(yb),
			}, nil
		}
	}
	return nil, fmt.Errorf("nenhuma chave EC P-256 encontrada no JWKS")
}

func AuthMiddleware(jwtSecret string, supabaseURL string) func(http.Handler) http.Handler {
	var ecKey *ecdsa.PublicKey
	if supabaseURL != "" {
		key, err := fetchECPublicKey(supabaseURL)
		if err != nil {
			log.Printf("[AUTH] aviso: não foi possível carregar chave JWKS: %v", err)
		} else {
			ecKey = key
			log.Println("[AUTH] chave EC P-256 carregada do Supabase JWKS")
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
			token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
				switch token.Method.(type) {
				case *jwt.SigningMethodECDSA:
					if ecKey == nil {
						return nil, fmt.Errorf("chave EC não disponível")
					}
					return ecKey, nil
				case *jwt.SigningMethodHMAC:
					return []byte(jwtSecret), nil
				default:
					return nil, fmt.Errorf("algoritmo inesperado: %v", token.Header["alg"])
				}
			})

			if err != nil || !token.Valid {
				log.Printf("[AUTH] token inválido: %v", err)
				http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(*Claims)
			if !ok || claims.AppMetadata.EmpresaID == "" {
				log.Printf("[AUTH] claims inválidas: ok=%v empresa_id=%q", ok, claims.AppMetadata.EmpresaID)
				http.Error(w, `{"error":"invalid claims"}`, http.StatusUnauthorized)
				return
			}

			ctx := r.Context()
			ctx = context.WithValue(ctx, keyUserID, claims.Sub)
			ctx = context.WithValue(ctx, keyUserEmail, claims.Email)
			ctx = context.WithValue(ctx, keyEmpresaID, claims.AppMetadata.EmpresaID)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserID(r *http.Request) string {
	v, _ := r.Context().Value(keyUserID).(string)
	return v
}

func GetUserEmail(r *http.Request) string {
	v, _ := r.Context().Value(keyUserEmail).(string)
	return v
}

func GetEmpresaID(r *http.Request) string {
	v, _ := r.Context().Value(keyEmpresaID).(string)
	return v
}
