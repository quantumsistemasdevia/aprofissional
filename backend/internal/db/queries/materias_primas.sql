-- name: ListMateriasPrimas :many
SELECT id, empresa_id, nome, tipo, cor, composicao, preco, criado_em, atualizado_em, deletado_em
FROM materias_primas
WHERE empresa_id = $1 AND deletado_em IS NULL
ORDER BY nome;

-- name: GetMateriaPrima :one
SELECT id, empresa_id, nome, tipo, cor, composicao, preco, criado_em, atualizado_em, deletado_em
FROM materias_primas
WHERE id = $1 AND deletado_em IS NULL;

-- name: CreateMateriaPrima :one
INSERT INTO materias_primas (id, empresa_id, nome, tipo, cor, composicao, preco)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, empresa_id, nome, tipo, cor, composicao, preco, criado_em, atualizado_em, deletado_em;

-- name: UpdateMateriaPrima :one
UPDATE materias_primas
SET nome = $2, tipo = $3, cor = $4, composicao = $5, preco = $6, atualizado_em = NOW()
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, empresa_id, nome, tipo, cor, composicao, preco, criado_em, atualizado_em, deletado_em;

-- name: DeleteMateriaPrima :exec
UPDATE materias_primas SET deletado_em = NOW()
WHERE id = $1 AND empresa_id = $2 AND deletado_em IS NULL;
