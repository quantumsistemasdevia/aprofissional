'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Personalizacao } from '@/types'

// Resumo de um item já salvo no pedido (para exibição no step 10 e edição)
export interface ItemResumoWizard {
  id: string
  produtoNome: string
  modeloNome: string
  cor?: string
  quantidade: number
  total?: number
  preview_frente_url?: string
  preview_verso_url?: string
  // dados completos preservados para reabrir edição
  itemData: WizardState['item']
  personalizacoes: Personalizacao[]
}

interface WizardState {
  currentStep: number
  // modo edição vindo de /pedidos/[id] (fluxo existente)
  editMode?: { pedidoId: string; itemId: string }
  // múltiplos itens
  pedidoId?: string
  itensAdicionados: ItemResumoWizard[]
  editandoItemId?: string
  // dados do pedido (nível ordem)
  pedido: {
    cliente_id?: string
    previsao_entrega?: string
    vendedor_id?: string
    observacoes?: string
    forma_pagamento?: string
  }
  // dados do item em configuração (nível item)
  item: {
    produto_id?: string
    modelo_id?: string
    materia_prima_id?: string
    fornecedor_id?: string
    arte_pronta?: boolean
    arte_pronta_url?: string
    produto_pronto?: boolean
    cor?: string
    cor_hex?: string
    tamanhos_quantidades: Record<string, number>
    especificacoes_modelo: Record<string, string>
    valor_unitario?: number
    tipo_desconto?: 'fixo' | 'percentual'
    desconto?: number
  }
  personalizacoes: Personalizacao[]
  preview_frente_url?: string
  preview_verso_url?: string
}

interface WizardContextType {
  state: WizardState
  // navegação
  setCurrentStep: (step: number) => void
  // dados do pedido
  updatePedido: (data: Partial<WizardState['pedido']>) => void
  // dados do item em configuração
  updateItem: (data: Partial<WizardState['item']>) => void
  // personalizações
  addPersonalizacao: (p: Personalizacao) => void
  removePersonalizacao: (id: string) => void
  updatePersonalizacao: (id: string, data: Partial<Personalizacao>) => void
  // preview
  updatePreviewUrls: (frenteUrl?: string, versoUrl?: string) => void
  // múltiplos itens
  setPedidoId: (id: string) => void
  adicionarItemFinalizado: (item: ItemResumoWizard) => void
  atualizarItemFinalizado: (item: ItemResumoWizard) => void
  iniciarNovoItem: () => void
  iniciarEdicaoItem: (itemId: string) => void
  removerItemDaLista: (itemId: string) => void
  // reset geral
  reset: () => void
}

const STORAGE_KEY = 'wizard_pedido_draft'
const STORAGE_VERSION = 3

const itemEmpty: WizardState['item'] = {
  tamanhos_quantidades: {},
  especificacoes_modelo: {},
}

const initialState: WizardState = {
  currentStep: 1,
  itensAdicionados: [],
  pedido: {},
  item: itemEmpty,
  personalizacoes: [],
}

function loadFromStorage(): WizardState {
  if (typeof window === 'undefined') return initialState
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialState
    const parsed = JSON.parse(saved)
    if (parsed._version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      return initialState
    }
    const { _version: _, ...wizardState } = parsed
    return {
      ...initialState,
      ...wizardState,
      itensAdicionados: wizardState.itensAdicionados ?? [],
    } as WizardState
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return initialState
  }
}

