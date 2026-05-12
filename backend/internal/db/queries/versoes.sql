-- name: CreateVersaoItem :one
INSERT INTO versoes_item_pedido (id, item_pedido_id, numero_versao, snapshot, alterado_por)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, item_pedido_id, numero_versao, snapshot, alterado_por, criado_em;

-- name: ListVersoesPorItem :many
SELECT id, item_pedido_id, numero_versao, snapshot, alterado_por, criado_em
FROM versoes_item_pedido
WHERE item_pedido_id = $1
ORDER BY numero_versao DESC;

-- name: GetUltimaVersao :one
SELECT id, item_pedido_id, numero_versao, snapshot, alterado_por, criado_em
FROM versoes_item_pedido
WHERE item_pedido_id = $1
ORDER BY numero_versao DESC
LIMIT 1;
