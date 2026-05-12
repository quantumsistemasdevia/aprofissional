-- Adiciona proporção configurável por opção do catálogo de modelo.
-- proporcao: valor numérico (ex: 1, 2, 5)
-- tipo_proporcao: 'unidade' (un/peça) ou 'percentual' (% do consumo de tecido)
-- NULL em qualquer um dos campos = não contabiliza na compra de materiais

ALTER TABLE catalogo_opcoes
  ADD COLUMN proporcao      NUMERIC(10,4),
  ADD COLUMN tipo_proporcao VARCHAR(20)
    CHECK (tipo_proporcao IN ('unidade', 'percentual'));
