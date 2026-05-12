-- name: ListPersonalizacoesPorItem :many
SELECT id, empresa_id, item_pedido_id, tipo, cores, tipo_conteudo, url_imagem, texto_conteudo, texto_fonte, lado, localizacao, canvas_x, canvas_y, canvas_escala, canvas_rotacao, canvas_largura, canvas_altura, observacao, deletado_em
FROM personalizacoes
WHERE item_pedido_id = $1 AND deletado_em IS NULL;

-- name: GetPersonalizacao :one
SELECT id, empresa_id, item_pedido_id, tipo, cores, tipo_conteudo, url_imagem, texto_conteudo, texto_fonte, lado, localizacao, canvas_x, canvas_y, canvas_escala, canvas_rotacao, canvas_largura, canvas_altura, observacao, deletado_em
FROM personalizacoes
WHERE id = $1 AND deletado_em IS NULL;

-- name: CreatePersonalizacao :one
INSERT INTO personalizacoes (id, empresa_id, item_pedido_id, tipo, cores, tipo_conteudo, url_imagem, texto_conteudo, texto_fonte, lado, localizacao, canvas_x, canvas_y, canvas_escala, canvas_rotacao, canvas_largura, canvas_altura, observacao)
VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
RETURNING id, empresa_id, item_pedido_id, tipo, cores, tipo_conteudo, url_imagem, texto_conteudo, texto_fonte, lado, localizacao, canvas_x, canvas_y, canvas_escala, canvas_rotacao, canvas_largura, canvas_altura, observacao, deletado_em;

-- name: UpdatePersonalizacao :one
UPDATE personalizacoes
SET tipo = $2, cores = $3::jsonb, tipo_conteudo = $4, url_imagem = $5, texto_conteudo = $6, texto_fonte = $7, lado = $8, localizacao = $9, canvas_x = $10, canvas_y = $11, canvas_escala = $12, canvas_rotacao = $13, canvas_largura = $14, canvas_altura = $15, observacao = $16
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, empresa_id, item_pedido_id, tipo, cores, tipo_conteudo, url_imagem, texto_conteudo, texto_fonte, lado, localizacao, canvas_x, canvas_y, canvas_escala, canvas_rotacao, canvas_largura, canvas_altura, observacao, deletado_em;

-- name: DeletePersonalizacao :exec
UPDATE personalizacoes SET deletado_em = NOW()
WHERE id = $1 AND empresa_id = $2 AND deletado_em IS NULL;
