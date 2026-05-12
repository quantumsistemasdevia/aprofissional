ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS consumo_por_unidade NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS unidade_consumo VARCHAR(2) CHECK (unidade_consumo IN ('kg', 'm'));
