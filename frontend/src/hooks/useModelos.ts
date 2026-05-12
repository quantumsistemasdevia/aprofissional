'use client'
import { useState, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

export interface Modelo {
  id: string
  empresa_id: string
  produto_id: string
  nome: string
  url_imagem_frente?: string
  url_imagem_verso?: string
  tipo?: string
  gola?: string
  mangas?: string
  barras?: string
  recortes?: string
  bolsos?: string
  acabamento?: string
  criado_em?: string
}

export interface CreateModeloPayload {
  produto_id: string
  nome: string
  url_imagem_frente?: string
  url_imagem_verso?: string
  tipo?: string
  gola?: string
  mangas?: string
  barras?: string
  recortes?: string
  bolsos?: string
  acabamento?: string
}

export interface UpdateModeloPayload {
  nome: string
  url_imagem_frente?: string
  url_imagem_verso?: string
  tipo?: string
  gola?: string
  mangas?: string
  barras?: string
  recortes?: string
  bolsos?: string
  acabamento?: string
}

export function useModelos(produtoId?: string) {
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [loading, setLoading] = useState(false)

  const list = useCallback(async (pId: string) => {
    setLoading(true)
    try {
      const data = await apiFetch<Modelo[]>(`/api/catalog/produtos/${pId}/modelos`)
      setModelos(data)
    } catch {
      setModelos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (produtoId) list(produtoId)
  }, [produtoId, list])

  const create = useCallback(async (payload: CreateModeloPayload): Promise<Modelo> => {
    const data = await apiFetch<Modelo>(`/api/catalog/produtos/${payload.produto_id}/modelos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setModelos(prev => [...prev, data])
    return data
  }, [])

  const update = useCallback(async (id: string, payload: UpdateModeloPayload): Promise<Modelo> => {
    const data = await apiFetch<Modelo>(`/api/catalog/modelos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    setModelos(prev => prev.map(m => m.id === id ? data : m))
    return data
  }, [])

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/catalog/modelos/${id}`, { method: 'DELETE' })
    setModelos(prev => prev.filter(m => m.id !== id))
  }, [])

  return { modelos, loading, list, create, update, remove }
}

export function useModelo(modeloId?: string) {
  const [modelo, setModelo] = useState<Modelo | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!modeloId) return
    setLoading(true)
    apiFetch<Modelo>(`/api/catalog/modelos/${modeloId}`)
      .then(setModelo)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [modeloId])
  return { modelo, loading }
}
