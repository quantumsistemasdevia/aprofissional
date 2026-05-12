package orders

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"
)

//go:embed assets/LogoAProfissional.png
var logoAProfissionalBytes []byte

// PersonalizacaoItem contém os dados de uma personalização para exibição nos PDFs.
type PersonalizacaoItem struct {
	Tipo          string
	Localizacao   string
	TipoConteudo  string
	TextoConteudo string
	Observacao    string
}

// ItemOrcamento é um item de pedido enriquecido com nomes de produto, modelo, matéria prima e fornecedor.
type ItemOrcamento struct {
	ItemPedido
	NomeProduto      string
	NomeModelo       string
	NomeMateriaPrima string
	NomeFornecedor   string
	Personalizacoes  []PersonalizacaoItem
}

// specsModelo mapeia os campos de especificação do modelo para exibição.
type specsModelo struct {
	CorUnica      string `json:"cor_unica"`
	Gola          string `json:"gola"`
	GolaCor       string `json:"gola_cor"`
	Mangas        string `json:"mangas"`
	ManagasCor    string `json:"mangas_cor"`
	Barras        string `json:"barras"`
	BarrasCor     string `json:"barras_cor"`
	Recortes      string `json:"recortes"`
	RecortesCor   string `json:"recortes_cor"`
	Bolsos        string `json:"bolsos"`
	BolsosCor     string `json:"bolsos_cor"`
	Acabamento    string `json:"acabamento"`
	AcabamentoCor string `json:"acabamento_cor"`
	Tipo          string `json:"tipo"`
}

var ordemTamanhos = []string{"PP", "P", "M", "G", "GG", "XG", "XGG", "XXG", "G1", "G2", "G3", "EG"}

