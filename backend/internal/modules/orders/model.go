package orders

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Pedido struct {
	ID              uuid.UUID  `json:"id"`
	EmpresaID       uuid.UUID  `json:"empresa_id"`
	Numero          int32      `json:"numero"`
	ClienteID       *uuid.UUID `json:"cliente_id,omitempty"`
	VendedorID      *uuid.UUID `json:"vendedor_id,omitempty"`
	CriadoPor       *uuid.UUID `json:"criado_por,omitempty"`
	Status          *string    `json:"status,omitempty"`
	Observacoes     *string    `json:"observacoes,omitempty"`
	Total           *string    `json:"total,omitempty"`
	FormaPagamento  *string    `json:"forma_pagamento,omitempty"`
	PrevisaoEntrega *time.Time `json:"previsao_entrega,omitempty"`
	DataEntrega     *time.Time `json:"data_entrega,omitempty"`
	CriadoEm        *time.Time `json:"criado_em,omitempty"`
	AtualizadoEm    *time.Time `json:"atualizado_em,omitempty"`
}

type CreatePedidoRequest struct {
	ClienteID       *uuid.UUID `json:"cliente_id,omitempty"`
	VendedorID      *uuid.UUID `json:"vendedor_id,omitempty"`
	Status          *string    `json:"status,omitempty"`
	Observacoes     *string    `json:"observacoes,omitempty"`
	FormaPagamento  *string    `json:"forma_pagamento,omitempty"`
	PrevisaoEntrega *time.Time `json:"previsao_entrega,omitempty"`
}

type UpdatePedidoStatusRequest struct {
	Status string `json:"status"`
}

type UpdatePedidoRequest struct {
	ClienteID       *uuid.UUID `json:"cliente_id,omitempty"`
	VendedorID      *uuid.UUID `json:"vendedor_id,omitempty"`
	Observacoes     *string    `json:"observacoes,omitempty"`
	FormaPagamento  *string    `json:"forma_pagamento,omitempty"`
	PrevisaoEntrega *time.Time `json:"previsao_entrega,omitempty"`
}

type ItemPedido struct {
	ID                   uuid.UUID       `json:"id"`
	EmpresaID            uuid.UUID       `json:"empresa_id"`
	PedidoID             uuid.UUID       `json:"pedido_id"`
	ProdutoID            uuid.UUID       `json:"produto_id"`
	ModeloID             *uuid.UUID      `json:"modelo_id,omitempty"`
	MateriaPrimaID       *uuid.UUID      `json:"materia_prima_id,omitempty"`
	FornecedorID         *uuid.UUID      `json:"fornecedor_id,omitempty"`
	Cor                  *string         `json:"cor,omitempty"`
	TamanhosQuantidades  json.RawMessage `json:"tamanhos_quantidades,omitempty"`
	Quantidade           *int32          `json:"quantidade,omitempty"`
	PrecoUnitario        *string         `json:"preco_unitario,omitempty"`
	TipoDesconto         *string         `json:"tipo_desconto,omitempty"`
	Desconto             *string         `json:"desconto,omitempty"`
	Total                *string         `json:"total,omitempty"`
	EspecificacoesModelo json.RawMessage `json:"especificacoes_modelo,omitempty"`
	PreviewFrenteURL     *string         `json:"preview_frente_url,omitempty"`
	PreviewVersoURL      *string         `json:"preview_verso_url,omitempty"`
	ConsumoPorUnidade    *float64        `json:"consumo_por_unidade,omitempty"`
	UnidadeConsumo       *string         `json:"unidade_consumo,omitempty"`
	ProdutoPronto        *bool           `json:"produto_pronto,omitempty"`
	CriadoEm             *time.Time      `json:"criado_em,omitempty"`
	AtualizadoEm         *time.Time      `json:"atualizado_em,omitempty"`
}

