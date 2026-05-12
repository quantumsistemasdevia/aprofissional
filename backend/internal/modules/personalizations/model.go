package personalizations

import (
	"encoding/json"

	"github.com/google/uuid"
)

type Personalizacao struct {
	ID            uuid.UUID       `json:"id"`
	EmpresaID     uuid.UUID       `json:"empresa_id"`
	ItemPedidoID  uuid.UUID       `json:"item_pedido_id"`
	Tipo          *string         `json:"tipo,omitempty"`
	Cores         json.RawMessage `json:"cores,omitempty"`
	TipoConteudo  *string         `json:"tipo_conteudo,omitempty"`
	UrlImagem     *string         `json:"url_imagem,omitempty"`
	TextoConteudo *string         `json:"texto_conteudo,omitempty"`
	TextoFonte    *string         `json:"texto_fonte,omitempty"`
	Lado          *string         `json:"lado,omitempty"`
	Localizacao   *string         `json:"localizacao,omitempty"`
	CanvasX       *float64        `json:"canvas_x,omitempty"`
	CanvasY       *float64        `json:"canvas_y,omitempty"`
	CanvasEscala  *float64        `json:"canvas_escala,omitempty"`
	CanvasRotacao *float64        `json:"canvas_rotacao,omitempty"`
	CanvasLargura *int32          `json:"canvas_largura,omitempty"`
	CanvasAltura  *int32          `json:"canvas_altura,omitempty"`
	Observacao    *string         `json:"observacao,omitempty"`
}

type CreatePersonalizacaoRequest struct {
	ItemPedidoID  uuid.UUID       `json:"item_pedido_id"`
	Tipo          *string         `json:"tipo,omitempty"`
	Cores         json.RawMessage `json:"cores,omitempty"`
	TipoConteudo  *string         `json:"tipo_conteudo,omitempty"`
	UrlImagem     *string         `json:"url_imagem,omitempty"`
	TextoConteudo *string         `json:"texto_conteudo,omitempty"`
	TextoFonte    *string         `json:"texto_fonte,omitempty"`
	Lado          *string         `json:"lado,omitempty"`
	Localizacao   *string         `json:"localizacao,omitempty"`
	CanvasX       *float64        `json:"canvas_x,omitempty"`
	CanvasY       *float64        `json:"canvas_y,omitempty"`
	CanvasEscala  *float64        `json:"canvas_escala,omitempty"`
	CanvasRotacao *float64        `json:"canvas_rotacao,omitempty"`
	CanvasLargura *int32          `json:"canvas_largura,omitempty"`
	CanvasAltura  *int32          `json:"canvas_altura,omitempty"`
	Observacao    *string         `json:"observacao,omitempty"`
}

type UpdatePersonalizacaoRequest struct {
	Tipo          *string         `json:"tipo,omitempty"`
	Cores         json.RawMessage `json:"cores,omitempty"`
	TipoConteudo  *string         `json:"tipo_conteudo,omitempty"`
	UrlImagem     *string         `json:"url_imagem,omitempty"`
	TextoConteudo *string         `json:"texto_conteudo,omitempty"`
	TextoFonte    *string         `json:"texto_fonte,omitempty"`
	Lado          *string         `json:"lado,omitempty"`
	Localizacao   *string         `json:"localizacao,omitempty"`
	CanvasX       *float64        `json:"canvas_x,omitempty"`
	CanvasY       *float64        `json:"canvas_y,omitempty"`
	CanvasEscala  *float64        `json:"canvas_escala,omitempty"`
	CanvasRotacao *float64        `json:"canvas_rotacao,omitempty"`
	CanvasLargura *int32          `json:"canvas_largura,omitempty"`
	CanvasAltura  *int32          `json:"canvas_altura,omitempty"`
	Observacao    *string         `json:"observacao,omitempty"`
}
