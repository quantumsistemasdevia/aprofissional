import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ConfecçãoPRO',
  description: 'Sistema de gestão de pedidos personalizados',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
