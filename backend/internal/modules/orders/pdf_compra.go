package orders

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"
)

func fmtDecimalPTBR(v float64) string {
	s := fmt.Sprintf("%.3f", v)
	s = strings.TrimRight(s, "0")
	s = strings.TrimRight(s, ".")
	return strings.Replace(s, ".", ",", 1)
}

// EmpresaInfoPDF contém os dados da empresa para impressão no relatório.
type EmpresaInfoPDF struct {
	Nome     string
	CNPJ     string
	Email    string
	Telefone string
}

// LinhaRelatorioCompra é uma linha agrupada do relatório de compra de materiais.
type LinhaRelatorioCompra struct {
	MateriaPrima string
	Cor          string
	Unidade      string
	Total        float64
}

// GerarPDFRelatorioCompra gera um PDF de compra de materiais com layout profissional.
func GerarPDFRelatorioCompra(linhas []LinhaRelatorioCompra, componentes []LinhaRelatorioCompra, empresa EmpresaInfoPDF) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(10, 10, 10)
	pdf.SetAutoPageBreak(true, 15)
	pdf.AddPage()

	tr := latin1

	// ── CABEÇALHO ────────────────────────────────────────────────────────────
	pdf.SetFillColor(26, 26, 26)
	pdf.Rect(0, 0, 210, 28, "F")

	pdf.RegisterImageOptionsReader(
		"logo_compra",
		gofpdf.ImageOptions{ImageType: "PNG", ReadDpi: true},
		bytes.NewReader(logoAProfissionalBytes),
	)
	pdf.ImageOptions("logo_compra", 10, 5, 55, 0, false, gofpdf.ImageOptions{}, 0, "")

	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 20)
	pdf.SetXY(70, 5)
	pdf.CellFormat(130, 12, tr("RELATÓRIO DE COMPRA"), "0", 1, "R", false, 0, "")

	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(200, 200, 200)
	pdf.SetXY(70, 18)
	pdf.CellFormat(130, 6, tr(fmt.Sprintf("Gerado em %s", time.Now().Format("02/01/2006 às 15:04"))), "0", 1, "R", false, 0, "")

	// Barras de acento: vermelho + amarelo
	pdf.SetFillColor(226, 10, 5)
	pdf.Rect(0, 28, 105, 3, "F")
	pdf.SetFillColor(234, 219, 8)
	pdf.Rect(105, 28, 105, 3, "F")

	pdf.SetTextColor(30, 30, 30)
	pdf.SetY(35)

	// ── DADOS DA EMPRESA ─────────────────────────────────────────────────────
	pdf.SetFillColor(220, 220, 220)
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetX(10)
	pdf.CellFormat(190, 5, tr("  DADOS DA EMPRESA"), "1", 1, "L", true, 0, "")

	pdf.SetFont("Helvetica", "B", 11)
	pdf.SetFillColor(255, 255, 255)
	pdf.SetX(10)
	pdf.CellFormat(190, 8, "  "+tr(empresa.Nome), "LR", 1, "L", false, 0, "")

	pdf.SetFont("Helvetica", "", 8)
	cnpjStr := ""
	if empresa.CNPJ != "" {
		cnpjStr = "CNPJ: " + empresa.CNPJ
	}
	contatoStr := ""
	if empresa.Telefone != "" {
		contatoStr += "Tel: " + empresa.Telefone
	}
	if empresa.Email != "" {
		if contatoStr != "" {
			contatoStr += "     "
		}
		contatoStr += "Email: " + empresa.Email
	}
	pdf.SetX(10)
	pdf.CellFormat(95, 6, "  "+tr(cnpjStr), "LB", 0, "L", false, 0, "")
	pdf.CellFormat(95, 6, tr(contatoStr)+"  ", "RB", 1, "R", false, 0, "")

	pdf.Ln(6)

	// ── CABEÇALHO DA TABELA ───────────────────────────────────────────────────
	// Larguras: 75 + 65 + 35 + 15 = 190mm
	colW := [4]float64{75, 65, 35, 15}
	headers := []string{"Matéria-Prima", "Cor", "Total", "Und."}
	aligns := []string{"L", "L", "R", "C"}

	pdf.SetFillColor(40, 40, 40)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 9)
	pdf.SetX(10)
	for i, h := range headers {
		ln := 0
		if i == len(headers)-1 {
			ln = 1
		}
		pdf.CellFormat(colW[i], 8, "  "+tr(h), "1", ln, aligns[i], true, 0, "")
	}
	pdf.SetTextColor(30, 30, 30)

	// ── LINHAS DA TABELA ──────────────────────────────────────────────────────
	for idx, l := range linhas {
		evenRow := idx%2 == 0
		if evenRow {
			pdf.SetFillColor(255, 255, 255)
		} else {
			pdf.SetFillColor(248, 248, 248)
		}

		pdf.SetFont("Helvetica", "", 9)
		pdf.SetX(10)
		pdf.CellFormat(colW[0], 7, "  "+tr(l.MateriaPrima), "1", 0, "L", !evenRow, 0, "")
		pdf.CellFormat(colW[1], 7, "  "+tr(l.Cor), "1", 0, "L", !evenRow, 0, "")
		pdf.CellFormat(colW[2], 7, fmtDecimalPTBR(l.Total)+"  ", "1", 0, "R", !evenRow, 0, "")
		pdf.CellFormat(colW[3], 7, "  "+tr(l.Unidade), "1", 1, "C", !evenRow, 0, "")
	}

	// ── COMPONENTES (gola, punho, etc.) ──────────────────────────────────────
	if len(componentes) > 0 {
		pdf.Ln(8)
		pdf.SetFillColor(40, 40, 40)
		pdf.SetTextColor(255, 255, 255)
		pdf.SetFont("Helvetica", "B", 9)
		pdf.SetX(10)
		pdf.CellFormat(190, 7, tr("  COMPONENTES (unidades por pedido)"), "1", 1, "L", true, 0, "")

		colWC := [3]float64{120, 50, 20}
		headersC := []string{"Componente", "Quantidade", "Und."}
		alignsC := []string{"L", "R", "C"}
		pdf.SetFont("Helvetica", "B", 8)
		pdf.SetFillColor(70, 70, 70)
		pdf.SetX(10)
		for i, h := range headersC {
			ln := 0
			if i == len(headersC)-1 {
				ln = 1
			}
			pdf.CellFormat(colWC[i], 6, "  "+tr(h), "1", ln, alignsC[i], true, 0, "")
		}

		pdf.SetTextColor(30, 30, 30)
		for idx, c := range componentes {
			if idx%2 == 0 {
				pdf.SetFillColor(255, 255, 255)
			} else {
				pdf.SetFillColor(248, 248, 248)
			}
			pdf.SetFont("Helvetica", "", 9)
			pdf.SetX(10)
			compLabel := c.MateriaPrima
			if c.Cor != "" {
				compLabel += " (" + c.Cor + ")"
			}
			pdf.CellFormat(colWC[0], 7, "  "+tr(compLabel), "1", 0, "L", idx%2 != 0, 0, "")
			pdf.CellFormat(colWC[1], 7, fmtDecimalPTBR(c.Total)+"  ", "1", 0, "R", idx%2 != 0, 0, "")
			pdf.CellFormat(colWC[2], 7, "  "+tr(c.Unidade), "1", 1, "C", idx%2 != 0, 0, "")
		}
	}

	// ── RODAPÉ ────────────────────────────────────────────────────────────────
	_, pageH := pdf.GetPageSize()
	pdf.SetXY(10, pageH-10)
	pdf.SetFont("Helvetica", "I", 7)
	pdf.SetTextColor(160, 160, 160)
	pdf.CellFormat(190, 5,
		tr(fmt.Sprintf("Gerado em %s | ConfecçãoPRO", time.Now().Format("02/01/2006 15:04"))),
		"", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
