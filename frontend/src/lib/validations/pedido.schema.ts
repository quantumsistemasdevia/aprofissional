import { z } from 'zod'

export const especificacoesModeloSchema = z.object({
  tipo: z.string().optional(),
  cor_unica: z.string().optional(),
  gola: z.string().optional(),
  gola_cor: z.string().optional(),
  mangas: z.string().optional(),
  mangas_cor: z.string().optional(),
  barras: z.string().optional(),
  barras_cor: z.string().optional(),
  recortes: z.string().optional(),
  recortes_cor: z.string().optional(),
  bolsos: z.string().optional(),
  bolsos_cor: z.string().optional(),
  acabamento: z.string().optional(),
  acabamento_cor: z.string().optional(),
})

export const personalizacaoSchema = z.object({
  id: z.string(),
  tipo: z.enum(['serigrafia', 'DTF', 'bordado', 'sublimacao']),
  tipo_conteudo: z.enum(['imagem', 'texto']),
  lado: z.enum(['frente', 'verso']),
  local_id: z.string().optional(),
  url_imagem: z.string().optional(),
  texto_conteudo: z.string().optional(),
  texto_fonte: z.string().optional(),
  cores: z.array(z.string()),
  canvas_x: z.number(),
  canvas_y: z.number(),
  canvas_escala: z.number().positive(),
  canvas_rotacao: z.number(),
  observacao: z.string().optional(),
})

export const itemPedidoSchema = z.object({
  produto_id: z.string().uuid('produto_id deve ser UUID'),
  modelo_id: z.string().uuid('modelo_id deve ser UUID').optional(),
  materia_prima_id: z.string().uuid().optional(),
  cor: z.string().min(1, 'Cor é obrigatória').optional(),
  tamanhos_quantidades: z.record(z.string(), z.number().int().min(0)),
  valor_unitario: z.number().positive('Valor unitário deve ser positivo'),
  tipo_desconto: z.enum(['fixo', 'percentual']).optional(),
  desconto: z.number().min(0).optional(),
  especificacoes_modelo: especificacoesModeloSchema.optional(),
})

export const criarPedidoSchema = z.object({
  cliente_id: z.string().uuid('cliente_id deve ser UUID'),
  previsao_entrega: z.string().min(1, 'Previsão de entrega é obrigatória'),
  vendedor_id: z.string().uuid().optional(),
  forma_pagamento: z.enum(['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto']).optional(),
  item: itemPedidoSchema,
  personalizacoes: z.array(personalizacaoSchema).default([]),
})

export type ItemPedidoInput = z.infer<typeof itemPedidoSchema>
export type CriarPedidoInput = z.infer<typeof criarPedidoSchema>
export type PersonalizacaoInput = z.infer<typeof personalizacaoSchema>
