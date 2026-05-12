-- Tabela de tamanhos do catálogo (multi-tenant)
CREATE TABLE catalogo_tamanhos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL REFERENCES empresas(id),
  grupo       VARCHAR(60) NOT NULL,
  nome        VARCHAR(30) NOT NULL,
  ordem       INT         NOT NULL DEFAULT 0,
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  criado_em   TIMESTAMP   DEFAULT NOW(),
  deletado_em TIMESTAMP
);

CREATE INDEX idx_catalogo_tamanhos_empresa
  ON catalogo_tamanhos (empresa_id, grupo)
  WHERE deletado_em IS NULL;

ALTER TABLE catalogo_tamanhos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_catalogo_tamanhos" ON catalogo_tamanhos
  USING (empresa_id = current_setting('app.current_empresa_id', true)::uuid);

-- Seed: tamanhos padrão inseridos para todas as empresas já existentes
INSERT INTO catalogo_tamanhos (id, empresa_id, grupo, nome, ordem)
SELECT gen_random_uuid(), e.id, t.grupo, t.nome, t.ordem
FROM empresas e
CROSS JOIN (VALUES
  ('Feminino',            'Baby Look', 0),
  ('Feminino',            'PP',        1),
  ('Feminino',            'P',         2),
  ('Feminino',            'M',         3),
  ('Feminino',            'G',         4),
  ('Feminino',            'GG',        5),
  ('Masculino',           'PP',        0),
  ('Masculino',           'P',         1),
  ('Masculino',           'M',         2),
  ('Masculino',           'G',         3),
  ('Masculino',           'GG',        4),
  ('Feminino Numeração',  '36',        0),
  ('Feminino Numeração',  '38',        1),
  ('Feminino Numeração',  '40',        2),
  ('Feminino Numeração',  '42',        3),
  ('Feminino Numeração',  '44',        4),
  ('Feminino Numeração',  '46',        5),
  ('Masculino Numeração', '36',        0),
  ('Masculino Numeração', '38',        1),
  ('Masculino Numeração', '40',        2),
  ('Masculino Numeração', '42',        3),
  ('Masculino Numeração', '44',        4),
  ('Masculino Numeração', '46',        5),
  ('Infantil',            '2',         0),
  ('Infantil',            '4',         1),
  ('Infantil',            '6',         2),
  ('Infantil',            '8',         3)
) AS t(grupo, nome, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM catalogo_tamanhos WHERE empresa_id = e.id
);
