'use client'

import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/constants/locais-personalizacao'
import type { Personalizacao } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

function toAbsoluteUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('/')) return `${API_URL}${url}`
  return url
}

export interface FabricCanvasHandle {
  exportImage: () => string | null
}

interface FabricCanvasProps {
  urlImagemFundo: string
  personalizacoes: Personalizacao[]
  width?: number
  height?: number
  mode?: 'edit' | 'view'
  onChange?: (updates: Array<{
    id: string
    canvas_x: number
    canvas_y: number
    canvas_escala: number
    canvas_escala_base: number
    canvas_rotacao: number
  }>) => void
  paintBucketColor?: string
  isPaintBucketActive?: boolean
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null
}

function floodFill(imageData: ImageData, startX: number, startY: number, fillHex: string, tolerance: number) {
  const { data, width: w, height: h } = imageData
  const fill = hexToRgb(fillHex)
  if (!fill) return

  const idx0 = (startY * w + startX) * 4
  const tr = data[idx0], tg = data[idx0 + 1], tb = data[idx0 + 2]

  if (
    Math.abs(tr - fill.r) <= tolerance &&
    Math.abs(tg - fill.g) <= tolerance &&
    Math.abs(tb - fill.b) <= tolerance
  ) return

  // Soft zone: pixels within SOFT are blended (edge anti-aliasing), not spread further
  const SOFT = tolerance * 3

  function rgbDist(idx: number) {
    const dr = data[idx]     - tr
    const dg = data[idx + 1] - tg
    const db = data[idx + 2] - tb
    return Math.sqrt(dr * dr + dg * dg + db * db)
  }

  const visited = new Uint8Array(w * h)
  const stack: number[] = [startY * w + startX]

  while (stack.length) {
    const pos = stack.pop()!
    if (visited[pos]) continue
    visited[pos] = 1

    const idx = pos * 4
    const dist = rgbDist(idx)

    if (dist > SOFT) continue

    const x = pos % w
    const y = (pos - x) / w

    if (dist <= tolerance) {
      // Hard zone: full replace and keep spreading
      data[idx]     = fill.r
      data[idx + 1] = fill.g
      data[idx + 2] = fill.b
      data[idx + 3] = 255
      if (x > 0)     stack.push(pos - 1)
      if (x < w - 1) stack.push(pos + 1)
      if (y > 0)     stack.push(pos - w)
      if (y < h - 1) stack.push(pos + w)
    } else {
      // Soft zone: blend toward fill color — no further spreading prevents background leakage
      const t = 1 - (dist - tolerance) / (SOFT - tolerance)
      data[idx]     = Math.round(data[idx]     + (fill.r - data[idx])     * t)
      data[idx + 1] = Math.round(data[idx + 1] + (fill.g - data[idx + 1]) * t)
      data[idx + 2] = Math.round(data[idx + 2] + (fill.b - data[idx + 2]) * t)
      data[idx + 3] = Math.round(Math.min(255, data[idx + 3] + (255 - data[idx + 3]) * t))
    }
  }
}

interface FabricObj {
  left?: number
  top?: number
  scaleX?: number
  scaleY?: number
  angle?: number
  width?: number
  height?: number
  set: (opts: Record<string, unknown>) => void
  scaleToWidth: (w: number) => void
}

interface FabricCanvasInstance {
  add: (obj: FabricObj) => void
  remove: (obj: FabricObj) => void
  dispose: () => void
  renderAll: () => void
  requestRenderAll: () => void
  setBackgroundImage: (img: FabricObj, callback: () => void) => void
  on: (event: string, handler: () => void) => void
  off: (event: string, handler: () => void) => void
  toDataURL: (opts: { format: string; quality: number }) => string
  getObjects: () => FabricObj[]
  clear: () => void
}

interface ObjEntry { obj: FabricObj; baseScale: number }

// Chave de serialização para comparar personalizacoes sem referência
function persKey(personalizacoes: Personalizacao[]): string {
  return JSON.stringify(personalizacoes.map(p => ({
    id: p.id,
    canvas_x: p.canvas_x,
    canvas_y: p.canvas_y,
    canvas_escala: p.canvas_escala,
    canvas_escala_base: p.canvas_escala_base,
    canvas_rotacao: p.canvas_rotacao,
    tipo_conteudo: p.tipo_conteudo,
    url_imagem: p.url_imagem,
    texto_conteudo: p.texto_conteudo,
    texto_fonte: p.texto_fonte,
    cores: p.cores,
    lado: p.lado,
  })))
}

