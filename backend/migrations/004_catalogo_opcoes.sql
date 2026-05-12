-- Tabela genérica para opções configuráveis do catálogo
-- Armazena listas de: modelo, gola, mangas, barras, recortes, bolsos, acabamento

CREATE TABLE catalogo_opcoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id),
  categoria   VARCHAR(50) NOT NULL,  -- 'modelo','gola','mangas','barras','recortes','bolsos','acabamento'
  nome        VARCHAR(120) NOT NULL,
  descricao   TEXT,
  ordem       INT NOT NULL DEFAULT 0,
  ativa       BOOLEAN NOT NULL DEFAULT true,
  criado_em   TIMESTAMP DEFAULT NOW(),
  deletado_em TIMESTAMP
);

CREATE INDEX idx_catalogo_opcoes_empresa_cat ON catalogo_opcoes (empresa_id, categoria)
  WHERE deletado_em IS NULL;

ALTER TABLE catalogo_opcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_catalogo_opcoes" ON catalogo_opcoes
  USING (empresa_id = current_setting('app.current_empresa_id', true)::uuid);
