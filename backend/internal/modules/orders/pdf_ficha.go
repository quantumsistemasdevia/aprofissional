package orders

import (
	"bytes"
	"fmt"
	"net/http"
	"time"

	"github.com/jung-kurt/gofpdf"
)

// GerarFichaProducao gera a ficha de produção com o mesmo layout do orçamento,
// porém sem nenhum valor financeiro — destinada à equipe de produção.
func GerarFichaProducao(pedido Pedido, itens []ItemOrcamento, nomeCliente, nomeVendedor string) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(10, 10, 10)
	pdf.SetAutoPageBreak(true, 15)
	pdf.AddPage()

	tr := latin1

	// ── CABEÇALHO ────────────────────────────────────────────────────────────────
	pdf.SetFillColor(25, 25, 25)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 22)
	pdf.CellFormat(190, 14, tr("FICHA DE PRODUÇÃO"), "0", 1, "C", true, 0, "")

	pdf.SetFillColor(60, 60, 60)
	pdf.SetFont("Helvetica", "", 9)
	headerInfo := fmt.Sprintf("  Pedido #%04d", pedido.Numero)
	if pedido.CriadoEm != nil {
		headerInfo += "   |   " + tr("Emissão: ") + pedido.CriadoEm.Format("02/01/2006")
	}
	pdf.CellFormat(190, 6, tr(headerInfo), "0", 1, "L", true, 0, "")
	pdf.SetTextColor(30, 30, 30)
	pdf.Ln(5)

	// ── DESTINATÁRIO / VENDEDOR ───────────────────────────────────────────────────
	pdf.SetFillColor(220, 220, 220)
	pdf.SetFont("Helvetica", "B", 8)
	pdf.CellFormat(95, 5, tr("  DESTINATÁRIO"), "1", 0, "L", true, 0, "")
	pdf.CellFormat(95, 5, "  VENDEDOR", "1", 1, "L", true, 0, "")

	clienteText := nomeCliente
	if clienteText == "" {
		clienteText = tr("Não informado")
	}
	vendedorText := nomeVendedor
	if vendedorText == "" {
		vendedorText = tr("Não informado")
	}

	pdf.SetFont("Helvetica", "B", 11)
	pdf.SetFillColor(255, 255, 255)
	pdf.CellFormat(95, 10, "  "+tr(clienteText), "LRB", 0, "L", false, 0, "")
	pdf.CellFormat(95, 10, "  "+tr(vendedorText), "LRB", 1, "L", false, 0, "")
	pdf.Ln(5)

	// ── DETALHES DO PEDIDO ────────────────────────────────────────────────────────
	pdf.SetFillColor(220, 220, 220)
	pdf.SetFont("Helvetica", "B", 8)
	pdf.CellFormat(190, 5, tr("  DETALHES DO PEDIDO"), "1", 1, "L", true, 0, "")

	detailH := 6.0
	labelW := 28.0
	valueW := 162.0
	if pedido.Status != nil {
		pdf.SetFont("Helvetica", "B", 8)
		pdf.CellFormat(labelW, detailH, "  Status:", "L", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 8)
		pdf.CellFormat(valueW, detailH, " "+tr(formatStatus(*pedido.Status)), "R", 1, "L", false, 0, "")
	}
	if pedido.PrevisaoEntrega != nil {
		pdf.SetFont("Helvetica", "B", 8)
		pdf.CellFormat(labelW, detailH, tr("  Prev. Entrega:"), "L", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 8)
		pdf.CellFormat(valueW, detailH, " "+pedido.PrevisaoEntrega.Format("02/01/2006"), "R", 1, "L", false, 0, "")
	}
	if pedido.DataEntrega != nil {
		pdf.SetFont("Helvetica", "B", 8)
		pdf.CellFormat(labelW, detailH, "  Data Entrega:", "L", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 8)
		pdf.CellFormat(valueW, detailH, " "+pedido.DataEntrega.Format("02/01/2006"), "R", 1, "L", false, 0, "")
	}
	if pedido.Observacoes != nil && *pedido.Observacoes != "" {
		pdf.SetFont("Helvetica", "B", 8)
		pdf.CellFormat(labelW, detailH, "  Obs:", "LB", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 8)
		pdf.MultiCell(valueW, detailH, " "+tr(*pedido.Observacoes), "RB", "L", false)
	} else {
		pdf.CellFormat(190, 0, "", "B", 1, "L", false, 0, "")
	}
	pdf.Ln(5)

	// ── ITENS DO PEDIDO (sem valores financeiros) ────────────────────────────────
	// Colunas: Produto/Modelo:130 | Cor:35 | Qtd:25 = 190
	colW := [3]float64{130, 35, 25}
	headers := []string{tr("Produto / Modelo"), "Cor", "Qtd"}

	var totalPecas int
	for idx, item := range itens {
		// Barra "ITEM X" — identifica visualmente cada bloco
		pdf.SetFillColor(40, 40, 40)
		pdf.SetTextColor(255, 255, 255)
		pdf.SetFont("Helvetica", "B", 9)
		pdf.SetX(10)
		pdf.CellFormat(190, 7, fmt.Sprintf("  ITEM %d", idx+1), "0", 1, "L", true, 0, "")

		// Cabeçalho de colunas deste item
		pdf.SetFillColor(80, 80, 80)
		pdf.SetFont("Helvetica", "B", 8)
		for i, h := range headers {
			ln := 0
			if i == len(headers)-1 {
				ln = 1
			}
			pdf.CellFormat(colW[i], 6, h, "1", ln, "C", true, 0, "")
		}
		pdf.SetTextColor(30, 30, 30)

		bgR, bgG, bgB := 255, 255, 255
		fill := false
		pdf.SetFillColor(bgR, bgG, bgB)

		cor := ""
		if item.ItemPedido.Cor != nil {
			cor = tr(*item.ItemPedido.Cor)
		}
		qty := ""
		if item.ItemPedido.Quantidade != nil {
			qty = fmt.Sprintf("%d", *item.ItemPedido.Quantidade)
			totalPecas += int(*item.ItemPedido.Quantidade)
		}

		// Linha principal (sem colunas de preço)
		pdf.SetFont("Helvetica", "", 8)
		pdf.CellFormat(colW[0], 7, tr(buildDescricao(item)), "1", 0, "L", fill, 0, "")
		pdf.CellFormat(colW[1], 7, cor, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(colW[2], 7, qty, "1", 1, "C", fill, 0, "")

		// Tamanhos
		if grupos := parseTamanhosGrupos(item.ItemPedido.TamanhosQuantidades); len(grupos) > 0 {
			renderTamanhosCompact(pdf, tr, grupos)
		}

		// Especificações do modelo
		if temEspecificacoes(item) {
			renderEspecificacoesCompact(pdf, tr, item)
		}

		// Personalizações
		if len(item.Personalizacoes) > 0 {
			renderPersonalizacoesCompact(pdf, tr, item.Personalizacoes)
		}

		pdf.Ln(3)
	}

	// ── TOTAL DE PEÇAS ────────────────────────────────────────────────────────────
	pdf.Ln(2)
	pdf.SetFont("Helvetica", "B", 11)
	pdf.SetFillColor(25, 25, 25)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(165, 9, tr("TOTAL DE PEÇAS:"), "1", 0, "R", true, 0, "")
	pdf.CellFormat(25, 9, fmt.Sprintf("%d", totalPecas), "1", 1, "C", true, 0, "")
	pdf.SetTextColor(30, 30, 30)

	// ── VISUALIZAÇÃO DAS PEÇAS ────────────────────────────────────────────────────
	type itemComImgF struct {
		item ItemOrcamento
		idx  int
	}
	var imgItemsF []itemComImgF
	for i, item := range itens {
		if (item.ItemPedido.PreviewFrenteURL != nil && *item.ItemPedido.PreviewFrenteURL != "") ||
			(item.ItemPedido.PreviewVersoURL != nil && *item.ItemPedido.PreviewVersoURL != "") {
			imgItemsF = append(imgItemsF, itemComImgF{item, i})
		}
	}

	if len(imgItemsF) > 0 {
		httpClient := &http.Client{Timeout: 30 * time.Second}

		const minImgH = 50.0
		const labelH = 5.0
		const slotGap = 4.0
		const slotW = (190.0 - slotGap) / 2

		_, pageH := pdf.GetPageSize()
		if pageH-pdf.GetY() < minImgH+labelH+20 {
			pdf.AddPage()
		}

		pdf.Ln(4)
		pdf.SetFont("Helvetica", "B", 8)
		pdf.SetFillColor(235, 235, 235)
		pdf.SetTextColor(30, 30, 30)
		pdf.SetX(10)
		pdf.CellFormat(190, 5, tr("  VISUALIZAÇÃO DAS PEÇAS"), "1", 1, "L", true, 0, "")
		pdf.Ln(2)

		if len(imgItemsF) == 1 {
			const singleW = 100.0
			const singleX = 10.0 + (190.0-singleW)/2

			it := imgItemsF[0]
			titulo := fmt.Sprintf("  Item %d", it.idx+1)
			if it.item.NomeProduto != "" {
				titulo += " — " + it.item.NomeProduto
			}
			pdf.SetFont("Helvetica", "B", 7)
			pdf.SetTextColor(60, 60, 60)
			pdf.CellFormat(190, 5, tr(titulo), "", 1, "C", false, 0, "")
			pdf.Ln(1)

			startY := pdf.GetY()
			bottomY := renderItemImagens(pdf, httpClient, it.item, it.idx, startY, singleX, singleW)
			pdf.SetY(bottomY + labelH + 4)
		} else {
			for i := 0; i < len(imgItemsF); i += 2 {
				_, ph := pdf.GetPageSize()
				if ph-pdf.GetY() < minImgH+labelH+10 {
					pdf.AddPage()
				}

				left := imgItemsF[i]
				leftX := 10.0
				rightX := leftX + slotW + slotGap

				tituloL := fmt.Sprintf("Item %d", left.idx+1)
				if left.item.NomeProduto != "" {
					tituloL += " — " + left.item.NomeProduto
				}
				pdf.SetFont("Helvetica", "B", 7)
				pdf.SetTextColor(60, 60, 60)
				pdf.SetX(leftX)
				pdf.CellFormat(slotW, 5, "  "+tr(tituloL), "", 0, "L", false, 0, "")

				if i+1 < len(imgItemsF) {
					right := imgItemsF[i+1]
					tituloR := fmt.Sprintf("Item %d", right.idx+1)
					if right.item.NomeProduto != "" {
						tituloR += " — " + right.item.NomeProduto
					}
					pdf.SetX(rightX)
					pdf.CellFormat(slotW, 5, "  "+tr(tituloR), "", 1, "L", false, 0, "")
				} else {
					pdf.Ln(5)
				}
				pdf.Ln(1)

				startY := pdf.GetY()
				leftBottom := renderItemImagens(pdf, httpClient, left.item, left.idx, startY, leftX, slotW)

				rowBottom := leftBottom
				if i+1 < len(imgItemsF) {
					right := imgItemsF[i+1]
					rightBottom := renderItemImagens(pdf, httpClient, right.item, right.idx, startY, rightX, slotW)
					if rightBottom > rowBottom {
						rowBottom = rightBottom
					}
				}

				pdf.SetY(rowBottom + labelH + 4)
			}
		}
	}

	// ── CONTROLE DE PRODUÇÃO ──────────────────────────────────────────────────────
	if pdf.GetY() > 220 {
		pdf.AddPage()
	}
	pdf.Ln(8)
	pdf.SetFillColor(40, 40, 40)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 9)
	pdf.CellFormat(190, 6, tr("  CONTROLE DE PRODUÇÃO"), "0", 1, "L", true, 0, "")
	pdf.SetTextColor(30, 30, 30)
	pdf.Ln(3)

	pdf.SetFont("Helvetica", "", 8)
	etapas := []string{
		"Corte", "Costura", "Acabamento",
		tr("Estampa / Bordado"), tr("Revisão"), "Embalagem",
	}
	for _, etapa := range etapas {
		pdf.CellFormat(60, 8, "  "+tr(etapa)+":", "1", 0, "L", false, 0, "")
		pdf.CellFormat(65, 8, tr("  Responsável: ___________________"), "1", 0, "L", false, 0, "")
		pdf.CellFormat(32, 8, tr("  Início: ________"), "1", 0, "L", false, 0, "")
		pdf.CellFormat(33, 8, tr("  Fim: __________"), "1", 1, "L", false, 0, "")
	}

	// ── RODAPÉ ────────────────────────────────────────────────────────────────────
	pdf.Ln(6)
	pdf.SetFont("Helvetica", "I", 7)
	pdf.SetTextColor(160, 160, 160)
	pdf.CellFormat(190, 5, "Gerado em: "+time.Now().Format("02/01/2006 15:04"), "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
