'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useOrders, type Pedido, type ItemPedido, type PersonalizacaoDetalhe, type StatusPedido } from '@/hooks/useOrders'
import { useCustomers } from '@/hooks/useCustomers'
import { usePermission } from '@/hooks/usePermission'
import { apiFetch } from '@/lib/api'
import type { Produto } from '@/hooks/useProdutos'
import type { Modelo } from '@/hooks/useModelos'
import type { Personalizacao, TipoPersonalizacao, LadoPeca } from '@/types'

const WIZARD_STORAGE_KEY = 'wizard_pedido_draft'
const WIZARD_VERSION = 3

type ItemEnriquecido = ItemPedido & {
  produto?: Produto
  modelo?: Modelo
  personalizacoes?: PersonalizacaoDetalhe[]
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange'

const STATUS_VARIANT: Record<StatusPedido, BadgeVariant> = {
  orcamento:  'purple',
  aprovado:   'success',
  producao:   'orange',
  finalizado: 'info',
  entregue:   'default',
}
const STATUS_LABEL: Record<StatusPedido, string> = {
  orcamento:  'Orçamento',
  aprovado:   'Aprovado',
  producao:   'Produção',
  finalizado: 'Finalizado',
  entregue:   'Entregue',
}

function fmtDate(iso?: string | null) {
  if (!iso) return '-'
  const datePart = iso.split('T')[0]
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return '-'
  return `${day}/${month}/${year}`
}

function fmtMoney(val?: string | number | null) {
  if (val == null) return '-'
  return `R$ ${Number(val).toFixed(2)}`
}

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  pix:            'Pix',
  dinheiro:       'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito:  'Cartão de Débito',
  boleto:         'Boleto',
}

type FormaMultipla = { metodo: string; valor: number }

function parseFormasPagamento(val?: string): { simples: string } | { multiplas: FormaMultipla[] } | null {
  if (!val) return null
  if (val.startsWith('[')) {
    try {
      const list = JSON.parse(val) as FormaMultipla[]
      if (Array.isArray(list) && list.length > 0) return { multiplas: list }
    } catch {}
  }
  return { simples: val }
}

