'use client'

import { useEffect, useState } from 'react'
import { useWizard } from '../WizardProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useTamanhos } from '@/hooks/useTamanhos'

export function StepTamanho() {
  const { state, updateItem, setCurrentStep } = useWizard()
  const tq = state.item.tamanhos_quantidades
  const { tamanhos, loading, list } = useTamanhos()
  const [grupoAtivo, setGrupoAtivo] = useState('')

  useEffect(() => { list() }, [list])

  const grupos = Array.from(new Set(tamanhos.map(t => t.grupo)))

  useEffect(() => {
    if (grupos.length > 0 && !grupoAtivo) {
      setGrupoAtivo(grupos[0])
    }
  }, [grupos.length])

  const tamanhosDaGrupo = tamanhos.filter(t => t.grupo === grupoAtivo)
  const total = Object.values(tq).reduce((a, b) => a + b, 0)

  function setQtd(grupo: string, nome: string, val: string) {
    const n = parseInt(val) || 0
    updateItem({ tamanhos_quantidades: { ...tq, [`${grupo}/${nome}`]: n } })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Quantidades por Tamanho</h2>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : grupos.length === 0 ? (
        <p className="text-center py-8 text-gray-400">
          Nenhum tamanho cadastrado no catálogo
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            {grupos.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGrupoAtivo(g)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  grupoAtivo === g
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-brand-primary/60'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {tamanhosDaGrupo.map(t => (
              <div key={t.id}>
                <Input
                  label={t.nome}
                  type="number"
                  min="0"
                  value={tq[`${t.grupo}/${t.nome}`] ?? 0}
                  onChange={e => setQtd(t.grupo, t.nome, e.target.value)}
                  className="text-center"
                />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 p-4 bg-red-50 rounded-lg">
        <p className="text-lg font-semibold text-brand-primary">Total: {total} peças</p>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrentStep(state.item.produto_pronto ? 2 : 4)}>← Anterior</Button>
        <Button onClick={() => setCurrentStep(6)} disabled={total === 0}>Próximo →</Button>
      </div>
    </div>
  )
}
