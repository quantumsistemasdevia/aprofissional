'use client'

import { useMemo } from 'react'
import { useWizard } from '../WizardProvider'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function StepValores() {
  const { state, updateItem, setCurrentStep } = useWizard()
  const { item } = state

  const qtdTotal = useMemo(
    () => Object.values(item.tamanhos_quantidades).reduce((a, b) => a + b, 0),
    [item.tamanhos_quantidades]
  )

  const totalBruto = (item.valor_unitario ?? 0) * qtdTotal

  const totalLiquido = useMemo(() => {
    if (!item.desconto) return totalBruto
    if (item.tipo_desconto === 'percentual') return totalBruto * (1 - item.desconto / 100)
    return Math.max(0, totalBruto - item.desconto)
  }, [totalBruto, item.desconto, item.tipo_desconto])

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Valores</h2>

      <div className="space-y-4">
        <Input
          label="Valor Unitário (R$)"
          type="number"
          min="0"
          step="0.01"
          value={item.valor_unitario ?? ''}
          onChange={(e) => updateItem({ valor_unitario: parseFloat(e.target.value) || 0 })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo de Desconto"
            options={[
              { value: 'fixo', label: 'Valor fixo (R$)' },
              { value: 'percentual', label: 'Percentual (%)' },
            ]}
            value={item.tipo_desconto ?? 'fixo'}
            onChange={(e) => {
              const tipo = e.target.value as 'fixo' | 'percentual'
              updateItem({ tipo_desconto: tipo, desconto: 0 })
            }}
          />
          <Input
            label={item.tipo_desconto === 'percentual' ? 'Desconto (%)' : 'Desconto (R$)'}
            type="number"
            min="0"
            step="0.01"
            value={item.desconto ?? ''}
            onChange={(e) => updateItem({ desconto: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <Card className="mt-6 p-4 bg-red-50 border-red-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Total de peças</p>
            <p className="text-xl font-bold text-gray-800">{qtdTotal}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Valor bruto</p>
            <p className="text-xl font-bold text-gray-800">R$ {totalBruto.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total líquido</p>
            <p className="text-xl font-bold text-brand-primary">R$ {totalLiquido.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrentStep(state.item.arte_pronta ? 6 : 7)}>
          ← Anterior
        </Button>
        <Button onClick={() => setCurrentStep(9)}>Próximo →</Button>
      </div>
    </div>
  )
}
