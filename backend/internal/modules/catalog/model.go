package catalog

import (
	"time"

	"github.com/google/uuid"
)

// Produto

type Produto struct {
	ID               uuid.UUID  `json:"id"`
	EmpresaID        uuid.UUID  `json:"empresa_id"`
	Nome             string     `json:"nome"`
	Descricao        *string    `json:"descricao,omitempty"`
	UrlImagem        *string    `json:"url_imagem,omitempty"`
	ConsumoPorUnidade *float64  `json:"consumo_por_unidade,omitempty"`
	UnidadeConsumo   *string    `json:"unidade_consumo,omitempty"`
	CriadoEm        *time.Time `json:"criado_em,omitempty"`
	AtualizadoEm    *time.Time `json:"atualizado_em,omitempty"`
}

type CreateProdutoRequest struct {
	Nome      string  `json:"nome"`
	Descricao *string `json:"descricao,omitempty"`
	UrlImagem *string `json:"url_imagem,omitempty"`
}

type UpdateProdutoRequest struct {
	Nome             string   `json:"nome"`
	Descricao        *string  `json:"descricao,omitempty"`
	UrlImagem        *string  `json:"url_imagem,omitempty"`
	ConsumoPorUnidade *float64 `json:"consumo_por_unidade,omitempty"`
	UnidadeConsumo   *string  `json:"unidade_consumo,omitempty"`
}

// Modelo

type Modelo struct {
	ID              uuid.UUID  `json:"id"`
	EmpresaID       uuid.UUID  `json:"empresa_id"`
	ProdutoID       uuid.UUID  `json:"produto_id"`
	Nome            string     `json:"nome"`
	UrlImagemFrente *string    `json:"url_imagem_frente,omitempty"`
	UrlImagemVerso  *string    `json:"url_imagem_verso,omitempty"`
	Tipo            *string    `json:"tipo,omitempty"`
	Gola            *string    `json:"gola,omitempty"`
	Mangas          *string    `json:"mangas,omitempty"`
	Barras          *string    `json:"barras,omitempty"`
	Recortes        *string    `json:"recortes,omitempty"`
	Bolsos          *string    `json:"bolsos,omitempty"`
	Acabamento      *string    `json:"acabamento,omitempty"`
	CriadoEm        *time.Time `json:"criado_em,omitempty"`
	AtualizadoEm    *time.Time `json:"atualizado_em,omitempty"`
}

type CreateModeloRequest struct {
	ProdutoID       uuid.UUID `json:"produto_id"`
	Nome            string    `json:"nome"`
	UrlImagemFrente *string   `json:"url_imagem_frente,omitempty"`
	UrlImagemVerso  *string   `json:"url_imagem_verso,omitempty"`
	Tipo            *string   `json:"tipo,omitempty"`
	Gola            *string   `json:"gola,omitempty"`
	Mangas          *string   `json:"mangas,omitempty"`
	Barras          *string   `json:"barras,omitempty"`
	Recortes        *string   `json:"recortes,omitempty"`
	Bolsos          *string   `json:"bolsos,omitempty"`
	Acabamento      *string   `json:"acabamento,omitempty"`
}

type UpdateModeloRequest struct {
	Nome            string  `json:"nome"`
	UrlImagemFrente *string `json:"url_imagem_frente,omitempty"`
	UrlImagemVerso  *string `json:"url_imagem_verso,omitempty"`
	Tipo            *string `json:"tipo,omitempty"`
	Gola            *string `json:"gola,omitempty"`
	Mangas          *string `json:"mangas,omitempty"`
	Barras          *string `json:"barras,omitempty"`
	Recortes        *string `json:"recortes,omitempty"`
	Bolsos          *string `json:"bolsos,omitempty"`
	Acabamento      *string `json:"acabamento,omitempty"`
}

// MateriaPrima

type MateriaPrima struct {
	ID           uuid.UUID  `json:"id"`
	EmpresaID    uuid.UUID  `json:"empresa_id"`
	Nome         string     `json:"nome"`
	Tipo         *string    `json:"tipo,omitempty"`
	Cor          *string    `json:"cor,omitempty"`
	Composicao   *string    `json:"composicao,omitempty"`
	Preco        *string    `json:"preco,omitempty"`
	CriadoEm     *time.Time `json:"criado_em,omitempty"`
	AtualizadoEm *time.Time `json:"atualizado_em,omitempty"`
}

type CreateMateriaPrimaRequest struct {
	Nome       string  `json:"nome"`
	Tipo       *string `json:"tipo,omitempty"`
	Cor        *string `json:"cor,omitempty"`
	Composicao *string `json:"composicao,omitempty"`
	Preco      *string `json:"preco,omitempty"`
}

type UpdateMateriaPrimaRequest struct {
	Nome       string  `json:"nome"`
	Tipo       *string `json:"tipo,omitempty"`
	Cor        *string `json:"cor,omitempty"`
	Composicao *string `json:"composicao,omitempty"`
	Preco      *string `json:"preco,omitempty"`
}
