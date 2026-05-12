'use client'

import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface OrdemProducao {
  id: string
  pedido_id: string
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
  iniciado_em?: string
  finalizado_em?: string
  criado_em: string
  pedido_numero?: number
  cliente_nome?: string
  quantidade?: number
  previsao_entrega?: string
}

export type StatusOrdem = OrdemProducao['status']

export function useProduction() {
  const [ordens, setOrdens] = useState<OrdemProducao[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<OrdemProducao[]>('/api/production/ordens')
      setOrdens(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStatus = useCallback(async (id: string, status: StatusOrdem) => {
    // Atualiza otimisticamente na UI
    setOrdens(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    try {
      await apiFetch(`/api/production/ordens/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    } catch (e) {
      // Reverte em caso de erro
      setOrdens(prev => prev.map(o => o.id === id ? { ...o } : o))
      await list()
      throw e
    }
  }, [list])

  return { ordens, loading, error, list, updateStatus }
}