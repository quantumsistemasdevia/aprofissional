-- Adiciona campo cor_hex na tabela catalogo_opcoes (usado pela categoria 'cor')
ALTER TABLE catalogo_opcoes ADD COLUMN IF NOT EXISTS cor_hex VARCHAR(7);

-- Popula os hexes das cores já cadastradas (por nome, independente de empresa)
UPDATE catalogo_opcoes SET cor_hex = CASE nome
  -- Neutros
  WHEN 'Branco'        THEN '#ffffff'
  WHEN 'Preto'         THEN '#000000'
  WHEN 'Cinza Claro'   THEN '#d1d5db'
  WHEN 'Cinza Médio'   THEN '#9ca3af'
  WHEN 'Cinza Escuro'  THEN '#4b5563'
  WHEN 'Chumbo'        THEN '#374151'
  WHEN 'Marfim'        THEN '#fffff0'
  WHEN 'Cru'           THEN '#f5f5dc'
  -- Azuis
  WHEN 'Azul Royal'    THEN '#4169e1'
  WHEN 'Azul Marinho'  THEN '#001f5b'
  WHEN 'Azul Celeste'  THEN '#87ceeb'
  WHEN 'Azul Turquesa' THEN '#40e0d0'
  WHEN 'Azul Petróleo' THEN '#005f73'
  WHEN 'Azul Bebê'     THEN '#89cff0'
  WHEN 'Azul Índigo'   THEN '#4b0082'
  -- Vermelhos e rosas
  WHEN 'Vermelho'       THEN '#dc2626'
  WHEN 'Vermelho Escuro'THEN '#991b1b'
  WHEN 'Bordô'          THEN '#800020'
  WHEN 'Rosa'           THEN '#f472b6'
  WHEN 'Rosa Claro'     THEN '#fce7f3'
  WHEN 'Coral'          THEN '#ff7f50'
  WHEN 'Salmão'         THEN '#fa8072'
  -- Verdes
  WHEN 'Verde Bandeira' THEN '#009c3b'
  WHEN 'Verde Escuro'   THEN '#14532d'
  WHEN 'Verde Claro'    THEN '#86efac'
  WHEN 'Verde Musgo'    THEN '#4d5d3b'
  WHEN 'Verde Militar'  THEN '#4b5320'
  WHEN 'Verde Menta'    THEN '#3eb489'
  WHEN 'Verde Limão'    THEN '#32cd32'
  -- Amarelos e laranjas
  WHEN 'Amarelo'        THEN '#facc15'
  WHEN 'Amarelo Ouro'   THEN '#d97706'
  WHEN 'Laranja'        THEN '#f97316'
  WHEN 'Laranja Escuro' THEN '#c2410c'
  -- Marrons e bege
  WHEN 'Bege'           THEN '#f5f0dc'
  WHEN 'Areia'          THEN '#e8d5b0'
  WHEN 'Marrom'         THEN '#92400e'
  WHEN 'Marrom Escuro'  THEN '#451a03'
  WHEN 'Caramelo'       THEN '#c27b2c'
  WHEN 'Camel'          THEN '#c19a6b'
  -- Roxos
  WHEN 'Roxo'           THEN '#7c3aed'
  WHEN 'Roxo Escuro'    THEN '#4c1d95'
  WHEN 'Lilás'          THEN '#c084fc'
  WHEN 'Vinho'          THEN '#7b1c2c'
  ELSE NULL
END
WHERE categoria = 'cor' AND cor_hex IS NULL;
