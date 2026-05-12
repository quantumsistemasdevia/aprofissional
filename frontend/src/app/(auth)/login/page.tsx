'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos. Verifique seus dados e tente novamente.')
      setLoading(false)
      return
    }

    document.cookie = 'empresa_id=; path=/; max-age=0'
    document.cookie = 'empresa_nome=; path=/; max-age=0'
    window.location.href = '/selecionar-empresa'
  }

  return (
    <main className="min-h-screen flex">

      {/* Painel esquerdo — fundo escuro com acentos da marca */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        {/* Formas decorativas com as cores da marca */}
        <div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: '#e20a05' }}
        />
        <div
          className="absolute -bottom-24 -right-12 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: '#eadb08' }}
        />
        <div
          className="absolute top-1/2 right-0 w-48 h-48 rounded-full blur-2xl opacity-10"
          style={{ backgroundColor: '#e20a05' }}
        />

        {/* Linha de acento lateral */}
        <div
          className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-full"
          style={{ backgroundColor: '#e20a05' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/LogoAProfissional.png"
            alt="A Profissional"
            width={180}
            height={60}
            className="object-contain"
            style={{ height: 'auto' }}
          />
        </div>

        {/* Texto central */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Gestão completa<br />
            <span style={{ color: '#e20a05' }}>para sua</span>{' '}
            <span style={{ color: '#eadb08' }}>confecção</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            Controle pedidos, produção e entregas em um só lugar. Simples, rápido e profissional.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Criação de pedidos com preview visual',
              'Rastreamento de produção em tempo real',
              'Relatórios gerenciais completos',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#e20a05' }}
                >
                  <ArrowRight size={11} className="text-white" />
                </div>
                <span className="text-gray-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé do painel */}
        <div className="relative z-10">
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} A Profissional. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/LogoAProfissional.png"
              alt="A Profissional"
              width={160}
              height={54}
              className="object-contain"
              style={{ height: 'auto' }}
            />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200 p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
              <p className="text-gray-500 text-sm mt-1">Acesse sua conta para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* Campo e-mail */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition"
                    style={{ '--tw-ring-color': '#e20a05' } as React.CSSProperties}
                    onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px #e20a0540'}
                    onBlur={e => e.currentTarget.style.boxShadow = ''}
                  />
                </div>
              </div>

              {/* Campo senha */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition"
                    onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px #e20a0540'}
                    onBlur={e => e.currentTarget.style.boxShadow = ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-lg px-3.5 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#e20a05' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#c00904' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#e20a05' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Desenvolvido por */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <span className="text-xs text-gray-400">Desenvolvido por</span>
            <Image
              src="/LogoQuantum.png"
              alt="Quantum"
              width={120}
              height={36}
              className="object-contain opacity-70"
              style={{ height: 'auto' }}
            />
          </div>

        </div>
      </div>
    </main>
  )
}