export const FabricCanvas = forwardRef<FabricCanvasHandle, FabricCanvasProps>(function FabricCanvas(
  {
    urlImagemFundo,
    personalizacoes,
    width = CANVAS_WIDTH,
    height = CANVAS_HEIGHT,
    mode = 'edit',
    onChange,
    paintBucketColor,
    isPaintBucketActive = false,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<FabricCanvasInstance | null>(null)
  const objMapRef = useRef<Map<string, ObjEntry>>(new Map())
  const fabricLibRef = useRef<Record<string, unknown> | null>(null)
  const lastPersKeyRef = useRef<string>('')
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  // incremented after fabric finishes loading so useEffect 2 re-runs with canvas ready
  const [canvasReady, setCanvasReady] = useState(0)

  useImperativeHandle(ref, () => ({
    exportImage: () => {
      if (!fabricRef.current) return null
      fabricRef.current.renderAll()
      return fabricRef.current.toDataURL({ format: 'png', quality: 1 })
    },
  }))

  const notifyChanges = useCallback(() => {
    if (!onChange || !fabricRef.current) return
    const updates: Array<{
      id: string
      canvas_x: number
      canvas_y: number
      canvas_escala: number
      canvas_escala_base: number
      canvas_rotacao: number
    }> = []

    objMapRef.current.forEach(({ obj, baseScale }, id) => {
      updates.push({
        id,
        canvas_x:           (obj.left  ?? 0) / width,
        canvas_y:           (obj.top   ?? 0) / height,
        canvas_escala:      (obj.scaleX ?? baseScale) / baseScale,
        canvas_escala_base: baseScale,
        canvas_rotacao:     obj.angle ?? 0,
      })
    })
    onChange(updates)
  }, [onChange, width, height])

  // ── Offscreen canvas: mantém estado acumulado das cores aplicadas pelo balde ──
  useEffect(() => {
    if (!urlImagemFundo) return
    const offscreen = document.createElement('canvas')
    offscreen.width  = width
    offscreen.height = height
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const scale = width / img.naturalWidth
      ctx.drawImage(img, 0, 0, img.naturalWidth * scale, img.naturalHeight * scale)
      offscreenCanvasRef.current = offscreen
    }
    img.src = toAbsoluteUrl(urlImagemFundo)

    return () => { offscreenCanvasRef.current = null }
  }, [urlImagemFundo, width, height])

  const applyFloodFill = useCallback((x: number, y: number, color: string) => {
    const offscreen   = offscreenCanvasRef.current
    const fabricCanvas = fabricRef.current
    const fabric      = fabricLibRef.current
    if (!offscreen || !fabricCanvas || !fabric) return

    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height)
    floodFill(imageData, x, y, color, 20)
    ctx.putImageData(imageData, 0, 0)

    const dataUrl = offscreen.toDataURL()
    const FabricImage = (fabric as unknown as {
      Image: { fromURL: (url: string, cb: (img: FabricObj) => void, opts: Record<string, unknown>) => void }
    }).Image

    FabricImage.fromURL(dataUrl, (img: FabricObj) => {
      img.set({ selectable: false, evented: false, originX: 'left', originY: 'top', left: 0, top: 0 })
      fabricCanvas.setBackgroundImage(img, () => fabricCanvas.renderAll())
    }, {})
  }, [])

  // ── useEffect 1: inicializa o canvas (só muda se url/dimensões/mode mudarem) ──
  useEffect(() => {
    if (!canvasRef.current) return
    let canvas: FabricCanvasInstance | null = null
    let destroyed = false

    import('fabric').then(({ fabric }) => {
      if (destroyed || !canvasRef.current) return

      canvas = new (fabric.Canvas as unknown as new (
        el: HTMLCanvasElement,
        opts: Record<string, unknown>
      ) => FabricCanvasInstance)(canvasRef.current, {
        width,
        height,
        backgroundColor: '#f3f4f6',
        selection: mode === 'edit',
      })
      fabricRef.current = canvas
      fabricLibRef.current = fabric as unknown as Record<string, unknown>

      const FabricImage = (fabric as unknown as {
        Image: { fromURL: (url: string, cb: (img: FabricObj) => void, opts: Record<string, unknown>) => void }
      }).Image

      if (urlImagemFundo) {
        FabricImage.fromURL(
          toAbsoluteUrl(urlImagemFundo),
          (img) => {
            if (!canvas || destroyed) return
            img.scaleToWidth(width)
            img.set({ selectable: false, evented: false, originX: 'left', originY: 'top', left: 0, top: 0 })
            canvas.setBackgroundImage(img, () => canvas!.renderAll())
          },
          { crossOrigin: 'anonymous' }
        )
      }

      canvas.on('object:modified', notifyChanges)

      // Reset key so useEffect 2 sees a difference and syncs the pre-loaded personalizations
      lastPersKeyRef.current = ''
      setCanvasReady(v => v + 1)
    })

    return () => {
      destroyed = true
      canvas?.dispose()
      fabricRef.current = null
      fabricLibRef.current = null
      objMapRef.current.clear()
      lastPersKeyRef.current = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlImagemFundo, width, height, mode])

  // ── useEffect 2: sincroniza personalizações quando mudam ──
  useEffect(() => {
    const currentKey = persKey(personalizacoes)
    if (currentKey === lastPersKeyRef.current) return

    const canvas = fabricRef.current
    const fabric = fabricLibRef.current
    if (!canvas || !fabric) return

    lastPersKeyRef.current = currentKey

    // Remove todos os objetos existentes (sem remover o background)
    objMapRef.current.forEach(({ obj }) => canvas.remove(obj))
    objMapRef.current.clear()

    const FabricImage = (fabric as unknown as {
      Image: { fromURL: (url: string, cb: (img: FabricObj) => void, opts: Record<string, unknown>) => void }
    }).Image

    const FabricText = (fabric as unknown as {
      Text: new (text: string, opts: Record<string, unknown>) => FabricObj
    }).Text

    let pending = 0
    function onReady() {
      if (--pending === 0) canvas!.renderAll()
    }

    personalizacoes.forEach((pers) => {
      const baseAttrs = {
        left:       pers.canvas_x * width,
        top:        pers.canvas_y * height,
        originX:    'center',
        originY:    'center',
        angle:      pers.canvas_rotacao ?? 0,
        selectable: mode === 'edit',
        evented:    mode === 'edit',
      }

      if (pers.tipo_conteudo === 'imagem' && pers.url_imagem) {
        const absUrl = toAbsoluteUrl(pers.url_imagem)
        const isSvg  = absUrl.toLowerCase().includes('.svg')

        const applyImage = (raw: FabricObj) => {
          const naturalW  = (raw as unknown as { width: number }).width || 100
          const baseScale = pers.canvas_escala_base
            ?? Math.min((width * 0.25) / naturalW, 3)
          const targetScale = baseScale * (pers.canvas_escala ?? 1)
          raw.set({ ...baseAttrs, scaleX: targetScale, scaleY: targetScale })
          objMapRef.current.set(pers.id, { obj: raw, baseScale })
          canvas!.add(raw)
          onReady()
        }

        if (isSvg) {
          pending++
          ;(fabric as unknown as {
            loadSVGFromURL: (url: string, cb: (objs: FabricObj[], opts: Record<string, unknown>) => void) => void
          }).loadSVGFromURL(absUrl, (objects, options) => {
            const group = (fabric as unknown as {
              util: { groupSVGElements: (o: FabricObj[], opts: Record<string, unknown>) => FabricObj }
            }).util.groupSVGElements(objects, options)
            applyImage(group)
          })
        } else {
          pending++
          FabricImage.fromURL(absUrl, applyImage, { crossOrigin: 'anonymous' })
        }

      } else if (pers.tipo_conteudo === 'texto' && pers.texto_conteudo) {
        const fontSize = Math.round(height * 0.07)
        const text = new FabricText(pers.texto_conteudo, {
          ...baseAttrs,
          fontFamily: pers.texto_fonte || 'Arial',
          fontSize,
          fill: pers.cores?.[0] || '#000000',
          scaleX: pers.canvas_escala ?? 1,
          scaleY: pers.canvas_escala ?? 1,
        })
        objMapRef.current.set(pers.id, { obj: text, baseScale: 1 })
        canvas.add(text)
      }
    })

    if (pending === 0) canvas.renderAll()

  }, [personalizacoes, width, height, mode, canvasReady])

  return (
    <div className="relative border border-gray-200 rounded-lg overflow-hidden" style={{ width, height }}>
      <canvas ref={canvasRef} />
      {isPaintBucketActive && paintBucketColor && (
        <div
          className="absolute inset-0"
          style={{ cursor: 'crosshair' }}
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const scaleX = width  / rect.width
            const scaleY = height / rect.height
            const x = Math.round((e.clientX - rect.left) * scaleX)
            const y = Math.round((e.clientY - rect.top)  * scaleY)
            applyFloodFill(x, y, paintBucketColor)
          }}
        />
      )}
    </div>
  )
})