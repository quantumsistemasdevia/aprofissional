-- Seed: cores de confecção para A Profissional Uniformes
-- Executar APÓS 004_catalogo_opcoes.sql

DO $$
DECLARE
  v_empresa_id UUID := '4c233ca9-a66e-4a37-bd0a-b0b39e90e4a0';
BEGIN

  INSERT INTO catalogo_opcoes (id, empresa_id, categoria, nome, ordem) VALUES
    -- Neutros e básicos
    (gen_random_uuid(), v_empresa_id, 'cor', 'Branco',              1),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Preto',               2),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Cinza Claro',         3),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Cinza Médio',         4),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Cinza Escuro',        5),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Chumbo',              6),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Marfim',              7),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Cru',                 8),

    -- Azuis
    (gen_random_uuid(), v_empresa_id, 'cor', 'Azul Royal',          9),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Azul Marinho',        10),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Azul Celeste',        11),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Azul Turquesa',       12),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Azul Petróleo',       13),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Azul Bebê',           14),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Azul Índigo',         15),

    -- Vermelhos e rosas
    (gen_random_uuid(), v_empresa_id, 'cor', 'Vermelho',            16),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Vermelho Escuro',     17),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Bordô',               18),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Rosa',                19),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Rosa Claro',          20),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Coral',               21),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Salmão',              22),

    -- Verdes
    (gen_random_uuid(), v_empresa_id, 'cor', 'Verde Bandeira',      23),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Verde Escuro',        24),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Verde Claro',         25),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Verde Musgo',         26),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Verde Militar',       27),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Verde Menta',         28),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Verde Limão',         29),

    -- Amarelos e laranjas
    (gen_random_uuid(), v_empresa_id, 'cor', 'Amarelo',             30),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Amarelo Ouro',        31),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Laranja',             32),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Laranja Escuro',      33),

    -- Marrons e bege
    (gen_random_uuid(), v_empresa_id, 'cor', 'Bege',                34),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Areia',               35),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Marrom',              36),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Marrom Escuro',       37),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Caramelo',            38),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Camel',               39),

    -- Roxos e lilás
    (gen_random_uuid(), v_empresa_id, 'cor', 'Roxo',                40),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Roxo Escuro',         41),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Lilás',               42),
    (gen_random_uuid(), v_empresa_id, 'cor', 'Vinho',               43);

END $$;

-- Confirmar inserção
SELECT nome, ordem FROM catalogo_opcoes
WHERE empresa_id = '4c233ca9-a66e-4a37-bd0a-b0b39e90e4a0'
  AND categoria = 'cor'
ORDER BY ordem;
