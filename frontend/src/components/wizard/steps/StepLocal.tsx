'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useWizard } from '../WizardProvider'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useModelo } from '@/hooks/useModelos'
import type { Personalizacao } from '@/types'

const MAP_W = 280
const MAP_H = 360

const tipoLabel: Record<string, string> = {
  serigrafia: 'Serigrafia', DTF: 'DTF', bordado: 'Bordado', sublimacao: 'Sublimação',
}

interface MarkerMapProps {
  painel: 'frente' | 'verso'
  personalizacoes: Personalizacao[]
  selectedPersId: string | null
  onSelectPers: (id: string) => void
  onUpdatePosition: (id: string, x: number, y: number) => void
  urlImagem?: string
  loadingImagem?: boolean
}

function MarkerMap({
  painel,
  personalizacoes,
  selectedPersId,
  onSelectPers,
  onUpdatePosition,
  urlImagem,
  loadingImagem,
}: MarkerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const clampedPct = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!containerRef.current) return null
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height)),
    }
  }, [])

  // Clique no fundo da peça move a personalização selecionada para aquele ponto
  function handleBgClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-marker]')) return
    if (!selectedPersId) return
    const p = clampedPct(e)
    if (p) onUpdatePosition(selectedPersId, p.x, p.y)
  }

  function handleMarkerDown(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    onSelectPers(id)
    setDraggingId(id)
  }

  useEffect(() => {
    if (!draggingId) return
    const id = draggingId

    function onMove(e: MouseEvent) {
      const p = clampedPct(e)
      if (p) onUpdatePosition(id, p.x, p.y)
    }
    function onUp() { setDraggingId(null) }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [draggingId, clampedPct, onUpdatePosition])

  const hasPers = personalizacoes.length > 0

  return (
    <div
      ref={containerRef}
      onClick={handleBgClick}
      className={`relative rounded-xl border-2 bg-gray-50 select-none overflow-hidden
        ${draggingId ? 'cursor-grabbing' : selectedPersId ? 'cursor-crosshair' : 'cursor-default'}
        ${selectedPersId ? 'border-brand-primary' : 'border-gray-300'}`}
      style={{ width: MAP_W, height: MAP_H }}
    >
      {/* Fundo: imagem do modelo, spinner ou silhueta */}
      {loadingImagem ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </div>
      ) : urlImagem ? (
        <img
          src={urlImagem}
          alt={painel === 'frente' ? 'Frente do modelo' : 'Verso do modelo'}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      ) : (
        <svg viewBox="0 0 280 360" className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" aria-hidden>
          <rect x="70" y="85" width="140" height="250" rx="8" fill="#6b7280" />
          <rect x="22" y="72" width="62" height="34" rx="4" fill="#6b7280" />
          <rect x="196" y="72" width="62" height="34" rx="4" fill="#6b7280" />
          <ellipse cx="140" cy="85" rx="32" ry="20" fill="#f3f4f6" />
          <rect x="10" y="98" width="58" height="100" rx="6" fill="#6b7280" />
          <rect x="212" y="98" width="58" height="100" rx="6" fill="#6b7280" />
        </svg>
      )}

      {/* Label do painel */}
      <p className="absolute top-2 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide bg-white/85 px-2 py-0.5 rounded-full shadow-sm pointer-events-none z-10">
        {painel === 'frente' ? 'Frente' : 'Verso'}
      </p>

      {/* Estado vazio */}
      {!hasPers && (
        <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 pointer-events-none">
          Nenhuma personalização neste lado
        </p>
      )}

      {/* Instrução flutuante */}
      {selectedPersId && hasPers && (
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-brand-primary bg-red-50/90 border border-brand-primary/20 px-2 py-0.5 rounded-full pointer-events-none z-10">
          Clique para mover · Arraste o marcador para ajustar
        </p>
      )}

      {/* Marcadores arrastáveis, um por personalização */}
      {personalizacoes.map((p, i) => {
        const isSelected = p.id === selectedPersId
        const isDragging = p.id === draggingId
        return (
          <div
            key={p.id}
            data-marker="true"
            onMouseDown={(e) => handleMarkerDown(e, p.id)}
            style={{
              left: `${p.canvas_x * 100}%`,
              top: `${p.canvas_y * 100}%`,
              transform: 'translate(-50%, -50%)',
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: isDragging ? 'none' : 'left 80ms, top 80ms',
            }}
            className={`absolute z-20 w-9 h-9 rounded-full border-2 flex flex-col items-center justify-center
              text-[10px] font-bold shadow-md
              ${isSelected
                ? 'bg-brand-primary border-brand-primary-dark text-white ring-2 ring-brand-primary/30 ring-offset-1 scale-110'
                : 'bg-white border-gray-400 text-gray-700 hover:border-brand-primary/60 hover:scale-105'
              }
              ${isDragging ? 'scale-125 shadow-lg' : ''}`}
          >
            {i + 1}
            {p.tipo_conteudo === 'imagem' ? (
              <span className="text-[7px] leading-none opacity-70">img</span>
            ) : (
              <span className="text-[7px] leading-none opacity-70">txt</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function StepLocal() {
  const { state, updatePersonalizacao, setCurrentStep } = useWizard()
  const { modelo, loading: loadingModelo } = useModelo(state.item.modelo_id)

  const [selectedPersId, setSelectedPersId] = useState<string | null>(
    state.personalizacoes[0]?.id ?? null
  )
  const [painel, setPainel] = useState<'frente' | 'verso'>(
    () => state.personalizacoes[0]?.lado ?? 'frente'
  )

  const persFrente = state.personalizacoes.filter(p => p.lado === 'frente')
  const persVerso  = state.personalizacoes.filter(p => p.lado === 'verso')
  const persNoPainel = painel === 'frente' ? persFrente : persVerso

  const handleUpdatePosition = useCallback((id: string, x: number, y: number) => {
    updatePersonalizacao(id, { canvas_x: x, canvas_y: y })
  }, [updatePersonalizacao])

  function handleSelectPers(id: string) {
    const p = state.personalizacoes.find(pers => pers.id === id)
    if (p) setPainel(p.lado as 'frente' | 'verso')
    setSelectedPersId(id)
  }

  if (state.personalizacoes.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">Posição da Personalização</h2>
        <p className="text-gray-500 text-sm">Nenhuma personalização adicionada. Volte ao passo anterior.</p>
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setCurrentStep(6)}>← Anterior</Button>
          <Button onClick={() => setCurrentStep(8)}>Próximo →</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Posição da Personalização</h2>
      <p className="text-sm text-gray-500 mb-4">
        Selecione um item na lista e clique na peça para posicioná-lo, ou arraste o marcador numerado para ajuste fino.
      </p>

      <div className="flex gap-6 flex-wrap">
        {/* Mapa interativo */}
        <div className="flex-shrink-0">
          <div className="flex mb-3 border-b">
            {(['frente', 'verso'] as const).map(lado => (
              <button
                key={lado}
                onClick={() => setPainel(lado)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  painel === lado
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {lado === 'frente' ? 'Frente' : 'Verso'}
                {(lado === 'frente' ? persFrente : persVerso).length > 0 && (
                  <span className="ml-1.5 text-xs bg-red-100 text-brand-primary rounded-full px-1.5">
                    {(lado === 'frente' ? persFrente : persVerso).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <MarkerMap
            painel={painel}
            personalizacoes={persNoPainel}
            selectedPersId={selectedPersId}
            onSelectPers={handleSelectPers}
            onUpdatePosition={handleUpdatePosition}
            urlImagem={painel === 'frente' ? modelo?.url_imagem_frente : modelo?.url_imagem_verso}
            loadingImagem={loadingModelo}
          />
        </div>

        {/* Lista lateral */}
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-medium text-gray-700 mb-3">Personalizações:</p>
          <div className="space-y-2">
            {state.personalizacoes.map((p, i) => {
              const isSelected = selectedPersId === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPers(p.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-brand-primary bg-red-50'
                      : 'border-gray-200 hover:border-brand-primary/40 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0
                      ${isSelected ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {i + 1}
                    </span>
                    <Badge variant="info">{tipoLabel[p.tipo] ?? p.tipo}</Badge>
                    <Badge variant="default">{p.local_id ?? p.lado}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 pl-8">
                    X {Math.round(p.canvas_x * 100)}% · Y {Math.round(p.canvas_y * 100)}%
                  </p>
                </button>
              )
            })}
          </div>

          <p className="mt-4 text-xs text-gray-400 leading-relaxed">
            As coordenadas mostradas são relativas à largura e altura da peça. No preview final você pode ajustar ainda mais.
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrentStep(6)}>← Anterior</Button>
        <Button onClick={() => setCurrentStep(8)}>Próximo →</Button>
      </div>
    </div>
  )
}
