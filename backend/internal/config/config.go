package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL     string
	APIPort         string
	JWTSecret       string
	SupabaseURL     string
	SupabaseKey     string
}

func Load() *Config {
	// carrega .env da raiz do projeto (ignora se não existir)
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	cfg := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		APIPort:     getEnvOrDefault("API_PORT", "8080"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		SupabaseURL: firstNonEmpty(os.Getenv("SUPABASE_URL"), os.Getenv("NEXT_PUBLIC_SUPABASE_URL")),
		SupabaseKey: os.Getenv("SUPABASE_SERVICE_KEY"),
	}

	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET é obrigatório")
	}
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL é obrigatório")
	}

	return cfg
}

func getEnvOrDefault(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}
