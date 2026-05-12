'use client'
import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface MateriaPrima {
  id: string
  empresa_id: string
  nome: string
  composicao?: string
  criado_em?: string
}

export interface CreateMateriaPrimaPayload {
  nome: string
  composicao?: string
}

export function useMateriasPrimas() {
  const [materias, setMaterias] = useState<MateriaPrima[]>([])
  const [loading, setLoading] = useState(false)

  const list = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<MateriaPrima[]>('/api/catalog/materias-primas')
      setMaterias(data)
    } catch {
      setMaterias([])
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (payload: CreateMateriaPrimaPayload): Promise<MateriaPrima> => {
    const data = await apiFetch<MateriaPrima>('/api/catalog/materias-primas', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setMaterias(prev => [...prev, data])
    return data
  }, [])

  const update = useCallback(async (id: string, payload: CreateMateriaPrimaPayload): Promise<MateriaPrima> => {
    const data = await apiFetch<MateriaPrima>(`/api/catalog/materias-primas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    setMaterias(prev => prev.map(m => m.id === id ? data : m))
    return data
  }, [])

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/catalog/materias-primas/${id}`, { method: 'DELETE' })
    setMaterias(prev => prev.filter(m => m.id !== id))
  }, [])

  return { materias, loading, list, create, update, remove }
}
