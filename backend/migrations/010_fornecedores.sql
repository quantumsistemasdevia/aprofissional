-- Tabela de fornecedores (multi-tenant)
CREATE TABLE fornecedores (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID       NOT NULL REFERENCES empresas(id),
  nome      VARCHAR(120) NOT NULL,
  contato   VARCHAR(120),
  telefone  VARCHAR(30),
  email     VARCHAR(120),
  ativo     BOOLEAN     NOT NULL DEFAULT true,
  criado_em TIMESTAMP   DEFAULT NOW(),
  deletado_em TIMESTAMP
);

CREATE INDEX idx_fornecedores_empresa
  ON fornecedores (empresa_id)
  WHERE deletado_em IS NULL;

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_fornecedores" ON fornecedores
  USING (empresa_id = current_setting('app.current_empresa_id', true)::uuid);

-- Coluna na tabela de itens do pedido
ALTER TABLE itens_pedido ADD COLUMN fornecedor_id UUID REFERENCES fornecedores(id);
