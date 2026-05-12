-- name: ListOrdens :many
SELECT id, empresa_id, pedido_id, status, iniciado_em, finalizado_em, criado_em, deletado_em
FROM ordens_producao
WHERE empresa_id = $1 AND deletado_em IS NULL
ORDER BY criado_em DESC;

-- name: GetOrdem :one
SELECT id, empresa_id, pedido_id, status, iniciado_em, finalizado_em, criado_em, deletado_em
FROM ordens_producao
WHERE id = $1 AND deletado_em IS NULL;

-- name: CreateOrdem :one
INSERT INTO ordens_producao (id, empresa_id, pedido_id, status)
VALUES ($1, $2, $3, $4)
RETURNING id, empresa_id, pedido_id, status, iniciado_em, finalizado_em, criado_em, deletado_em;

-- name: UpdateOrdemStatus :one
UPDATE ordens_producao
SET status = $2, iniciado_em = CASE WHEN $2::text = 'em_andamento' AND iniciado_em IS NULL THEN NOW() ELSE iniciado_em END, finalizado_em = CASE WHEN $2::text IN ('concluida', 'cancelada') THEN NOW() ELSE finalizado_em END
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, empresa_id, pedido_id, status, iniciado_em, finalizado_em, criado_em, deletado_em;

-- name: DeleteOrdem :exec
UPDATE ordens_producao SET deletado_em = NOW()
WHERE id = $1 AND empresa_id = $2 AND deletado_em IS NULL;

-- name: ListEtapas :many
SELECT id, ordem_producao_id, config_etapa_id, status, responsavel, previsao_conclusao, data_inicio, iniciado_em, data_conclusao, finalizado_em, deletado_em
FROM etapas_producao
WHERE ordem_producao_id = $1 AND deletado_em IS NULL;

-- name: GetEtapa :one
SELECT id, ordem_producao_id, config_etapa_id, status, responsavel, previsao_conclusao, data_inicio, iniciado_em, data_conclusao, finalizado_em, deletado_em
FROM etapas_producao
WHERE id = $1 AND deletado_em IS NULL;

-- name: CreateEtapa :one
INSERT INTO etapas_producao (id, ordem_producao_id, config_etapa_id, status, responsavel, previsao_conclusao)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, ordem_producao_id, config_etapa_id, status, responsavel, previsao_conclusao, data_inicio, iniciado_em, data_conclusao, finalizado_em, deletado_em;

-- name: UpdateEtapaStatus :one
UPDATE etapas_producao
SET status = $2, iniciado_em = CASE WHEN $2::text = 'em_andamento' AND iniciado_em IS NULL THEN NOW() ELSE iniciado_em END, finalizado_em = CASE WHEN $2::text = 'concluido' THEN NOW() ELSE finalizado_em END, data_conclusao = CASE WHEN $2::text = 'concluido' THEN NOW() ELSE data_conclusao END
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, ordem_producao_id, config_etapa_id, status, responsavel, previsao_conclusao, data_inicio, iniciado_em, data_conclusao, finalizado_em, deletado_em;

-- name: ListConfigs :many
SELECT id, empresa_id, nome, ordem, percentual_tempo, criado_em, deletado_em
FROM configs_etapa_producao
WHERE empresa_id = $1 AND deletado_em IS NULL
ORDER BY ordem;

-- name: GetConfig :one
SELECT id, empresa_id, nome, ordem, percentual_tempo, criado_em, deletado_em
FROM configs_etapa_producao
WHERE id = $1 AND deletado_em IS NULL;

-- name: CreateConfig :one
INSERT INTO configs_etapa_producao (id, empresa_id, nome, ordem, percentual_tempo)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, empresa_id, nome, ordem, percentual_tempo, criado_em, deletado_em;

-- name: UpdateConfig :one
UPDATE configs_etapa_producao
SET nome = $2, ordem = $3, percentual_tempo = $4
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, empresa_id, nome, ordem, percentual_tempo, criado_em, deletado_em;

-- name: DeleteConfig :exec
UPDATE configs_etapa_producao SET deletado_em = NOW()
WHERE id = $1 AND empresa_id = $2 AND deletado_em IS NULL;
