-- Seed: produtos iniciais para A Profissional Uniformes
-- Executar no Supabase SQL Editor

DO $$
DECLARE
  v_empresa_id UUID := '4c233ca9-a66e-4a37-bd0a-b0b39e90e4a0';
BEGIN
  INSERT INTO produtos (id, empresa_id, nome) VALUES
    (gen_random_uuid(), v_empresa_id, 'Jaleco Curto Manga Curta'),
    (gen_random_uuid(), v_empresa_id, 'Calça Elástico Total'),
    (gen_random_uuid(), v_empresa_id, 'Calça Cós e Elástico'),
    (gen_random_uuid(), v_empresa_id, 'Calça Cós Total - Profis'),
    (gen_random_uuid(), v_empresa_id, 'Avental Frente Única'),
    (gen_random_uuid(), v_empresa_id, 'Avental Tipo Saia'),
    (gen_random_uuid(), v_empresa_id, 'Avental Envelope'),
    (gen_random_uuid(), v_empresa_id, 'Touca Feminina Malha'),
    (gen_random_uuid(), v_empresa_id, 'Touca Feminina Redinha'),
    (gen_random_uuid(), v_empresa_id, 'Bandana'),
    (gen_random_uuid(), v_empresa_id, 'Camiseta Tradicional'),
    (gen_random_uuid(), v_empresa_id, 'Camiseta Polo'),
    (gen_random_uuid(), v_empresa_id, 'Jaleco Clínica'),
    (gen_random_uuid(), v_empresa_id, 'Jaleco Curto'),
    (gen_random_uuid(), v_empresa_id, 'Pijama Cirúrgico'),
    (gen_random_uuid(), v_empresa_id, 'Touca Cirúrgica');
END $$;

-- Confirmar inserção
SELECT nome, criado_em FROM produtos WHERE empresa_id = '4c233ca9-a66e-4a37-bd0a-b0b39e90e4a0' ORDER BY nome;
