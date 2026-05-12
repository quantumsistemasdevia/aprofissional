-- Seed: opções configuráveis de catálogo para A Profissional Uniformes
-- Executar APÓS 004_catalogo_opcoes.sql

DO $$
DECLARE
  v_empresa_id UUID := '4c233ca9-a66e-4a37-bd0a-b0b39e90e4a0';
BEGIN

  -- ── GOLA ──────────────────────────────────────────────────────────
  INSERT INTO catalogo_opcoes (id, empresa_id, categoria, nome, ordem) VALUES
    (gen_random_uuid(), v_empresa_id, 'gola', 'Gola Redonda',  1),
    (gen_random_uuid(), v_empresa_id, 'gola', 'Gola V',        2),
    (gen_random_uuid(), v_empresa_id, 'gola', 'Gola Polo',     3);

  -- ── MANGAS ────────────────────────────────────────────────────────
  INSERT INTO catalogo_opcoes (id, empresa_id, categoria, nome, ordem) VALUES
    (gen_random_uuid(), v_empresa_id, 'mangas', 'Tradicional',  1),
    (gen_random_uuid(), v_empresa_id, 'mangas', 'Raglan',       2),
    (gen_random_uuid(), v_empresa_id, 'mangas', 'Baby Look',    3),
    (gen_random_uuid(), v_empresa_id, 'mangas', 'Curta',        4),
    (gen_random_uuid(), v_empresa_id, 'mangas', 'Longa',        5),
    (gen_random_uuid(), v_empresa_id, 'mangas', 'Meia Manga',   6);

  -- ── BOLSOS ────────────────────────────────────────────────────────
  INSERT INTO catalogo_opcoes (id, empresa_id, categoria, nome, ordem) VALUES
    (gen_random_uuid(), v_empresa_id, 'bolsos', 'Com Bolso',       1),
    (gen_random_uuid(), v_empresa_id, 'bolsos', 'Sem Bolso',       2),
    (gen_random_uuid(), v_empresa_id, 'bolsos', 'Bolso com Friso', 3),
    (gen_random_uuid(), v_empresa_id, 'bolsos', 'Bolso Padrão',    4);

  -- ── BARRAS (tipo de cós/fechamento) ───────────────────────────────
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

  -- ── MODELO (estilo/corte da peça) ─────────────────────────────────
  INSERT INTO catalogo_opcoes (id, empresa_id, categoria, nome, ordem) VALUES
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Infantil',               1),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Regata',                 2),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Machão',                 3),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Feminina',               4),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Masculina',              5),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Curto com Bolso',        6),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Curto sem Bolso',        7),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Longo com Bolso',        8),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Longo sem Bolso',        9),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Camisa Manga Curta',    10),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Camisa Manga Longa',    11),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Calça Reta sem Bolso',  12),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Calça Reta com Bolso',  13),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Calça Social Masculina',14),
    (gen_random_uuid(), v_empresa_id, 'modelo', 'Blusa Feminina',        15);

END $$;

-- Confirmar inserção
SELECT categoria, nome, ordem
FROM catalogo_opcoes
WHERE empresa_id = '4c233ca9-a66e-4a37-bd0a-b0b39e90e4a0'
ORDER BY categoria, ordem;
