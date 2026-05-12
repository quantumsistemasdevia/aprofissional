-- Seed: matérias-primas para A Profissional Uniformes
-- Executar APÓS 001_initial.sql

DO $$
DECLARE
  v_empresa_id UUID := '4c233ca9-a66e-4a37-bd0a-b0b39e90e4a0';
BEGIN

  INSERT INTO materias_primas (id, empresa_id, nome, composicao) VALUES
    (gen_random_uuid(), v_empresa_id, 'Tricoline/Class',        '67% algodão / 33% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Tricoline/Ibiza',        '67% algodão / 33% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Tricoline/Amélie',       '67% algodão / 33% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Office L1',              '50% algodão / 50% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Office L2',              '50% algodão / 50% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Office X1',              '50% algodão / 50% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Office X2',              '50% algodão / 50% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Rip Stop',               '67% poliéster / 33% algodão'),
    (gen_random_uuid(), v_empresa_id, 'Confort Mix',            '63% algodão / 37% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Microfibra',             '100% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Oxfordine',              '100% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Texfil/Grafil',          '65% algodão / 35% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Fustão',                 '50% algodão / 50% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Helanka',                '100% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Fil a Fil',              '50% algodão / 50% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Oxford',                 '100% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Gabardine',              '100% poliéster'),
    (gen_random_uuid(), v_empresa_id, 'Gabardine com Elastano', '95% poliéster / 5% elastano'),
    (gen_random_uuid(), v_empresa_id, 'Brim',                   '100% algodão'),
    (gen_random_uuid(), v_empresa_id, 'Sarja',                  '100% algodão'),
    (gen_random_uuid(), v_empresa_id, 'Poliviscose',            NULL),
    (gen_random_uuid(), v_empresa_id, 'Poliéster',              NULL),
    (gen_random_uuid(), v_empresa_id, 'Poliesportiva',          NULL),
    (gen_random_uuid(), v_empresa_id, 'Dry',                    NULL),
    (gen_random_uuid(), v_empresa_id, 'Algodão',                NULL),
    (gen_random_uuid(), v_empresa_id, 'Piquet-Mix',             NULL),
    (gen_random_uuid(), v_empresa_id, 'Piquet-PV',              NULL);

END $$;

-- Confirmar inserção
SELECT nome, composicao FROM materias_primas
WHERE empresa_id = '4c233ca9-a66e-4a37-bd0a-b0b39e90e4a0'
ORDER BY nome;
