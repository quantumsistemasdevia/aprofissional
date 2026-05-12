'use client'

import { useEffect, useState } from 'react'
import { useWizard } from '../WizardProvider'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useModelos, type Modelo } from '@/hooks/useModelos'
import { apiFetch } from '@/lib/api'
import type { CatalogoOpcao } from '@/hooks/useCatalogoOpcoes'

type OpcaoSelect = { value: string; label: string }
const VAZIO: OpcaoSelect[] = [{ value: '', label: 'Selecione...' }]

function toOpcoes(items: CatalogoOpcao[]): OpcaoSelect[] {
  return [{ value: '', label: 'Selecione...' }, ...items.map(o => ({ value: o.nome, label: o.nome }))]
}

function ColorPicker({
  cores,
  value,
  onChange,
}: {
  cores: CatalogoOpcao[]
  value: string
  onChange: (nome: string, hex: string) => void
}) {
  if (cores.length === 0) return <p className="text-xs text-gray-400 mt-1">Nenhuma cor cadastrada</p>
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {cores.map(c => (
        <button
          key={c.id}
          type="button"
          title={c.nome}
          onClick={() => onChange(c.nome, c.cor_hex ?? '#e5e7eb')}
          className={`w-7 h-7 rounded-full border-2 transition-all flex-shrink-0 ${
            value === (c.cor_hex ?? '')
              ? 'border-brand-primary scale-110 shadow-md'
              : 'border-transparent hover:border-gray-400'
          }`}
          style={{ backgroundColor: c.cor_hex ?? '#e5e7eb' }}
        />
      ))}
    </div>
  )
}

