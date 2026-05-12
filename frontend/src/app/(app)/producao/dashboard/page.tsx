'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { apiFetch } from '@/lib/api'
import { RefreshCw } from 'lucide-react'

interface DashboardItem {
  ordem_id: string
  pedido_id: string
  pedido_numero: number
  cliente_nome: string
  quantidade: number
  previsao_entrega?: string
  config_etapa_id: string
  etapa_nome: string
  etapa_ordem: number
  etapa_id: string
  etapa_status: string
  etapa_previsao?: string
}

const PHASE_COLORS = [
  { bg: 'bg-blue-50',   border: 'border-blue-400',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-400'   },
  { bg: 'bg-violet-50', border: 'border-violet-400',  text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400' },
  { bg: 'bg-orange-50', border: 'border-orange-400',  text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  { bg: 'bg-green-50',  border: 'border-green-400',   text: 'text-green-700',  badge: 'bg-green-100 text-green-700',  dot: 'bg-green-400'  },
  { bg: 'bg-pink-50',   border: 'border-pink-400',    text: 'text-pink-700',   badge: 'bg-pink-100 text-pink-700',    dot: 'bg-pink-400'   },
  { bg: 'bg-cyan-50',   border: 'border-cyan-400',    text: 'text-cyan-700',   badge: 'bg-cyan-100 text-cyan-700',    dot: 'bg-cyan-400'   },
]

function situacao(previsao?: string): { label: string; variant: 'success' | 'warning' | 'danger' | 'default' } {
  if (!previsao) return { label: 'Sem prazo', variant: 'default' }
  const diff = (new Date(previsao).getTime() - Date.now()) / 86_400_000
  if (diff < 0)  return { label: 'Atrasado', variant: 'danger' }
  if (diff <= 3) return { label: 'Atenção',  variant: 'warning' }
  return { label: 'No prazo', variant: 'success' }
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  const datePart = iso.split('T')[0]
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return '—'
  return `${day}/${month}/${year}`
}

export default function DashboardProducaoPage() {
  const router = useRouter()
  const [items,     setItems]     = useState<DashboardItem[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filtro,    setFiltro]    = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date>(new Date())

  const scrollRef   = useRef<HTMLDivElement>(null)
  const isDragging  = useRef(false)
  const startX      = useRef(0)
  const scrollLeft  = useRef(0)
  const didDrag     = useRef(false)

  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true
    didDrag.current    = false
    startX.current     = e.pageX - (scrollRef.current?.offsetLeft ?? 0)
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0
    scrollRef.current?.style.setProperty('cursor', 'grabbing')
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    const x    = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.2
    if (Math.abs(walk) > 4) didDrag.current = true
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }

  function onMouseUp() {
    isDragging.current = false
    scrollRef.current?.style.setProperty('cursor', 'grab')
  }

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<DashboardItem[]>('/api/production/dashboard')
      setItems(data ?? [])
      setLastFetch(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // Atualiza a cada 30 segundos
  useEffect(() => {
    const id = setInterval(carregar, 30_000)
    return () => clearInterval(id)
  }, [carregar])

  // Fases únicas na ordem definida
  const fases = Array.from(
    new Map(items.map(i => [i.config_etapa_id, { id: i.config_etapa_id, nome: i.etapa_nome, ordem: i.etapa_ordem }]))
    .values()
  ).sort((a, b) => a.ordem - b.ordem)

  const faseAtiva = filtro ?? null
  const itensFiltrados = faseAtiva
    ? items.filter(i => i.config_etapa_id === faseAtiva)
    : items

  const faseAtivaNome = fases.find(f => f.id === faseAtiva)?.nome ?? 'Todas as fases'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Dashboard de Produção"
          description="Visualize onde cada pedido está no fluxo de produção"
        />
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-gray-400">
            Atualizado {lastFetch.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={carregar}
            disabled={loading}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-40"
            title="Atualizar"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-gray-400' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* Cards de fase */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto cursor-grab select-none no-scrollbar"
            style={{ scrollbarWidth: 'none' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {fases.map((fase, idx) => {
              const cor    = PHASE_COLORS[idx % PHASE_COLORS.length]
              const count  = items.filter(i => i.config_etapa_id === fase.id).length
              const ativo  = faseAtiva === fase.id
              return (
                <button
                  key={fase.id}
                  onClick={() => { if (!didDrag.current) setFiltro(ativo ? null : fase.id) }}
                  className={`
                    flex-shrink-0 w-44 text-left p-4 rounded-lg border-l-4 transition-all shadow-sm
                    ${cor.bg} ${cor.border}
                    ${ativo ? 'ring-2 ring-offset-1 ring-gray-400 shadow-md' : 'hover:shadow-md'}
                  `}
                >
                  <p className={`font-semibold text-sm ${cor.text}`}>{fase.nome}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{count === 1 ? 'pedido' : 'pedidos'}</p>
                </button>
              )
            })}

            {fases.length === 0 && !loading && (
              <div className="col-span-full">
                <Card className="p-8 text-center text-gray-400 text-sm">
                  Nenhum pedido em produção no momento.
                </Card>
              </div>
            )}
          </div>

          {fases.length > 0 && (
            <>
              {/* Filtro por fase */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-500 mr-1">Filtrar por fase:</span>
                <button
                  onClick={() => setFiltro(null)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    faseAtiva === null
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todas
                </button>
                {fases.map((fase, idx) => {
                  const cor   = PHASE_COLORS[idx % PHASE_COLORS.length]
                  const ativo = faseAtiva === fase.id
                  return (
                    <button
                      key={fase.id}
                      onClick={() => setFiltro(ativo ? null : fase.id)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        ativo
                          ? `${cor.dot.replace('bg-', 'bg-')} text-white ${cor.dot}`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={ativo ? {} : {}}
                    >
                      {fase.nome}
                    </button>
                  )
                })}
              </div>

              {/* Tabela */}
              <Card className="overflow-hidden">
                <div className="px-5 py-3 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-700 text-sm">
                    Pedidos — <span className="text-blue-600">{faseAtivaNome}</span>
                    <span className="ml-2 text-gray-400 font-normal">({itensFiltrados.length})</span>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                        <th className="px-5 py-3">#Pedido</th>
                        <th className="px-5 py-3">Cliente</th>
                        <th className="px-5 py-3">Qtd Peças</th>
                        <th className="px-5 py-3">Fase Atual</th>
                        <th className="px-5 py-3">Previsão Entrega</th>
                        <th className="px-5 py-3">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {itensFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                            Nenhum pedido nesta fase.
                          </td>
                        </tr>
                      ) : (
                        itensFiltrados.map((item, idx) => {
                          const sit   = situacao(item.previsao_entrega)
                          const faseIdx = fases.findIndex(f => f.id === item.config_etapa_id)
                          const cor   = PHASE_COLORS[faseIdx % PHASE_COLORS.length]
                          return (
                            <tr
                              key={item.ordem_id}
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/producao/${item.ordem_id}`)}
                            >
                              <td className="px-5 py-3">
                                <span className="font-semibold text-blue-600">
                                  #{String(item.pedido_numero).padStart(4, '0')}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-gray-700">
                                {item.cliente_nome || '—'}
                              </td>
                              <td className="px-5 py-3 text-gray-600">
                                {item.quantidade} {item.quantidade === 1 ? 'pç' : 'pçs'}
                              </td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cor.badge}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cor.dot}`} />
                                  {item.etapa_nome}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-gray-600">
                                {fmtDate(item.previsao_entrega)}
                              </td>
                              <td className="px-5 py-3">
                                <Badge variant={sit.variant}>{sit.label}</Badge>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
