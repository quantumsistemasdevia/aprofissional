'use client'

import { useWizard } from './WizardProvider'

const STEPS = [
  { num: 1, label: 'Cliente' },
  { num: 2, label: 'Produto' },
  { num: 3, label: 'Modelo' },
  { num: 4, label: 'Matéria-Prima' },
  { num: 5, label: 'Tamanho' },
  { num: 6, label: 'Personalização' },
  { num: 7, label: 'Local' },
  { num: 8, label: 'Valores' },
  { num: 9, label: 'Preview' },
  { num: 10, label: 'Resumo' },
]

const STEPS_PULADOS_PRODUTO_PRONTO = new Set([3, 4])

export function WizardStepper() {
  const { state, setCurrentStep } = useWizard()
  const produtoPronto = state.item.produto_pronto ?? false

  function handleStepClick(num: number) {
    if (produtoPronto && STEPS_PULADOS_PRODUTO_PRONTO.has(num)) {
      setCurrentStep(5)
      return
    }
    setCurrentStep(num)
  }

  return (
    <div className="flex items-center overflow-x-auto pb-2 mb-8 gap-1">
      {STEPS.map((step, index) => {
        const pulado = produtoPronto && STEPS_PULADOS_PRODUTO_PRONTO.has(step.num)
        const ativo = state.currentStep === step.num
        const concluido = !pulado && state.currentStep > step.num

        return (
          <div key={step.num} className="flex items-center flex-shrink-0">
            <button
              onClick={() => handleStepClick(step.num)}
              title={pulado ? `${step.label} (pulado — Produto Pronto)` : step.label}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                pulado
                  ? 'bg-gray-100 text-gray-400 cursor-default line-through'
                  : ativo
                  ? 'bg-brand-primary text-white'
                  : concluido
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {pulado ? '—' : concluido ? '✓' : step.num}
            </button>
            <span className={`ml-1 mr-2 text-xs hidden sm:inline ${
              pulado ? 'text-gray-300 line-through' : ativo ? 'font-medium text-brand-primary' : 'text-gray-500'
            }`}>
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <div className={`w-4 h-0.5 ${concluido ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
