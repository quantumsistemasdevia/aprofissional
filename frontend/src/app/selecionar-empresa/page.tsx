'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { selecionarEmpresa } from './actions'

type Empresa = {
  id: string
  nome: string
  cnpj: string | null
  slug: string
}

export default function SelecionarEmpresaPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selecionandoId, setSelecionandoId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  useEffect(() => {
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Sessão expirada. Faça login novamente.')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/minhas-empresas`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        )

        if (!res.ok) throw new Error()

        const data = await res.json()
        const lista: Empresa[] = data.empresas ?? []
        setEmpresas(lista)
      } catch {
        setError('Não foi possível carregar as empresas. Verifique a conexão com o servidor.')
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  function handleSelecionar(empresa: Empresa) {
    setSelecionandoId(empresa.id)
    startTransition(() => {
      selecionarEmpresa(empresa.id, empresa.nome)
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>

      {/* Círculo vermelho — canto superior esquerdo */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ backgroundColor: '#e20a05' }} />
      {/* Círculo amarelo — canto inferior direito */}
      <div className="absolute -bottom-24 -right-12 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: '#eadb08' }} />
      {/* Círculo vermelho pequeno — meio direito */}
      <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full blur-2xl opacity-10 pointer-events-none" style={{ backgroundColor: '#e20a05' }} />
      {/* Linha de acento — borda esquerda */}
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-full pointer-events-none" style={{ backgroundColor: '#e20a05' }} />
      {/* Header */}
      <div className="relative z-10 mb-10 text-center">
        <h1 className="text-3xl font-bold" style={{ color: '#eadb08' }}>Quantum Confecção</h1>
        <p className="mt-2 text-white/70 text-sm">Selecione a empresa para continuar</p>
      </div>

      {/* Card container */}
      <div className="relative z-10 w-full max-w-2xl bg-white/5 border border-white/10 rounded-xl p-8">

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#e20a05', borderTopColor: 'transparent' }} />
            <p className="text-white/60 text-sm">Carregando empresas...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm underline hover:no-underline" style={{ color: '#eadb08' }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && empresas.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/60 text-sm">
              Nenhuma empresa encontrada para este usuário.
            </p>
            <p className="text-white/40 text-xs mt-1">
              Entre em contato com o administrador.
            </p>
          </div>
        )}

        {!loading && !error && empresas.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {empresas.map((empresa) => {
              const isSelecionando = selecionandoId === empresa.id && isPending
              return (
                <button
                  key={empresa.id}
                  onClick={() => handleSelecionar(empresa)}
                  disabled={isPending}
                  className={`
                    relative flex flex-col items-center gap-3 p-6 rounded-xl border
                    transition-all duration-150
                    ${isSelecionando
                      ? 'scale-[0.98]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }
                    disabled:opacity-60 disabled:cursor-not-allowed
                  `}
                  style={isSelecionando ? { backgroundColor: '#e20a05', borderColor: '#e20a05' } : undefined}
                >
                  <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center text-2xl
                    ${isSelecionando ? 'bg-white/20' : 'bg-white/10'}
                  `}>
                    🏭
                  </div>

                  <div className="text-center w-full">
                    <p className="text-white font-semibold text-sm leading-tight">{empresa.nome}</p>
                    {empresa.cnpj && (
                      <p className="text-white/40 text-xs mt-1">{empresa.cnpj}</p>
                    )}
                  </div>

                  {isSelecionando ? (
                    <div className="absolute top-3 right-3">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <span className="text-xs font-medium" style={{ color: '#eadb08' }}>
                      Selecionar →
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="relative z-10 mt-6 text-white/40 text-xs hover:text-white/70 transition-colors"
      >
        Sair da conta
      </button>

      {/* Logo Quantum */}
      <div className="relative z-10 mt-8 flex flex-col items-center gap-1.5">
        <span className="text-xs text-white/30">Desenvolvido por</span>
        <Image
          src="/logoquantum.webp"
          alt="Quantum"
          width={120}
          height={36}
          className="object-contain opacity-50"
          style={{ height: 'auto' }}
        />
      </div>
    </main>
  )
}
