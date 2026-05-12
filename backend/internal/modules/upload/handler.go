package upload

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

var allowedExts = map[string]bool{
	".png":  true,
	".jpg":  true,
	".jpeg": true,
	".svg":  true,
}

const maxSize = 10 << 20 // 10 MB

func ArteHandler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(maxSize); err != nil {
		jsonError(w, "arquivo muito grande (máximo 10 MB)", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("arquivo")
	if err != nil {
		jsonError(w, "campo 'arquivo' não encontrado no formulário", http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExts[ext] {
		jsonError(w, "tipo não permitido — use PNG, JPG ou SVG", http.StatusBadRequest)
		return
	}

	if err := os.MkdirAll("uploads/artes", 0755); err != nil {
		jsonError(w, "erro interno ao criar diretório", http.StatusInternalServerError)
		return
	}

	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	dst, err := os.Create(filepath.Join("uploads/artes", filename))
	if err != nil {
		jsonError(w, "erro interno ao salvar arquivo", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		jsonError(w, "erro interno ao gravar arquivo", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"url": fmt.Sprintf("/api/uploads/artes/%s", filename)}) //nolint:errcheck
}

func jsonError(w http.ResponseWriter, msg string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg}) //nolint:errcheck
}
