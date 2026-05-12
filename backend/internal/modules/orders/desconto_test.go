package orders

import (
	"testing"
)

func TestCalcularTotal(t *testing.T) {
	tests := []struct {
		name          string
		quantidade    int
		precoUnitario float64
		tipoDesconto  string
		desconto      float64
		expected      float64
	}{
		{
			name:          "sem desconto",
			quantidade:    10,
			precoUnitario: 25.00,
			tipoDesconto:  "",
			desconto:      0,
			expected:      250.00,
		},
		{
			name:          "desconto fixo",
			quantidade:    5,
			precoUnitario: 100.00,
			tipoDesconto:  "fixo",
			desconto:      50.00,
			expected:      450.00,
		},
		{
			name:          "desconto percentual",
			quantidade:    4,
			precoUnitario: 50.00,
			tipoDesconto:  "percentual",
			desconto:      10.0,
			expected:      180.00,
		},
		{
			name:          "desconto percentual 100%",
			quantidade:    2,
			precoUnitario: 100.00,
			tipoDesconto:  "percentual",
			desconto:      100.0,
			expected:      0.00,
		},
		{
			name:          "desconto fixo maior que subtotal",
			quantidade:    1,
			precoUnitario: 10.00,
			tipoDesconto:  "fixo",
			desconto:      20.00,
			expected:      0.00, // não pode ser negativo
		},
		{
			name:          "desconto tipo desconhecido equivale a sem desconto",
			quantidade:    3,
			precoUnitario: 30.00,
			tipoDesconto:  "outro",
			desconto:      5.00,
			expected:      90.00,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalcularTotal(tt.quantidade, tt.precoUnitario, tt.tipoDesconto, tt.desconto)
			if got != tt.expected {
				t.Errorf("CalcularTotal(%d, %.2f, %s, %.2f) = %.2f; esperado %.2f",
					tt.quantidade, tt.precoUnitario, tt.tipoDesconto, tt.desconto, got, tt.expected)
			}
		})
	}
}
