'use client'

import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface EtapaConfig {
  id: string
  nome: string
  ordem: number
  percentual_tempo: number
}

export function useEtapas() {
  const [etapas, setEtapas] = useState<EtapaConfig[]>([])
  const [loading, setLoading] = useState(false)

  const list = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<EtapaConfig[]>('/api/production/configs')
      setEtapas(data)
    } catch {
      /* handled */
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (payload: Omit<EtapaConfig, 'id'>) => {
    const data = await apiFetch<EtapaConfig>('/api/production/configs', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setEtapas(prev => [...prev, data].sort((a, b) => a.ordem - b.ordem))
    return data
  }, [])

  const update = useCallback(async (id: string, payload: Omit<EtapaConfig, 'id'>) => {
    const data = await apiFetch<EtapaConfig>(`/api/production/configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    setEtapas(prev => prev.map(e => e.id === id ? data : e).sort((a, b) => a.ordem - b.ordem))
    return data
  }, [])

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/production/configs/${id}`, { method: 'DELETE' })
    setEtapas(prev => prev.filter(e => e.id !== id))
  }, [])

  return { etapas, loading, list, create, update, remove }
}
