'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { apiFetch } from '@/lib/api'
import { useMateriasPrimas } from '@/hooks/useMateriasPrimas'
import { useFornecedores } from '@/hooks/useFornecedores'
import { FileDown, ShoppingCart, RotateCcw, Send } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function apiFetchBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.blob()
}

interface ComponenteCompra {
  nome: string
  cor?: string
  quantidade: number
}

interface CompraItem {
  item_id: string
  numero_pedido: number
  cliente_nome?: string
  fornecedor_id?: string
  fornecedor_nome?: string
  fornecedor_telefone?: string
  materia_prima_nome?: string
  cor?: string
  quantidade: number
  consumo_por_unidade?: number
  unidade_consumo?: string
  consumo_total?: number
  status_compra: 'comprado' | 'nao_comprado'
  data?: string
  componentes?: ComponenteCompra[]
}

function formatWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return '55' + digits
}

function fmtNum(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

function formatData(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function CompraMateriaisPage() {
  const [items, setItems]           = useState<CompraItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [gerandoPDF, setGerandoPDF] = useState(false)
  const [alterandoStatus, setAlterandoStatus] = useState(false)
  const [selected, setSelected]     = useState<Set<string>>(new Set())

  const [dataInicio, setDataInicio]     = useState('')
  const [dataFim, setDataFim]           = useState('')
  const [mpFilter, setMpFilter]         = useState('')
  const [fornFilter, setFornFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'nao_comprado' | 'comprado'>('')

  const { materias, list: listMp }       = useMateriasPrimas()
  const { fornecedores, list: listForn } = useFornecedores()

  useEffect(() => { listMp(); listForn() }, [listMp, listForn])

  const load = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    try {
      const params = new URLSearchParams()
      if (dataInicio)  params.set('data_inicio', dataInicio)
      if (dataFim)     params.set('data_fim', dataFim)
      if (mpFilter)    params.set('materia_prima_id', mpFilter)
      if (fornFilter)  params.set('fornecedor_id', fornFilter)
      const data = await apiFetch<CompraItem[]>(`/api/compra-materiais?${params}`)
      setItems(data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [dataInicio, dataFim, mpFilter, fornFilter])

  useEffect(() => { load() }, [load])

  function toggleItem(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (filteredItems.every(i => selected.has(i.item_id))) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredItems.map(i => i.item_id)))
    }
  }

  async function handleGerarRelatorio() {
    if (selected.size === 0) return
    setGerandoPDF(true)
    try {
      const blob = await apiFetchBlob('/api/compra-materiais/relatorio', {
        method: 'POST',
        body: JSON.stringify({ item_ids: Array.from(selected) }),
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compra-materiais-${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Erro ao gerar relatório')
    } finally {
      setGerandoPDF(false)
    }
  }

  async function handleAlterarStatus(status: 'comprado' | 'nao_comprado') {
    if (selected.size === 0) return
    setAlterandoStatus(true)
    try {
      await apiFetch('/api/compra-materiais/alterar-status', {
        method: 'POST',
        body: JSON.stringify({ item_ids: Array.from(selected), status }),
      })
      await load()
    } catch {
      alert('Erro ao alterar status')
    } finally {
      setAlterandoStatus(false)
    }
  }

  // Lógica do botão "Enviar para Fornecedor"
  const selectedItems      = items.filter(i => selected.has(i.item_id))
  const fornecedoresUnicos = Array.from(new Set(selectedItems.map(i => i.fornecedor_id).filter(Boolean)))
  const podEnviarWhatsApp  =
    selectedItems.length > 0 &&
    fornecedoresUnicos.length === 1 &&
    !!selectedItems[0].fornecedor_telefone

  function handleEnviarWhatsApp() {
    if (!podEnviarWhatsApp) return
    const forn     = selectedItems[0]
    const telefone = formatWhatsAppNumber(forn.fornecedor_telefone!)

    const totais = new Map<string, { total: number; unidade: string }>()
    for (const item of selectedItems) {
      if (!item.materia_prima_nome || item.consumo_total == null) continue
      const chave = `${item.materia_prima_nome} - ${item.cor ?? 'Sem cor'}`
      const atual = totais.get(chave)
      if (atual) {
        atual.total += item.consumo_total
      } else {
        totais.set(chave, { total: item.consumo_total, unidade: item.unidade_consumo ?? '' })
      }
    }

    const linhas = Array.from(totais.entries())
      .map(([nome, { total, unidade }]) =>
        `• ${nome}: ${total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${unidade}`
      )
      .join('\n')

    const msg = [
      `Olá, ${forn.fornecedor_nome ?? 'fornecedor'}!`,
      '',
      'Segue o resumo de materiais necessários para compra:',
      '',
      linhas,
      '',
      'O relatório detalhado foi gerado e será enviado em anexo.',
    ].join('\n')

    window.open(`https://wa.me/${telefone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const filteredItems     = statusFilter ? items.filter(i => i.status_compra === statusFilter) : items
  const allSelected       = filteredItems.length > 0 && filteredItems.every(i => selected.has(i.item_id))
  const someSelected      = selected.size > 0
  const isBusy            = gerandoPDF || alterandoStatus
  const todosNaoComprados = selectedItems.length > 0 && selectedItems.every(i => i.status_compra === 'nao_comprado')
  const todosComprados    = selectedItems.length > 0 && selectedItems.every(i => i.status_compra === 'comprado')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Compra de Materiais" description="Necessidade de matéria-prima por pedido" />

        {someSelected && (
          <div className="flex items-center gap-2">
            {podEnviarWhatsApp && (
              <button
                onClick={handleEnviarWhatsApp}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white text-sm font-semibold rounded-xl shadow hover:bg-[#1ebe57] transition-colors"
              >
                <Send size={15} />
                Enviar para Fornecedor
              </button>
            )}
            {!todosComprados && (
              <button
                onClick={() => handleAlterarStatus('comprado')}
                disabled={isBusy}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {alterandoStatus ? <Spinner size="sm" /> : <ShoppingCart size={15} />}
                Marcar como Comprado ({selected.size})
              </button>
            )}
            {!todosNaoComprados && (
              <button
                onClick={() => handleAlterarStatus('nao_comprado')}
                disabled={isBusy}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-500 text-white text-sm font-semibold rounded-xl shadow hover:bg-gray-600 transition-colors disabled:opacity-60"
              >
                {alterandoStatus ? <Spinner size="sm" /> : <RotateCcw size={15} />}
                Marcar como Não Comprado ({selected.size})
              </button>
            )}
            <button
              onClick={handleGerarRelatorio}
              disabled={isBusy}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#C41E3A] text-white text-sm font-semibold rounded-xl shadow hover:bg-[#9B1C1C] transition-colors disabled:opacity-60"
            >
              <FileDown size={15} />
              {gerandoPDF ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data fim</label>
          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Matéria-Prima</label>
          <select
            value={mpFilter}
            onChange={e => setMpFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 min-w-[160px]"
          >
            <option value="">Todas</option>
            {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fornecedor</label>
          <select
            value={fornFilter}
            onChange={e => setFornFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 min-w-[160px]"
          >
            <option value="">Todos</option>
            {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as '' | 'nao_comprado' | 'comprado')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 min-w-[150px]"
          >
            <option value="">Todos</option>
            <option value="nao_comprado">Não Comprado</option>
            <option value="comprado">Comprado</option>
          </select>
        </div>
        <button
          onClick={() => { setDataInicio(''); setDataFim(''); setMpFilter(''); setFornFilter(''); setStatusFilter('') }}
          className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Limpar
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400 text-sm">
          {items.length === 0
            ? 'Nenhum pedido encontrado para os filtros selecionados'
            : 'Nenhum item com status "' + (statusFilter === 'comprado' ? 'Comprado' : 'Não Comprado') + '" nos filtros atuais'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded accent-[#C41E3A] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">N° Pedido</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fornecedor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Matéria-Prima</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cor</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Qtd. Peças</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total a Comprar</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Componentes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredItems.map((item) => {
                  const checked = selected.has(item.item_id)
                  return (
                    <tr
                      key={item.item_id}
                      onClick={() => toggleItem(item.item_id)}
                      className={`cursor-pointer transition-colors ${checked ? 'bg-rose-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleItem(item.item_id)}
                          className="w-4 h-4 rounded accent-[#C41E3A] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">#{item.numero_pedido}</td>
                      <td className="px-4 py-3 text-gray-600">{item.cliente_nome ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.fornecedor_nome ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.materia_prima_nome ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.cor ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-800 font-medium">{item.quantidade}</td>
                      <td className="px-4 py-3 text-right">
                        {item.consumo_total != null ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
                            {fmtNum(item.consumo_total)}
                            <span className="text-xs font-normal text-gray-400">{item.unidade_consumo}</span>
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatData(item.data)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status_compra} />
                      </td>
                      <td className="px-4 py-3">
                        {item.componentes && item.componentes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.componentes.map(c => (
                              <span
                                key={`${c.nome}-${c.cor}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap"
                              >
                                {c.nome}{c.cor ? ` (${c.cor})` : ''}: <strong>{fmtNum(c.quantidade)}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Totais items={filteredItems} />
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'comprado') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Comprado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Não Comprado
    </span>
  )
}

function Totais({ items }: { items: CompraItem[] }) {
  const map = new Map<string, { total: number; unidade: string }>()
  for (const item of items) {
    if (item.consumo_total == null || !item.materia_prima_nome) continue
    const existing = map.get(item.materia_prima_nome)
    if (existing) {
      existing.total += item.consumo_total
    } else {
      map.set(item.materia_prima_nome, { total: item.consumo_total, unidade: item.unidade_consumo ?? '' })
    }
  }
  if (map.size === 0) return null
  return (
    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 flex flex-wrap gap-3 items-center">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total geral:</span>
      {Array.from(map.entries()).map(([nome, { total, unidade }]) => (
        <span key={nome} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
          <span className="text-gray-500">{nome}</span>
          <span className="font-bold text-gray-900">
            {total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
          </span>
          <span className="text-xs text-gray-400">{unidade}</span>
        </span>
      ))}
    </div>
  )
}
