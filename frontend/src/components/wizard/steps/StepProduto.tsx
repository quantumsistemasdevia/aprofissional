'use client'

import { useEffect, useState } from 'react'
import { useWizard } from '../WizardProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useProdutos, type Produto } from '@/hooks/useProdutos'

export function StepProduto() {
  const { state, updateItem, setCurrentStep } = useWizard()
  const { produtos, loading, list } = useProdutos()
  const [search, setSearch] = useState('')

  const produtoPronto = state.item.produto_pronto ?? false

  useEffect(() => { list() }, [list])

  const filtered = produtos.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()))

  function select(p: Produto) {
    if (produtoPronto) {
      updateItem({ produto_id: p.id, modelo_id: undefined, materia_prima_id: undefined, produto_pronto: true })
      setCurrentStep(5)
    } else {
      const modeloId = state.item.produto_id === p.id ? state.item.modelo_id : undefined
      updateItem({ produto_id: p.id, modelo_id: modeloId, produto_pronto: false })
      setCurrentStep(3)
    }
  }

  function toggleProdutoPronto(checked: boolean) {
    updateItem({ produto_pronto: checked, modelo_id: undefined, materia_prima_id: undefined })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Selecione o Produto</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={produtoPronto}
              onChange={e => toggleProdutoPronto(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-brand-primary"
            />
            <span className="text-sm font-medium text-gray-700">Produto Pronto</span>
          </label>
          <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        </div>
      </div>

      {produtoPronto && (
        <div className="mb-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-700">
          <span className="font-medium">Produto Pronto:</span> modelo e matéria-prima já disponíveis — etapas 3 e 4 serão puladas.
        </div>
      )}

      {loading ? <div className="flex justify-center p-12"><Spinner /></div> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => select(p)}
              className={`rounded-lg border-2 cursor-pointer overflow-hidden transition-all hover:shadow-md ${
                state.item.produto_id === p.id ? 'border-brand-primary' : 'border-gray-200 hover:border-brand-primary/40'
              }`}
            >
              {p.url_imagem ? (
                <img src={p.url_imagem} alt={p.nome} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">Sem imagem</div>
              )}
              <div className="p-3"><p className="font-medium text-sm">{p.nome}</p></div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-gray-500 col-span-3">{search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</p>}
        </div>
      )}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>← Anterior</Button>
      </div>
    </div>
  )
}
