package orders

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/heliobarreira/aprofissional/internal/db"
	"github.com/heliobarreira/aprofissional/internal/middleware"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) ListPedidos(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	list, err := h.svc.ListPedidos(r.Context(), middleware.GetDB(r), empresaID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, list, http.StatusOK)
}

func (h *Handler) GetPedido(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	p, err := h.svc.GetPedido(r.Context(), middleware.GetDB(r), id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusNotFound)
		return
	}
	jsonResponse(w, p, http.StatusOK)
}

func (h *Handler) CreatePedido(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	var req CreatePedidoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	if req.ClienteID == nil {
		jsonError(w, "cliente_id é obrigatório", http.StatusBadRequest)
		return
	}
	criadoPor := middleware.GetUserID(r)
	p, err := h.svc.CreatePedido(r.Context(), middleware.GetDB(r), empresaID, req, criadoPor)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, p, http.StatusCreated)
}

func (h *Handler) UpdatePedido(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req UpdatePedidoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	p, err := h.svc.UpdatePedido(r.Context(), middleware.GetDB(r), id, req)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, p, http.StatusOK)
}

func (h *Handler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req UpdatePedidoStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	p, err := h.svc.UpdateStatus(r.Context(), middleware.GetDB(r), id, req.Status)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, p, http.StatusOK)
}

func (h *Handler) DeletePedido(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	if err := h.svc.DeletePedido(r.Context(), middleware.GetDB(r), id, empresaID); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---- Itens ----

func (h *Handler) ListItens(w http.ResponseWriter, r *http.Request) {
	pedidoID, err := uuid.Parse(chi.URLParam(r, "pedidoID"))
	if err != nil {
		jsonError(w, "pedido_id inválido", http.StatusBadRequest)
		return
	}
	list, err := h.svc.ListItens(r.Context(), middleware.GetDB(r), pedidoID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, list, http.StatusOK)
}

func (h *Handler) GetItem(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "itemID"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	item, err := h.svc.GetItem(r.Context(), middleware.GetDB(r), id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusNotFound)
		return
	}
	jsonResponse(w, item, http.StatusOK)
}

func (h *Handler) AddItem(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	pedidoID, err := uuid.Parse(chi.URLParam(r, "pedidoID"))
	if err != nil {
		jsonError(w, "pedido_id inválido", http.StatusBadRequest)
		return
	}

	body, _ := io.ReadAll(r.Body)
	log.Printf("DEBUG AddItem body: %s", string(body))

	var req CreateItemPedidoRequest
	if err := json.NewDecoder(bytes.NewReader(body)).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}

	log.Printf("DEBUG tamanhos raw: %s", string(req.TamanhosQuantidades))
	log.Printf("DEBUG specs raw: %s", string(req.EspecificacoesModelo))

	item, err := h.svc.AddItem(r.Context(), middleware.GetDB(r), empresaID, pedidoID, req)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, item, http.StatusCreated)
}

func (h *Handler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "itemID"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	var req UpdateItemPedidoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "corpo inválido", http.StatusBadRequest)
		return
	}
	alteradoPor := middleware.GetUserID(r)
	item, err := h.svc.UpdateItem(r.Context(), middleware.GetDB(r), id, req, alteradoPor)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}
	jsonResponse(w, item, http.StatusOK)
}

