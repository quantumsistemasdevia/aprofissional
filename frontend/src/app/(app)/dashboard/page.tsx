'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { apiFetch } from '@/lib/api'
import { Inbox, TrendingUp, Package, Users } from 'lucide-react'

interface DashboardStats {
  pedidosAbertos: number
  pedidosProducao: number
  pedidosFinalizados: number
  clientesAtivos: number
}

interface PedidoRecente {
  numero: number
  cliente_nome: string | null
  status: string | null
  previsao_entrega: string | null
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'purple' | 'success' | 'orange' | 'info' | 'default' }> = {
  orcamento:  { label: 'Orçamento',  variant: 'purple' },
  aprovado:   { label: 'Aprovado',   variant: 'success' },
  producao:   { label: 'Produção',   variant: 'orange' },
  finalizado: { label: 'Finalizado', variant: 'info' },
  entregue:   { label: 'Entregue',   variant: 'default' },
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-100 rounded w-28" />
          <div className="h-6 bg-gray-100 rounded w-16" />
        </div>
      </div>
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 animate-pulse">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['#', 'Cliente', 'Status', 'Previsão de Entrega'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-10" /></td>
              <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-40" /></td>
              <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
              <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-28" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pedidos, setPedidos] = useState<PedidoRecente[] | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingPedidos, setLoadingPedidos] = useState(true)

  useEffect(() => {
    apiFetch<DashboardStats>('/api/dashboard/stats')
      .then(setStats)
      .catch(() => setStats({ pedidosAbertos: 0, pedidosProducao: 0, pedidosFinalizados: 0, clientesAtivos: 0 }))
      .finally(() => setLoadingStats(false))

    apiFetch<PedidoRecente[]>('/api/dashboard/pedidos-recentes')
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setLoadingPedidos(false))
  }, [])

  const statCards = [
    {
      label: 'Pedidos Abertos',
      value: stats?.pedidosAbertos ?? 0,
      context: 'este mês',
      icon: Inbox,
      iconBg: '#FEE2E2',
      iconColor: '#EF4444',
    },
    {
      label: 'Em Produção',
      value: stats?.pedidosProducao ?? 0,
      context: 'ativos',
      icon: TrendingUp,
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
    },
    {
      label: 'Finalizados',
      value: stats?.pedidosFinalizados ?? 0,
      context: 'últimos 30d',
      icon: Package,
      iconBg: '#CCFBF1',
      iconColor: '#0D9488',
    },
    {
      label: 'Clientes Ativos',
      value: stats?.clientesAtivos ?? 0,
      context: 'este mês',
      icon: Users,
      iconBg: '#EDE9FE',
      iconColor: '#7C3AED',
    },
  ]

  const columns = [
    {
      key: 'numero',
      header: '#',
      render: (p: PedidoRecente) => <span className="font-medium text-gray-700">#{p.numero}</span>,
    },
    {
      key: 'cliente_nome',
      header: 'Cliente',
      render: (p: PedidoRecente) => <span>{p.cliente_nome ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: PedidoRecente) => {
        const cfg = STATUS_CONFIG[p.status ?? '']
        return cfg
          ? <Badge variant={cfg.variant}>{cfg.label}</Badge>
          : <Badge>{p.status ?? '—'}</Badge>
      },
    },
    {
      key: 'previsao_entrega',
      header: 'Previsão de Entrega',
      render: (p: PedidoRecente) =>
        p.previsao_entrega
          ? new Date(p.previsao_entrega).toLocaleDateString('pt-BR')
          : '—',
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Visão geral do sistema" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loadingStats
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: stat.iconBg }}
                >
                  <stat.icon size={22} style={{ color: stat.iconColor }} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                    <span className="text-xs text-gray-400">{stat.context}</span>
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Pedidos Recentes</h2>
        {loadingPedidos
          ? <SkeletonTable />
          : <Table
              columns={columns}
              data={pedidos ?? []}
              keyField="numero"
              emptyMessage="Nenhum pedido encontrado"
            />
        }
      </div>
    </div>
  )
}
