package erp

import "context"

// ERPCustomer representa um cliente vindo do ERP externo.
type ERPCustomer struct {
	ERPID    string  `json:"erp_id"`
	Nome     string  `json:"nome"`
	Tipo     string  `json:"tipo"`
	CpfCnpj  string  `json:"cpf_cnpj,omitempty"`
	Email    string  `json:"email,omitempty"`
	Telefone string  `json:"telefone,omitempty"`
}

// ERPClient define a interface para comunicação com o ERP externo.
type ERPClient interface {
	SearchCustomers(ctx context.Context, query string) ([]ERPCustomer, error)
	GetCustomer(ctx context.Context, erpID string) (ERPCustomer, error)
	CreateCustomer(ctx context.Context, c ERPCustomer) (ERPCustomer, error)
	UpdateCustomer(ctx context.Context, erpID string, c ERPCustomer) (ERPCustomer, error)
}
