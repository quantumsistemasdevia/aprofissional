'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Spinner } from '@/components/ui/Spinner'
import { useOrders, type Pedido, type StatusPedido } from '@/hooks/useOrders'
import { useCustomers } from '@/hooks/useCustomers'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange'

const STATUS_VARIANT: Record<StatusPedido, BadgeVariant> = {
  orcamento: 'purple',
  aprovado:  'success',
  producao:  'orange',
  finalizado: 'info',
  entregue:  'default',
}

const STATUS_LABEL: Record<StatusPedido, string> = {
  orcamento:  'Orçamento',
  aprovado:   'Aprovado',
  producao:   'Produção',
  finalizado: 'Finalizado',
  entregue:   'Entregue',
}

function fmtDate(iso?: string) {
  if (!iso) return '-'
  const datePart = iso.split('T')[0]
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return '-'
  return `${day}/${month}/${year}`
}

export default function PedidosPage() {
  const router = useRouter()
  const { pedidos, loading, list } = useOrders()
  const { clientes, list: listClientes } = useCustomers()

  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [periodoIni,   setPeriodoIni]   = useState('')
  const [periodoFim,   setPeriodoFim]   = useState('')
  const [previsaoFim,  setPrevisaoFim]  = useState('')

  useEffect(() => { list(); listClientes() }, [list, listClientes])

  const clienteMap = useMemo(() => {
    const m: Record<string, string> = {}
    clientes.forEach(c => { m[c.id] = c.nome })
    return m
  }, [clientes])

  const filtered = useMemo(() => {
    return pedidos.filter(p => {
      const clienteNome = p.cliente_id ? (clienteMap[p.cliente_id] ?? '') : ''

      if (search) {
        const q = search.toLowerCase()
        const matchNumero  = String(p.numero).includes(q)
        const matchCliente = clienteNome.toLowerCase().includes(q)
        if (!matchNumero && !matchCliente) return false
      }

      if (statusFilter && p.status !== statusFilter) return false

      if (periodoIni && p.criado_em) {
        if (new Date(p.criado_em) < new Date(periodoIni)) return false
      }
      if (periodoFim && p.criado_em) {
        if (new Date(p.criado_em) > new Date(periodoFim + 'T23:59:59')) return false
      }

      if (previsaoFim && p.previsao_entrega) {
        if (new Date(p.previsao_entrega) > new Date(previsaoFim + 'T23:59:59')) return false
      }

      return true
    })
  }, [pedidos, clienteMap, search, statusFilter, periodoIni, periodoFim, previsaoFim])

  const columns = [
    {
      key: 'numero',
      header: 'Nº',
      render: (p: Pedido) => (
        <button
          className="text-blue-600 hover:underline font-medium"
          onClick={() => router.push(`/pedidos/${p.id}`)}
        >
          #{String(p.numero).padStart(4, '0')}
        </button>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (p: Pedido) =>
        p.cliente_id ? (clienteMap[p.cliente_id] ?? p.cliente_id.slice(0, 8) + '…') : '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: Pedido) => {
        const s = (p.status ?? 'orcamento') as StatusPedido
        return <Badge variant={STATUS_VARIANT[s]}>{STATUS_LABEL[s] ?? s}</Badge>
      },
    },
    {
      key: 'previsao_entrega',
      header: 'Previsão de Entrega',
      render: (p: Pedido) => fmtDate(p.previsao_entrega),
    },
    {
      key: 'criado_em',
      header: 'Criado em',
      render: (p: Pedido) => fmtDate(p.criado_em),
    },
    {
      key: 'total',
      header: 'Total',
      render: (p: Pedido) =>
        p.total != null ? `R$ ${Number(p.total).toFixed(2)}` : '-',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Gerencie os pedidos"
        actions={<Button onClick={() => router.push('/pedidos/novo')}>Novo Pedido</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <div className="lg:col-span-1">
          <label className="block text-xs text-gray-500 mb-1">Buscar</label>
          <Input
            placeholder="Nº ou cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <Select
            options={[
              { value: '', label: 'Todos' },
              { value: 'orcamento',  label: 'Orçamento'  },
              { value: 'aprovado',   label: 'Aprovado'   },
              { value: 'producao',   label: 'Produção'   },
              { value: 'finalizado', label: 'Finalizado' },
              { value: 'entregue',   label: 'Entregue'   },
            ]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Período — de</label>
          <Input
            type="date"
            value={periodoIni}
            onChange={e => setPeriodoIni(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Período — até</label>
          <Input
            type="date"
            value={periodoFim}
            onChange={e => setPeriodoFim(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Previsão de entrega até</label>
          <Input
            type="date"
            value={previsaoFim}
            onChange={e => setPrevisaoFim(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage="Nenhum pedido encontrado"
        />
      )}
    </div>
  )
}
