'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { useProduction, type OrdemProducao, type StatusOrdem } from '@/hooks/useProduction'

const COLUMNS: { id: StatusOrdem; label: string; color: string; border: string }[] = [
  { id: 'pendente',     label: 'Pendente',     color: 'bg-gray-100',   border: 'border-gray-300'  },
  { id: 'em_andamento', label: 'Em Andamento', color: 'bg-yellow-50',  border: 'border-yellow-300' },
  { id: 'concluida',    label: 'Concluída',    color: 'bg-green-50',   border: 'border-green-300'  },
  { id: 'cancelada',    label: 'Cancelada',    color: 'bg-red-50',     border: 'border-red-300'    },
]

export default function ProducaoPage() {
  const router = useRouter()
  const { ordens, loading, list, updateStatus } = useProduction()
  const [draggingId, setDraggingId]   = useState<string | null>(null)
  const [overCol,    setOverCol]      = useState<StatusOrdem | null>(null)
  const dragOrdem = useRef<OrdemProducao | null>(null)

  useEffect(() => { list() }, [list])

  function handleDragStart(e: React.DragEvent, ordem: OrdemProducao) {
    dragOrdem.current = ordem
    setDraggingId(ordem.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragEnd() {
    setDraggingId(null)
    setOverCol(null)
    dragOrdem.current = null
  }

  function handleDragOver(e: React.DragEvent, colId: StatusOrdem) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverCol(colId)
  }

  async function handleDrop(e: React.DragEvent, colId: StatusOrdem) {
    e.preventDefault()
    const ordem = dragOrdem.current
    if (!ordem || ordem.status === colId) {
      handleDragEnd()
      return
    }
    setDraggingId(null)
    setOverCol(null)
    dragOrdem.current = null
    try {
      await updateStatus(ordem.id, colId)
    } catch {
      alert('Erro ao atualizar status')
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>

  return (
    <div>
      <PageHeader title="Produção" description="Arraste os cards para atualizar o status" />
      <div className="flex gap-4 overflow-x-auto pb-6 mt-4">
        {COLUMNS.map(col => {
          const colOrdens = ordens.filter(o => o.status === col.id)
          const isOver    = overCol === col.id

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-72"
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={() => setOverCol(null)}
              onDrop={e => handleDrop(e, col.id)}
            >
              <div className={`
                rounded-lg p-4 min-h-64 transition-all border-2
                ${col.color}
                ${isOver ? col.border + ' scale-[1.01] shadow-md' : 'border-transparent'}
              `}>
                {/* Header da coluna */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">{col.label}</h3>
                  <span className="bg-white text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                    {colOrdens.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {colOrdens.map(ordem => {
                    const atrasado =
                      ordem.previsao_entrega &&
                      new Date(ordem.previsao_entrega.split('T')[0] + 'T00:00:00') < new Date() &&
                      col.id !== 'concluida' && col.id !== 'cancelada'

                    return (
                    <div
                      key={ordem.id}
                      draggable
                      onDragStart={e => handleDragStart(e, ordem)}
                      onDragEnd={handleDragEnd}
                      onClick={() => router.push(`/producao/${ordem.id}`)}
                      className={`
                        bg-white p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing
                        hover:shadow-md transition-all select-none
                        border ${atrasado ? 'border-red-300' : 'border-transparent hover:border-gray-200'}
                        ${draggingId === ordem.id ? 'opacity-40 scale-95' : 'opacity-100'}
                      `}
                    >
                      {/* Linha topo: número + indicador de atraso */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-semibold text-sm text-gray-900">
                          #{String(ordem.pedido_numero ?? 0).padStart(4, '0')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {atrasado && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                              ⚠ Atrasado
                            </span>
                          )}
                          <span className="text-gray-300 text-base leading-none shrink-0">⠿</span>
                        </div>
                      </div>

                      {/* Cliente */}
                      <p className="text-xs text-gray-600 truncate">
                        {ordem.cliente_nome ?? '—'}
                      </p>

                      {/* Quantidade + previsão */}
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                        <span>{ordem.quantidade ?? 0} peça{(ordem.quantidade ?? 0) !== 1 ? 's' : ''}</span>
                        {ordem.previsao_entrega && (
                          <span className={atrasado ? 'text-red-500 font-medium' : ''}>
                            Prev. {new Date(ordem.previsao_entrega).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </span>
                        )}
                      </div>
                    </div>
                    )
                  })}

                  {colOrdens.length === 0 && (
                    <div className={`
                      rounded-lg border-2 border-dashed p-6 text-center transition-colors
                      ${isOver ? col.border + ' bg-white/50' : 'border-gray-200'}
                    `}>
                      <p className="text-xs text-gray-400">
                        {isOver ? 'Soltar aqui' : 'Nenhuma ordem'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}