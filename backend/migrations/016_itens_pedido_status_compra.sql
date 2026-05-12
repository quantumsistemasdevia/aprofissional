ALTER TABLE itens_pedido
  ADD COLUMN IF NOT EXISTS status_compra VARCHAR(20) DEFAULT 'nao_enviado'
    CHECK (status_compra IN ('nao_enviado', 'enviado'));
