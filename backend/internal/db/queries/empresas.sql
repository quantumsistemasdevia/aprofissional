-- name: GetEmpresa :one
SELECT id, nome, slug, cnpj, email, telefone, config_erp, config_notificacao, criado_em, deletado_em
FROM empresas
WHERE id = $1 AND deletado_em IS NULL;

-- name: GetEmpresaBySlug :one
SELECT id, nome, slug, cnpj, email, telefone, config_erp, config_notificacao, criado_em, deletado_em
FROM empresas
WHERE slug = $1 AND deletado_em IS NULL;

-- name: CreateEmpresa :one
INSERT INTO empresas (id, nome, slug, cnpj, email, telefone, config_erp, config_notificacao)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, nome, slug, cnpj, email, telefone, config_erp, config_notificacao, criado_em, deletado_em;

-- name: UpdateEmpresa :one
UPDATE empresas
SET nome = $2, cnpj = $3, email = $4, telefone = $5, config_erp = $6, config_notificacao = $7
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, nome, slug, cnpj, email, telefone, config_erp, config_notificacao, criado_em, deletado_em;

-- name: DeleteEmpresa :exec
UPDATE empresas SET deletado_em = NOW()
WHERE id = $1 AND deletado_em IS NULL;