export function StepModelo() {
  const { state, updateItem, setCurrentStep } = useWizard()
  const { modelos, loading } = useModelos(state.item.produto_id)

  const [especOpcoes, setEspecOpcoes] = useState<Record<string, OpcaoSelect[]>>({})
  const [cores, setCores] = useState<CatalogoOpcao[]>([])
  const [loadingEspec, setLoadingEspec] = useState(true)
  const [usarCorUnica, setUsarCorUnica] = useState(() => 'cor_unica' in state.item.especificacoes_modelo)

  useEffect(() => {
    const categorias = ['gola', 'mangas', 'barras', 'recortes', 'bolsos', 'acabamento']
    let cancelled = false
    setLoadingEspec(true)
    Promise.all(
      [...categorias, 'cor'].map(c =>
        apiFetch<CatalogoOpcao[]>(`/api/catalog/opcoes?categoria=${c}`).catch(() => [] as CatalogoOpcao[])
      )
    ).then(results => {
      if (cancelled) return
      const map: Record<string, OpcaoSelect[]> = {}
      categorias.forEach((c, i) => { map[c] = toOpcoes(results[i]) })
      setEspecOpcoes(map)
      setCores(results[categorias.length]) // último resultado é 'cor'
      setLoadingEspec(false)
    })
    return () => { cancelled = true }
  }, [])

  function selectModelo(m: Modelo) {
    updateItem({ modelo_id: m.id })
  }

  function setEspec(key: string, value: string) {
    updateItem({ especificacoes_modelo: { ...state.item.especificacoes_modelo, [key]: value } })
  }

  function setEspecCor(prefixo: string, nome: string, hex: string) {
    updateItem({
      especificacoes_modelo: {
        ...state.item.especificacoes_modelo,
        [`${prefixo}_cor`]:     nome,
        [`${prefixo}_cor_hex`]: hex,
      },
    })
  }

  function toggleCorUnica(ativo: boolean) {
    setUsarCorUnica(ativo)
    if (!ativo) {
      const { cor_unica: _cu, cor_unica_hex: _cuh, ...resto } = state.item.especificacoes_modelo
      updateItem({ especificacoes_modelo: resto })
    }
  }

  const esp = state.item.especificacoes_modelo

  const opcoesGola       = especOpcoes['gola']       ?? VAZIO
  const opcoesMangas     = especOpcoes['mangas']     ?? VAZIO
  const opcoesBarras     = especOpcoes['barras']     ?? VAZIO
  const opcoesRecortes   = especOpcoes['recortes']   ?? VAZIO
  const opcoesBolsos     = especOpcoes['bolsos']     ?? VAZIO
  const opcoesAcabamento = especOpcoes['acabamento'] ?? VAZIO

  const partes: Array<{ key: string; label: string; opcoes: OpcaoSelect[] }> = [
    { key: 'gola',       label: 'Gola',       opcoes: opcoesGola       },
    { key: 'mangas',     label: 'Mangas',     opcoes: opcoesMangas     },
    { key: 'barras',     label: 'Barras',     opcoes: opcoesBarras     },
    { key: 'recortes',   label: 'Recortes',   opcoes: opcoesRecortes   },
    { key: 'bolsos',     label: 'Bolsos',     opcoes: opcoesBolsos     },
    { key: 'acabamento', label: 'Acabamento', opcoes: opcoesAcabamento },
  ]

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Selecione o Modelo</h2>
      {loading ? <div className="flex justify-center p-8"><Spinner /></div> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {modelos.map(m => (
            <div
              key={m.id}
              onClick={() => selectModelo(m)}
              className={`rounded-lg border-2 cursor-pointer p-3 transition-all hover:shadow-md ${
                state.item.modelo_id === m.id ? 'border-brand-primary bg-red-50' : 'border-gray-200 hover:border-brand-primary/40'
              }`}
            >
              <p className="font-medium text-sm">{m.nome}</p>
            </div>
          ))}
          {modelos.length === 0 && (
            <p className="text-amber-600 col-span-3 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Nenhum modelo cadastrado para este produto. Acesse o Catálogo e crie pelo menos um modelo antes de continuar.
            </p>
          )}
        </div>
      )}

      <h3 className="text-base font-semibold mb-3">Especificações do Modelo</h3>

      {/* Toggle cor única */}
      <label className="flex items-center gap-2 mb-4 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={usarCorUnica}
          onChange={e => toggleCorUnica(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 accent-[#e20a05]"
        />
        <span className="text-sm font-medium text-gray-700">Cor única para todas as especificações</span>
      </label>

      {/* Seletor de cor única */}
      {usarCorUnica && (
        <div className="mb-5 p-3 bg-gray-50 border border-gray-200 rounded-lg max-w-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-700">Cor única:</span>
            {esp.cor_unica && (
              <>
                <div
                  className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: esp.cor_unica_hex ?? '#e5e7eb' }}
                />
                <span className="text-sm text-gray-700">{esp.cor_unica}</span>
              </>
            )}
          </div>
          {loadingEspec
            ? <Spinner />
            : <ColorPicker
                cores={cores}
                value={esp.cor_unica_hex ?? ''}
                onChange={(nome, hex) => {
                  setEspec('cor_unica', nome)
                  setEspec('cor_unica_hex', hex)
                }}
              />
          }
        </div>
      )}

      {/* Especificações + cores por parte */}
      {loadingEspec ? (
        <div className="flex justify-center p-6"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {partes.map(({ key, label, opcoes }) => (
            <div key={key} className="space-y-1">
              <Select
                label={label}
                options={opcoes}
                value={esp[key] ?? ''}
                onChange={e => setEspec(key, e.target.value)}
              />
              {!usarCorUnica && esp[key] && (
                <div className="pl-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Cor:</span>
                    {esp[`${key}_cor`] && (
                      <>
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: esp[`${key}_cor_hex`] ?? '#e5e7eb' }}
                        />
                        <span className="text-xs text-gray-700">{esp[`${key}_cor`]}</span>
                      </>
                    )}
                  </div>
                  <ColorPicker
                    cores={cores}
                    value={esp[`${key}_cor_hex`] ?? ''}
                    onChange={(nome, hex) => setEspecCor(key, nome, hex)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!state.item.modelo_id && modelos.length > 0 && (
        <p className="text-sm text-amber-600 mt-4">Selecione um modelo para continuar.</p>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrentStep(2)}>← Anterior</Button>
        <Button
          onClick={() => setCurrentStep(4)}
          disabled={!state.item.modelo_id}
        >
          Próximo →
        </Button>
      </div>
    </div>
  )
}
