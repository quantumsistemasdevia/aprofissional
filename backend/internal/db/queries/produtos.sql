-- name: ListProdutos :many
SELECT id, empresa_id, nome, descricao, url_imagem, consumo_por_unidade, unidade_consumo, criado_em, atualizado_em, deletado_em
FROM produtos
WHERE empresa_id = $1 AND deletado_em IS NULL
ORDER BY nome;

-- name: GetProduto :one
SELECT id, empresa_id, nome, descricao, url_imagem, consumo_por_unidade, unidade_consumo, criado_em, atualizado_em, deletado_em
FROM produtos
WHERE id = $1 AND deletado_em IS NULL;

-- name: CreateProduto :one
INSERT INTO produtos (id, empresa_id, nome, descricao, url_imagem)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, empresa_id, nome, descricao, url_imagem, consumo_por_unidade, unidade_consumo, criado_em, atualizado_em, deletado_em;

-- name: UpdateProduto :one
UPDATE produtos
SET nome = $2, descricao = $3, url_imagem = $4, consumo_por_unidade = $5, unidade_consumo = $6, atualizado_em = NOW()
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, empresa_id, nome, descricao, url_imagem, consumo_por_unidade, unidade_consumo, criado_em, atualizado_em, deletado_em;

-- name: DeleteProduto :exec
UPDATE produtos SET deletado_em = NOW()
WHERE id = $1 AND empresa_id = $2 AND deletado_em IS NULL;
