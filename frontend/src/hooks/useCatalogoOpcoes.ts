'use client'
import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export type CategoriaOpcao = 'modelo' | 'gola' | 'mangas' | 'barras' | 'recortes' | 'bolsos' | 'acabamento' | 'cor'

export interface CatalogoOpcao {
  id: string
  categoria: string
  nome: string
  descricao?: string
  cor_hex?: string
  ordem: number
  ativa: boolean
  proporcao?: number
  tipo_proporcao?: 'unidade' | 'percentual'
}

export interface CreateOpcaoPayload {
  categoria: CategoriaOpcao
  nome: string
  descricao?: string
  cor_hex?: string
  ordem: number
  proporcao?: number
  tipo_proporcao?: 'unidade' | 'percentual'
}

export function useCatalogoOpcoes(categoria: CategoriaOpcao) {
  const [opcoes, setOpcoes] = useState<CatalogoOpcao[]>([])
  const [loading, setLoading] = useState(false)

  const list = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<CatalogoOpcao[]>(`/api/catalog/opcoes?categoria=${categoria}`)
      setOpcoes(data)
    } catch {
      setOpcoes([])
    } finally {
      setLoading(false)
    }
  }, [categoria])

  const create = useCallback(async (
    nome: string, descricao: string, ordem: number, corHex?: string,
    proporcao?: number, tipoProporcao?: 'unidade' | 'percentual',
  ): Promise<CatalogoOpcao> => {
    const data = await apiFetch<CatalogoOpcao>('/api/catalog/opcoes', {
      method: 'POST',
      body: JSON.stringify({
        categoria, nome, descricao: descricao || undefined,
        cor_hex: corHex || undefined, ordem,
        proporcao: proporcao ?? undefined,
        tipo_proporcao: tipoProporcao || undefined,
      }),
    })
    setOpcoes(prev => [...prev, data].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)))
    return data
  }, [categoria])

  const update = useCallback(async (
    id: string, nome: string, descricao: string, ordem: number, corHex?: string,
    proporcao?: number, tipoProporcao?: 'unidade' | 'percentual',
  ): Promise<CatalogoOpcao> => {
    const data = await apiFetch<CatalogoOpcao>(`/api/catalog/opcoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nome, descricao: descricao || undefined,
        cor_hex: corHex || undefined, ordem,
        proporcao: proporcao ?? undefined,
        tipo_proporcao: tipoProporcao || undefined,
      }),
    })
    setOpcoes(prev => prev.map(o => o.id === id ? data : o).sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)))
    return data
  }, [])

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/catalog/opcoes/${id}`, { method: 'DELETE' })
    setOpcoes(prev => prev.filter(o => o.id !== id))
  }, [])

  return { opcoes, loading, list, create, update, remove }
}
