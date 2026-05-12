-- Adiciona 'relatorio_gerado' ao CHECK constraint de status_compra
ALTER TABLE itens_pedido DROP CONSTRAINT IF EXISTS itens_pedido_status_compra_check;
ALTER TABLE itens_pedido
  ADD CONSTRAINT itens_pedido_status_compra_check
  CHECK (status_compra IN ('nao_enviado', 'relatorio_gerado', 'enviado'));
