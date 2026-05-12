'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Table } from '@/components/ui/Table'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { apiFetch } from '@/lib/api'
import {
  CalendarDays,
  TrendingUp,
  Palette,
  Users,
  Clock,
  BarChart2,
  LucideIcon,
} from 'lucide-react'

// ---- Tipos de linha de cada relatório ----

interface PedidoPeriodoRow    { data: string; quantidade: number; total: number }
interface ProdutoVendidoRow   { nome_produto: string; quantidade: number; total_vendas: number }
interface PersonalizacaoRow   { tipo: string; localizacao: string; quantidade: number }
interface VendedorRow         { nome_vendedor: string; total_pedidos: number; total_valor: number }
interface PontualidadeRow     { total_pedidos: number; entregues_no_prazo: number; entregues_atrasados: number; taxa_pontualidade: number }
interface DesempenhoEtapaRow  { nome_etapa: string; total_etapas: number; concluidas_no_prazo: number; taxa_conclusao: number }

type ReportRow =
  | PedidoPeriodoRow
  | ProdutoVendidoRow
  | PersonalizacaoRow
  | VendedorRow
  | PontualidadeRow
  | DesempenhoEtapaRow

// ---- Configuração dos 6 relatórios ----

interface ReportConfig {
  id: string
  title: string
  description: string
  icon: LucideIcon
  color: string
  iconBg: string
  endpoint: string
  hasPeriod: boolean
  columns: { key: string; header: string; render?: (row: ReportRow) => React.ReactNode }[]
  keyField: string
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pct(v: number) {
  return `${v.toFixed(1)}%`
}

const REPORTS: ReportConfig[] = [
  {
    id: 'pedidos-periodo',
    title: 'Pedidos por Período',
    description: 'Volume e faturamento diário no intervalo selecionado.',
    icon: CalendarDays,
    color: 'text-blue-600',
    iconBg: 'bg-blue-100',
    endpoint: '/api/reports/pedidos-periodo',
    hasPeriod: true,
    keyField: 'data',
    columns: [
      { key: 'data',       header: 'Data',       render: (r) => new Date((r as PedidoPeriodoRow).data.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR') },
      { key: 'quantidade', header: 'Pedidos'     },
      { key: 'total',      header: 'Faturamento', render: (r) => brl((r as PedidoPeriodoRow).total) },
    ],
  },
  {
    id: 'produtos-mais-vendidos',
    title: 'Produtos Mais Vendidos',
    description: 'Ranking de produtos por quantidade e receita.',
    icon: TrendingUp,
    color: 'text-green-600',
    iconBg: 'bg-green-100',
    endpoint: '/api/reports/produtos-mais-vendidos',
    hasPeriod: false,
    keyField: 'nome_produto',
    columns: [
      { key: 'nome_produto', header: 'Produto'     },
      { key: 'quantidade',   header: 'Qtd. vendida' },
      { key: 'total_vendas', header: 'Total',        render: (r) => brl((r as ProdutoVendidoRow).total_vendas) },
    ],
  },
  {
    id: 'personalizacoes-usadas',
    title: 'Personalizações Mais Usadas',
    description: 'Técnicas e localizações de personalização mais frequentes.',
    icon: Palette,
    color: 'text-purple-600',
    iconBg: 'bg-purple-100',
    endpoint: '/api/reports/personalizacoes-usadas',
    hasPeriod: false,
    keyField: 'tipo',
    columns: [
      { key: 'tipo',        header: 'Tipo'        },
      { key: 'localizacao', header: 'Localização' },
      { key: 'quantidade',  header: 'Usos'        },
    ],
  },
  {
    id: 'por-vendedor',
    title: 'Pedidos por Vendedor',
    description: 'Total de pedidos e valor gerado por vendedor.',
    icon: Users,
    color: 'text-yellow-600',
    iconBg: 'bg-yellow-100',
    endpoint: '/api/reports/por-vendedor',
    hasPeriod: false,
    keyField: 'nome_vendedor',
    columns: [
      { key: 'nome_vendedor',  header: 'Vendedor'      },
      { key: 'total_pedidos',  header: 'Pedidos'       },
      { key: 'total_valor',    header: 'Valor total',   render: (r) => brl((r as VendedorRow).total_valor) },
    ],
  },
  {
    id: 'pontualidade',
    title: 'Pontualidade de Entregas',
    description: 'Taxa de pedidos entregues dentro do prazo acordado no período selecionado.',
    icon: Clock,
    color: 'text-orange-600',
    iconBg: 'bg-orange-100',
    endpoint: '/api/reports/pontualidade',
    hasPeriod: true,
    keyField: 'total_pedidos',
    columns: [
      { key: 'total_pedidos',       header: 'Total entregues'  },
      { key: 'entregues_no_prazo',  header: 'No prazo'         },
      { key: 'entregues_atrasados', header: 'Atrasados'        },
      { key: 'taxa_pontualidade',   header: 'Taxa pontualidade', render: (r) => {
          const v = (r as PontualidadeRow).taxa_pontualidade
          const color = v >= 80 ? 'text-green-600' : v >= 60 ? 'text-yellow-600' : 'text-red-600'
          return <span className={`font-semibold ${color}`}>{pct(v)}</span>
        }
      },
    ],
  },
  {
    id: 'desempenho-etapa',
    title: 'Desempenho por Etapa',
    description: 'Taxa de conclusão no prazo para cada etapa de produção.',
    icon: BarChart2,
    color: 'text-indigo-600',
    iconBg: 'bg-indigo-100',
    endpoint: '/api/reports/desempenho-etapa',
    hasPeriod: false,
    keyField: 'nome_etapa',
    columns: [
      { key: 'nome_etapa',         header: 'Etapa'              },
      { key: 'total_etapas',       header: 'Total'              },
      { key: 'concluidas_no_prazo', header: 'No prazo'          },
      { key: 'taxa_conclusao',     header: 'Taxa conclusão', render: (r) => {
          const v = (r as DesempenhoEtapaRow).taxa_conclusao
          const color = v >= 80 ? 'text-green-600' : v >= 60 ? 'text-yellow-600' : 'text-red-600'
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-16">
                <div
                  className={`h-2 rounded-full ${v >= 80 ? 'bg-green-500' : v >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(v, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${color} shrink-0`}>{pct(v)}</span>
            </div>
          )
        }
      },
    ],
  },
]

// ---- Componente principal ----

export default function RelatoriosPage() {
  const [activeReport, setActiveReport] = useState<ReportConfig | null>(null)
  const [dataInicio, setDataInicio]     = useState('')
  const [dataFim, setDataFim]           = useState('')
  const [rows, setRows]                 = useState<ReportRow[]>([])
  const [loading, setLoading]           = useState(false)
  const [generated, setGenerated]       = useState(false)

  function openReport(report: ReportConfig) {
    setActiveReport(report)
    setRows([])
    setGenerated(false)
    setDataInicio('')
    setDataFim('')
    fetchReport(report, '', '')
  }

  function closeModal() {
    setActiveReport(null)
    setRows([])
    setGenerated(false)
  }

  async function fetchReport(report: ReportConfig, inicio = dataInicio, fim = dataFim) {
    setLoading(true)
    setGenerated(false)
    try {
      const params: Record<string, string> = {}
      if (report.hasPeriod) {
        if (inicio) params.data_inicio = inicio
        if (fim)    params.data_fim    = fim
      }
      const qs = new URLSearchParams(params).toString()
      const url = qs ? `${report.endpoint}?${qs}` : report.endpoint
      const data = await apiFetch<ReportRow[]>(url)
      setRows(data ?? [])
      setGenerated(true)
    } catch {
      setRows([])
      setGenerated(true)
    } finally {
      setLoading(false)
    }
  }

  async function gerar() {
    if (!activeReport) return
    fetchReport(activeReport)
  }

  return (
    <div>
      <PageHeader title="Relatórios" description="Relatórios gerenciais" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {REPORTS.map((report) => {
          const Icon = report.icon
          return (
            <button
              key={report.id}
              onClick={() => openReport(report)}
              className="text-left w-full"
            >
              <Card className="p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className={`${report.iconBg} p-3 rounded-lg shrink-0`}>
                    <Icon size={22} className={report.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{report.title}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{report.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-xs font-medium ${report.color}`}>Ver relatório →</span>
                </div>
              </Card>
            </button>
          )
        })}
      </div>

      {/* Modal do relatório */}
      <Modal
        isOpen={!!activeReport}
        onClose={closeModal}
        title={activeReport?.title}
        size="xl"
      >
        {activeReport && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-3 items-end">
              {activeReport.hasPeriod && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Data início</label>
                    <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Data fim</label>
                    <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                  </div>
                </>
              )}
              <Button onClick={gerar} disabled={loading}>
                {loading ? 'Gerando…' : 'Gerar relatório'}
              </Button>
            </div>

            {/* Resultado */}
            {loading && (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            )}

            {!loading && generated && (
              rows.length > 0
                ? (
                  <Table
                    columns={activeReport.columns}
                    data={rows}
                    keyField={activeReport.keyField as keyof ReportRow}
                    emptyMessage="Nenhum dado encontrado"
                  />
                )
                : (
                  <p className="text-center text-gray-400 py-8 text-sm">
                    Nenhum dado encontrado para os filtros selecionados.
                  </p>
                )
            )}

            {!loading && !generated && activeReport.hasPeriod && (
              <p className="text-center text-gray-400 py-8 text-sm">
                Defina o período e clique em Gerar relatório.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
