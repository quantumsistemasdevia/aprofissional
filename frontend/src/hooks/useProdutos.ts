'use client'

import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface Produto {
  id: string
  nome: string
  descricao?: string
  url_imagem?: string
  consumo_por_unidade?: number
  unidade_consumo?: 'kg' | 'm'
  criado_em: string
}

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)

  const list = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Produto[]>('/api/catalog/produtos')
      setProdutos(data)
    } catch {
      /* handled by apiFetch */
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (payload: Omit<Produto, 'id' | 'criado_em'>) => {
    const data = await apiFetch<Produto>('/api/catalog/produtos', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setProdutos(prev => [data, ...prev])
    return data
  }, [])

  const update = useCallback(async (id: string, payload: Partial<Omit<Produto, 'id' | 'criado_em'>>) => {
    const data = await apiFetch<Produto>(`/api/catalog/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    setProdutos(prev => prev.map(p => p.id === id ? data : p))
    return data
  }, [])

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/catalog/produtos/${id}`, { method: 'DELETE' })
    setProdutos(prev => prev.filter(p => p.id !== id))
  }, [])

  return { produtos, loading, list, create, update, remove }
}
