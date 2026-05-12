'use client'
import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: 'admin' | 'vendedor' | 'producao'
  criado_em?: string
}

export interface CreateUsuarioPayload {
  nome: string
  email: string
  senha: string
  perfil: 'admin' | 'vendedor' | 'producao'
}

export interface UpdateUsuarioPayload {
  nome: string
  perfil: 'admin' | 'vendedor' | 'producao'
}

export function useUsers() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading]   = useState(false)

  const list = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Usuario[]>('/api/users')
      setUsuarios(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (payload: CreateUsuarioPayload): Promise<Usuario> => {
    const u = await apiFetch<Usuario>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setUsuarios(prev => [...prev, u])
    return u
  }, [])

  const update = useCallback(async (id: string, payload: UpdateUsuarioPayload): Promise<Usuario> => {
    const u = await apiFetch<Usuario>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    setUsuarios(prev => prev.map(x => x.id === id ? u : x))
    return u
  }, [])

  const remove = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/users/${id}`, { method: 'DELETE' })
    setUsuarios(prev => prev.filter(x => x.id !== id))
  }, [])

  return { usuarios, loading, list, create, update, remove }
}
