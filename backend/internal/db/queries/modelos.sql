-- name: ListModelos :many
SELECT id, empresa_id, produto_id, nome, url_imagem_frente, url_imagem_verso, tipo, gola, mangas, barras, recortes, bolsos, acabamento, criado_em, atualizado_em, deletado_em
FROM modelos
WHERE empresa_id = $1 AND produto_id = $2 AND deletado_em IS NULL
ORDER BY nome;

-- name: GetModelo :one
SELECT id, empresa_id, produto_id, nome, url_imagem_frente, url_imagem_verso, tipo, gola, mangas, barras, recortes, bolsos, acabamento, criado_em, atualizado_em, deletado_em
FROM modelos
WHERE id = $1 AND deletado_em IS NULL;

-- name: CreateModelo :one
INSERT INTO modelos (id, empresa_id, produto_id, nome, url_imagem_frente, url_imagem_verso, tipo, gola, mangas, barras, recortes, bolsos, acabamento)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
RETURNING id, empresa_id, produto_id, nome, url_imagem_frente, url_imagem_verso, tipo, gola, mangas, barras, recortes, bolsos, acabamento, criado_em, atualizado_em, deletado_em;

-- name: UpdateModelo :one
UPDATE modelos
SET nome = $2, url_imagem_frente = $3, url_imagem_verso = $4, tipo = $5, gola = $6, mangas = $7, barras = $8, recortes = $9, bolsos = $10, acabamento = $11, atualizado_em = NOW()
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, empresa_id, produto_id, nome, url_imagem_frente, url_imagem_verso, tipo, gola, mangas, barras, recortes, bolsos, acabamento, criado_em, atualizado_em, deletado_em;

-- name: DeleteModelo :exec
UPDATE modelos SET deletado_em = NOW()
WHERE id = $1 AND empresa_id = $2 AND deletado_em IS NULL;
