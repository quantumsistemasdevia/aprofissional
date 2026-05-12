import { z } from 'zod'

export const personalizacaoSchema = z.object({
  tipo: z.enum(['serigrafia', 'DTF', 'bordado', 'sublimacao']),
  tipo_conteudo: z.enum(['imagem', 'texto']),
  url_imagem: z.string().optional(),
  texto_conteudo: z.string().optional(),
  texto_fonte: z.string().optional(),
  cores: z.array(z.string()).default([]),
  lado: z.enum(['frente', 'verso']),
  localizacao: z.string().min(1, 'Local é obrigatório'),
  canvas_x: z.number().optional(),
  canvas_y: z.number().optional(),
  canvas_escala: z.number().optional(),
  canvas_rotacao: z.number().optional(),
})

export type PersonalizacaoInput = z.infer<typeof personalizacaoSchema>
