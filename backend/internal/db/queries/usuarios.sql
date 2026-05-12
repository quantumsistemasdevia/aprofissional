-- name: GetUsuario :one
SELECT id, empresa_id, nome, email, perfil, criado_em, deletado_em
FROM usuarios
WHERE id = $1 AND deletado_em IS NULL;

-- name: GetUsuarioByEmail :one
SELECT id, empresa_id, nome, email, perfil, criado_em, deletado_em
FROM usuarios
WHERE email = $1 AND deletado_em IS NULL;

-- name: ListUsuarios :many
SELECT id, empresa_id, nome, email, perfil, criado_em, deletado_em
FROM usuarios
WHERE empresa_id = $1 AND deletado_em IS NULL
ORDER BY nome;

-- name: CreateUsuario :one
INSERT INTO usuarios (id, empresa_id, nome, email, perfil)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, empresa_id, nome, email, perfil, criado_em, deletado_em;

-- name: UpdateUsuario :one
UPDATE usuarios
SET nome = $2, perfil = $3
WHERE id = $1 AND deletado_em IS NULL
RETURNING id, empresa_id, nome, email, perfil, criado_em, deletado_em;

-- name: DeleteUsuario :exec
UPDATE usuarios SET deletado_em = NOW()
WHERE id = $1 AND empresa_id = $2 AND deletado_em IS NULL;
