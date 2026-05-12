import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/constants/locais-personalizacao'

export function pctToPixel(xPct: number, yPct: number, w = CANVAS_WIDTH, h = CANVAS_HEIGHT) {
  return { x: xPct * w, y: yPct * h }
}

export function pixelToPct(x: number, y: number, w = CANVAS_WIDTH, h = CANVAS_HEIGHT) {
  return { xPct: x / w, yPct: y / h }
}

export function calcularTotal(quantidade: number, precoUnitario: number, tipoDesconto: 'fixo' | 'percentual' | undefined, desconto: number | undefined): number {
  const base = quantidade * precoUnitario
  if (!desconto || !tipoDesconto) return base
  if (tipoDesconto === 'fixo') return Math.max(0, base - desconto)
  return base * (1 - desconto / 100)
}
