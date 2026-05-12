export type StatusPedido = 'orcamento' | 'aprovado' | 'producao' | 'finalizado' | 'entregue'
export type StatusProducao = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
export type TipoPessoa = 'fisica' | 'juridica'
export type PerfilUsuario = 'admin' | 'vendedor' | 'producao'
export type TipoPersonalizacao = 'serigrafia' | 'DTF' | 'bordado' | 'sublimacao'
export type LadoPeca = 'frente' | 'verso'

export interface LocalPersonalizacao {
  id: string
  nome: string
  categoria: string
  xPct: number
  yPct: number
  painel: LadoPeca
  descricao: string
}

export interface Personalizacao {
  id: string
  tipo: 'serigrafia' | 'DTF' | 'bordado' | 'sublimacao'
  sublimacao_tipo?: 'total' | 'parcial'
  tipo_conteudo: 'imagem' | 'texto'
  lado: 'frente' | 'verso'
  local_id?: string
  url_imagem?: string
  texto_conteudo?: string
  texto_fonte?: string
  cores: string[]
  canvas_x: number
  canvas_y: number
  canvas_escala: number
  canvas_escala_base?: number   // baseScale de imagens — persiste entre edit e view
  canvas_rotacao: number
  observacao?: string
}