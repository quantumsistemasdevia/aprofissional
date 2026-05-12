'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, ClipboardList, PlusCircle, CheckCircle, Lightbulb, Pencil, Trash2 } from 'lucide-react'
import { useWizard, type ItemResumoWizard } from '../WizardProvider'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { apiFetch } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { criarPedidoSchema } from '@/lib/validations/pedido.schema'

const DISPLAY_W = 168
const DISPLAY_H = 202
const THUMB_W   = 56
const THUMB_H   = 68

const METODOS_PAGAMENTO = [
  { value: 'pix',            label: 'Pix' },
  { value: 'dinheiro',       label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito',  label: 'Cartão de Débito' },
  { value: 'boleto',         label: 'Boleto' },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const tipoLabel: Record<string, string> = {
  serigrafia: 'Serigrafia', DTF: 'DTF', bordado: 'Bordado', sublimacao: 'Sublimação',
}

type SaveAction = 'outro-item' | 'finalizar' | 'orcamento' | 'ficha' | null

// ── Modal de Forma de Pagamento ────────────────────────────────────────────

function ModalFormaPagamento({
  isOpen,
  onClose,
  onConfirm,
  totalGeral,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (metodo: string | undefined, multiplos?: { metodo: string; valor: number }[], observacao?: string) => void
  totalGeral: number
}) {
  const [isMultiple, setIsMultiple] = useState(false)
  const [selectedSingle, setSelectedSingle] = useState('')
  const [pagamentos, setPagamentos] = useState<{ metodo: string; valor: number }[]>([])
  const [observacao, setObservacao] = useState('')

  const somaMultiplos = pagamentos.reduce((s, p) => s + (p.valor || 0), 0)
  const somaCerta = pagamentos.length > 0 && Math.abs(somaMultiplos - totalGeral) < 0.01
  const canConfirm = isMultiple ? somaCerta : true

  function toggleMetodo(metodo: string) {
    if (!isMultiple) {
      setSelectedSingle(prev => (prev === metodo ? '' : metodo))
      return
    }
    setPagamentos(prev =>
      prev.some(p => p.metodo === metodo)
        ? prev.filter(p => p.metodo !== metodo)
        : [...prev, { metodo, valor: 0 }]
    )
  }

  function handleCheckbox(checked: boolean) {
    setIsMultiple(checked)
    setPagamentos([])
    setSelectedSingle('')
  }

  function handleConfirm() {
    const obs = observacao.trim() || undefined
    if (isMultiple) {
      onConfirm(pagamentos[0]?.metodo || undefined, pagamentos, obs)
    } else {
      onConfirm(selectedSingle || undefined, undefined, obs)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Forma de Pagamento" size="sm">
      <div className="space-y-4">

        {/* Total do pedido */}
        <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-600 font-medium">Total do pedido</span>
          <span className="text-lg font-bold text-brand-primary">{brl(totalGeral)}</span>
        </div>

        {/* Checkbox múltiplas formas */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isMultiple}
            onChange={e => handleCheckbox(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Selecionar mais de uma forma de pagamento</span>
        </label>

        {/* Métodos */}
        <div className="grid grid-cols-2 gap-2">
          {METODOS_PAGAMENTO.map(m => {
            const isSelected = isMultiple
              ? pagamentos.some(p => p.metodo === m.value)
              : selectedSingle === m.value
            return (
              <div key={m.value} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => toggleMetodo(m.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors
                    ${isSelected
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-brand-primary hover:bg-red-50'
                    }`}
                >
                  {m.label}
                </button>
                {isMultiple && isSelected && (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={pagamentos.find(p => p.metodo === m.value)?.valor || ''}
                    onChange={e => {
                      const v = parseFloat(e.target.value) || 0
                      setPagamentos(prev =>
                        prev.map(p => p.metodo === m.value ? { ...p, valor: v } : p)
                      )
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Resumo de múltiplos pagamentos */}
        {isMultiple && pagamentos.length > 0 && (
          <div className={`rounded-lg px-4 py-3 text-sm border ${
            somaCerta ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex justify-between font-medium">
              <span className={somaCerta ? 'text-green-700' : 'text-red-700'}>
                Soma das formas
              </span>
              <span className={somaCerta ? 'text-green-700' : 'text-red-700'}>
                {brl(somaMultiplos)}
              </span>
            </div>
            {!somaCerta && (
              <p className="text-red-600 text-xs mt-1">
                {somaMultiplos < totalGeral
                  ? `Faltam ${brl(totalGeral - somaMultiplos)} para igualar o total`
                  : `Excede o total em ${brl(somaMultiplos - totalGeral)}`}
              </p>
            )}
          </div>
        )}

        {/* Observação geral */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observação geral do pedido <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Ex: prazo urgente, embalagem especial, instrução de entrega…"
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
          />
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity
              ${canConfirm ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-300 cursor-not-allowed'}`}
          >
            Confirmar e Finalizar
          </button>
        </div>

      </div>
    </Modal>
  )
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

function CanvasPreview({ dataUrl, label }: { dataUrl?: string; label: string }) {
  return (
    <div className="flex flex-col" style={{ borderRight: label === 'Frente' ? '1px solid #f3f4f6' : undefined }}>
      <div className="bg-gray-100 text-center py-1.5 px-6">
        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-center justify-center p-3 bg-white">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`Preview ${label}`}
            width={DISPLAY_W}
            height={DISPLAY_H}
            style={{ width: DISPLAY_W, height: DISPLAY_H, objectFit: 'contain', borderRadius: 4 }}
          />
        ) : (
          <div className="bg-gray-100 rounded flex items-center justify-center" style={{ width: DISPLAY_W, height: DISPLAY_H }}>
            <TshirtIcon />
          </div>
        )}
      </div>
    </div>
  )
}

function TshirtIcon() {
  return (
    <svg viewBox="0 0 100 120" className="w-14 h-16 opacity-20">
      <rect x="22" y="26" width="56" height="86" rx="4" fill="#6b7280" />
      <rect x="7"  y="22" width="24" height="12" rx="2" fill="#6b7280" />
      <rect x="69" y="22" width="24" height="12" rx="2" fill="#6b7280" />
      <ellipse cx="50" cy="26" rx="12" ry="8" fill="#f3f4f6" />
      <rect x="3"  y="32" width="22" height="36" rx="3" fill="#6b7280" />
      <rect x="75" y="32" width="22" height="36" rx="3" fill="#6b7280" />
    </svg>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="w-36 shrink-0 text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm text-gray-800 leading-snug">{value || '—'}</span>
    </div>
  )
}

function ActionBtn({
  icon, label, bg, disabled, loading, onClick,
}: {
  icon: React.ReactNode
  label: string
  bg: string
  disabled?: boolean
  loading?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white text-sm font-semibold
        transition-opacity ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'} ${bg}`}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {label}
    </button>
  )
}

function ItemAdicionadoCard({
  item, index, onEditar, onRemover, removendo, disabled,
}: {
  item: ItemResumoWizard
  index: number
  onEditar: () => void
  onRemover: () => void
  removendo: boolean
  disabled: boolean
}) {
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
      <div className="shrink-0">
        {item.preview_frente_url ? (
          <img
            src={item.preview_frente_url}
            alt="Preview"
            style={{ width: THUMB_W, height: THUMB_H, objectFit: 'contain' }}
            className="rounded border border-gray-100"
          />
        ) : (
          <div className="bg-gray-100 rounded flex items-center justify-center" style={{ width: THUMB_W, height: THUMB_H }}>
            <TshirtIcon />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Item {index}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{item.produtoNome}</p>
        <p className="text-xs text-gray-500">
          {[item.modeloNome !== '—' ? item.modeloNome : null, item.cor].filter(Boolean).join(' · ')}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          {item.quantidade} pçs{item.total ? ` · ${brl(item.total)}` : ''}
        </p>
      </div>

      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={onEditar}
          disabled={disabled}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
        >
          <Pencil size={12} />
          Editar
        </button>
        <button
          onClick={onRemover}
          disabled={disabled || removendo}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
        >
          {removendo ? <Spinner size="sm" /> : <Trash2 size={12} />}
          Remover
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export function StepResumo() {
  const {
    state, setCurrentStep, reset,
    setPedidoId,
    adicionarItemFinalizado,
    atualizarItemFinalizado,
    iniciarEdicaoItem,
    removerItemDaLista,
  } = useWizard()
  const router = useRouter()

  const [clienteNome,  setClienteNome]  = useState('')
  const [vendedorNome, setVendedorNome] = useState('')
  const [produtoNome,  setProdutoNome]  = useState('')
  const [modeloNome,   setModeloNome]   = useState('')
  const [materiaNome,  setMateriaNome]  = useState('')

  const [savedItemId,    setSavedItemId]    = useState<string | null>(null)
  const [activeAction,   setActiveAction]   = useState<SaveAction>(null)
  const [error,          setError]          = useState<string | null>(null)
  const [removendoItemId, setRemovendoItemId] = useState<string | null>(null)
  const [showModalPagamento, setShowModalPagamento] = useState(false)
  const formaPagamentoRef = useRef<string | undefined>(undefined)
  const observacoesRef    = useRef<string | null>(null)

  useEffect(() => {
    if (state.pedido.cliente_id)
      apiFetch<{ id: string; nome: string }>(`/api/customers/${state.pedido.cliente_id}`)
        .then(c => setClienteNome(c.nome)).catch(() => {})

    if (state.item.produto_id)
      apiFetch<{ id: string; nome: string }>(`/api/catalog/produtos/${state.item.produto_id}`)
        .then(p => setProdutoNome(p.nome)).catch(() => {})

    if (state.pedido.vendedor_id)
      apiFetch<{ id: string; nome: string }[]>('/api/users')
        .then(us => { const u = us.find(x => x.id === state.pedido.vendedor_id); if (u) setVendedorNome(u.nome) })
        .catch(() => {})

    if (state.item.materia_prima_id)
      apiFetch<{ id: string; nome: string }>(`/api/catalog/materias-primas/${state.item.materia_prima_id}`)
        .then(m => setMateriaNome(m.nome)).catch(() => {})

    if (state.item.modelo_id)
      apiFetch<{ id: string; nome: string }>(`/api/catalog/modelos/${state.item.modelo_id}`)
        .then(m => setModeloNome(m.nome)).catch(() => {})
  }, [
    state.pedido.cliente_id, state.item.produto_id,
    state.pedido.vendedor_id, state.item.materia_prima_id, state.item.modelo_id,
  ])

  // ── Cálculos ───────────────────────────────────────────────────────────────
  const qtdTotal    = Object.values(state.item.tamanhos_quantidades).reduce((a, b) => a + b, 0)
  const totalBruto  = (state.item.valor_unitario ?? 0) * qtdTotal
  const desconto    = state.item.desconto ?? 0
  const totalLiquido =
    state.item.tipo_desconto === 'percentual'
      ? totalBruto * (1 - desconto / 100)
      : Math.max(0, totalBruto - desconto)
  const totalGeral = totalLiquido + state.itensAdicionados.reduce((s, i) => s + (i.total ?? 0), 0)

  // ── Strings do sumário ─────────────────────────────────────────────────────
  const produtoDesc = [produtoNome, materiaNome, state.item.cor].filter(Boolean).join(' · ')

  const tamanhosDesc = (() => {
    const byGroup: Record<string, string[]> = {}
    Object.entries(state.item.tamanhos_quantidades)
      .filter(([, q]) => q > 0)
      .forEach(([key, q]) => {
        const [grupo, nome] = key.includes('/') ? key.split('/', 2) : ['', key]
        if (!byGroup[grupo]) byGroup[grupo] = []
        byGroup[grupo].push(`${nome}:${q}`)
      })
    const parts = Object.entries(byGroup).map(([g, sizes]) =>
      g ? `${g}: ${sizes.join(' ')}` : sizes.join(' ')
    )
    return parts.length ? `${parts.join('  |  ')}  →  ${qtdTotal} pçs` : 'Nenhum'
  })()

  const persDesc = state.item.arte_pronta
    ? 'Arte Pronta'
    : state.personalizacoes.length === 0
      ? 'Nenhuma'
      : state.personalizacoes
          .map(p => {
            const tipoStr = p.tipo === 'sublimacao' && p.sublimacao_tipo
              ? `Sublimação ${p.sublimacao_tipo === 'total' ? 'Total' : 'Parcial'}`
              : (tipoLabel[p.tipo] ?? p.tipo)
            const parts = [
              `${tipoStr} ${p.local_id ?? p.lado}`,
              p.texto_conteudo || (p.url_imagem ? 'Arte' : null),
              p.cores.length ? p.cores.join(' e ') : null,
            ].filter(Boolean)
            return parts.join(' · ')
          })
          .join(' | ')

  const qtdValorDesc = (() => {
    const base = `${qtdTotal} pçs × ${brl(state.item.valor_unitario ?? 0)}`
    if (!desconto) return `${base} = ${brl(totalLiquido)}`
    const descontoStr = state.item.tipo_desconto === 'percentual'
      ? `– ${desconto}%`
      : `– ${brl(desconto)}`
    return `${base} ${descontoStr} = ${brl(totalLiquido)}`
  })()

  // ── Helpers internos ───────────────────────────────────────────────────────
  function buildItemPayload() {
    return {
      produto_id:            state.item.produto_id,
      modelo_id:             state.item.modelo_id         || undefined,
      materia_prima_id:      state.item.materia_prima_id  || undefined,
      fornecedor_id:         state.item.fornecedor_id     || undefined,
      cor:                   state.item.cor               || undefined,
      tamanhos_quantidades:  state.item.tamanhos_quantidades ?? {},
      quantidade:            qtdTotal,
      preco_unitario:        state.item.valor_unitario    ?? 0,
      tipo_desconto:         state.item.tipo_desconto     ?? 'fixo',
      desconto:              state.item.desconto          ?? 0,
      especificacoes_modelo: state.item.especificacoes_modelo ?? {},
      preview_frente_url:    state.preview_frente_url     || undefined,
      preview_verso_url:     state.preview_verso_url      || undefined,
      produto_pronto:        state.item.produto_pronto    ?? false,
    }
  }

  function buildItemResumo(itemId: string): ItemResumoWizard {
    return {
      id:                 itemId,
      produtoNome:        produtoNome || (state.item.produto_id ?? '—'),
      modeloNome:         state.item.produto_pronto ? 'Produto Pronto' : (modeloNome || '—'),
      cor:                state.item.cor,
      quantidade:         qtdTotal,
      total:              totalLiquido,
      preview_frente_url: state.preview_frente_url,
      preview_verso_url:  state.preview_verso_url,
      itemData:           { ...state.item },
      personalizacoes:    [...state.personalizacoes],
    }
  }

  async function salvarPersonalizacoes(itemId: string) {
    if (state.personalizacoes.length === 0) return
    await Promise.all(
      state.personalizacoes.map(p => apiFetch('/api/personalizations', {
        method: 'POST',
        body: JSON.stringify({
          item_pedido_id: itemId,
          tipo:           p.tipo,
          cores:          p.cores && p.cores.length > 0 ? p.cores : undefined,
          tipo_conteudo:  p.tipo_conteudo,
          url_imagem:     p.url_imagem     || undefined,
          texto_conteudo: p.texto_conteudo || undefined,
          texto_fonte:    p.texto_fonte    || undefined,
          lado:           p.lado,
          localizacao:    p.local_id       || undefined,
          canvas_x:       p.canvas_x,
          canvas_y:       p.canvas_y,
          canvas_escala:  p.canvas_escala,
          canvas_rotacao: p.canvas_rotacao,
          observacao:     p.observacao     || undefined,
        }),
      }))
    )
  }

  async function recriarPersonalizacoes(itemId: string) {
    const existentes = await apiFetch<{ id: string }[]>(`/api/personalizations/item/${itemId}`)
    await Promise.all(existentes.map(p => apiFetch(`/api/personalizations/${p.id}`, { method: 'DELETE' })))
    await salvarPersonalizacoes(itemId)
  }

  // ── Funções de persistência ────────────────────────────────────────────────

  async function criarPedidoEItem(): Promise<{ pedidoId: string; itemId: string } | null> {
    const validation = criarPedidoSchema.safeParse({
      cliente_id:       state.pedido.cliente_id  ?? '',
      previsao_entrega: state.pedido.previsao_entrega ?? '',
      vendedor_id:      state.pedido.vendedor_id,
      item: {
        produto_id:            state.item.produto_id ?? '',
        modelo_id:             state.item.produto_pronto ? undefined : (state.item.modelo_id || undefined),
        materia_prima_id:      state.item.materia_prima_id,
        cor:                   state.item.cor || undefined,
        tamanhos_quantidades:  state.item.tamanhos_quantidades,
        valor_unitario:        state.item.valor_unitario ?? 0,
        tipo_desconto:         state.item.tipo_desconto,
        desconto:              state.item.desconto,
        especificacoes_modelo: state.item.especificacoes_modelo,
      },
      personalizacoes: state.personalizacoes,
    })
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Dados inválidos')
      return null
    }

    const pedido = await apiFetch<{ id: string }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        cliente_id:       state.pedido.cliente_id       || undefined,
        vendedor_id:      state.pedido.vendedor_id      || undefined,
        previsao_entrega: state.pedido.previsao_entrega
          ? `${state.pedido.previsao_entrega}T00:00:00Z` : undefined,
        observacoes:      observacoesRef.current !== null ? (observacoesRef.current || undefined) : (state.pedido.observacoes || undefined),
        forma_pagamento:  formaPagamentoRef.current     ?? state.pedido.forma_pagamento ?? undefined,
      }),
    })
    setPedidoId(pedido.id)

    const itemCriado = await apiFetch<{ id: string }>(`/api/orders/${pedido.id}/items`, {
      method: 'POST',
      body: JSON.stringify(buildItemPayload()),
    })
    await salvarPersonalizacoes(itemCriado.id)
    setSavedItemId(itemCriado.id)
    return { pedidoId: pedido.id, itemId: itemCriado.id }
  }

  async function criarItemEmPedidoExistente(pedidoId: string): Promise<{ pedidoId: string; itemId: string } | null> {
    if (!state.item.produto_id) {
      setError('Produto é obrigatório')
      return null
    }
    if (!state.item.produto_pronto && !state.item.modelo_id) {
      setError('Selecione um modelo antes de continuar')
      return null
    }
    const itemCriado = await apiFetch<{ id: string }>(`/api/orders/${pedidoId}/items`, {
      method: 'POST',
      body: JSON.stringify(buildItemPayload()),
    })
    await salvarPersonalizacoes(itemCriado.id)
    setSavedItemId(itemCriado.id)
    return { pedidoId, itemId: itemCriado.id }
  }

  async function atualizarItemExistente(pedidoId: string, itemId: string): Promise<{ pedidoId: string; itemId: string } | null> {
    await apiFetch(`/api/orders/${pedidoId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(buildItemPayload()),
    })
    await recriarPersonalizacoes(itemId)
    setSavedItemId(itemId)
    return { pedidoId, itemId }
  }

  async function salvarEdicaoCompleta({ pedidoId, itemId }: { pedidoId: string; itemId: string }): Promise<{ pedidoId: string; itemId: string } | null> {
    await apiFetch(`/api/orders/${pedidoId}`, {
      method: 'PUT',
      body: JSON.stringify({
        cliente_id:       state.pedido.cliente_id       || undefined,
        vendedor_id:      state.pedido.vendedor_id      || undefined,
        previsao_entrega: state.pedido.previsao_entrega
          ? `${state.pedido.previsao_entrega}T00:00:00Z` : undefined,
        observacoes:      observacoesRef.current !== null ? (observacoesRef.current || undefined) : (state.pedido.observacoes || undefined),
        forma_pagamento:  formaPagamentoRef.current     ?? state.pedido.forma_pagamento ?? undefined,
      }),
    })
    await apiFetch(`/api/orders/${pedidoId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(buildItemPayload()),
    })
    await recriarPersonalizacoes(itemId)
    setSavedItemId(itemId)
    return { pedidoId, itemId }
  }

  async function ensureSaved(): Promise<{ pedidoId: string; itemId: string } | null> {
    const curPedidoId = state.pedidoId ?? state.editMode?.pedidoId
    if (savedItemId && curPedidoId) {
      return { pedidoId: curPedidoId, itemId: savedItemId }
    }
    setError(null)
    try {
      if (state.editMode) {
        return await salvarEdicaoCompleta(state.editMode)
      }
      if (state.editandoItemId && state.pedidoId) {
        return await atualizarItemExistente(state.pedidoId, state.editandoItemId)
      }
      if (state.pedidoId) {
        return await criarItemEmPedidoExistente(state.pedidoId)
      }
      return await criarPedidoEItem()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
      return null
    }
  }

  // ── Ações dos botões ───────────────────────────────────────────────────────

  async function abrirPdf(tipo: 'orcamento' | 'ficha-producao') {
    const action = tipo === 'orcamento' ? 'orcamento' : 'ficha'
    setActiveAction(action)
    try {
      const result = await ensureSaved()
      if (!result) return
      const { data: { session } } = await createClient().auth.getSession()
      const res = await fetch(`${API_URL}/api/orders/${result.pedidoId}/${tipo}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      if (!res.ok) throw new Error('Falha ao gerar PDF')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 15_000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar PDF')
    } finally {
      setActiveAction(null)
    }
  }

  async function adicionarOutroItem() {
    setActiveAction('outro-item')
    try {
      const result = await ensureSaved()
      if (!result) return
      const resumo = buildItemResumo(result.itemId)
      if (state.editandoItemId) {
        atualizarItemFinalizado(resumo)
      } else {
        adicionarItemFinalizado(resumo)
      }
      setCurrentStep(2)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar item')
    } finally {
      setActiveAction(null)
    }
  }

  function finalizarPedido() {
    setShowModalPagamento(true)
  }

  async function confirmarFinalizacao(metodo: string | undefined, multiplos?: { metodo: string; valor: number }[], observacao?: string) {
    formaPagamentoRef.current = multiplos && multiplos.length > 1
      ? JSON.stringify(multiplos)
      : metodo
    observacoesRef.current = observacao ?? ''
    setShowModalPagamento(false)
    setActiveAction('finalizar')
    try {
      const result = await ensureSaved()
      if (!result) return
      reset()
      router.push(`/pedidos/${result.pedidoId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao finalizar pedido')
      setActiveAction(null)
    }
  }

  async function removerItem(itemId: string) {
    if (!state.pedidoId) return
    setRemovendoItemId(itemId)
    setError(null)
    try {
      await apiFetch(`/api/orders/${state.pedidoId}/items/${itemId}`, { method: 'DELETE' })
      removerItemDaLista(itemId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover item')
    } finally {
      setRemovendoItemId(null)
    }
  }

  // ── Labels dinâmicos ───────────────────────────────────────────────────────
  const numItens    = state.itensAdicionados.length
  const isBusy      = activeAction !== null || removendoItemId !== null

  const headerLabel = state.editMode
    ? 'Editar Pedido — Item 1'
    : state.editandoItemId
    ? 'Editando Item'
    : numItens > 0
    ? `Item ${numItens + 1} em configuração`
    : 'Resumo do Pedido — Item 1'

  const pedidoLabel = clienteNome
    ? `${state.editMode ? 'Editando' : 'Novo'} · ${clienteNome}`
    : state.editMode ? 'Editando pedido' : 'Novo pedido'

  return (
    <>
    <ModalFormaPagamento
      isOpen={showModalPagamento}
      onClose={() => setShowModalPagamento(false)}
      onConfirm={confirmarFinalizacao}
      totalGeral={totalGeral}
    />

    <div className="space-y-3">

      {/* ── Itens já adicionados ──────────────────────────────────────────── */}
      {numItens > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-0.5">
            Itens adicionados ({numItens})
          </p>
          {state.itensAdicionados.map((item, idx) => (
            <ItemAdicionadoCard
              key={item.id}
              item={item}
              index={idx + 1}
              onEditar={() => iniciarEdicaoItem(item.id)}
              onRemover={() => removerItem(item.id)}
              removendo={removendoItemId === item.id}
              disabled={isBusy}
            />
          ))}
          <div className="border-t border-dashed border-gray-200 pt-1" />
        </div>
      )}

      {/* ── Card do item atual ────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="bg-brand-primary text-white px-5 py-3">
          <h2 className="font-semibold text-base tracking-wide">{headerLabel}</h2>
        </div>

        <div className="flex bg-white">
          <div className="flex-1 px-6 py-4">
            <Row label="Pedido:"         value={pedidoLabel} />
            <Row label="Vendedor:"       value={vendedorNome} />
            <Row label="Produto:"        value={produtoDesc} />
            <Row label="Tamanhos:"       value={tamanhosDesc} />
            <Row label="Personalização:" value={persDesc} />
            <Row label="Qtd / Valor:"    value={qtdValorDesc} />
          </div>

          <div className="flex shrink-0 border-l border-gray-100">
            {state.item.arte_pronta ? (
              <div className="flex items-center justify-center p-3 bg-white">
                {state.preview_frente_url ? (
                  <img
                    src={state.preview_frente_url}
                    alt="Arte Pronta"
                    style={{ width: DISPLAY_W, height: DISPLAY_H, objectFit: 'contain', borderRadius: 4 }}
                  />
                ) : (
                  <div className="bg-gray-100 rounded flex items-center justify-center" style={{ width: DISPLAY_W, height: DISPLAY_H }}>
                    <TshirtIcon />
                  </div>
                )}
              </div>
            ) : (
              <>
                <CanvasPreview dataUrl={state.preview_frente_url} label="Frente" />
                <CanvasPreview dataUrl={state.preview_verso_url}  label="Verso"  />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Dica ─────────────────────────────────────────────────────────── */}
      {!state.editMode && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <Lightbulb size={15} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-700">
            Pode adicionar quantos itens quiser ao mesmo pedido antes de finalizar.
          </p>
        </div>
      )}

      {/* ── Erro ─────────────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      {/* ── Ações ────────────────────────────────────────────────────────── */}
      {state.editMode ? (
        <div className="grid grid-cols-3 gap-2">
          <ActionBtn
            icon={<FileText size={16} />}
            label="Orçamento"
            bg="bg-slate-800"
            disabled={isBusy}
            loading={activeAction === 'orcamento'}
            onClick={() => abrirPdf('orcamento')}
          />
          <ActionBtn
            icon={<ClipboardList size={16} />}
            label="Ficha de Produção"
            bg="bg-green-600"
            disabled={isBusy}
            loading={activeAction === 'ficha'}
            onClick={() => abrirPdf('ficha-producao')}
          />
          <ActionBtn
            icon={<CheckCircle size={16} />}
            label="Salvar Alterações"
            bg="bg-orange-500"
            disabled={isBusy}
            loading={activeAction === 'finalizar'}
            onClick={finalizarPedido}
          />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <ActionBtn
            icon={<FileText size={16} />}
            label="Orçamento"
            bg="bg-slate-800"
            disabled={isBusy}
            loading={activeAction === 'orcamento'}
            onClick={() => abrirPdf('orcamento')}
          />
          <ActionBtn
            icon={<ClipboardList size={16} />}
            label="Ficha de Produção"
            bg="bg-green-600"
            disabled={isBusy}
            loading={activeAction === 'ficha'}
            onClick={() => abrirPdf('ficha-producao')}
          />
          <ActionBtn
            icon={<PlusCircle size={16} />}
            label="+ Outro Item"
            bg="bg-gray-500"
            disabled={isBusy}
            loading={activeAction === 'outro-item'}
            onClick={adicionarOutroItem}
          />
          <ActionBtn
            icon={<CheckCircle size={16} />}
            label="Finalizar Pedido"
            bg="bg-orange-500"
            disabled={isBusy}
            loading={activeAction === 'finalizar'}
            onClick={finalizarPedido}
          />
        </div>
      )}

      {/* ── Voltar ───────────────────────────────────────────────────────── */}
      <div>
        <Button variant="outline" onClick={() => setCurrentStep(9)}>← Anterior</Button>
      </div>

    </div>
    </>
  )
}
