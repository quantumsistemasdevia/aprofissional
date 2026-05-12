# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com o código deste repositório.

## Visão Geral

**ConfecçãoPRO** — SaaS multi-tenant para gestão de pedidos personalizados de confecção. Fluxos principais: criação de pedidos via wizard multi-etapas, preview visual interativo com canvas Fabric.js e rastreamento de produção por etapas.

## Comandos

### Backend (Go)

```bash
cd backend
go run cmd/api/main.go                        # inicia a API na porta :8080
go test ./...                                 # roda todos os testes
go test ./internal/modules/orders/...         # roda testes de um pacote específico
go build -o bin/api cmd/api/main.go
sqlc generate                                 # regenera código do banco a partir das queries SQL
```

### Frontend (Next.js)

```bash
cd frontend
npm run dev     # servidor de dev em localhost:3001
npm run build
npm run lint
```

### Docker / Infraestrutura

```bash
docker-compose up -d            # todos os serviços (postgres + backend + frontend)
docker-compose up -d postgres   # apenas o banco
docker-compose logs -f backend

# Aplicar migrations (com postgres rodando)
psql $DATABASE_URL -f backend/migrations/001_initial.sql
```

### Ambiente

```bash
cp .env.example .env   # preencher SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, DATABASE_URL
```

## Arquitetura

### Multi-tenancy

Toda requisição autenticada passa por dois middlewares (nessa ordem):

1. **`AuthMiddleware`** (`internal/middleware/auth.go`) — valida o JWT do Supabase (EC P-256 ou HMAC). Extrai `user_id`, `user_email` e, criticamente, **`empresa_id`** de `app_metadata.empresa_id` nas claims do JWT.
2. **`TenantMiddleware`** (`internal/middleware/tenant.go`) — abre uma `*sql.Tx`, executa `SET LOCAL app.current_empresa_id = '<uuid>'` e injeta a transação no contexto da requisição. Todos os handlers chamam `middleware.GetDB(r)` para obter essa transação já configurada. As políticas de Row-Level Security (RLS) do PostgreSQL usam `current_setting('app.current_empresa_id')` para aplicar isolamento de tenant automaticamente.

O módulo `companies` não passa pelo auth (rota admin). Um `AuthOnlyMiddleware` separado (`auth_only.go`) valida o JWT sem exigir `empresa_id` — usado no endpoint `/auth/minhas-empresas`, que lista as empresas antes da seleção de tenant.

### Estrutura dos módulos do backend

Cada módulo em `internal/modules/<nome>/` segue o mesmo padrão:
- `model.go` — tipos de domínio e structs de request/response
- `repository.go` — acesso ao banco via queries geradas pelo SQLC (`internal/db/`)
- `service.go` — regras de negócio
- `handler.go` — handler HTTP (usa `middleware.GetDB(r)` para a transação com tenant)
- `routes.go` — `RegisterRoutes(r chi.Router, h *Handler)`

O SQLC gera código a partir dos arquivos SQL em `internal/db/queries/` para `internal/db/`. Após editar qualquer arquivo `.sql`, execute `sqlc generate`. A interface `DBTX` é passada pelos métodos do repositório, não armazenada na struct.

**Dependência entre módulos**: `ordersSvc.SetProduction(productionSvc)` conecta o serviço de pedidos ao de produção, de forma que a criação de um pedido cria automaticamente as etapas de produção.

### Estrutura do frontend

- `src/app/(auth)/` — página de login (sem layout wrapper)
- `src/app/selecionar-empresa/` — seletor de empresa após o login (antes do contexto de tenant ser definido)
- `src/app/(app)/` — app autenticado principal: `pedidos`, `producao`, `catalogo`, `clientes`, `dashboard`, `relatorios`, `configuracoes`
- `src/components/wizard/` — wizard de criação de pedidos (`WizardProvider.tsx` mantém o estado, `WizardStepper.tsx` controla a navegação, `steps/` tem 10 componentes de etapa)
- `src/components/canvas/FabricCanvas.tsx` — preview interativo de personalizações baseado em Fabric.js
- `src/lib/api/index.ts` — helper `apiFetch<T>()` que anexa automaticamente o JWT do Supabase no header `Authorization: Bearer`
- `src/hooks/` — um hook por domínio (`useOrders`, `useProduction`, `useModelos`, etc.) encapsulando `apiFetch`
- `src/lib/validations/pedido.schema.ts` — schemas Zod v4 para criação de pedidos (compartilhados pelas etapas do wizard)

### Fluxo de autenticação

1. Usuário faz login via Supabase Auth → JWT emitido.
2. O middleware do frontend (`src/middleware.ts`) chama `updateSession` para renovar o cookie de sessão em cada requisição.
3. Se não houver `empresa_id` na sessão, o usuário é redirecionado para `/selecionar-empresa`.
4. Ao selecionar a empresa, `empresa_id` é armazenado (app metadata no JWT ou cookie separado).
5. Todas as chamadas subsequentes de `apiFetch` enviam o JWT; o `AuthMiddleware` lê o `empresa_id` a partir dele.

### Integração ERP

`internal/erp/` contém a interface `ERPClient` e um `MockERPClient` para desenvolvimento. O serviço de clientes aceita um `ERPClient` para sincronização bidirecional.

### Geração de PDF

`internal/modules/orders/pdf_ficha.go` e `pdf_orcamento.go` geram PDFs usando `github.com/jung-kurt/gofpdf`.
