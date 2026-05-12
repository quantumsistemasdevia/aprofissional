-- =====================================================
-- Seed: dados iniciais para A Profissional Uniformes
-- Executar APÓS 001_initial.sql
-- =====================================================

-- Etapas de produção padrão (soma = 100%)
-- Substitua o empresa_id pelo UUID real da sua empresa
DO $$
DECLARE
  v_empresa_id UUID := '4c233ca9-a66e-4a37-bd0a-b0b39e90e4a0';
BEGIN
  INSERT INTO configs_etapa_producao (id, empresa_id, nome, descricao, ordem, percentual_tempo, ativa)
  VALUES
    (gen_random_uuid(), v_empresa_id, 'Arte e Aprovação',    'Criação e aprovação da arte pelo cliente',        1, 10, true),
    (gen_random_uuid(), v_empresa_id, 'Corte',               'Corte do tecido conforme moldes',                 2, 15, true),
    (gen_random_uuid(), v_empresa_id, 'Costura',             'Montagem e costura das peças',                    3, 35, true),
    (gen_random_uuid(), v_empresa_id, 'Personalização',      'Serigrafia, bordado, DTF ou sublimação',          4, 25, true),
    (gen_random_uuid(), v_empresa_id, 'Acabamento',          'Revisão, embalagem e etiquetagem',                5, 10, true),
    (gen_random_uuid(), v_empresa_id, 'Expedição',           'Separação e envio ao cliente',                    6,  5, true);
END $$;

-- Confirmar etapas criadas
SELECT nome, percentual_tempo, ordem FROM configs_etapa_producao ORDER BY ordem;