// GerarPDFOrcamento gera um PDF de orçamento completo com todos os detalhes do pedido,
// incluindo informações do cliente, vendedor, especificações do modelo e visualização das peças.
func GerarPDFOrcamento(pedido Pedido, itens []ItemOrcamento, nomeCliente, nomeVendedor string) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(10, 10, 10)
	pdf.SetAutoPageBreak(true, 15)
	pdf.AddPage()

	tr := latin1

	// ── CABEÇALHO ────────────────────────────────────────────────────────────────
	pdf.SetFillColor(26, 26, 26)
	pdf.Rect(0, 0, 210, 28, "F")

	pdf.RegisterImageOptionsReader(
		"logo_aprofissional",
		gofpdf.ImageOptions{ImageType: "PNG", ReadDpi: true},
		bytes.NewReader(logoAProfissionalBytes),
	)
	pdf.ImageOptions("logo_aprofissional", 10, 5, 55, 0, false, gofpdf.ImageOptions{}, 0, "")

	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 24)
	pdf.SetXY(80, 5)
	pdf.CellFormat(120, 12, tr("ORÇAMENTO"), "0", 1, "R", false, 0, "")

	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(200, 200, 200)
	headerInfo := fmt.Sprintf("Pedido #%04d", pedido.Numero)
	if pedido.CriadoEm != nil {
		headerInfo += "   |   " + tr("Emissão: ") + pedido.CriadoEm.Format("02/01/2006")
	}
	pdf.SetXY(80, 17)
	pdf.CellFormat(120, 6, tr(headerInfo), "0", 1, "R", false, 0, "")

	pdf.SetFillColor(226, 10, 5)
	pdf.Rect(0, 28, 105, 3, "F")
	pdf.SetFillColor(234, 219, 8)
	pdf.Rect(105, 28, 105, 3, "F")

	pdf.SetTextColor(30, 30, 30)
	pdf.SetXY(10, 35)

	// ── DESTINATÁRIO / VENDEDOR ───────────────────────────────────────────────────
	clienteText := nomeCliente
	if clienteText == "" {
		clienteText = tr("Não informado")
	}
	vendedorText := nomeVendedor
	if vendedorText == "" {
		vendedorText = tr("Não informado")
	}

	pdf.SetFillColor(235, 235, 235)
	pdf.SetFont("Helvetica", "B", 7)
	pdf.CellFormat(95, 4, tr("  DESTINATÁRIO"), "1", 0, "L", true, 0, "")
	pdf.CellFormat(95, 4, "  VENDEDOR", "1", 1, "L", true, 0, "")

	pdf.SetFont("Helvetica", "B", 9)
	pdf.SetFillColor(255, 255, 255)
	pdf.CellFormat(95, 7, "  "+tr(clienteText), "LRB", 0, "L", false, 0, "")
	pdf.CellFormat(95, 7, "  "+tr(vendedorText), "LRB", 1, "L", false, 0, "")
	pdf.Ln(3)

	// ── DETALHES DO PEDIDO ────────────────────────────────────────────────────────
	pdf.SetFillColor(235, 235, 235)
	pdf.SetFont("Helvetica", "B", 7)
	pdf.CellFormat(190, 4, tr("  DETALHES DO PEDIDO"), "1", 1, "L", true, 0, "")

	const detailH = 5.0
	const detailLabelW = 28.0
	const detailValueW = 162.0

	if pedido.Status != nil {
		pdf.SetFont("Helvetica", "B", 7)
		pdf.CellFormat(detailLabelW, detailH, "  Status:", "L", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 7)
		pdf.CellFormat(detailValueW, detailH, " "+tr(formatStatus(*pedido.Status)), "R", 1, "L", false, 0, "")
	}
	if pedido.PrevisaoEntrega != nil {
		pdf.SetFont("Helvetica", "B", 7)
		pdf.CellFormat(detailLabelW, detailH, tr("  Prev. Entrega:"), "L", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 7)
		pdf.CellFormat(detailValueW, detailH, " "+pedido.PrevisaoEntrega.Format("02/01/2006"), "R", 1, "L", false, 0, "")
	}
	if pedido.DataEntrega != nil {
		pdf.SetFont("Helvetica", "B", 7)
		pdf.CellFormat(detailLabelW, detailH, "  Data Entrega:", "L", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 7)
		pdf.CellFormat(detailValueW, detailH, " "+pedido.DataEntrega.Format("02/01/2006"), "R", 1, "L", false, 0, "")
	}
	if pedido.FormaPagamento != nil && *pedido.FormaPagamento != "" {
		renderFormaPagamentoPDF(pdf, tr, *pedido.FormaPagamento, detailLabelW, detailValueW, detailH)
	}
	if pedido.Observacoes != nil && *pedido.Observacoes != "" {
		pdf.SetFont("Helvetica", "B", 7)
		pdf.CellFormat(detailLabelW, detailH, "  Obs:", "LB", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 7)
		pdf.MultiCell(detailValueW, detailH, " "+tr(*pedido.Observacoes), "RB", "L", false)
	} else {
		pdf.CellFormat(190, 0, "", "B", 1, "L", false, 0, "")
	}
	pdf.Ln(4)

	// ── ITENS DO PEDIDO ──────────────────────────────────────────────────────────
	// Colunas: Produto/Modelo:75 | Cor:25 | Qtd:15 | Preço:30 | Desc:20 | Total:25 = 190
	colW := [6]float64{75, 25, 15, 30, 20, 25}
	headers := []string{
		tr("Produto / Modelo"), "Cor", "Qtd",
		tr("Preço Unit."), "Desconto", "Total",
	}

	// Cabeçalho de colunas — uma única vez
	pdf.SetFillColor(220, 220, 220)
	pdf.SetFont("Helvetica", "B", 7)
	for i, h := range headers {
		ln := 0
		if i == len(headers)-1 {
			ln = 1
		}
		pdf.CellFormat(colW[i], 5, h, "1", ln, "C", true, 0, "")
	}

	for idx, item := range itens {
		cor := ""
		if item.ItemPedido.Cor != nil {
			cor = tr(*item.ItemPedido.Cor)
		}
		qty := ""
		if item.ItemPedido.Quantidade != nil {
			qty = fmt.Sprintf("%d", *item.ItemPedido.Quantidade)
		}
		preco := ""
		if item.ItemPedido.PrecoUnitario != nil {
			preco = "R$" + *item.ItemPedido.PrecoUnitario
		}
		desconto := ""
		if item.ItemPedido.Desconto != nil && *item.ItemPedido.Desconto != "0.00" {
			if item.ItemPedido.TipoDesconto != nil && *item.ItemPedido.TipoDesconto == "percentual" {
				desconto = *item.ItemPedido.Desconto + "%"
			} else {
				desconto = "R$" + *item.ItemPedido.Desconto
			}
		}
		total := ""
		if item.ItemPedido.Total != nil {
			total = "R$" + *item.ItemPedido.Total
		}

		// Separador leve identificando o item
		pdf.SetFont("Helvetica", "B", 7)
		pdf.SetTextColor(100, 100, 100)
		pdf.SetX(10)
		pdf.CellFormat(190, 4, fmt.Sprintf("  Item %d", idx+1), "LTR", 1, "L", false, 0, "")
		pdf.SetTextColor(30, 30, 30)

		// Linha de dados principal
		pdf.SetFont("Helvetica", "B", 7)
		pdf.SetX(10)
		pdf.CellFormat(colW[0], 5, "  "+tr(buildDescricao(item)), "LR", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 7)
		pdf.CellFormat(colW[1], 5, cor, "LR", 0, "C", false, 0, "")
		pdf.CellFormat(colW[2], 5, qty, "LR", 0, "C", false, 0, "")
		pdf.CellFormat(colW[3], 5, preco, "LR", 0, "R", false, 0, "")
		pdf.CellFormat(colW[4], 5, desconto, "LR", 0, "R", false, 0, "")
		pdf.CellFormat(colW[5], 5, total, "LR", 1, "R", false, 0, "")

		// Sub-linhas compactas
		if grupos := parseTamanhosGrupos(item.ItemPedido.TamanhosQuantidades); len(grupos) > 0 {
			renderTamanhosCompact(pdf, tr, grupos)
		}
		if temEspecificacoes(item) {
			renderEspecificacoesCompact(pdf, tr, item)
		}
		if len(item.Personalizacoes) > 0 {
			renderPersonalizacoesCompact(pdf, tr, item.Personalizacoes)
		}

		// Borda inferior do item
		pdf.SetX(10)
		pdf.CellFormat(190, 0, "", "LRB", 1, "L", false, 0, "")
		pdf.Ln(2)
	}

	// ── TOTAL GERAL ───────────────────────────────────────────────────────────────
	var somaTotal float64
	for _, item := range itens {
		if item.ItemPedido.Total != nil {
			if v, err := strconv.ParseFloat(*item.ItemPedido.Total, 64); err == nil {
				somaTotal += v
			}
		}
	}
	totalGeral := fmt.Sprintf("R$ %.2f", somaTotal)
	if pedido.Total != nil && *pedido.Total != "" && *pedido.Total != "0.00" {
		totalGeral = "R$ " + *pedido.Total
	}

	pdf.Ln(1)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.SetFillColor(25, 25, 25)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(159, 8, tr("TOTAL GERAL:"), "1", 0, "R", true, 0, "")
	pdf.CellFormat(31, 8, totalGeral, "1", 1, "R", true, 0, "")
	pdf.SetTextColor(30, 30, 30)

	// ── VISUALIZAÇÃO DAS PEÇAS ────────────────────────────────────────────────────
	type itemComImg struct {
		item ItemOrcamento
		idx  int
	}
	var imgItems []itemComImg
	for i, item := range itens {
		if (item.ItemPedido.PreviewFrenteURL != nil && *item.ItemPedido.PreviewFrenteURL != "") ||
			(item.ItemPedido.PreviewVersoURL != nil && *item.ItemPedido.PreviewVersoURL != "") {
			imgItems = append(imgItems, itemComImg{item, i})
		}
	}

	if len(imgItems) > 0 {
		httpClient := &http.Client{Timeout: 30 * time.Second}

		const minImgH = 50.0
		const labelH = 5.0
		const slotGap = 4.0
		const slotW = (190.0 - slotGap) / 2 // ~93mm por item

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

		if len(imgItems) == 1 {
			// Item único: centralizado
			const singleW = 100.0
			const singleX = 10.0 + (190.0-singleW)/2

			it := imgItems[0]
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
			// Dois itens por linha: item ímpar à esquerda, par à direita
			for i := 0; i < len(imgItems); i += 2 {
				_, ph := pdf.GetPageSize()
				if ph-pdf.GetY() < minImgH+labelH+10 {
					pdf.AddPage()
				}

				left := imgItems[i]
				leftX := 10.0
				rightX := leftX + slotW + slotGap

				// Labels dos dois itens na mesma linha
				tituloL := fmt.Sprintf("Item %d", left.idx+1)
				if left.item.NomeProduto != "" {
					tituloL += " — " + left.item.NomeProduto
				}
				pdf.SetFont("Helvetica", "B", 7)
				pdf.SetTextColor(60, 60, 60)
				pdf.SetX(leftX)
				pdf.CellFormat(slotW, 5, "  "+tr(tituloL), "", 0, "L", false, 0, "")

				if i+1 < len(imgItems) {
					right := imgItems[i+1]
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
				if i+1 < len(imgItems) {
					right := imgItems[i+1]
					rightBottom := renderItemImagens(pdf, httpClient, right.item, right.idx, startY, rightX, slotW)
					if rightBottom > rowBottom {
						rowBottom = rightBottom
					}
				}

				pdf.SetY(rowBottom + labelH + 4)
			}
		}
	}

	// ── RODAPÉ ───────────────────────────────────────────────────────────────────
	_, pageH := pdf.GetPageSize()
	pdf.SetXY(10, pageH-10)
	pdf.SetFont("Helvetica", "I", 7)
	pdf.SetTextColor(160, 160, 160)
	pdf.CellFormat(190, 5, "Gerado em: "+time.Now().Format("02/01/2006 15:04"), "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// registrarImagemURL baixa a imagem da URL, valida o formato e a registra no PDF.
func registrarImagemURL(pdf *gofpdf.Fpdf, client *http.Client, name, url string) error {
	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	_, format, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("formato inválido: %w", err)
	}

	imgType := "PNG"
	if format == "jpeg" {
		imgType = "JPEG"
	}

	opts := gofpdf.ImageOptions{ImageType: imgType, ReadDpi: true}
	pdf.RegisterImageOptionsReader(name, opts, bytes.NewReader(data))
	return nil
}

// renderItemImagens renderiza frente e/ou verso de um item dentro do slot indicado.
// Retorna o bottomY das imagens (sem contar o labelH).
func renderItemImagens(pdf *gofpdf.Fpdf, client *http.Client, item ItemOrcamento, idx int, startY, slotX, slotW float64) float64 {
	const minImgH = 50.0
	const labelH = 5.0

	hasFrente := item.PreviewFrenteURL != nil && *item.PreviewFrenteURL != ""
	hasVerso := item.PreviewVersoURL != nil && *item.PreviewVersoURL != ""
	bottomY := startY + minImgH

	if hasFrente && hasVerso {
		imgW := (slotW - 5) / 2
		versoX := slotX + imgW + 5

		frenteName := fmt.Sprintf("item_frente_%d", idx)
		if err := registrarImagemURL(pdf, client, frenteName, *item.PreviewFrenteURL); err == nil {
			pdf.ImageOptions(frenteName, slotX, startY, imgW, 0, false, gofpdf.ImageOptions{}, 0, "")
			if pdf.GetY() > bottomY {
				bottomY = pdf.GetY()
			}
		} else {
			pdf.Rect(slotX, startY, imgW, minImgH, "D")
		}

		versoName := fmt.Sprintf("item_verso_%d", idx)
		if err := registrarImagemURL(pdf, client, versoName, *item.PreviewVersoURL); err == nil {
			pdf.ImageOptions(versoName, versoX, startY, imgW, 0, false, gofpdf.ImageOptions{}, 0, "")
			if pdf.GetY() > bottomY {
				bottomY = pdf.GetY()
			}
		} else {
			pdf.Rect(versoX, startY, imgW, minImgH, "D")
		}

		pdf.SetFont("Helvetica", "I", 7)
		pdf.SetXY(slotX, bottomY+1)
		pdf.CellFormat(imgW, labelH, "Frente", "", 0, "C", false, 0, "")
		pdf.SetXY(versoX, bottomY+1)
		pdf.CellFormat(imgW, labelH, "Verso", "", 0, "C", false, 0, "")
	} else {
		imgW := slotW * 0.75
		imgX := slotX + (slotW-imgW)/2

		var singleURL, singleName string
		if hasFrente {
			singleURL = *item.PreviewFrenteURL
			singleName = fmt.Sprintf("item_frente_%d", idx)
		} else {
			singleURL = *item.PreviewVersoURL
			singleName = fmt.Sprintf("item_verso_%d", idx)
		}

		if err := registrarImagemURL(pdf, client, singleName, singleURL); err == nil {
			pdf.ImageOptions(singleName, imgX, startY, imgW, 0, false, gofpdf.ImageOptions{}, 0, "")
			if pdf.GetY() > bottomY {
				bottomY = pdf.GetY()
			}
		} else {
			pdf.Rect(imgX, startY, imgW, minImgH, "D")
		}
	}

	return bottomY
}

func buildDescricao(item ItemOrcamento) string {
	if item.NomeProduto != "" {
		if item.NomeModelo != "" {
			return item.NomeProduto + " / " + item.NomeModelo
		}
		return item.NomeProduto
	}
	return item.ItemPedido.ProdutoID.String()[:8] + "..."
}

// ── TAMANHOS ─────────────────────────────────────────────────────────────────

type tamEntry struct{ nome, qtd string }
type tamGrupo struct {
	nome    string
	entries []tamEntry
}

func parseTamanhosGrupos(raw json.RawMessage) []tamGrupo {
	if len(raw) == 0 {
		return nil
	}
	var m map[string]interface{}
	if err := json.Unmarshal(raw, &m); err != nil || len(m) == 0 {
		return nil
	}

	grupoMap := make(map[string][]tamEntry)
	seen := make(map[string]bool)
	var grupoOrder []string

	for k, v := range m {
		s := qtdString(v)
		if s == "" || s == "0" {
			continue
		}
		var grupo, nome string
		if idx := strings.Index(k, "/"); idx >= 0 {
			grupo = k[:idx]
			nome = k[idx+1:]
		} else {
			grupo = ""
			nome = k
		}
		if !seen[grupo] {
			grupoOrder = append(grupoOrder, grupo)
			seen[grupo] = true
		}
		grupoMap[grupo] = append(grupoMap[grupo], tamEntry{nome, s})
	}

	if len(grupoOrder) == 0 {
		return nil
	}

	sort.Strings(grupoOrder)
	var result []tamGrupo
	for _, g := range grupoOrder {
		entries := grupoMap[g]
		sort.Slice(entries, func(i, j int) bool {
			oi, oj := indexOfTamanho(entries[i].nome), indexOfTamanho(entries[j].nome)
			if oi != oj {
				return oi < oj
			}
			return entries[i].nome < entries[j].nome
		})
		result = append(result, tamGrupo{g, entries})
	}
	return result
}

// renderTamanhosCompact exibe tamanhos como texto compacto: "Feminino: PP:2  P:3  M:5"
func renderTamanhosCompact(pdf *gofpdf.Fpdf, tr func(string) string, grupos []tamGrupo) {
	const rowH = 4.5
	const labelW = 26.0

	for _, grupo := range grupos {
		if len(grupo.entries) == 0 {
			continue
		}
		var parts []string
		for _, e := range grupo.entries {
			parts = append(parts, e.nome+":"+e.qtd)
		}
		linha := strings.Join(parts, "  ")

		label := "Tam.:"
		if grupo.nome != "" {
			label = tr(grupo.nome) + ":"
		}

		pdf.SetX(10)
		pdf.SetFont("Helvetica", "B", 7)
		pdf.SetTextColor(80, 80, 80)
		pdf.CellFormat(labelW, rowH, "  "+label, "LR", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 7)
		pdf.SetTextColor(30, 30, 30)
		pdf.CellFormat(190-labelW, rowH, "  "+tr(linha), "R", 1, "L", false, 0, "")
	}
}

// ── ESPECIFICAÇÕES ────────────────────────────────────────────────────────────

func temEspecificacoes(item ItemOrcamento) bool {
	if item.NomeMateriaPrima != "" || item.NomeFornecedor != "" {
		return true
	}
	if len(item.ItemPedido.EspecificacoesModelo) == 0 {
		return false
	}
	var specs specsModelo
	if err := json.Unmarshal(item.ItemPedido.EspecificacoesModelo, &specs); err != nil {
		return false
	}
	return specs.Gola != "" || specs.Mangas != "" || specs.Barras != "" ||
		specs.Recortes != "" || specs.Bolsos != "" || specs.Acabamento != "" ||
		specs.CorUnica != "" || specs.Tipo != ""
}

// renderEspecificacoesCompact exibe specs como texto inline: "Gola: Careca   Mangas: Curta (Azul)"
func renderEspecificacoesCompact(pdf *gofpdf.Fpdf, tr func(string) string, item ItemOrcamento) {
	type campo struct{ label, valor string }
	var campos []campo

	if item.NomeMateriaPrima != "" {
		campos = append(campos, campo{tr("Mat. Prima"), tr(item.NomeMateriaPrima)})
	}
	if item.NomeFornecedor != "" {
		campos = append(campos, campo{"Fornecedor", tr(item.NomeFornecedor)})
	}

	var specs specsModelo
	if len(item.ItemPedido.EspecificacoesModelo) > 0 {
		_ = json.Unmarshal(item.ItemPedido.EspecificacoesModelo, &specs)
	}
	if specs.CorUnica != "" {
		campos = append(campos, campo{tr("Cor Única"), tr(specs.CorUnica)})
	}
	if specs.Tipo != "" {
		campos = append(campos, campo{"Tipo", tr(specs.Tipo)})
	}

	addCampo := func(label, valor, cor string) {
		if valor == "" {
			return
		}
		v := tr(valor)
		if cor != "" && specs.CorUnica == "" {
			v += " (" + tr(cor) + ")"
		}
		campos = append(campos, campo{label, v})
	}
	addCampo("Gola", specs.Gola, specs.GolaCor)
	addCampo("Mangas", specs.Mangas, specs.ManagasCor)
	addCampo("Barras", specs.Barras, specs.BarrasCor)
	addCampo("Recortes", specs.Recortes, specs.RecortesCor)
	addCampo("Bolsos", specs.Bolsos, specs.BolsosCor)
	addCampo("Acabamento", specs.Acabamento, specs.AcabamentoCor)

	if len(campos) == 0 {
		return
	}

	// Até 3 campos por linha
	const perLinha = 3
	for i := 0; i < len(campos); i += perLinha {
		var parts []string
		for j := i; j < i+perLinha && j < len(campos); j++ {
			parts = append(parts, campos[j].label+": "+campos[j].valor)
		}
		pdf.SetX(10)
		pdf.SetFont("Helvetica", "", 7)
		pdf.SetTextColor(30, 30, 30)
		pdf.CellFormat(190, 4.5, "  "+tr(strings.Join(parts, "   ")), "LR", 1, "L", false, 0, "")
	}
}

func indexOfTamanho(nome string) int {
	for i, s := range ordemTamanhos {
		if s == nome {
			return i
		}
	}
	return len(ordemTamanhos)
}

func qtdString(v interface{}) string {
	switch val := v.(type) {
	case float64:
		if val == float64(int64(val)) {
			return fmt.Sprintf("%d", int64(val))
		}
		return fmt.Sprintf("%.1f", val)
	case int:
		return fmt.Sprintf("%d", val)
	case string:
		return val
	default:
		return fmt.Sprintf("%v", v)
	}
}

func formatStatus(s string) string {
	m := map[string]string{
		"orcamento":  "Orçamento",
		"aprovado":   "Aprovado",
		"producao":   "Em Produção",
		"finalizado": "Finalizado",
		"entregue":   "Entregue",
	}
	if v, ok := m[s]; ok {
		return v
	}
	return s
}

func formatMetodoPagamento(s string) string {
	m := map[string]string{
		"pix":            "Pix",
		"dinheiro":       "Dinheiro",
		"cartao_credito": "Cartão de Crédito",
		"cartao_debito":  "Cartão de Débito",
		"boleto":         "Boleto",
	}
	if v, ok := m[s]; ok {
		return v
	}
	return s
}

func formatFormaPagamento(s string) string {
	return formatMetodoPagamento(s)
}

type pagamentoItem struct {
	Metodo string  `json:"metodo"`
	Valor  float64 `json:"valor"`
}

func renderFormaPagamentoPDF(pdf *gofpdf.Fpdf, tr func(string) string, fp string, labelW, valueW, detailH float64) {
	if strings.HasPrefix(fp, "[") {
		var pagamentos []pagamentoItem
		if err := json.Unmarshal([]byte(fp), &pagamentos); err == nil && len(pagamentos) > 0 {
			for i, p := range pagamentos {
				label := tr("  Forma Pgto:")
				if i > 0 {
					label = ""
				}
				pdf.SetFont("Helvetica", "B", 7)
				pdf.CellFormat(labelW, detailH, label, "L", 0, "L", false, 0, "")
				pdf.SetFont("Helvetica", "", 7)
				linha := fmt.Sprintf(" %s: R$ %.2f", tr(formatMetodoPagamento(p.Metodo)), p.Valor)
				pdf.CellFormat(valueW, detailH, tr(linha), "R", 1, "L", false, 0, "")
			}
			return
		}
	}
	pdf.SetFont("Helvetica", "B", 7)
	pdf.CellFormat(labelW, detailH, tr("  Forma Pgto:"), "L", 0, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 7)
	pdf.CellFormat(valueW, detailH, " "+tr(formatFormaPagamento(fp)), "R", 1, "L", false, 0, "")
}

// ── PERSONALIZAÇÕES ───────────────────────────────────────────────────────────

// renderPersonalizacoesCompact exibe cada personalização como uma linha inline.
func renderPersonalizacoesCompact(pdf *gofpdf.Fpdf, tr func(string) string, personalizacoes []PersonalizacaoItem) {
	const rowH = 4.5
	const labelW = 26.0

	for i, p := range personalizacoes {
		linha := labelTipoPersonalizacao(p.Tipo)
		if p.Localizacao != "" {
			linha += " — " + p.Localizacao
		}
		conteudo := labelConteudoPersonalizacao(p.TipoConteudo, p.TextoConteudo)
		if conteudo != "" {
			linha += " — " + conteudo
		}
		if p.Observacao != "" {
			linha += " — " + p.Observacao
		}

		label := ""
		if i == 0 {
			label = "Personal.:"
		}

		pdf.SetX(10)
		pdf.SetFont("Helvetica", "B", 7)
		pdf.SetTextColor(80, 80, 80)
		pdf.CellFormat(labelW, rowH, "  "+label, "LR", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 7)
		pdf.SetTextColor(30, 30, 30)
		pdf.CellFormat(190-labelW, rowH, "  "+tr(linha), "R", 1, "L", false, 0, "")
	}
}

func labelTipoPersonalizacao(tipo string) string {
	switch tipo {
	case "serigrafia":
		return "Serigrafia"
	case "DTF":
		return "DTF"
	case "bordado":
		return "Bordado"
	case "sublimacao":
		return "Sublimação"
	}
	return tipo
}

func labelConteudoPersonalizacao(tipoConteudo, texto string) string {
	switch tipoConteudo {
	case "imagem":
		return "Imagem / Arte"
	case "texto":
		if texto != "" {
			if len([]rune(texto)) > 28 {
				return "Texto: " + string([]rune(texto)[:28]) + "..."
			}
			return "Texto: " + texto
		}
		return "Texto"
	}
	return tipoConteudo
}
