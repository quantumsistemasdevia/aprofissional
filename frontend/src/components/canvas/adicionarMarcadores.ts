import { LOCAIS } from '@/lib/constants/locais-personalizacao'

/** Minimal shape of a Fabric.js canvas instance (dynamically loaded v5 API) */
interface FabricCanvasInstance {
  add: (obj: unknown) => void
  renderAll: () => void
}

/** Minimal shape of the fabric module's Text constructor */
interface FabricModule {
  Text: new (text: string, opts: Record<string, unknown>) => unknown
}

export function adicionarMarcadores(
  canvas: FabricCanvasInstance,
  lado: 'frente' | 'verso',
  fabricModule: FabricModule,
  canvasWidth: number,
  canvasHeight: number
) {
  LOCAIS.filter((l) => l.painel === lado).forEach((local) => {
    const marker = new fabricModule.Text('📍', {
      left: local.xPct * canvasWidth,
      top: local.yPct * canvasHeight,
      fontSize: 18,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      opacity: 0.7,
    })
    canvas.add(marker)
  })
  canvas.renderAll()
}
