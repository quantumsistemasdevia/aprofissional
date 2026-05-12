'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function selecionarEmpresa(empresaId: string, empresaNome: string) {
  const cookieStore = await cookies()

  cookieStore.set('empresa_id', empresaId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  })

  cookieStore.set('empresa_nome', empresaNome, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  redirect('/')
}
