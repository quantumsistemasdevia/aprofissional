'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useProduction, type StatusOrdem } from '@/hooks/useProduction'
import { useOrders, type ItemPedido, type PersonalizacaoDetalhe } from '@/hooks/useOrders'
import { useCustomers } from '@/hooks/useCustomers'
import { apiFetch } from '@/lib/api'
import type { Produto } from '@/hooks/useProdutos'
import type { Modelo } from '@/hooks/useModelos'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface OrdemDetalhe {
  id: string
  empresa_id: string
  pedido_id: string
  status?: string
  iniciado_em?: string
  finalizado_em?: string
  criado_em?: string
}

interface EtapaProducao {
  id: string
  ordem_producao_id: string
  config_etapa_id: string
  status?: string
  previsao_conclusao?: string
  data_inicio?: string
  data_conclusao?: string
}

interface ConfigEtapa {
  id: string
  nome: string
  ordem: number
}

type ItemEnriquecido = ItemPedido & {
  produto?: Produto
  modelo?: Modelo
  personalizacoes?: PersonalizacaoDetalhe[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange'

const STATUS_ORDEM_VARIANT: Record<string, BadgeVariant> = {
  pendente:     'default',
  em_andamento: 'orange',
  concluida:    'success',
  cancelada:    'danger',
}
const STATUS_ORDEM_LABEL: Record<string, string> = {
  pendente:     'Pendente',
  em_andamento: 'Em Andamento',
  concluida:    'Concluída',
  cancelada:    'Cancelada',
}

const STATUS_ETAPA_VARIANT: Record<string, BadgeVariant> = {
  pendente:     'default',
  em_andamento: 'orange',
  concluido:    'success',
}
const STATUS_ETAPA_LABEL: Record<string, string> = {
  pendente:     'Pendente',
  em_andamento: 'Em Andamento',
  concluido:    'Concluído',
}

const SPEC_LABELS: Record<string, string> = {
  gola: 'Gola', mangas: 'Mangas', barras: 'Barras',
  recortes: 'Recortes', bolsos: 'Bolsos', acabamento: 'Acabamento',
  cor_unica: 'Cor Única',
}

function fmtDate(iso?: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function ProducaoDetalhePage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { updateStatus } = useProduction()
  const { getItens, getPersonalizacoes } = useOrders()
  const { clientes, list: listClientes } = useCustomers()

  const [ordem,         setOrdem]         = useState<OrdemDetalhe | null>(null)
  const [etapas,        setEtapas]        = useState<EtapaProducao[]>([])
  const [configs,       setConfigs]       = useState<ConfigEtapa[]>([])
  const [itens,         setItens]         = useState<ItemEnriquecido[]>([])
  const [loading,       setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error,         setError]         = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ordemData, etapasData] = await Promise.all([
        apiFetch<OrdemDetalhe>(`/api/production/ordens/${id}`),
        apiFetch<EtapaProducao[]>(`/api/production/ordens/${id}/etapas`),
      ])
      setOrdem(ordemData)
      setEtapas(etapasData)

      // Carregar configs para exibir nome das etapas
      const configsData = await apiFetch<ConfigEtapa[]>('/api/production/configs')
      setConfigs(configsData)

      // Carregar itens do pedido enriquecidos
      const rawItens = await getItens(ordemData.pedido_id)
      const enriquecidos = await Promise.all(
        rawItens.map(async item => {
          const [produto, modelo, personalizacoes] = await Promise.allSettled([
            apiFetch<Produto>(`/api/catalog/produtos/${item.produto_id}`),
            apiFetch<Modelo>(`/api/catalog/modelos/${item.modelo_id}`),
            getPersonalizacoes(item.id),
          ])
          return {
            ...item,
            produto:         produto.status         === 'fulfilled' ? produto.value         : undefined,
            modelo:          modelo.status          === 'fulfilled' ? modelo.value          : undefined,
            personalizacoes: personalizacoes.status === 'fulfilled' ? personalizacoes.value : [],
          }
        })
      )
      setItens(enriquecidos)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar ordem')
    } finally {
      setLoading(false)
    }
  }, [id, getItens, getPersonalizacoes])

  useEffect(() => { carregar(); listClientes() }, [carregar, listClientes])

  async function handleStatus(status: StatusOrdem) {
    if (!ordem) return
    setActionLoading(status)
    try {
      await updateStatus(ordem.id, status)
      setOrdem(prev => prev ? { ...prev, status } : prev)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao atualizar status')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleEtapaStatus(etapaId: string, status: string) {
    setActionLoading(etapaId)
    try {
      const updated = await apiFetch<EtapaProducao>(`/api/production/ordens/${id}/etapas/${etapaId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setEtapas(prev => prev.map(e => e.id === etapaId ? { ...e, ...updated } : e))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao atualizar etapa')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="flex justify-center p-16"><Spinner /></div>

  if (error || !ordem) {
    return (
      <div className="p-8 text-center text-red-600">
        {error ?? 'Ordem não encontrada'}
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
        </div>
      </div>
    )
  }

  const status      = ordem.status ?? 'pendente'
  const clienteNome = itens[0]
    ? (clientes.find(c => c.id === (itens[0] as any).cliente_id)?.nome ?? '-')
    : '-'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <PageHeader
            title="Ordem de Produção"
            description={`Pedido ${ordem.pedido_id.slice(0, 8)}…`}
          />
          <div className="mt-1 ml-1">
            <Badge variant={STATUS_ORDEM_VARIANT[status]}>
              {STATUS_ORDEM_LABEL[status] ?? status}
            </Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.back()}>← Voltar</Button>
      </div>

      {/* Ações de status da ordem */}
      <div className="flex flex-wrap gap-3">
        {status === 'pendente' && (
          <Button onClick={() => handleStatus('em_andamento')} disabled={actionLoading !== null}>
            {actionLoading === 'em_andamento' ? 'Iniciando...' : '▶ Iniciar Produção'}
          </Button>
        )}
        {status === 'em_andamento' && (
          <Button onClick={() => handleStatus('concluida')} disabled={actionLoading !== null}>
            {actionLoading === 'concluida' ? 'Concluindo...' : '✓ Concluir Produção'}
          </Button>
        )}
        {status !== 'cancelada' && status !== 'concluida' && (
          <Button variant="outline" onClick={() => handleStatus('cancelada')} disabled={actionLoading !== null}>
            {actionLoading === 'cancelada' ? 'Cancelando...' : 'Cancelar Ordem'}
          </Button>
        )}
      </div>

      {/* Dados gerais */}
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Dados da Ordem</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <Campo label="Status"       value={STATUS_ORDEM_LABEL[status] ?? status} />
          <Campo label="Criada em"    value={fmtDate(ordem.criado_em)} />
          <Campo label="Iniciada em"  value={fmtDate(ordem.iniciado_em)} />
          <Campo label="Concluída em" value={fmtDate(ordem.finalizado_em)} />
        </div>
      </Card>

      {/* Etapas */}
      {etapas.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Etapas ({etapas.length})</h2>
          <div className="space-y-3">
            {etapas
              .slice()
              .sort((a, b) => {
                const ca = configs.find(c => c.id === a.config_etapa_id)?.ordem ?? 0
                const cb = configs.find(c => c.id === b.config_etapa_id)?.ordem ?? 0
                return ca - cb
              })
              .map(etapa => {
                const cfg        = configs.find(c => c.id === etapa.config_etapa_id)
                const etapaStatus = etapa.status ?? 'pendente'
                return (
                  <div key={etapa.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        etapaStatus === 'concluido'    ? 'bg-green-500' :
                        etapaStatus === 'em_andamento' ? 'bg-orange-400' :
                        'bg-gray-300'
                      }`} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900">{cfg?.nome ?? 'Etapa'}</p>
                        <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                          {etapa.previsao_conclusao && (
                            <span>Previsão: {fmtDate(etapa.previsao_conclusao)}</span>
                          )}
                          {etapa.data_conclusao && (
                            <span>Concluída: {fmtDate(etapa.data_conclusao)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={STATUS_ETAPA_VARIANT[etapaStatus]}>
                        {STATUS_ETAPA_LABEL[etapaStatus] ?? etapaStatus}
                      </Badge>
                      {etapaStatus === 'pendente' && (
                        <Button
                          variant="outline"
                          onClick={() => handleEtapaStatus(etapa.id, 'em_andamento')}
                          disabled={actionLoading !== null}
                        >
                          Iniciar
                        </Button>
                      )}
                      {etapaStatus === 'em_andamento' && (
                        <Button
                          variant="outline"
                          onClick={() => handleEtapaStatus(etapa.id, 'concluido')}
                          disabled={actionLoading !== null}
                        >
                          Concluir
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>
      )}

      {/* Itens do pedido */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900">Itens do Pedido ({itens.length})</h2>
        {itens.length === 0 ? (
          <Card className="p-6 text-center text-gray-400">Nenhum item encontrado</Card>
        ) : (
          itens.map((item, idx) => (
            <ItemCard key={item.id} item={item} idx={idx + 1} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  )
}

function ItemCard({ item, idx }: { item: ItemEnriquecido; idx: number }) {
  const tamanhos = item.tamanhos_quantidades ?? {}
  const specs    = item.especificacoes_modelo ?? {}

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
          <p className="font-semibold text-gray-900">
            Item {idx} — {item.produto?.nome ?? 'Produto'}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex gap-2">
              <Miniatura url={item.modelo?.url_imagem_frente} label="Frente" />
              <Miniatura url={item.modelo?.url_imagem_verso}  label="Verso"  />
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

          {item.cor && (
            <div className="mt-2 text-sm">
              <span className="text-gray-600">Cor: <strong>{item.cor}</strong></span>
            </div>
          )}

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
              Unitário: <strong className="text-gray-900">
                {item.preco_unitario ? `R$ ${Number(item.preco_unitario).toFixed(2)}` : '-'}
              </strong>
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
                {p.tipo         && <Badge variant="info">{p.tipo}</Badge>}
                {p.lado         && <Badge variant="default">{p.lado}</Badge>}
                {p.tipo_conteudo && <Badge variant="default">{p.tipo_conteudo}</Badge>}
                {p.url_imagem   && <img src={p.url_imagem} alt="arte" className="w-8 h-8 object-contain rounded border" />}
                {p.texto_conteudo && <span className="text-sm text-gray-600">&ldquo;{p.texto_conteudo}&rdquo;</span>}
                {p.observacao && <span className="text-xs text-gray-400 italic">Obs: {p.observacao}</span>}
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