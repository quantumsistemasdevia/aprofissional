'use client'
import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface Fornecedor {
  id: string
  nome: string
  contato?: string
  telefone?: string
  email?: string
  ativo: boolean
}

export interface CreateFornecedorPayload {
  nome: string
  contato?: string
  telefone?: string
  email?: string
}

export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(false)

  const list = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Fornecedor[]>('/api/catalog/fornecedores')
      setFornecedores(data)
    } catch {
      setFornecedores([])
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (payload: CreateFornecedorPayload): Promise<Fornecedor> => {
    const data = await apiFetch<Fornecedor>('/api/catalog/fornecedores', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setFornecedores(prev => [...prev, data])
    return data
  }, [])

  const update = useCallback(async (id: string, payload: CreateFornecedorPayload): Promise<Fornecedor> => {
    const data = await apiFetch<Fornecedor>(`/api/catalog/fornecedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    setFornecedores(prev => prev.map(f => f.id === id ? data : f))
    return data
  }, [])

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/catalog/fornecedores/${id}`, { method: 'DELETE' })
    setFornecedores(prev => prev.filter(f => f.id !== id))
  }, [])

  return { fornecedores, loading, list, create, update, remove }
}
