'use client'

import { useEffect, useState } from 'react'
import { useWizard } from '../WizardProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useMateriasPrimas, type MateriaPrima } from '@/hooks/useMateriasPrimas'
import { useCatalogoOpcoes, type CatalogoOpcao } from '@/hooks/useCatalogoOpcoes'
import { useFornecedores, type Fornecedor } from '@/hooks/useFornecedores'

export function StepMateriaPrima() {
  const { state, updateItem, setCurrentStep } = useWizard()
  const { materias, loading: loadingMaterias, list } = useMateriasPrimas()
  const { opcoes: cores, loading: loadingCores, list: listCores } = useCatalogoOpcoes('cor')
  const { fornecedores, loading: loadingForn, list: listForn } = useFornecedores()
  const [searchMateria, setSearchMateria] = useState('')
  const [searchCor, setSearchCor] = useState('')
  const [searchForn, setSearchForn] = useState('')

  useEffect(() => { list() }, [list])
  useEffect(() => { listCores() }, [listCores])
  useEffect(() => { listForn() }, [listForn])

  const filteredMaterias = materias.filter(m =>
    m.nome.toLowerCase().includes(searchMateria.toLowerCase()) ||
    (m.composicao ?? '').toLowerCase().includes(searchMateria.toLowerCase())
  )

  const filteredCores = cores.filter(c =>
    c.nome.toLowerCase().includes(searchCor.toLowerCase())
  )

  const filteredForn = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(searchForn.toLowerCase())
  )

  function selectMateria(m: MateriaPrima) {
    updateItem({ materia_prima_id: m.id })
  }

  function selectCor(c: CatalogoOpcao) {
    updateItem({ cor: c.nome, cor_hex: c.cor_hex ?? state.item.cor_hex ?? '#ffffff' })
  }

  function selectFornecedor(f: Fornecedor) {
    updateItem({
      fornecedor_id: state.item.fornecedor_id === f.id ? undefined : f.id,
    })
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold whitespace-nowrap">Fornecedor</h2>
        <Input
          placeholder="Buscar fornecedor..."
          value={searchForn}
          onChange={e => setSearchForn(e.target.value)}
          className="w-64"
        />
        {state.item.fornecedor_id && (
          <button
            type="button"
            onClick={() => updateItem({ fornecedor_id: undefined })}
            className="text-xs text-gray-400 hover:text-red-500 ml-auto"
          >
            Limpar seleção
          </button>
        )}
      </div>

      {loadingForn ? <div className="flex justify-center p-4"><Spinner /></div> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {filteredForn.map(f => (
            <div
              key={f.id}
              onClick={() => selectFornecedor(f)}
              className={`rounded-lg border-2 cursor-pointer p-3 transition-all hover:shadow-md ${
                state.item.fornecedor_id === f.id ? 'border-brand-primary bg-red-50' : 'border-gray-200 hover:border-brand-primary/40'
              }`}
            >
              <p className="font-medium text-sm">{f.nome}</p>
              {f.contato && <p className="text-xs text-gray-500">{f.contato}</p>}
              {f.telefone && <p className="text-xs text-gray-400">{f.telefone}</p>}
            </div>
          ))}
          {filteredForn.length === 0 && (
            <p className="text-gray-500 col-span-4 text-sm">
              {searchForn ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado. Cadastre em Catálogo > Fornecedores.'}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold whitespace-nowrap">Matéria-Prima</h2>
        <Input
          placeholder="Buscar tecido..."
          value={searchMateria}
          onChange={e => setSearchMateria(e.target.value)}
          className="w-64"
        />
      </div>

      {loadingMaterias ? <div className="flex justify-center p-8"><Spinner /></div> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {filteredMaterias.map(m => (
            <div
              key={m.id}
              onClick={() => selectMateria(m)}
              className={`rounded-lg border-2 cursor-pointer p-3 transition-all hover:shadow-md ${
                state.item.materia_prima_id === m.id ? 'border-brand-primary bg-red-50' : 'border-gray-200 hover:border-brand-primary/40'
              }`}
            >
              <p className="font-medium text-sm">{m.nome}</p>
              {m.composicao && <p className="text-xs text-gray-500">{m.composicao}</p>}
            </div>
          ))}
          {filteredMaterias.length === 0 && (
            <p className="text-gray-500 col-span-4 text-sm">
              {searchMateria ? 'Nenhuma matéria-prima encontrada' : 'Nenhuma matéria-prima cadastrada'}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold whitespace-nowrap">Cor</h2>
        <Input
          placeholder="Buscar cor..."
          value={searchCor}
          onChange={e => setSearchCor(e.target.value)}
          className="w-64"
        />
      </div>

      {loadingCores ? <div className="flex justify-center p-8"><Spinner /></div> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {filteredCores.map(c => (
              <div
                key={c.id}
                onClick={() => selectCor(c)}
                className={`rounded-lg border-2 cursor-pointer p-3 transition-all hover:shadow-md ${
                  state.item.cor === c.nome ? 'border-brand-primary bg-red-50' : 'border-gray-200 hover:border-brand-primary/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: c.cor_hex ?? '#e5e7eb' }}
                  />
                  <p className="font-medium text-sm">{c.nome}</p>
                </div>
              </div>
            ))}
            {filteredCores.length === 0 && (
              <p className="text-gray-500 col-span-4 text-sm">
                {searchCor ? 'Nenhuma cor encontrada' : 'Nenhuma cor cadastrada. Cadastre em Catálogo > Cores.'}
              </p>
            )}
          </div>

          {state.item.cor && (
            <div className="flex items-center gap-3 mb-6 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg w-fit">
              <span className="text-sm text-gray-600">Tom de</span>
              <span className="text-sm font-medium text-gray-800">{state.item.cor}:</span>
              <input
                type="color"
                value={state.item.cor_hex ?? '#ffffff'}
                onChange={(e) => updateItem({ cor_hex: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                title="Ajustar tom exato"
              />
              <span className="text-xs text-gray-400">Ajuste o tom exato para o preview</span>
            </div>
          )}
        </>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrentStep(3)}>← Anterior</Button>
        <Button onClick={() => setCurrentStep(5)}>Próximo →</Button>
      </div>
    </div>
  )
}
