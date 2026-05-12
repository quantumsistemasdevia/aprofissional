-- Atualiza mangas, barras, recortes e acabamento
-- Seguro para re-executar: apaga e recria as 4 categorias

DO $$
DECLARE
  v_empresa_id UUID := '4c233ca9-a66e-4a37-bd0a-b0b39e90e4a0';
BEGIN

  DELETE FROM catalogo_opcoes
  WHERE empresa_id = v_empresa_id
    AND categoria IN ('mangas', 'barras', 'recortes', 'acabamento');

  -- ── MANGAS ────────────────────────────────────────────────────────
  INSERT INTO catalogo_opcoes (id, empresa_id, categoria, nome, ordem) VALUES
    (gen_random_uuid(), v_empresa_id, 'mangas', 'Tradicional',  1),
    (gen_random_uuid(), v_empresa_id, 'mangas', 'Raglan',       2),
    (gen_random_uuid(), v_empresa_id, 'mangas', 'Baby Look',    3),
    (gen_random_uuid(), v_empresa_id, 'mangas', 'Curta',        4),
    (gen_random_uuid(), v_empresa_id, 'mangas', 'Longa',        5),
    (gen_random_uuid(), v_empresa_id, 'mangas', 'Meia Manga',   6);

  -- ── BARRAS ────────────────────────────────────────────────────────
  INSERT INTO catalogo_opcoes (id, empresa_id, categoria, nome, ordem) VALUES
    (gen_random_uuid(), v_empresa_id, 'barras', 'Tradicional', 1),
    (gen_random_uuid(), v_empresa_id, 'barras', 'Punho',       2),
    (gen_random_uuid(), v_empresa_id, 'barras', 'Ribana',      3),
    (gen_random_uuid(), v_empresa_id, 'barras', 'Dupla',       4),
    (gen_random_uuid(), v_empresa_id, 'barras', 'Viés',        5);

  -- ── RECORTES ──────────────────────────────────────────────────────
  INSERT INTO catalogo_opcoes (id, empresa_id, categoria, nome, ordem) VALUES
    (gen_random_uuid(), v_empresa_id, 'recortes', 'Lateral Frente e Costa',    1),
    (gen_random_uuid(), v_empresa_id, 'recortes', 'Lateral Só Frente',         2),
    (gen_random_uuid(), v_empresa_id, 'recortes', 'Horizontal Frente e Costa', 3),
    (gen_random_uuid(), v_empresa_id, 'recortes', 'Horizontal Só Costas',      4),
    (gen_random_uuid(), v_empresa_id, 'recortes', 'Vertical Frente Direita',   5),
    (gen_random_uuid(), v_empresa_id, 'recortes', 'Vertical Frente Esquerda',  6);

  -- ── ACABAMENTO ────────────────────────────────────────────────────
  INSERT INTO catalogo_opcoes (id, empresa_id, categoria, nome, ordem) VALUES
    (gen_random_uuid(), v_empresa_id, 'acabamento', 'Viés',        1),
    (gen_random_uuid(), v_empresa_id, 'acabamento', 'Ribana',      2),
    (gen_random_uuid(), v_empresa_id, 'acabamento', 'Punho Fab',   3),
    (gen_random_uuid(), v_empresa_id, 'acabamento', 'Punho Pronto',4),
    (gen_random_uuid(), v_empresa_id, 'acabamento', 'Com Capuz',   5),
    (gen_random_uuid(), v_empresa_id, 'acabamento', 'Sem Capuz',   6);

END $$;

-- Confirmar
SELECT categoria, COUNT(*) FROM catalogo_opcoes
WHERE empresa_id = '4c233ca9-a66e-4a37-bd0a-b0b39e90e4a0'
GROUP BY categoria ORDER BY categoria;
