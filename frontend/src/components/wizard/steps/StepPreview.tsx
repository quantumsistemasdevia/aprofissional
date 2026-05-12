'use client'

import { useRef, useState, useEffect } from 'react'
import { useWizard } from '../WizardProvider'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useModelo } from '@/hooks/useModelos'
import { createClient } from '@/lib/supabase/client'
import type { FabricCanvasHandle } from '@/components/canvas/FabricCanvas'

// Import direto (sem dynamic) para que o forwardRef/ref funcione corretamente.
let FabricCanvas: React.ComponentType<{
  ref?: React.Ref<FabricCanvasHandle>
  urlImagemFundo: string
  personalizacoes: import('@/types').Personalizacao[]
  mode?: 'edit' | 'view'
  width?: number
  height?: number
  onChange?: (updates: CanvasUpdate[]) => void
  paintBucketColor?: string
  isPaintBucketActive?: boolean
}> | null = null

type CanvasUpdate = {
  id: string
  canvas_x: number
  canvas_y: number
  canvas_escala: number
  canvas_escala_base: number
  canvas_rotacao: number
}

const BUCKET = 'canvas-previews'

// Converte data URL para Blob
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

// Faz upload de um canvas para o Supabase Storage e retorna a URL pública
async function uploadCanvasPreview(
  dataUrl: string,
  path: string
): Promise<string> {
  const supabase = createClient()
  const blob = dataUrlToBlob(dataUrl)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/png', upsert: true })

  if (error) throw new Error(`Erro ao fazer upload: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

function GarmentPlaceholder({ label, count }: { label: string; count: number }) {
  return (
    <div className="w-[300px] h-[360px] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2">
      <svg viewBox="0 0 100 120" className="w-24 h-28 opacity-30">
        <rect x="22" y="26" width="56" height="86" rx="4" fill="#6b7280" />
        <rect x="7" y="22" width="24" height="12" rx="2" fill="#6b7280" />
        <rect x="69" y="22" width="24" height="12" rx="2" fill="#6b7280" />
        <ellipse cx="50" cy="26" rx="12" ry="8" fill="#f3f4f6" />
        <rect x="3" y="32" width="22" height="36" rx="3" fill="#6b7280" />
        <rect x="75" y="32" width="22" height="36" rx="3" fill="#6b7280" />
      </svg>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      {count > 0 && (
        <p className="text-xs text-brand-primary">{count} personalização(ões)</p>
      )}
    </div>
  )
}

function LoadingCanvas() {
  return (
    <div className="w-[300px] h-[360px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
      Carregando canvas...
    </div>
  )
}

const tipoLabel: Record<string, string> = {
  serigrafia: 'Serigrafia', DTF: 'DTF', bordado: 'Bordado', sublimacao: 'Sublimação',
}

export function StepPreview() {
  const { state, updatePersonalizacao, updatePreviewUrls, setCurrentStep } = useWizard()
  const { modelo } = useModelo(state.item.modelo_id)
  const artePronta = state.item.arte_pronta ?? false

  const [canvasReady, setCanvasReady] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [corBalde, setCorBalde] = useState(state.item.cor_hex ?? '#3b82f6')
  const [baldeAtivo, setBaldeAtivo] = useState(false)

  useEffect(() => {
    if (state.item.cor_hex) setCorBalde(state.item.cor_hex)
  }, [state.item.cor_hex])

  const frenteRef = useRef<FabricCanvasHandle>(null)
  const versoRef  = useRef<FabricCanvasHandle>(null)

  useEffect(() => {
    if (artePronta) return
    import('@/components/canvas/FabricCanvas').then((mod) => {
      FabricCanvas = mod.FabricCanvas as typeof FabricCanvas
      setCanvasReady(true)
    })
  }, [artePronta])

  const personalizacoesFrente = state.personalizacoes.filter(p => p.lado === 'frente')
  const personalizacoesVerso  = state.personalizacoes.filter(p => p.lado === 'verso')

  function handleChange(updates: CanvasUpdate[]) {
    updates.forEach(u =>
      updatePersonalizacao(u.id, {
        canvas_x:           u.canvas_x,
        canvas_y:           u.canvas_y,
        canvas_escala:      u.canvas_escala,
        canvas_escala_base: u.canvas_escala_base,
        canvas_rotacao:     u.canvas_rotacao,
      })
    )
  }

  async function handleProximo() {
    setUploadError(null)
    setUploading(true)

    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      // Gera um ID único para este conjunto de previews (baseado no timestamp)
      const previewId = `${Date.now()}`

      let frenteUrl: string | undefined
      let versoUrl:  string | undefined

      const frenteDataUrl = frenteRef.current?.exportImage()
      const versoDataUrl  = versoRef.current?.exportImage()

      // Upload em paralelo
      const uploads = await Promise.allSettled([
        frenteDataUrl
          ? uploadCanvasPreview(frenteDataUrl, `previews/${previewId}/frente.png`)
          : Promise.resolve(undefined),
        versoDataUrl
          ? uploadCanvasPreview(versoDataUrl, `previews/${previewId}/verso.png`)
          : Promise.resolve(undefined),
      ])

      if (uploads[0].status === 'fulfilled') frenteUrl = uploads[0].value
      else console.error('Erro upload frente:', uploads[0].reason)

      if (uploads[1].status === 'fulfilled') versoUrl = uploads[1].value
      else console.error('Erro upload verso:', uploads[1].reason)

      updatePreviewUrls(frenteUrl, versoUrl)
      setCurrentStep(10)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Erro ao salvar previews')
    } finally {
      setUploading(false)
    }
  }

  const semPersonalizacoes = state.personalizacoes.length === 0

  // ── Modo Arte Pronta ──────────────────────────────────────────────────────
  if (artePronta) {
    const arteUrl = state.item.arte_pronta_url

    const confirmarArtePronta = () => {
      if (arteUrl) updatePreviewUrls(arteUrl, undefined)
      setCurrentStep(10)
    }

    return (
      <div>
        <h2 className="text-lg font-semibold mb-1">Preview — Arte Pronta</h2>
        <p className="text-sm text-amber-600 mb-6">Arte pronta enviada. Confira abaixo e clique em Próximo.</p>

        <div className="flex justify-center">
          {arteUrl ? (
            <img
              src={arteUrl}
              alt="Arte pronta"
              className="max-w-sm max-h-[420px] object-contain rounded-lg border shadow-sm"
            />
          ) : (
            <div className="w-64 h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
              Nenhuma arte enviada
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setCurrentStep(8)}>← Anterior</Button>
          <Button onClick={confirmarArtePronta} disabled={!arteUrl}>Próximo →</Button>
        </div>
      </div>
    )
  }

  // ── Alvos de pintura: cor única, partes e cor da camiseta ───────────────
  const pinturaAlvos: Array<{ label: string; corNome: string; corHex: string }> = []
  const esp = state.item.especificacoes_modelo
  if (esp.cor_unica && esp.cor_unica_hex) {
    pinturaAlvos.push({ label: 'Cor Única', corNome: esp.cor_unica, corHex: esp.cor_unica_hex })
  } else {
    const partes: Array<[string, string]> = [
      ['gola', 'Gola'], ['mangas', 'Mangas'], ['barras', 'Barras'],
      ['recortes', 'Recortes'], ['bolsos', 'Bolsos'], ['acabamento', 'Acabamento'],
    ]
    for (const [key, label] of partes) {
      const nome = esp[`${key}_cor`]
      const hex  = esp[`${key}_cor_hex`]
      if (nome && hex) pinturaAlvos.push({ label, corNome: nome, corHex: hex })
    }
  }
  if (state.item.cor && state.item.cor_hex) {
    pinturaAlvos.push({ label: 'Camiseta', corNome: state.item.cor, corHex: state.item.cor_hex })
  }

  // ── Modo normal ───────────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Preview das Personalizações</h2>
      <p className="text-sm text-gray-500 mb-6">
        {semPersonalizacoes
          ? 'Nenhuma personalização adicionada.'
          : 'Arraste os elementos no canvas para ajustar a posição.'}
      </p>

      {/* Toolbar balde de tinta */}
      {canvasReady && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">

          {/* Chips de cores das partes do modelo */}
          {pinturaAlvos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pintar por parte</p>
              <div className="flex flex-wrap gap-2">
                {pinturaAlvos.map(alvo => {
                  const isActive = baldeAtivo && corBalde === alvo.corHex
                  return (
                    <button
                      key={alvo.label}
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          setBaldeAtivo(false)
                        } else {
                          setCorBalde(alvo.corHex)
                          setBaldeAtivo(true)
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${
                        isActive
                          ? 'bg-brand-primary text-white border-brand-primary-dark shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-brand-primary/60'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/60 flex-shrink-0"
                        style={{ backgroundColor: alvo.corHex }}
                      />
                      <span className="font-medium">{alvo.label}:</span>
                      <span className="opacity-75">{alvo.corNome}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cor personalizada + balde toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Cor personalizada:</span>
            <input
              type="color"
              value={corBalde}
              onChange={(e) => { setCorBalde(e.target.value) }}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
              title="Escolher cor"
            />
            <button
              type="button"
              onClick={() => setBaldeAtivo(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
                baldeAtivo
                  ? 'bg-brand-primary text-white border-brand-primary-dark'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15a1.49 1.49 0 0 0 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/>
                <path fillOpacity=".36" d="M0 20h24v4H0z"/>
              </svg>
              {baldeAtivo ? 'Pintar (ativo)' : 'Balde de tinta'}
            </button>
            {baldeAtivo && (
              <span className="text-xs text-brand-primary">Clique na camiseta para pintar</span>
            )}
          </div>

        </div>
      )}

      <div className="flex flex-wrap gap-8">
        <div className="flex gap-6">

          {/* Frente */}
          <div className="text-center">
            <h3 className="font-medium mb-2 text-gray-700 text-sm">Frente</h3>
            {!canvasReady || !FabricCanvas ? (
              <LoadingCanvas />
            ) : modelo?.url_imagem_frente ? (
              <FabricCanvas
                ref={frenteRef}
                urlImagemFundo={modelo.url_imagem_frente}
                personalizacoes={personalizacoesFrente}
                mode="edit"
                width={300}
                height={360}
                onChange={handleChange}
                paintBucketColor={corBalde}
                isPaintBucketActive={baldeAtivo}
              />
            ) : (
              <GarmentPlaceholder label="Frente" count={personalizacoesFrente.length} />
            )}
          </div>

          {/* Verso */}
          <div className="text-center">
            <h3 className="font-medium mb-2 text-gray-700 text-sm">Verso</h3>
            {!canvasReady || !FabricCanvas ? (
              <LoadingCanvas />
            ) : modelo?.url_imagem_verso ? (
              <FabricCanvas
                ref={versoRef}
                urlImagemFundo={modelo.url_imagem_verso}
                personalizacoes={personalizacoesVerso}
                mode="edit"
                width={300}
                height={360}
                onChange={handleChange}
                paintBucketColor={corBalde}
                isPaintBucketActive={baldeAtivo}
              />
            ) : (
              <GarmentPlaceholder label="Verso" count={personalizacoesVerso.length} />
            )}
          </div>

        </div>

        {state.personalizacoes.length > 0 && (
          <div className="flex-1 min-w-[220px]">
            <h3 className="font-medium text-gray-700 mb-3 text-sm">Personalizações</h3>
            <div className="space-y-2">
              {state.personalizacoes.map((p, i) => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-lg border text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">#{i + 1}</span>
                    <Badge variant="info">
                      {p.tipo === 'sublimacao' && p.sublimacao_tipo
                        ? `Sublimação ${p.sublimacao_tipo === 'total' ? 'Total' : 'Parcial'}`
                        : (tipoLabel[p.tipo] ?? p.tipo)}
                    </Badge>
                    <Badge variant="default">{p.lado}</Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Posição: </span>
                    X {Math.round(p.canvas_x * 100)}% · Y {Math.round(p.canvas_y * 100)}%
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Conteúdo: </span>{p.tipo_conteudo}
                    {p.texto_conteudo && ` — "${p.texto_conteudo}"`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {uploadError}
        </p>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrentStep(8)} disabled={uploading}>
          ← Anterior
        </Button>
        <Button onClick={handleProximo} disabled={uploading}>
          {uploading ? 'Salvando previews…' : 'Próximo →'}
        </Button>
      </div>
    </div>
  )
}