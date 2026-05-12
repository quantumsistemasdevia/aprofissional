package erp

import (
	"context"
	"fmt"
	"strings"
)

// MockERPClient implementa ERPClient com dados estáticos para testes.
type MockERPClient struct{}

var mockCustomers = []ERPCustomer{
	{ERPID: "ERP001", Nome: "Confecções Alpargatas Ltda", Tipo: "juridica", CpfCnpj: "12.345.678/0001-90", Email: "contato@alpargatas.com.br", Telefone: "(11) 3000-0001"},
	{ERPID: "ERP002", Nome: "Maria das Graças Souza", Tipo: "fisica", CpfCnpj: "123.456.789-00", Email: "maria@email.com", Telefone: "(11) 99000-0002"},
	{ERPID: "ERP003", Nome: "Tecidos e Cia ME", Tipo: "juridica", CpfCnpj: "98.765.432/0001-10", Email: "vendas@tecidosecia.com.br", Telefone: "(11) 3000-0003"},
	{ERPID: "ERP004", Nome: "João Carlos Moda", Tipo: "fisica", CpfCnpj: "987.654.321-00", Email: "joao@moda.com.br", Telefone: "(11) 98000-0004"},
	{ERPID: "ERP005", Nome: "Vestindo Bem Distribuidora", Tipo: "juridica", CpfCnpj: "11.222.333/0001-44", Email: "contato@vestindobem.com.br", Telefone: "(11) 3000-0005"},
}

func (m *MockERPClient) SearchCustomers(_ context.Context, query string) ([]ERPCustomer, error) {
	q := strings.ToLower(query)
	var results []ERPCustomer
	for _, c := range mockCustomers {
		if strings.Contains(strings.ToLower(c.Nome), q) ||
			strings.Contains(c.CpfCnpj, q) ||
			strings.Contains(c.ERPID, q) {
			results = append(results, c)
		}
	}
	return results, nil
}

func (m *MockERPClient) GetCustomer(_ context.Context, erpID string) (ERPCustomer, error) {
	for _, c := range mockCustomers {
		if c.ERPID == erpID {
			return c, nil
		}
	}
	return ERPCustomer{}, fmt.Errorf("cliente ERP %s não encontrado", erpID)
}

func (m *MockERPClient) CreateCustomer(_ context.Context, c ERPCustomer) (ERPCustomer, error) {
	c.ERPID = fmt.Sprintf("ERP%03d", len(mockCustomers)+1)
	mockCustomers = append(mockCustomers, c)
	return c, nil
}

func (m *MockERPClient) UpdateCustomer(_ context.Context, erpID string, c ERPCustomer) (ERPCustomer, error) {
	for i, existing := range mockCustomers {
		if existing.ERPID == erpID {
			c.ERPID = erpID
			mockCustomers[i] = c
			return c, nil
		}
	}
	return ERPCustomer{}, fmt.Errorf("cliente ERP %s não encontrado", erpID)
}
