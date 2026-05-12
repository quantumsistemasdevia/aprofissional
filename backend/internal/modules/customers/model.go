package customers

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Cliente struct {
	ID                uuid.UUID       `json:"id"`
	EmpresaID         uuid.UUID       `json:"empresa_id"`
	Nome              string          `json:"nome"`
	Tipo              *string         `json:"tipo,omitempty"`
	CpfCnpj           *string         `json:"cpf_cnpj,omitempty"`
	Email             *string         `json:"email,omitempty"`
	Telefone          *string         `json:"telefone,omitempty"`
	Endereco          json.RawMessage `json:"endereco,omitempty"`
	NomeContato       *string         `json:"nome_contato,omitempty"`
	ErpID             *string         `json:"erp_id,omitempty"`
	ErpSincronizadoEm *time.Time      `json:"erp_sincronizado_em,omitempty"`
	CriadoEm          *time.Time      `json:"criado_em,omitempty"`
	AtualizadoEm      *time.Time      `json:"atualizado_em,omitempty"`
}

type CreateClienteRequest struct {
	Nome        string          `json:"nome"`
	Tipo        *string         `json:"tipo,omitempty"`
	CpfCnpj     *string         `json:"cpf_cnpj,omitempty"`
	Email       *string         `json:"email,omitempty"`
	Telefone    *string         `json:"telefone,omitempty"`
	Endereco    json.RawMessage `json:"endereco,omitempty"`
	NomeContato *string         `json:"nome_contato,omitempty"`
	ErpID       *string         `json:"erp_id,omitempty"`
}

type UpdateClienteRequest struct {
	Nome        string          `json:"nome"`
	Tipo        *string         `json:"tipo,omitempty"`
	CpfCnpj     *string         `json:"cpf_cnpj,omitempty"`
	Email       *string         `json:"email,omitempty"`
	Telefone    *string         `json:"telefone,omitempty"`
	Endereco    json.RawMessage `json:"endereco,omitempty"`
	NomeContato *string         `json:"nome_contato,omitempty"`
}
