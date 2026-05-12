package companies

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Empresa struct {
	ID                uuid.UUID       `json:"id"`
	Nome              string          `json:"nome"`
	Slug              string          `json:"slug"`
	CNPJ              *string         `json:"cnpj,omitempty"`
	Email             *string         `json:"email,omitempty"`
	Telefone          *string         `json:"telefone,omitempty"`
	ConfigERP         json.RawMessage `json:"config_erp,omitempty"`
	ConfigNotificacao json.RawMessage `json:"config_notificacao,omitempty"`
	CriadoEm         *time.Time      `json:"criado_em,omitempty"`
}

type CreateEmpresaRequest struct {
	Nome              string          `json:"nome"`
	Slug              string          `json:"slug"`
	CNPJ              *string         `json:"cnpj,omitempty"`
	Email             *string         `json:"email,omitempty"`
	Telefone          *string         `json:"telefone,omitempty"`
	ConfigERP         json.RawMessage `json:"config_erp,omitempty"`
	ConfigNotificacao json.RawMessage `json:"config_notificacao,omitempty"`
}

type UpdateEmpresaRequest struct {
	Nome              string          `json:"nome"`
	CNPJ              *string         `json:"cnpj,omitempty"`
	Email             *string         `json:"email,omitempty"`
	Telefone          *string         `json:"telefone,omitempty"`
	ConfigERP         json.RawMessage `json:"config_erp,omitempty"`
	ConfigNotificacao json.RawMessage `json:"config_notificacao,omitempty"`
}
