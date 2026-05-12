'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WizardProvider, useWizard } from '@/components/wizard/WizardProvider'
import { WizardStepper } from '@/components/wizard/WizardStepper'
import { StepCliente } from '@/components/wizard/steps/StepCliente'
import { StepProduto } from '@/components/wizard/steps/StepProduto'
import { StepModelo } from '@/components/wizard/steps/StepModelo'
import { StepMateriaPrima } from '@/components/wizard/steps/StepMateriaPrima'
import { StepTamanho } from '@/components/wizard/steps/StepTamanho'
import { StepPersonalizacao } from '@/components/wizard/steps/StepPersonalizacao'
import { StepLocal } from '@/components/wizard/steps/StepLocal'
import { StepValores } from '@/components/wizard/steps/StepValores'
import { StepPreview } from '@/components/wizard/steps/StepPreview'
import { StepResumo } from '@/components/wizard/steps/StepResumo'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

function WizardContent() {
  const { state, reset } = useWizard()
  const router = useRouter()
  const isEditMode = !!state.editMode

  function handleCancelar() {
    if (isEditMode && state.editMode) {
      const destino = `/pedidos/${state.editMode.pedidoId}`
      reset()
      router.push(destino)
    } else {
      reset()
      router.push('/pedidos')
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isEditMode ? 'Editar Pedido' : 'Novo Pedido'}</h1>
        <Button variant="ghost" onClick={handleCancelar}>
          ✕ Cancelar
        </Button>
      </div>
      <WizardStepper />
      <Card>
        <div className="p-6">
          {state.currentStep === 1 && <StepCliente />}
          {state.currentStep === 2 && <StepProduto />}
          {state.currentStep === 3 && <StepModelo />}
          {state.currentStep === 4 && <StepMateriaPrima />}
          {state.currentStep === 5 && <StepTamanho />}
          {state.currentStep === 6 && <StepPersonalizacao />}
          {state.currentStep === 7 && <StepLocal />}
          {state.currentStep === 8 && <StepValores />}
          {state.currentStep === 9 && <StepPreview />}
          {state.currentStep === 10 && <StepResumo />}
        </div>
      </Card>
    </div>
  )
}

function WizardWithProvider() {
  const searchParams = useSearchParams()
  const mountKey = searchParams.get('t') ?? 'default'

  return (
    <WizardProvider key={mountKey}>
      <WizardContent />
    </WizardProvider>
  )
}

export default function NovoPedidoPage() {
  return (
    <Suspense>
      <WizardWithProvider />
    </Suspense>
  )
}
