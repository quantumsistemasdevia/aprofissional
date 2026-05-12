package reports

import "time"

type PedidoPeriodoRow struct {
	Data      time.Time `json:"data"`
	Total     float64   `json:"total"`
	Quantidade int      `json:"quantidade"`
}

type ProdutoVendidoRow struct {
	ProdutoID   string  `json:"produto_id"`
	NomeProduto string  `json:"nome_produto"`
	Quantidade  int     `json:"quantidade"`
	TotalVendas float64 `json:"total_vendas"`
}

type PersonalizacaoUsadaRow struct {
	Tipo        string `json:"tipo"`
	Localizacao string `json:"localizacao"`
	Quantidade  int    `json:"quantidade"`
}

type VendedorPedidoRow struct {
	VendedorID   string  `json:"vendedor_id"`
	NomeVendedor string  `json:"nome_vendedor"`
	TotalPedidos int     `json:"total_pedidos"`
	TotalValor   float64 `json:"total_valor"`
}

type PontualidadeRow struct {
	TotalPedidos    int     `json:"total_pedidos"`
	EntreguesNoPrazo int    `json:"entregues_no_prazo"`
	EntreguesAtrasados int  `json:"entregues_atrasados"`
	TaxaPontualidade float64 `json:"taxa_pontualidade"`
}

type DesempenhoEtapaRow struct {
	ConfigEtapaID   string  `json:"config_etapa_id"`
	NomeEtapa       string  `json:"nome_etapa"`
	TotalEtapas     int     `json:"total_etapas"`
	ConcluidasNoPrazo int   `json:"concluidas_no_prazo"`
	TaxaConclusao   float64 `json:"taxa_conclusao"`
}