type CreateItemPedidoRequest struct {
	ProdutoID            uuid.UUID       `json:"produto_id"`
	ModeloID             *uuid.UUID      `json:"modelo_id,omitempty"`
	MateriaPrimaID       *uuid.UUID      `json:"materia_prima_id,omitempty"`
	FornecedorID         *uuid.UUID      `json:"fornecedor_id,omitempty"`
	Cor                  *string         `json:"cor,omitempty"`
	TamanhosQuantidades  json.RawMessage `json:"tamanhos_quantidades,omitempty"`
	Quantidade           int             `json:"quantidade"`
	PrecoUnitario        float64         `json:"preco_unitario"`
	TipoDesconto         *string         `json:"tipo_desconto,omitempty"`
	Desconto             float64         `json:"desconto"`
	EspecificacoesModelo json.RawMessage `json:"especificacoes_modelo,omitempty"`
	PreviewFrenteURL     *string         `json:"preview_frente_url,omitempty"`
	PreviewVersoURL      *string         `json:"preview_verso_url,omitempty"`
	ProdutoPronto        *bool           `json:"produto_pronto,omitempty"`
}

type UpdateItemPedidoRequest struct {
	ProdutoID            uuid.UUID       `json:"produto_id"`
	ModeloID             *uuid.UUID      `json:"modelo_id,omitempty"`
	MateriaPrimaID       *uuid.UUID      `json:"materia_prima_id,omitempty"`
	FornecedorID         *uuid.UUID      `json:"fornecedor_id,omitempty"`
	Cor                  *string         `json:"cor,omitempty"`
	TamanhosQuantidades  json.RawMessage `json:"tamanhos_quantidades,omitempty"`
	Quantidade           int             `json:"quantidade"`
	PrecoUnitario        float64         `json:"preco_unitario"`
	TipoDesconto         *string         `json:"tipo_desconto,omitempty"`
	Desconto             float64         `json:"desconto"`
	EspecificacoesModelo json.RawMessage `json:"especificacoes_modelo,omitempty"`
	PreviewFrenteURL     *string         `json:"preview_frente_url,omitempty"`
	PreviewVersoURL      *string         `json:"preview_verso_url,omitempty"`
	ProdutoPronto        *bool           `json:"produto_pronto,omitempty"`
}

type ComponenteCompra struct {
	Nome       string  `json:"nome"`
	Cor        string  `json:"cor,omitempty"`
	Quantidade float64 `json:"quantidade"`
}

type CompraMateriaisItem struct {
	ItemID              string           `json:"item_id"`
	NumeroPedido        int32            `json:"numero_pedido"`
	ClienteNome         *string          `json:"cliente_nome,omitempty"`
	FornecedorID        *string          `json:"fornecedor_id,omitempty"`
	FornecedorNome      *string          `json:"fornecedor_nome,omitempty"`
	FornecedorTelefone  *string          `json:"fornecedor_telefone,omitempty"`
	MateriaPrimaNome    *string          `json:"materia_prima_nome,omitempty"`
	Cor                 *string          `json:"cor,omitempty"`
	Quantidade          int32            `json:"quantidade"`
	ConsumoPorUnidade   *float64         `json:"consumo_por_unidade,omitempty"`
	ConsumoTotal        *float64         `json:"consumo_total,omitempty"`
	UnidadeConsumo      *string          `json:"unidade_consumo,omitempty"`
	StatusCompra        string           `json:"status_compra"`
	Data                *time.Time       `json:"data,omitempty"`
	Componentes         []ComponenteCompra `json:"componentes,omitempty"`
}

type RelatorioCompraRequest struct {
	ItemIDs []string `json:"item_ids"`
}

type AlterarStatusCompraRequest struct {
	ItemIDs []string `json:"item_ids"`
	Status  string   `json:"status"`
}

type VersaoItemPedido struct {
	ID           uuid.UUID       `json:"id"`
	ItemPedidoID uuid.UUID       `json:"item_pedido_id"`
	NumeroVersao int32           `json:"numero_versao"`
	Snapshot     json.RawMessage `json:"snapshot"`
	AlteradoPor  *uuid.UUID      `json:"alterado_por,omitempty"`
	CriadoEm     *time.Time      `json:"criado_em,omitempty"`
}
