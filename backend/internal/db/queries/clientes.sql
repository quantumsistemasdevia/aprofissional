-- name: ListClientes :many
SELECT id, empresa_id, nome, tipo, cpf_cnpj, email, telefone, endereco, nome_contato, erp_id, erp_sincronizado_em, criado_em, atualizado_em, deletado_em
FROM clientes
WHERE empresa_id = $1 AND deletado_em IS NULL
ORDER BY nome;

-- name: GetCliente :one
SELECT id, empresa_id, nome, tipo, cpf_cnpj, email, telefone, endereco, nome_contato, erp_id, erp_sincronizado_em, criado_em, atualizado_em, deletado_em
FROM clientes
WHERE id = $1 AND deletado_em IS NULL;

-- name: CreateCliente :one
INSERT INTO clientes (id, empresa_id, nome, tipo, cpf_cnpj, email, telefone, endereco, nome_contato, erp_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, empresa_id, nome, tipo, cpf_cnpj, email, telefone, endereco, nome_contato, erp_id, erp_sincronizado_em, criado_em, atualizado_em, deletado_em;

-- name: UpdateCliente :one
UPDATE clientes
SET nome = $2, tipo = $3, cpf_cnpj = $4, email = $5, telefone = $6, endereco = $7, nome_contato = $8, atualizado_em = NOW()
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, empresa_id, nome, tipo, cpf_cnpj, email, telefone, endereco, nome_contato, erp_id, erp_sincronizado_em, criado_em, atualizado_em, deletado_em;

-- name: DeleteCliente :exec
UPDATE clientes SET deletado_em = NOW()
WHERE id = $1 AND empresa_id = $2 AND deletado_em IS NULL;

-- name: GetClienteByErpID :one
SELECT id, empresa_id, nome, tipo, cpf_cnpj, email, telefone, endereco, nome_contato, erp_id, erp_sincronizado_em, criado_em, atualizado_em, deletado_em
FROM clientes
WHERE empresa_id = $1 AND erp_id = $2 AND deletado_em IS NULL;

-- name: UpdateClienteErpID :one
UPDATE clientes
SET erp_id = $2, erp_sincronizado_em = NOW(), atualizado_em = NOW()
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, empresa_id, nome, tipo, cpf_cnpj, email, telefone, endereco, nome_contato, erp_id, erp_sincronizado_em, criado_em, atualizado_em, deletado_em;
