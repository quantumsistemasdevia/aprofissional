-- Permite modelo_id nulo (produto pronto não precisa de modelo)
ALTER TABLE itens_pedido ALTER COLUMN modelo_id DROP NOT NULL;

-- Marca itens de produto pronto (sem necessidade de compra de material)
ALTER TABLE itens_pedido
  ADD COLUMN IF NOT EXISTS produto_pronto BOOLEAN NOT NULL DEFAULT FALSE;
