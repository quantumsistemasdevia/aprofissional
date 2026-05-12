-- 1. Remover a constraint ANTES de alterar os dados
ALTER TABLE itens_pedido DROP CONSTRAINT IF EXISTS itens_pedido_status_compra_check;

-- 2. Migrar dados existentes para os novos status
UPDATE itens_pedido
  SET status_compra = 'nao_comprado'
  WHERE status_compra IN ('nao_enviado', 'relatorio_gerado');

UPDATE itens_pedido
  SET status_compra = 'comprado'
  WHERE status_compra = 'enviado';

-- 3. Adicionar nova constraint
ALTER TABLE itens_pedido ADD CONSTRAINT itens_pedido_status_compra_check
  CHECK (status_compra IN ('nao_comprado', 'comprado'));

-- 4. Atualizar default
ALTER TABLE itens_pedido ALTER COLUMN status_compra SET DEFAULT 'nao_comprado';
