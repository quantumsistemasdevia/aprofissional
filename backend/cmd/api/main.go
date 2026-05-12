package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/heliobarreira/aprofissional/internal/config"
	"github.com/heliobarreira/aprofissional/internal/erp"
	appMiddleware "github.com/heliobarreira/aprofissional/internal/middleware"
	authModule "github.com/heliobarreira/aprofissional/internal/modules/auth"
	"github.com/heliobarreira/aprofissional/internal/modules/catalog"
	"github.com/heliobarreira/aprofissional/internal/modules/companies"
	"github.com/heliobarreira/aprofissional/internal/modules/customers"
	"github.com/heliobarreira/aprofissional/internal/modules/dashboard"
	"github.com/heliobarreira/aprofissional/internal/modules/orders"
	"github.com/heliobarreira/aprofissional/internal/modules/personalizations"
	"github.com/heliobarreira/aprofissional/internal/modules/production"
	"github.com/heliobarreira/aprofissional/internal/modules/reports"
	"github.com/heliobarreira/aprofissional/internal/modules/upload"
	"github.com/heliobarreira/aprofissional/internal/modules/users"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	// Conectar ao PostgreSQL via pgxpool
	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Erro ao parsear config do banco: %v", err)
	}
	// Necessário para compatibilidade com PgBouncer (evita erro de prepared statement)
	poolConfig.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		log.Fatalf("Erro ao conectar ao banco de dados: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("Erro ao pingar banco de dados: %v", err)
	}
	log.Println("Conectado ao banco de dados")

	// SQL DB para módulo companies (admin-level, sem RLS tenant)
	sqlDB := stdlib.OpenDBFromPool(pool)
	defer sqlDB.Close()

	// Inicializar ERP (mock para desenvolvimento)
	erpClient := &erp.MockERPClient{}

	// Inicializar módulos
	companiesRepo := companies.NewRepository(sqlDB)
	companiesSvc := companies.NewService(companiesRepo)
	companiesHandler := companies.NewHandler(companiesSvc)

	customersRepo := customers.NewRepository()
	customersSvc := customers.NewService(customersRepo, erpClient)
	customersHandler := customers.NewHandler(customersSvc)

	catalogRepo := catalog.NewRepository()
	catalogSvc := catalog.NewService(catalogRepo)
	catalogHandler := catalog.NewHandler(catalogSvc)

	ordersRepo := orders.NewRepository()
	ordersSvc := orders.NewService(ordersRepo)
	ordersHandler := orders.NewHandler(ordersSvc)

	personalizationsRepo := personalizations.NewRepository()
	personalizationsSvc := personalizations.NewService(personalizationsRepo)
	personalizationsHandler := personalizations.NewHandler(personalizationsSvc)

	productionRepo := production.NewRepository()
	productionSvc := production.NewService(productionRepo)
	productionHandler := production.NewHandler(productionSvc)

	ordersSvc.SetProduction(productionSvc)

	reportsSvc := reports.NewService()
	reportsHandler := reports.NewHandler(reportsSvc)

	dashboardHandler := dashboard.NewHandler()
	usersHandler := users.NewHandler(cfg.SupabaseURL, cfg.SupabaseKey)

	// Router
	r := chi.NewRouter()
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.RequestID)

	// CORS — deve vir antes do auth para liberar OPTIONS preflight
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin == "" {
				origin = "http://localhost:3000"
			}
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	})

	// Servir arquivos de arte enviados via upload
	r.Handle("/api/uploads/*", http.StripPrefix("/api/uploads/", http.FileServer(http.Dir("uploads"))))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	// Rotas de auth (JWT válido, sem empresa_id obrigatório)
	r.Group(func(r chi.Router) {
		r.Use(appMiddleware.AuthOnlyMiddleware(cfg.JWTSecret, cfg.SupabaseURL))
		r.Get("/auth/minhas-empresas", authModule.MinhasEmpresas(pool))
	})

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Companies — sem autenticação (admin-level)
		r.Route("/companies", func(r chi.Router) {
			companies.RegisterRoutes(r, companiesHandler)
		})

		// Empresa da sessão (auth sem tenant middleware — usa sqlDB direto)
		r.Group(func(r chi.Router) {
			r.Use(appMiddleware.AuthMiddleware(cfg.JWTSecret, cfg.SupabaseURL))
			r.Get("/empresa/me", companiesHandler.GetMyEmpresa)
			r.Put("/empresa/me", companiesHandler.UpdateMyEmpresa)
		})

		// Rotas autenticadas
		r.Group(func(r chi.Router) {
			r.Use(appMiddleware.AuthMiddleware(cfg.JWTSecret, cfg.SupabaseURL))
			r.Use(appMiddleware.TenantMiddleware(pool))

			// Customers
			r.Route("/customers", func(r chi.Router) {
				customers.RegisterRoutes(r, customersHandler)
			})

			// Catalog
			r.Route("/catalog", func(r chi.Router) {
				catalog.RegisterRoutes(r, catalogHandler)
			})

			// Orders
			r.Route("/orders", func(r chi.Router) {
				orders.RegisterRoutes(r, ordersHandler)
			})

			// Compra de Materiais
			r.Get("/compra-materiais", ordersHandler.ListComprasMateriais)
			r.Post("/compra-materiais/relatorio", ordersHandler.GerarRelatorioCompra)
			r.Post("/compra-materiais/alterar-status", ordersHandler.AlterarStatusCompra)

			// Personalizations
			r.Route("/personalizations", func(r chi.Router) {
				personalizations.RegisterRoutes(r, personalizationsHandler)
			})

			// Upload de arquivos de arte
			r.Post("/upload/arte", upload.ArteHandler)

			// Production
			r.Route("/production", func(r chi.Router) {
				production.RegisterRoutes(r, productionHandler)
			})

			// Reports
			r.Route("/reports", func(r chi.Router) {
				reports.RegisterRoutes(r, reportsHandler)
			})

			// Dashboard
			r.Get("/dashboard/stats", dashboardHandler.GetStats)
			r.Get("/dashboard/pedidos-recentes", dashboardHandler.GetPedidosRecentes)

			// Users
			r.Route("/users", func(r chi.Router) {
				users.RegisterRoutes(r, usersHandler)
			})
		})
	})

	log.Printf("API rodando na porta %s", cfg.APIPort)
	if err := http.ListenAndServe(":"+cfg.APIPort, r); err != nil {
		log.Fatal(err)
	}
}
