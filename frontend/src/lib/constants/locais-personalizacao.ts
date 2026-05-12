export interface LocalPersonalizacao {
  id: string
  nome: string
  categoria: string
  xPct: number
  yPct: number
  painel: 'frente' | 'verso'
  descricao: string
}

export const LOCAIS: LocalPersonalizacao[] = [
  { id: 'bolso_acima', nome: 'Bolso Acima', categoria: 'Bolso', xPct: 0.50, yPct: 0.15, painel: 'frente', descricao: 'Bolso superior' },
  { id: 'bolso_centro', nome: 'Bolso Centro', categoria: 'Bolso', xPct: 0.50, yPct: 0.30, painel: 'frente', descricao: 'Bolso central' },
  { id: 'bolso_baixo', nome: 'Bolso Baixo', categoria: 'Bolso', xPct: 0.50, yPct: 0.45, painel: 'frente', descricao: 'Bolso inferior' },
  { id: 'peito', nome: 'Peito', categoria: 'Frente', xPct: 0.50, yPct: 0.25, painel: 'frente', descricao: 'Centro do peito' },
  { id: 'ombro_direito', nome: 'Ombro Direito', categoria: 'Frente', xPct: 0.75, yPct: 0.10, painel: 'frente', descricao: 'Ombro direito' },
  { id: 'ombro_esquerdo', nome: 'Ombro Esquerdo', categoria: 'Frente', xPct: 0.25, yPct: 0.10, painel: 'frente', descricao: 'Ombro esquerdo' },
  { id: 'estomago', nome: 'Estômago', categoria: 'Frente', xPct: 0.50, yPct: 0.55, painel: 'frente', descricao: 'Região do estômago' },
  { id: 'bolso_direita', nome: 'Bolso Direito', categoria: 'Frente', xPct: 0.80, yPct: 0.35, painel: 'frente', descricao: 'Bolsinho lado direito' },
  { id: 'bolso_esquerda', nome: 'Bolso Esquerdo', categoria: 'Frente', xPct: 0.20, yPct: 0.35, painel: 'frente', descricao: 'Bolsinho lado esquerdo' },
  { id: 'etiqueta_costas', nome: 'Etiqueta Costas', categoria: 'Costas', xPct: 0.50, yPct: 0.05, painel: 'verso', descricao: 'Etiqueta interna' },
  { id: 'padrao_costas', nome: 'Padrão Costas', categoria: 'Costas', xPct: 0.50, yPct: 0.35, painel: 'verso', descricao: 'Padrão costas' },
  { id: 'barra_costas', nome: 'Barra Costas', categoria: 'Costas', xPct: 0.50, yPct: 0.90, painel: 'verso', descricao: 'Barra das costas' },
  { id: 'numerada_peito', nome: 'Numerada Peito', categoria: 'Personalizada', xPct: 0.50, yPct: 0.20, painel: 'frente', descricao: 'Numeração no peito' },
  { id: 'numerada_costas', nome: 'Numerada Costas', categoria: 'Personalizada', xPct: 0.50, yPct: 0.30, painel: 'verso', descricao: 'Numeração costas' },
  { id: 'nomeada_peito', nome: 'Nomeada Peito', categoria: 'Personalizada', xPct: 0.50, yPct: 0.35, painel: 'frente', descricao: 'Nome no peito' },
  { id: 'nomeada_costas', nome: 'Nomeada Costas', categoria: 'Personalizada', xPct: 0.50, yPct: 0.40, painel: 'verso', descricao: 'Nome costas' },
  { id: 'barra_central', nome: 'Barra Central', categoria: 'Barra', xPct: 0.50, yPct: 0.95, painel: 'frente', descricao: 'Barra central' },
  { id: 'barra_direita', nome: 'Barra Direita', categoria: 'Barra', xPct: 0.75, yPct: 0.95, painel: 'frente', descricao: 'Barra lado direito' },
  { id: 'barra_esquerda', nome: 'Barra Esquerda', categoria: 'Barra', xPct: 0.25, yPct: 0.95, painel: 'frente', descricao: 'Barra lado esquerdo' },
  { id: 'etiqueta_barra', nome: 'Etiqueta Barra', categoria: 'Barra', xPct: 0.50, yPct: 0.92, painel: 'frente', descricao: 'Etiqueta na barra' },
  { id: 'local_personalizado_frente', nome: 'Local Personalizado Frente', categoria: 'Personalização Local', xPct: 0.50, yPct: 0.50, painel: 'frente', descricao: 'Local definido livremente' },
  { id: 'local_personalizado_costas', nome: 'Local Personalizado Costas', categoria: 'Personalização Local', xPct: 0.50, yPct: 0.50, painel: 'verso', descricao: 'Local definido livremente' },
  { id: 'local_bolso', nome: 'Local Bolso', categoria: 'Personalização Local', xPct: 0.50, yPct: 0.30, painel: 'frente', descricao: 'No bolso' },
  { id: 'local_ombros', nome: 'Local Ombros', categoria: 'Personalização Local', xPct: 0.50, yPct: 0.10, painel: 'frente', descricao: 'Ombros' },
]

export const CANVAS_WIDTH = 400
export const CANVAS_HEIGHT = 500
