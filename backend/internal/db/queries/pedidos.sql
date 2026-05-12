-- name: ListPedidos :many
SELECT id, empresa_id, numero, cliente_id, vendedor_id, criado_por, status, observacoes, total, forma_pagamento, previsao_entrega, data_entrega, criado_em, atualizado_em, deletado_em
FROM pedidos
WHERE empresa_id = $1 AND deletado_em IS NULL
ORDER BY numero DESC;

-- name: GetPedido :one
SELECT id, empresa_id, numero, cliente_id, vendedor_id, criado_por, status, observacoes, total, forma_pagamento, previsao_entrega, data_entrega, criado_em, atualizado_em, deletado_em
FROM pedidos
WHERE id = $1 AND deletado_em IS NULL;

-- name: CreatePedido :one
INSERT INTO pedidos (id, empresa_id, numero, cliente_id, vendedor_id, criado_por, status, observacoes, forma_pagamento, previsao_entrega)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, empresa_id, numero, cliente_id, vendedor_id, criado_por, status, observacoes, total, forma_pagamento, previsao_entrega, data_entrega, criado_em, atualizado_em, deletado_em;

-- name: UpdatePedidoStatus :one
UPDATE pedidos
SET status = $2, atualizado_em = NOW()
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, empresa_id, numero, cliente_id, vendedor_id, criado_por, status, observacoes, total, forma_pagamento, previsao_entrega, data_entrega, criado_em, atualizado_em, deletado_em;

-- name: DeletePedido :exec
UPDATE pedidos SET deletado_em = NOW()
WHERE id = $1 AND empresa_id = $2 AND deletado_em IS NULL;

-- name: NextNumeroPedido :one
UPDATE pedidos_contadores
SET ultimo_numero = ultimo_numero + 1
WHERE empresa_id = $1
RETURNING ultimo_numero;

-- name: InitNumeroPedido :one
INSERT INTO pedidos_contadores (empresa_id, ultimo_numero)
VALUES ($1, 1)
ON CONFLICT (empresa_id) DO UPDATE SET ultimo_numero = pedidos_contadores.ultimo_numero + 1
RETURNING ultimo_numero;
