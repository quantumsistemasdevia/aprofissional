# ConfecçãoPRO

Sistema web fullstack para gestão de pedidos personalizados de confecção. Multi-tenant, com wizard de criação de pedidos, preview visual interativo e rastreamento de produção por etapas.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router), TailwindCSS, Fabric.js |
| Backend | Go, Chi router, SQLC |
| Banco | PostgreSQL via Supabase |
| Auth | Supabase Auth (JWT) |
| Canvas | Fabric.js (preview visual de pedidos) |

## Desenvolvimento

### Backend (Go)

```bash
cd backend

# Rodar API
go run cmd/api/main.go

# Testes
go test ./...

# Gerar código SQLC
sqlc generate

# Build
go build -o bin/api cmd/api/main.go
```

### Frontend (Next.js)

```bash
cd frontend

npm run dev        # dev server em localhost:3000
npm run build      # build de produção
npm run lint       # ESLint
```

### Docker

```bash
# Subir todos os serviços (postgres + backend + frontend)
docker-compose up -d

# Apenas banco de dados
docker-compose up -d postgres

# Ver logs do backend
docker-compose logs -f backend
```

### Banco de dados

```bash
# Aplicar migrations (postgres rodando)
psql $DATABASE_URL -f backend/migrations/001_initial.sql
```

### Configuração

```bash
cp .env.example .env
# Editar .env com as credenciais reais
```
