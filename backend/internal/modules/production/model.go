package production

import (
	"time"

	"github.com/google/uuid"
)

type OrdemProducao struct {
	ID             uuid.UUID  `json:"id"`
	EmpresaID      uuid.UUID  `json:"empresa_id"`
	PedidoID       uuid.UUID  `json:"pedido_id"`
	Status         *string    `json:"status,omitempty"`
	IniciadoEm     *time.Time `json:"iniciado_em,omitempty"`
	FinalizadoEm   *time.Time `json:"finalizado_em,omitempty"`
	CriadoEm       *time.Time `json:"criado_em,omitempty"`
	// Campos enriquecidos via JOIN com pedidos/clientes
	PedidoNumero   *int32     `json:"pedido_numero,omitempty"`
	ClienteNome    *string    `json:"cliente_nome,omitempty"`
	Quantidade     *int32     `json:"quantidade,omitempty"`
	PrevisaoEntrega *time.Time `json:"previsao_entrega,omitempty"`
}

type CreateOrdemRequest struct {
	PedidoID uuid.UUID `json:"pedido_id"`
	Status   *string   `json:"status,omitempty"`
}

type UpdateOrdemStatusRequest struct {
	Status string `json:"status"`
}

type EtapaProducao struct {
	ID                uuid.UUID  `json:"id"`
	OrdemProducaoID   uuid.UUID  `json:"ordem_producao_id"`
	ConfigEtapaID     uuid.UUID  `json:"config_etapa_id"`
	Status            *string    `json:"status,omitempty"`
	Responsavel       *uuid.UUID `json:"responsavel,omitempty"`
	PrevisaoConclusao *time.Time `json:"previsao_conclusao,omitempty"`
	DataInicio        *time.Time `json:"data_inicio,omitempty"`
	IniciadoEm        *time.Time `json:"iniciado_em,omitempty"`
	DataConclusao     *time.Time `json:"data_conclusao,omitempty"`
	FinalizadoEm      *time.Time `json:"finalizado_em,omitempty"`
}

type UpdateEtapaStatusRequest struct {
	Status string `json:"status"`
}

type ConfigEtapa struct {
	ID              uuid.UUID  `json:"id"`
	EmpresaID       uuid.UUID  `json:"empresa_id"`
	Nome            string     `json:"nome"`
	Ordem           int32      `json:"ordem"`
	PercentualTempo *int32     `json:"percentual_tempo,omitempty"`
	CriadoEm        *time.Time `json:"criado_em,omitempty"`
}

type CreateConfigRequest struct {
	Nome            string `json:"nome"`
	Ordem           int32  `json:"ordem"`
	PercentualTempo *int32 `json:"percentual_tempo,omitempty"`
}

type UpdateConfigRequest struct {
	Nome            string `json:"nome"`
	Ordem           int32  `json:"ordem"`
	PercentualTempo *int32 `json:"percentual_tempo,omitempty"`
}

type DashboardEtapaItem struct {
	OrdemID         uuid.UUID  `json:"ordem_id"`
	PedidoID        uuid.UUID  `json:"pedido_id"`
	PedidoNumero    int32      `json:"pedido_numero"`
	ClienteNome     string     `json:"cliente_nome"`
	Quantidade      int32      `json:"quantidade"`
	PrevisaoEntrega *time.Time `json:"previsao_entrega,omitempty"`
	ConfigEtapaID   uuid.UUID  `json:"config_etapa_id"`
	EtapaNome       string     `json:"etapa_nome"`
	EtapaOrdem      int32      `json:"etapa_ordem"`
	EtapaID         uuid.UUID  `json:"etapa_id"`
	EtapaStatus     string     `json:"etapa_status"`
	EtapaPrevisao   *time.Time `json:"etapa_previsao,omitempty"`
}