export default function PedidoDetalhePage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const { getOne, getItens, getPersonalizacoes, updateStatus, downloadPdf } = useOrders()
  const { clientes, list: listClientes } = useCustomers()
  const { hasPermission } = usePermission()

  const [pedido, setPedido]   = useState<Pedido | null>(null)
  const [itens,  setItens]    = useState<ItemEnriquecido[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, rawItens] = await Promise.all([getOne(id), getItens(id)])
      setPedido(p)
      const enriquecidos = await Promise.all(
        rawItens.map(async item => {
          const [produto, modelo, personalizacoes] = await Promise.allSettled([
            apiFetch<Produto>(`/api/catalog/produtos/${item.produto_id}`),
            apiFetch<Modelo>(`/api/catalog/modelos/${item.modelo_id}`),
            getPersonalizacoes(item.id),
          ])
          return {
            ...item,
            produto:         produto.status === 'fulfilled'         ? produto.value         : undefined,
            modelo:          modelo.status === 'fulfilled'          ? modelo.value          : undefined,
            personalizacoes: personalizacoes.status === 'fulfilled' ? personalizacoes.value : [],
          }
        })
      )
      setItens(enriquecidos)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }, [id, getOne, getItens, getPersonalizacoes])

  useEffect(() => { carregarDados(); listClientes() }, [carregarDados, listClientes])

  const clienteNome = pedido?.cliente_id
    ? (clientes.find(c => c.id === pedido.cliente_id)?.nome ?? pedido.cliente_id)
    : '-'

  async function handleStatus(status: StatusPedido) {
    if (!pedido) return
    setActionLoading(status)
    try {
      const updated = await updateStatus(pedido.id, status)
      setPedido(updated)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao atualizar status')
    } finally {
      setActionLoading(null)
    }
  }

  function handleEditarItem(item: ItemEnriquecido) {
    if (!pedido) return

    // Detecta modo Arte Pronta: todas as personalizações de imagem compartilham a mesma URL
    const imagePerss = (item.personalizacoes ?? []).filter(
      p => (p.tipo_conteudo ?? 'imagem') === 'imagem' && p.url_imagem
    )
    const uniqueUrls = [...new Set(imagePerss.map(p => p.url_imagem))]
    const isArtePronta = imagePerss.length >= 2 && uniqueUrls.length === 1
    const arteProntaUrl = isArtePronta ? uniqueUrls[0] : undefined

    const wizardState = {
      _version: WIZARD_VERSION,
      currentStep: 1,
      editMode: { pedidoId: pedido.id, itemId: item.id },
      pedido: {
        cliente_id:       pedido.cliente_id,
        previsao_entrega: pedido.previsao_entrega
          ? new Date(pedido.previsao_entrega).toISOString().split('T')[0]
          : undefined,
        vendedor_id:      pedido.vendedor_id,
        observacoes:      pedido.observacoes,
        forma_pagamento:  pedido.forma_pagamento,
      },
      item: {
        produto_id:            item.produto_id,
        modelo_id:             item.modelo_id,
        materia_prima_id:      item.materia_prima_id,
        fornecedor_id:         item.fornecedor_id,
        cor:                   item.cor,
        tamanhos_quantidades:  item.tamanhos_quantidades ?? {},
        especificacoes_modelo: item.especificacoes_modelo ?? {},
        valor_unitario:        item.preco_unitario ? Number(item.preco_unitario) : undefined,
        tipo_desconto:         item.tipo_desconto as 'fixo' | 'percentual' | undefined,
        desconto:              item.desconto ? Number(item.desconto) : undefined,
        arte_pronta:           isArtePronta,
        arte_pronta_url:       arteProntaUrl,
      },
      personalizacoes: (item.personalizacoes ?? []).map((p): Personalizacao => ({
        id:             p.id,
        tipo:           (p.tipo ?? 'serigrafia') as TipoPersonalizacao,
        tipo_conteudo:  (p.tipo_conteudo ?? 'imagem') as 'imagem' | 'texto',
        lado:           (p.lado ?? 'frente') as LadoPeca,
        local_id:       p.localizacao,
        url_imagem:     p.url_imagem,
        texto_conteudo: p.texto_conteudo,
        texto_fonte:    p.texto_fonte,
        cores:          p.cores ?? [],
        canvas_x:       p.canvas_x ?? 0.5,
        canvas_y:       p.canvas_y ?? 0.5,
        canvas_escala:  p.canvas_escala ?? 1,
        canvas_rotacao: p.canvas_rotacao ?? 0,
        observacao:     p.observacao,
      })),
      preview_frente_url: item.preview_frente_url,
      preview_verso_url:  item.preview_verso_url,
    }
    localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(wizardState))
    router.push(`/pedidos/novo?t=${Date.now()}`)
  }

  function handleEditarPedido() {
    if (itens.length === 0) return
    handleEditarItem(itens[0])
  }

  async function handleDownload(tipo: 'orcamento' | 'ficha-producao') {
    if (!pedido) return
    setActionLoading(tipo)
    try {
      await downloadPdf(pedido.id, tipo)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao gerar PDF')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="flex justify-center p-16"><Spinner /></div>

  if (error || !pedido) {
    return (
      <div className="p-8 text-center text-red-600">
        {error ?? 'Pedido não encontrado'}
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
        </div>
      </div>
    )
  }

  const status  = (pedido.status ?? 'orcamento') as StatusPedido
  const isAdmin = hasPermission('aprovar_pedido')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <PageHeader
            title={`Pedido #${String(pedido.numero).padStart(4, '0')}`}
            description={clienteNome}
          />
          <div className="mt-1 ml-1">
            <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.back()}>← Voltar</Button>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-3">
        {(status === 'orcamento' || status === 'aprovado') && itens.length > 0 && (
          <Button variant="outline" onClick={handleEditarPedido} disabled={actionLoading !== null}>
            Editar Pedido
          </Button>
        )}

        {status === 'orcamento' && isAdmin && (
          <Button onClick={() => handleStatus('aprovado')} disabled={actionLoading !== null}>
            {actionLoading === 'aprovado' ? 'Aprovando...' : 'Aprovar Pedido'}
          </Button>
        )}

        {status === 'aprovado' && isAdmin && (
          <Button onClick={() => handleStatus('producao')} disabled={actionLoading !== null}>
            {actionLoading === 'producao' ? 'Enviando...' : 'Enviar para Produção'}
          </Button>
        )}

        {status === 'producao' && isAdmin && (
          <Button onClick={() => handleStatus('finalizado')} disabled={actionLoading !== null}>
            {actionLoading === 'finalizado' ? 'Finalizando...' : 'Finalizar Pedido'}
          </Button>
        )}

        {status !== 'entregue' && (
          <Button variant="outline" onClick={() => handleStatus('entregue')} disabled={actionLoading !== null}>
            {actionLoading === 'entregue' ? 'Salvando...' : 'Marcar Entregue'}
          </Button>
        )}

        <Button variant="outline" onClick={() => handleDownload('orcamento')} disabled={actionLoading !== null}>
          {actionLoading === 'orcamento' ? 'Gerando...' : '↓ PDF Orçamento'}
        </Button>

        <Button variant="outline" onClick={() => handleDownload('ficha-producao')} disabled={actionLoading !== null}>
          {actionLoading === 'ficha-producao' ? 'Gerando...' : '↓ PDF Ficha de Produção'}
        </Button>
      </div>

      {/* Dados Gerais */}
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Dados Gerais</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <Campo label="Cliente"             value={clienteNome} />
          <Campo label="Status"              value={STATUS_LABEL[status]} />
          <Campo label="Previsão de Entrega" value={fmtDate(pedido.previsao_entrega)} />
          <Campo label="Data de Entrega"     value={fmtDate(pedido.data_entrega)} />
          <Campo label="Total"               value={fmtMoney(pedido.total)} />
          <CampoFormaPagamento valor={pedido.forma_pagamento} />
          <Campo label="Criado em"           value={fmtDate(pedido.criado_em)} />
          {pedido.observacoes && (
            <div className="col-span-2 md:col-span-3">
              <Campo label="Observações" value={pedido.observacoes} />
            </div>
          )}
        </div>
      </Card>

      {/* Itens */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900">Itens do Pedido ({itens.length})</h2>
        {itens.length === 0 ? (
          <Card className="p-6 text-center text-gray-400">Nenhum item neste pedido</Card>
        ) : (
          itens.map((item, idx) => (
            <ItemCard
              key={item.id}
              item={item}
              idx={idx + 1}
              canEdit={status === 'orcamento' || status === 'aprovado'}
              onEditar={() => handleEditarItem(item)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  )
}

function CampoFormaPagamento({ valor }: { valor?: string }) {
  const parsed = parseFormasPagamento(valor)
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">Forma de Pagamento</p>
      {!parsed ? (
        <p className="font-medium text-gray-900">-</p>
      ) : 'simples' in parsed ? (
        <p className="font-medium text-gray-900">{FORMA_PAGAMENTO_LABEL[parsed.simples] ?? parsed.simples}</p>
      ) : (
        <div className="space-y-0.5">
          {parsed.multiplas.map((p, i) => (
            <p key={i} className="font-medium text-gray-900 text-sm">
              {FORMA_PAGAMENTO_LABEL[p.metodo] ?? p.metodo}
              <span className="text-gray-500 font-normal ml-1">
                R$ {p.valor.toFixed(2).replace('.', ',')}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function ItemCard({ item, idx, canEdit, onEditar }: {
  item: ItemEnriquecido
  idx: number
  canEdit?: boolean
  onEditar?: () => void
}) {
  const tamanhos = item.tamanhos_quantidades ?? {}
  const specs    = item.especificacoes_modelo ?? {}

  const SPEC_LABELS: Record<string, string> = {
    gola: 'Gola', mangas: 'Mangas', barras: 'Barras',
    recortes: 'Recortes', bolsos: 'Bolsos', acabamento: 'Acabamento',
    cor_unica: 'Cor Única',
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded border bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
          {item.produto?.url_imagem ? (
            <img src={item.produto.url_imagem} alt={item.produto.nome} className="w-full h-full object-contain" />
          ) : (
            <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-900">
              Item {idx} — {item.produto?.nome ?? 'Produto'}
            </p>
            {canEdit && onEditar && (
              <button
                onClick={onEditar}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                </svg>
                Editar
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex gap-2">
              <Miniatura url={item.preview_frente_url ?? item.modelo?.url_imagem_frente} label="Frente" />
              <Miniatura url={item.preview_verso_url  ?? item.modelo?.url_imagem_verso}  label="Verso"  />
            </div>
            {item.modelo?.nome && (
              <span className="text-sm text-gray-700 font-medium">{item.modelo.nome}</span>
            )}
          </div>

          {Object.keys(specs).some(k => specs[k] && !k.endsWith('_cor') && !k.endsWith('_hex')) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {Object.entries(specs)
                .filter(([k, v]) => v && !k.endsWith('_cor') && !k.endsWith('_hex'))
                .map(([k, v]) => {
                  const cor = specs[`${k}_cor`]
                  return (
                    <span key={k} className="text-xs text-gray-500">
                      <span className="font-medium">{SPEC_LABELS[k] ?? k}:</span>{' '}
                      {v}{cor && <span className="text-gray-400"> ({cor})</span>}
                    </span>
                  )
                })}
            </div>
          )}

          <div className="flex gap-4 mt-2 text-sm">
            {item.cor && <span className="text-gray-600">Cor: <strong>{item.cor}</strong></span>}
          </div>

          {Object.keys(tamanhos).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(tamanhos).filter(([, q]) => q > 0).map(([tam, qtd]) => (
                <span key={tam} className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                  {tam.includes('/') ? tam.split('/')[1] : tam} × {qtd}
                </span>
              ))}
              <span className="text-xs text-gray-500 self-center">
                Total: {Object.values(tamanhos).reduce((a, b) => a + b, 0)} pç
              </span>
            </div>
          )}

          <div className="flex gap-6 mt-3 text-sm">
            <span className="text-gray-500">
              Unitário: <strong className="text-gray-900">{item.preco_unitario ? `R$ ${Number(item.preco_unitario).toFixed(2)}` : '-'}</strong>
            </span>
            {item.desconto && Number(item.desconto) > 0 && (
              <span className="text-gray-500">
                Desconto: <strong className="text-gray-900">
                  {item.tipo_desconto === 'percentual'
                    ? `${item.desconto}%`
                    : `R$ ${Number(item.desconto).toFixed(2)}`}
                </strong>
              </span>
            )}
            <span className="text-gray-500">
              Total: <strong className="text-blue-700 text-base">
                {item.total ? `R$ ${Number(item.total).toFixed(2)}` : '-'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {(item.personalizacoes ?? []).length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
            Personalizações ({item.personalizacoes!.length})
          </p>
          <div className="space-y-2">
            {item.personalizacoes!.map(p => (
              <div key={p.id} className="flex flex-wrap items-center gap-2">
                {p.tipo && <Badge variant="info">{p.tipo}</Badge>}
                {p.lado && <Badge variant="default">{p.lado}</Badge>}
                {p.tipo_conteudo && <Badge variant="default">{p.tipo_conteudo}</Badge>}
                {p.url_imagem && (
                  <img src={p.url_imagem} alt="arte" className="w-8 h-8 object-contain rounded border" />
                )}
                {p.texto_conteudo && (
                  <span className="text-sm text-gray-600">&ldquo;{p.texto_conteudo}&rdquo;</span>
                )}
                {p.observacao && (
                  <span className="text-xs text-gray-400 italic">Obs: {p.observacao}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function Miniatura({ url, label }: { url?: string; label: string }) {
  return (
    <div className="w-14 h-14 rounded border bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
      {url ? (
        <img src={url} alt={label} className="w-full h-full object-contain" />
      ) : (
        <span className="text-gray-300 text-[10px] text-center leading-tight px-1">{label}</span>
      )}
    </div>
  )
}