const WizardContext = createContext<WizardContextType | undefined>(undefined)

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(loadFromStorage)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, _version: STORAGE_VERSION }))
  }, [state])

  // ── navegação ────────────────────────────────────────────────────────────
  const setCurrentStep = (step: number) =>
    setState(s => ({ ...s, currentStep: step }))

  // ── pedido (nível ordem) ─────────────────────────────────────────────────
  const updatePedido = (data: Partial<WizardState['pedido']>) =>
    setState(s => ({ ...s, pedido: { ...s.pedido, ...data } }))

  // ── item em configuração ─────────────────────────────────────────────────
  const updateItem = (data: Partial<WizardState['item']>) =>
    setState(s => ({ ...s, item: { ...s.item, ...data } }))

  // ── personalizações ──────────────────────────────────────────────────────
  const addPersonalizacao = (p: Personalizacao) =>
    setState(s => ({ ...s, personalizacoes: [...s.personalizacoes, p] }))

  const removePersonalizacao = (id: string) =>
    setState(s => ({ ...s, personalizacoes: s.personalizacoes.filter(p => p.id !== id) }))

  const updatePersonalizacao = (id: string, data: Partial<Personalizacao>) =>
    setState(s => ({
      ...s,
      personalizacoes: s.personalizacoes.map(p => p.id === id ? { ...p, ...data } : p),
    }))

  // ── preview ──────────────────────────────────────────────────────────────
  const updatePreviewUrls = (frenteUrl?: string, versoUrl?: string) =>
    setState(s => ({
      ...s,
      preview_frente_url: frenteUrl ?? s.preview_frente_url,
      preview_verso_url:  versoUrl  ?? s.preview_verso_url,
    }))

  // ── múltiplos itens ──────────────────────────────────────────────────────

  const setPedidoId = (id: string) =>
    setState(s => ({ ...s, pedidoId: id }))

  // Chamado após POST item com sucesso: adiciona à lista e limpa estado do item
  const adicionarItemFinalizado = (item: ItemResumoWizard) =>
    setState(s => ({
      ...s,
      itensAdicionados: [...s.itensAdicionados, item],
      item: itemEmpty,
      personalizacoes: [],
      preview_frente_url: undefined,
      preview_verso_url: undefined,
      editandoItemId: undefined,
    }))

  // Chamado após PUT item com sucesso: atualiza na lista e limpa estado do item
  const atualizarItemFinalizado = (updated: ItemResumoWizard) =>
    setState(s => ({
      ...s,
      itensAdicionados: s.itensAdicionados.map(i => i.id === updated.id ? updated : i),
      item: itemEmpty,
      personalizacoes: [],
      preview_frente_url: undefined,
      preview_verso_url: undefined,
      editandoItemId: undefined,
    }))

  // Limpa estado do item e vai para o passo 2 para configurar novo item
  const iniciarNovoItem = () =>
    setState(s => ({
      ...s,
      currentStep: 2,
      item: itemEmpty,
      personalizacoes: [],
      preview_frente_url: undefined,
      preview_verso_url: undefined,
      editandoItemId: undefined,
    }))

  // Restaura estado do item a partir dos dados salvos e vai para passo 2
  const iniciarEdicaoItem = (itemId: string) =>
    setState(s => {
      const found = s.itensAdicionados.find(i => i.id === itemId)
      if (!found) return s
      return {
        ...s,
        currentStep: 2,
        item: { ...itemEmpty, ...found.itemData },
        personalizacoes: found.personalizacoes,
        preview_frente_url: found.preview_frente_url,
        preview_verso_url: found.preview_verso_url,
        editandoItemId: itemId,
      }
    })

  // Remove item da lista local (a chamada DELETE na API fica no componente)
  const removerItemDaLista = (itemId: string) =>
    setState(s => ({
      ...s,
      itensAdicionados: s.itensAdicionados.filter(i => i.id !== itemId),
    }))

  // ── reset total ──────────────────────────────────────────────────────────
  const reset = () => {
    localStorage.removeItem(STORAGE_KEY)
    setState(initialState)
  }

  return (
    <WizardContext.Provider value={{
      state,
      setCurrentStep,
      updatePedido,
      updateItem,
      addPersonalizacao,
      removePersonalizacao,
      updatePersonalizacao,
      updatePreviewUrls,
      setPedidoId,
      adicionarItemFinalizado,
      atualizarItemFinalizado,
      iniciarNovoItem,
      iniciarEdicaoItem,
      removerItemDaLista,
      reset,
    }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be inside WizardProvider')
  return ctx
}
