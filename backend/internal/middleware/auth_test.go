package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/heliobarreira/aprofissional/internal/middleware"
)

const testSecret = "test-secret-32-characters-minimum!!"

func makeToken(empresaID, userID string) string {
	claims := jwt.MapClaims{
		"sub":        userID,
		"email":      "test@example.com",
		"empresa_id": empresaID,
		"exp":        time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString([]byte(testSecret))
	return signed
}

func TestAuthMiddleware_Valid(t *testing.T) {
	mw := middleware.AuthMiddleware(testSecret)

	var gotEmpresaID, gotUserID string
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotEmpresaID = middleware.GetEmpresaID(r)
		gotUserID = middleware.GetUserID(r)
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+makeToken("empresa-123", "user-456"))
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if gotEmpresaID != "empresa-123" {
		t.Errorf("expected empresa_id=empresa-123, got %s", gotEmpresaID)
	}
	if gotUserID != "user-456" {
		t.Errorf("expected user_id=user-456, got %s", gotUserID)
	}
}

func TestAuthMiddleware_MissingHeader(t *testing.T) {
	mw := middleware.AuthMiddleware(testSecret)
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	mw := middleware.AuthMiddleware(testSecret)
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer token-invalido")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
