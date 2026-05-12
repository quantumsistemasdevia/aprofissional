package orders

import "math"

// CalcularTotal calcula o total de um item de pedido com desconto.
// tipoDesconto: "fixo" | "percentual" | "" (sem desconto)
func CalcularTotal(quantidade int, precoUnitario float64, tipoDesconto string, desconto float64) float64 {
	subtotal := float64(quantidade) * precoUnitario
	var total float64
	switch tipoDesconto {
	case "fixo":
		total = subtotal - desconto
	case "percentual":
		total = subtotal * (1 - desconto/100)
	default:
		total = subtotal
	}
	if total < 0 {
		total = 0
	}
	// Arredondar para 2 casas decimais
	return math.Round(total*100) / 100
}
