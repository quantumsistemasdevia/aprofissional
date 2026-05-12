-- name: ListItensPorPedido :many
SELECT id, empresa_id, pedido_id, produto_id, modelo_id, materia_prima_id, cor, tamanhos_quantidades, quantidade, preco_unitario, tipo_desconto, desconto, total, especificacoes_modelo, preview_frente_url, preview_verso_url, criado_em, atualizado_em, deletado_em
FROM itens_pedido
WHERE pedido_id = $1 AND deletado_em IS NULL
ORDER BY criado_em;

-- name: GetItemPedido :one
SELECT id, empresa_id, pedido_id, produto_id, modelo_id, materia_prima_id, cor, tamanhos_quantidades, quantidade, preco_unitario, tipo_desconto, desconto, total, especificacoes_modelo, preview_frente_url, preview_verso_url, criado_em, atualizado_em, deletado_em
FROM itens_pedido
WHERE id = $1 AND deletado_em IS NULL;

-- name: CreateItemPedido :one
INSERT INTO itens_pedido (id, empresa_id, pedido_id, produto_id, modelo_id, materia_prima_id, cor, tamanhos_quantidades, quantidade, preco_unitario, tipo_desconto, desconto, total, especificacoes_modelo)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
RETURNING id, empresa_id, pedido_id, produto_id, modelo_id, materia_prima_id, cor, tamanhos_quantidades, quantidade, preco_unitario, tipo_desconto, desconto, total, especificacoes_modelo, preview_frente_url, preview_verso_url, criado_em, atualizado_em, deletado_em;

-- name: UpdateItemPedido :one
UPDATE itens_pedido
SET produto_id = $2, modelo_id = $3, materia_prima_id = $4, cor = $5, tamanhos_quantidades = $6, quantidade = $7, preco_unitario = $8, tipo_desconto = $9, desconto = $10, total = $11, especificacoes_modelo = $12, atualizado_em = NOW()
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, empresa_id, pedido_id, produto_id, modelo_id, materia_prima_id, cor, tamanhos_quantidades, quantidade, preco_unitario, tipo_desconto, desconto, total, especificacoes_modelo, preview_frente_url, preview_verso_url, criado_em, atualizado_em, deletado_em;

-- name: DeleteItemPedido :exec
UPDATE itens_pedido SET deletado_em = NOW()
WHERE id = $1 AND empresa_id = $2 AND deletado_em IS NULL;
