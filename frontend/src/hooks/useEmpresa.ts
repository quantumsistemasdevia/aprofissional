'use client'
import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface Empresa {
  id: string
  nome: string
  slug: string
  cnpj?: string
  email?: string
  telefone?: string
}

export interface UpdateEmpresaPayload {
  nome: string
  cnpj?: string
  email?: string
  telefone?: string
}

export function useEmpresa() {
  const [empresa,  setEmpresa]  = useState<Empresa | null>(null)
  const [loading,  setLoading]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Empresa>('/api/empresa/me')
      setEmpresa(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(async (payload: UpdateEmpresaPayload): Promise<Empresa> => {
    const data = await apiFetch<Empresa>('/api/empresa/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    setEmpresa(data)
    return data
  }, [])

  return { empresa, loading, load, save }
}
