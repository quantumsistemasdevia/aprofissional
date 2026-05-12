'use client'
import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface Tamanho {
  id: string
  grupo: string
  nome: string
  ordem: number
  ativo: boolean
}

export interface CreateTamanhoPayload {
  grupo: string
  nome: string
  ordem: number
}

export function useTamanhos() {
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([])
  const [loading, setLoading] = useState(false)

  const list = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Tamanho[]>('/api/catalog/tamanhos')
      setTamanhos(data)
    } catch {
      setTamanhos([])
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (payload: CreateTamanhoPayload): Promise<Tamanho> => {
    const data = await apiFetch<Tamanho>('/api/catalog/tamanhos', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setTamanhos(prev => [...prev, data])
    return data
  }, [])

  const update = useCallback(async (id: string, payload: CreateTamanhoPayload): Promise<Tamanho> => {
    const data = await apiFetch<Tamanho>(`/api/catalog/tamanhos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    setTamanhos(prev => prev.map(t => t.id === id ? data : t))
    return data
  }, [])

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/catalog/tamanhos/${id}`, { method: 'DELETE' })
    setTamanhos(prev => prev.filter(t => t.id !== id))
  }, [])

  return { tamanhos, loading, list, create, update, remove }
}
