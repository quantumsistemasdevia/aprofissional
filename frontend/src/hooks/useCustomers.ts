'use client'

import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface Cliente {
  id: string
  nome: string
  tipo: 'fisica' | 'juridica'
  cpf_cnpj?: string
  email?: string
  telefone?: string
  erp_id?: string
  criado_em: string
}

export function useCustomers() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Cliente[]>('/api/customers')
      setClientes(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (payload: Omit<Cliente, 'id' | 'criado_em'>) => {
    const data = await apiFetch<Cliente>('/api/customers', { method: 'POST', body: JSON.stringify(payload) })
    setClientes((prev) => [data, ...prev])
    return data
  }, [])

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/customers/${id}`, { method: 'DELETE' })
    setClientes((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return { clientes, loading, error, list, create, remove }
}