func (h *Handler) DeleteItem(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "itemID"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}
	if err := h.svc.DeleteItem(r.Context(), middleware.GetDB(r), id, empresaID); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) GerarOrcamento(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	ctx := r.Context()
	qtx := middleware.GetDB(r)
	q := db.New(qtx)

	pedido, err := h.svc.GetPedido(ctx, qtx, id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusNotFound)
		return
	}
	itens, err := h.svc.ListItens(ctx, qtx, id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Buscar nome do cliente (destinatário)
	nomeCliente := ""
	if pedido.ClienteID != nil {
		if c, err := q.GetCliente(ctx, *pedido.ClienteID); err == nil {
			nomeCliente = c.Nome
		}
	}

	// Buscar nome do vendedor
	nomeVendedor := ""
	if pedido.VendedorID != nil {
		if u, err := q.GetUsuario(ctx, *pedido.VendedorID); err == nil {
			nomeVendedor = u.Nome
		}
	}

	itensOrcamento := enriquecerItens(ctx, q, qtx, itens)

	pdfBytes, err := GerarPDFOrcamento(pedido, itensOrcamento, nomeCliente, nomeVendedor)
	if err != nil {
		jsonError(w, "erro ao gerar PDF", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=orcamento.pdf")
	w.WriteHeader(http.StatusOK)
	w.Write(pdfBytes) //nolint:errcheck
}

func (h *Handler) GerarFichaProducao(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		jsonError(w, "id inválido", http.StatusBadRequest)
		return
	}
	ctx := r.Context()
	qtx := middleware.GetDB(r)
	q := db.New(qtx)

	pedido, err := h.svc.GetPedido(ctx, qtx, id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusNotFound)
		return
	}
	itens, err := h.svc.ListItens(ctx, qtx, id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	nomeCliente := ""
	if pedido.ClienteID != nil {
		if c, err := q.GetCliente(ctx, *pedido.ClienteID); err == nil {
			nomeCliente = c.Nome
		}
	}

	nomeVendedor := ""
	if pedido.VendedorID != nil {
		if u, err := q.GetUsuario(ctx, *pedido.VendedorID); err == nil {
			nomeVendedor = u.Nome
		}
	}

	itensOrcamento := enriquecerItens(ctx, q, qtx, itens)

	pdfBytes, err := GerarFichaProducao(pedido, itensOrcamento, nomeCliente, nomeVendedor)
	if err != nil {
		jsonError(w, "erro ao gerar PDF", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=ficha-producao.pdf")
	w.WriteHeader(http.StatusOK)
	w.Write(pdfBytes) //nolint:errcheck
}

func (h *Handler) ListVersoes(w http.ResponseWriter, r *http.Request) {
	itemID, err := uuid.Parse(chi.URLParam(r, "itemID"))
	if err != nil {
		jsonError(w, "item_id inválido", http.StatusBadRequest)
		return
	}
	list, err := h.svc.ListVersoes(r.Context(), middleware.GetDB(r), itemID)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonResponse(w, list, http.StatusOK)
}

// ---- Helpers ----

// enriquecerItens popula nomes e personalizações de cada item para exibição nos PDFs.
func enriquecerItens(ctx context.Context, q *db.Queries, qtx *sql.Tx, itens []ItemPedido) []ItemOrcamento {
	result := make([]ItemOrcamento, len(itens))
	for i, item := range itens {
		result[i] = ItemOrcamento{ItemPedido: item}
		if prod, err := q.GetProduto(ctx, item.ProdutoID); err == nil {
			result[i].NomeProduto = prod.Nome
		}
		if item.ModeloID != nil {
			if mod, err := q.GetModelo(ctx, *item.ModeloID); err == nil {
				result[i].NomeModelo = mod.Nome
			}
		}
		if item.MateriaPrimaID != nil {
			if mp, err := q.GetMateriaPrima(ctx, *item.MateriaPrimaID); err == nil {
				result[i].NomeMateriaPrima = mp.Nome
			}
		}
		if item.FornecedorID != nil {
			var nome string
			if err := qtx.QueryRowContext(ctx, `SELECT nome FROM fornecedores WHERE id = $1`, item.FornecedorID).Scan(&nome); err == nil {
				result[i].NomeFornecedor = nome
			}
		}
		if rows, err := q.ListPersonalizacoesPorItem(ctx, item.ID); err == nil {
			for _, p := range rows {
				pi := PersonalizacaoItem{}
				if p.Tipo.Valid {
					pi.Tipo = p.Tipo.String
				}
				if p.Localizacao.Valid {
					pi.Localizacao = p.Localizacao.String
				}
				if p.TipoConteudo.Valid {
					pi.TipoConteudo = p.TipoConteudo.String
				}
				if p.TextoConteudo.Valid {
					pi.TextoConteudo = p.TextoConteudo.String
				}
				if p.Observacao.Valid {
					pi.Observacao = p.Observacao.String
				}
				result[i].Personalizacoes = append(result[i].Personalizacoes, pi)
			}
		}
	}
	return result
}

func (h *Handler) ListComprasMateriais(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}

	q := r.URL.Query()
	dataInicio := q.Get("data_inicio")
	dataFim := q.Get("data_fim")
	materiaPrimaID := q.Get("materia_prima_id")
	fornecedorID := q.Get("fornecedor_id")

	qtx := middleware.GetDB(r)

	baseQuery := `
		SELECT
			ip.id::text,
			p.numero,
			c.nome  AS cliente_nome,
			ip.fornecedor_id::text,
			f.nome  AS fornecedor_nome,
			f.telefone AS fornecedor_telefone,
			mp.nome AS materia_prima_nome,
			ip.cor,
			ip.quantidade,
			ip.consumo_por_unidade,
			ip.unidade_consumo,
			CASE
				WHEN ip.consumo_por_unidade IS NOT NULL AND ip.quantidade IS NOT NULL
				THEN ROUND((ip.quantidade * ip.consumo_por_unidade)::numeric, 4)
				ELSE NULL
			END AS consumo_base,
			COALESCE(ip.status_compra, 'nao_comprado'),
			p.criado_em,
			ip.especificacoes_modelo
		FROM itens_pedido ip
		JOIN pedidos p ON p.id = ip.pedido_id
		LEFT JOIN clientes c ON c.id = p.cliente_id
		LEFT JOIN fornecedores f ON f.id = ip.fornecedor_id
		LEFT JOIN materias_primas mp ON mp.id = ip.materia_prima_id
		WHERE ip.empresa_id = $1
		  AND p.deletado_em IS NULL
		  AND ip.deletado_em IS NULL
		  AND COALESCE(ip.produto_pronto, false) = false`

	args := []any{empresaID}
	idx := 2

	if dataInicio != "" {
		baseQuery += fmt.Sprintf(" AND p.criado_em >= $%d", idx)
		args = append(args, dataInicio)
		idx++
	}
	if dataFim != "" {
		baseQuery += fmt.Sprintf(" AND p.criado_em < ($%d::date + interval '1 day')", idx)
		args = append(args, dataFim)
		idx++
	}
	if materiaPrimaID != "" {
		baseQuery += fmt.Sprintf(" AND ip.materia_prima_id = $%d", idx)
		args = append(args, materiaPrimaID)
		idx++
	}
	if fornecedorID != "" {
		baseQuery += fmt.Sprintf(" AND ip.fornecedor_id = $%d", idx)
		args = append(args, fornecedorID)
		_ = idx
	}
	baseQuery += " ORDER BY p.criado_em DESC"

	rows, err := qtx.QueryContext(r.Context(), baseQuery, args...)
	if err != nil {
		jsonError(w, "erro ao listar compras", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type itemSpecs struct {
		item  CompraMateriaisItem
		specs []byte
	}
	raw := make([]itemSpecs, 0)
	for rows.Next() {
		var item CompraMateriaisItem
		var clienteNome, fornNome, mpNome, cor, unidade sql.NullString
		var consumo, consumoBase sql.NullFloat64
		var quantidade sql.NullInt32
		var criadoEm sql.NullTime
		var itemID, fornID, fornTelefone sql.NullString
		var specsRaw []byte

		if err := rows.Scan(
			&itemID,
			&item.NumeroPedido,
			&clienteNome, &fornID, &fornNome, &fornTelefone, &mpNome,
			&cor,
			&quantidade,
			&consumo, &unidade, &consumoBase,
			&item.StatusCompra,
			&criadoEm,
			&specsRaw,
		); err != nil {
			log.Printf("WARN ListComprasMateriais scan: %v", err)
			continue
		}
		if !itemID.Valid || itemID.String == "" {
			continue
		}
		item.ItemID = itemID.String
		if clienteNome.Valid { item.ClienteNome = &clienteNome.String }
		if fornID.Valid { item.FornecedorID = &fornID.String }
		if fornNome.Valid { item.FornecedorNome = &fornNome.String }
		if fornTelefone.Valid { item.FornecedorTelefone = &fornTelefone.String }
		if mpNome.Valid { item.MateriaPrimaNome = &mpNome.String }
		if cor.Valid { item.Cor = &cor.String }
		if quantidade.Valid { item.Quantidade = quantidade.Int32 }
		if consumo.Valid { item.ConsumoPorUnidade = &consumo.Float64 }
		if unidade.Valid { item.UnidadeConsumo = &unidade.String }
		if consumoBase.Valid { item.ConsumoTotal = &consumoBase.Float64 }
		if criadoEm.Valid { t := criadoEm.Time; item.Data = &t }

		raw = append(raw, itemSpecs{item: item, specs: specsRaw})
	}

	proporcoes := fetchProporcoes(r.Context(), qtx, empresaID)

	result := make([]CompraMateriaisItem, 0, len(raw))
	for _, rs := range raw {
		item := rs.item
		applyProporcoes(&item, proporcoes, rs.specs)
		result = append(result, item)
	}
	jsonResponse(w, result, http.StatusOK)
}

func (h *Handler) GerarRelatorioCompra(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}

	var req RelatorioCompraRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.ItemIDs) == 0 {
		jsonError(w, "item_ids obrigatório", http.StatusBadRequest)
		return
	}

	qtx := middleware.GetDB(r)

	// Monta placeholders: $2, $3, ...
	placeholders := ""
	args := []any{empresaID}
	for i, id := range req.ItemIDs {
		if i > 0 {
			placeholders += ","
		}
		args = append(args, id)
		placeholders += fmt.Sprintf("$%d", i+2)
	}

	query := fmt.Sprintf(`
		SELECT
			COALESCE(mp.nome, 'Sem matéria-prima'),
			COALESCE(ip.cor, 'Sem cor'),
			COALESCE(ip.unidade_consumo, ''),
			CASE WHEN ip.consumo_por_unidade IS NOT NULL AND ip.quantidade IS NOT NULL
			     THEN ROUND((ip.quantidade * ip.consumo_por_unidade)::numeric, 4)
			     ELSE NULL END,
			ip.especificacoes_modelo,
			COALESCE(ip.quantidade, 0)
		FROM itens_pedido ip
		LEFT JOIN materias_primas mp ON mp.id = ip.materia_prima_id
		WHERE ip.empresa_id = $1
		  AND ip.id IN (%s)
		  AND ip.deletado_em IS NULL
		ORDER BY mp.nome, ip.cor`, placeholders)

	rows, err := qtx.QueryContext(r.Context(), query, args...)
	if err != nil {
		jsonError(w, "erro ao gerar relatório", http.StatusInternalServerError)
		return
	}

	type rowRelatorio struct {
		mpNome, cor, unidade string
		consumoBase          sql.NullFloat64
		specsRaw             []byte
		qtd                  int32
	}
	var rawRows []rowRelatorio
	for rows.Next() {
		var rr rowRelatorio
		if err := rows.Scan(&rr.mpNome, &rr.cor, &rr.unidade, &rr.consumoBase, &rr.specsRaw, &rr.qtd); err != nil {
			continue
		}
		rawRows = append(rawRows, rr)
	}
	rows.Close()

	// Busca proporções após fechar as rows (mesma conexão/transação)
	proporcoes := fetchProporcoes(r.Context(), qtx, empresaID)

	// Agrupa materiais por (MateriaPrima + Cor) com ajuste percentual aplicado
	type chave struct{ mp, cor string }
	totaisMap := map[chave]*LinhaRelatorioCompra{}
	var ordemChaves []chave
	// Agrega componentes por (nome + cor)
	type compChave struct{ nome, cor string }
	compMap := map[compChave]float64{}
	var ordemComp []compChave

	for _, rr := range rawRows {
		var pctTotal float64
		var unitComponents []ComponenteCompra
		if len(rr.specsRaw) > 0 && rr.qtd > 0 {
			var specsMap map[string]interface{}
			if json.Unmarshal(rr.specsRaw, &specsMap) == nil {
				for _, cat := range specCategories {
					val, ok := specsMap[cat]
					if !ok {
						continue
					}
					nome, ok := val.(string)
					if !ok || nome == "" {
						continue
					}
					catProps, ok := proporcoes[cat]
					if !ok {
						continue
					}
					prop, ok := catProps[nome]
					if !ok {
						continue
					}
					switch prop.tipoProporcao {
					case "percentual":
						pctTotal += prop.proporcao
					case "unidade":
						unitComponents = append(unitComponents, ComponenteCompra{
							Nome:       nome,
							Cor:        corDoComponente(specsMap, cat),
							Quantidade: math.Round(prop.proporcao*float64(rr.qtd)*10000) / 10000,
						})
					}
				}
			}
		}

		if rr.consumoBase.Valid {
			adjusted := rr.consumoBase.Float64 * (1 + pctTotal/100)
			adjusted = math.Round(adjusted*10000) / 10000
			k := chave{mp: rr.mpNome, cor: rr.cor}
			if _, ok := totaisMap[k]; !ok {
				totaisMap[k] = &LinhaRelatorioCompra{MateriaPrima: rr.mpNome, Cor: rr.cor, Unidade: rr.unidade}
				ordemChaves = append(ordemChaves, k)
			}
			totaisMap[k].Total += adjusted
		}

		for _, c := range unitComponents {
			ck := compChave{nome: c.Nome, cor: c.Cor}
			if _, seen := compMap[ck]; !seen {
				ordemComp = append(ordemComp, ck)
			}
			compMap[ck] += c.Quantidade
		}
	}

	linhas := make([]LinhaRelatorioCompra, 0, len(ordemChaves))
	for _, k := range ordemChaves {
		linhas = append(linhas, *totaisMap[k])
	}
	componentes := make([]LinhaRelatorioCompra, 0, len(ordemComp))
	for _, ck := range ordemComp {
		componentes = append(componentes, LinhaRelatorioCompra{MateriaPrima: ck.nome, Cor: ck.cor, Unidade: "un", Total: compMap[ck]})
	}

	// Busca dados da empresa para o cabeçalho do PDF
	var empresa EmpresaInfoPDF
	_ = qtx.QueryRowContext(r.Context(),
		`SELECT nome, COALESCE(cnpj,''), COALESCE(email,''), COALESCE(telefone,'') FROM empresas WHERE id = $1`,
		empresaID,
	).Scan(&empresa.Nome, &empresa.CNPJ, &empresa.Email, &empresa.Telefone)

	pdfBytes, err := GerarPDFRelatorioCompra(linhas, componentes, empresa)
	if err != nil {
		jsonError(w, "erro ao gerar PDF", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf(
		`attachment; filename="compra-materiais-%s.pdf"`, time.Now().Format("2006-01-02")))
	w.WriteHeader(http.StatusOK)
	w.Write(pdfBytes) //nolint:errcheck
}

func (h *Handler) AlterarStatusCompra(w http.ResponseWriter, r *http.Request) {
	empresaID := mustEmpresaID(w, r)
	if empresaID == uuid.Nil {
		return
	}

	var req AlterarStatusCompraRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.ItemIDs) == 0 {
		jsonError(w, "item_ids obrigatório", http.StatusBadRequest)
		return
	}
	if req.Status != "comprado" && req.Status != "nao_comprado" {
		jsonError(w, "status inválido: use 'comprado' ou 'nao_comprado'", http.StatusBadRequest)
		return
	}

	qtx := middleware.GetDB(r)

	placeholders := ""
	args := []any{empresaID, req.Status}
	for i, id := range req.ItemIDs {
		if i > 0 {
			placeholders += ","
		}
		args = append(args, id)
		placeholders += fmt.Sprintf("$%d", i+3)
	}

	query := fmt.Sprintf(`
		UPDATE itens_pedido SET status_compra = $2, atualizado_em = NOW()
		WHERE empresa_id = $1 AND id IN (%s) AND deletado_em IS NULL`, placeholders)

	if _, err := qtx.ExecContext(r.Context(), query, args...); err != nil {
		jsonError(w, "erro ao atualizar status", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func mustEmpresaID(w http.ResponseWriter, r *http.Request) uuid.UUID {
	id, err := uuid.Parse(middleware.GetEmpresaID(r))
	if err != nil {
		jsonError(w, "empresa_id inválido", http.StatusBadRequest)
		return uuid.Nil
	}
	return id
}

// ---- Proporções de catálogo ----

type proporcaoInfo struct {
	proporcao     float64
	tipoProporcao string
}

var specCategories = []string{"gola", "mangas", "barras", "recortes", "bolsos", "acabamento"}

// fetchProporcoes busca todas as opções com proporção configurada para a empresa.
// Retorna map[categoria]map[nome]proporcaoInfo.
func fetchProporcoes(ctx context.Context, qtx db.DBTX, empresaID uuid.UUID) map[string]map[string]proporcaoInfo {
	result := map[string]map[string]proporcaoInfo{}
	rows, err := qtx.QueryContext(ctx, `
		SELECT categoria, nome, proporcao, tipo_proporcao
		FROM catalogo_opcoes
		WHERE empresa_id = $1
		  AND deletado_em IS NULL
		  AND proporcao IS NOT NULL
		  AND tipo_proporcao IS NOT NULL
		  AND categoria IN ('gola','mangas','barras','recortes','bolsos','acabamento')
	`, empresaID)
	if err != nil {
		return result
	}
	defer rows.Close()
	for rows.Next() {
		var cat, nome, tipo string
		var prop float64
		if err := rows.Scan(&cat, &nome, &prop, &tipo); err != nil {
			continue
		}
		if result[cat] == nil {
			result[cat] = map[string]proporcaoInfo{}
		}
		result[cat][nome] = proporcaoInfo{proporcao: prop, tipoProporcao: tipo}
	}
	return result
}

// corDoComponente retorna a cor selecionada para uma parte do modelo.
// Prioridade: cor_unica (quando todas as partes têm a mesma cor) → {cat}_cor individual.
func corDoComponente(specsMap map[string]interface{}, cat string) string {
	if v, ok := specsMap["cor_unica"]; ok {
		if s, _ := v.(string); s != "" {
			return s
		}
	}
	if v, ok := specsMap[cat+"_cor"]; ok {
		if s, _ := v.(string); s != "" {
			return s
		}
	}
	return ""
}

// applyProporcoes aplica ajustes de proporção ao item:
// - tipo 'percentual': soma ao consumo_total (metros/kg)
// - tipo 'unidade': acrescenta componente com cor (ex: Gola V / Branco: 50 un)
func applyProporcoes(item *CompraMateriaisItem, proporcoes map[string]map[string]proporcaoInfo, specsRaw []byte) {
	if len(specsRaw) == 0 || item.Quantidade == 0 {
		return
	}
	var specsMap map[string]interface{}
	if err := json.Unmarshal(specsRaw, &specsMap); err != nil {
		return
	}

	var pctTotal float64
	var componentes []ComponenteCompra

	for _, cat := range specCategories {
		val, ok := specsMap[cat]
		if !ok {
			continue
		}
		nome, ok := val.(string)
		if !ok || nome == "" {
			continue
		}
		catProps, ok := proporcoes[cat]
		if !ok {
			continue
		}
		prop, ok := catProps[nome]
		if !ok {
			continue
		}
		switch prop.tipoProporcao {
		case "percentual":
			pctTotal += prop.proporcao
		case "unidade":
			componentes = append(componentes, ComponenteCompra{
				Nome:       nome,
				Cor:        corDoComponente(specsMap, cat),
				Quantidade: math.Round(prop.proporcao*float64(item.Quantidade)*10000) / 10000,
			})
		}
	}

	if pctTotal > 0 && item.ConsumoTotal != nil {
		adjusted := *item.ConsumoTotal * (1 + pctTotal/100)
		rounded := math.Round(adjusted*10000) / 10000
		item.ConsumoTotal = &rounded
	}

	if len(componentes) > 0 {
		item.Componentes = componentes
	}
}

func jsonResponse(w http.ResponseWriter, data any, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data) //nolint:errcheck
}

func jsonError(w http.ResponseWriter, msg string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg}) //nolint:errcheck
}
