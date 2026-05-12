'use client'

import { useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { apiFetch } from '@/lib/api'

export type StatusPedido = 'orcamento' | 'aprovado' | 'producao' | 'finalizado' | 'entregue'

export interface Pedido {
  id: string
  numero: number
  status?: StatusPedido
  cliente_id?: string
  vendedor_id?: string
  criado_por?: string
  total?: string
  observacoes?: string
  forma_pagamento?: string
  previsao_entrega?: string
  data_entrega?: string
  criado_em?: string
  atualizado_em?: string
}

export interface ItemPedido {
  id: string
  empresa_id: string
  pedido_id: string
  produto_id: string
  modelo_id: string
  materia_prima_id?: string
  fornecedor_id?: string
  cor?: string
  tamanhos_quantidades?: Record<string, number>
  quantidade?: number
  preco_unitario?: string
  tipo_desconto?: string
  desconto?: string
  total?: string
  especificacoes_modelo?: Record<string, string>
  preview_frente_url?: string
  preview_verso_url?: string
  criado_em?: string
}

export interface PersonalizacaoDetalhe {
  id: string
  item_pedido_id: string
  tipo?: string
  tipo_conteudo?: string
  lado?: string
  url_imagem?: string
  texto_conteudo?: string
  texto_fonte?: string
  cores?: string[]
  localizacao?: string
  canvas_x?: number
  canvas_y?: number
  canvas_escala?: number
  canvas_rotacao?: number
  observacao?: string
}

export function useOrders() {
  const [pedidos, setPedidos]   = useState<Pedido[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const list = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Pedido[]>('/api/orders')
      setPedidos(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }, [])

  const getOne = useCallback(async (id: string): Promise<Pedido> => {
    return apiFetch<Pedido>(`/api/orders/${id}`)
  }, [])

  const getItens = useCallback(async (pedidoId: string): Promise<ItemPedido[]> => {
    const rows = await apiFetch<ItemPedido[]>(`/api/orders/${pedidoId}/items`)
    return rows.map(r => ({
      ...r,
      tamanhos_quantidades: (r.tamanhos_quantidades as unknown as Record<string, number>) ?? {},
      especificacoes_modelo: (r.especificacoes_modelo as unknown as Record<string, string>) ?? {},
    }))
  }, [])

  const getPersonalizacoes = useCallback(async (itemId: string): Promise<PersonalizacaoDetalhe[]> => {
    return apiFetch<PersonalizacaoDetalhe[]>(`/api/personalizations/item/${itemId}`)
  }, [])

  const updateStatus = useCallback(async (id: string, status: StatusPedido): Promise<Pedido> => {
    const data = await apiFetch<Pedido>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    setPedidos(prev => prev.map(p => p.id === id ? data : p))
    return data
  }, [])

  const downloadPdf = useCallback(async (id: string, tipo: 'orcamento' | 'ficha-producao') => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { session } } = await supabase.auth.getSession()
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

    const res = await fetch(`${API_URL}/api/orders/${id}/${tipo}`, {
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    })
    if (!res.ok) throw new Error('Erro ao gerar PDF')

    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${tipo}-pedido-${id.slice(0, 8)}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  return { pedidos, loading, error, list, getOne, getItens, getPersonalizacoes, updateStatus, downloadPdf }
}
