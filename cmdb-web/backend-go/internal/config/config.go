package config

import (
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	ProjectName              string
	Port                     string
	DatabaseURL              string
	DatabaseType             string // sqlite, postgres, mysql
	SecretKey                string
	Algorithm                string
	AccessTokenExpireMinutes int
	AllowedOrigins           []string
}

var AppConfig *Config

func Init() error {
	// Load .env file
	_ = godotenv.Load()

	// Parse environment variables
	port := getEnv("PORT", "8000")
	if port == "" {
		port = "8000"
	}

	expireMinutes, _ := strconv.Atoi(getEnv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

	allowedOriginsStr := getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001")
	allowedOrigins := strings.Split(allowedOriginsStr, ",")

	AppConfig = &Config{
		ProjectName:              getEnv("PROJECT_NAME", "CMDB Backend"),
		Port:                     port,
		DatabaseType:             getEnv("DATABASE_TYPE", "sqlite"),   // 默认使用 SQLite
		DatabaseURL:              getEnv("DATABASE_URL", "./cmdb.db"), // SQLite 默认路径
		SecretKey:                getEnv("SECRET_KEY", "cmdb-secret-key-change-in-production"),
		Algorithm:                getEnv("ALGORITHM", "HS256"),
		AccessTokenExpireMinutes: expireMinutes,
		AllowedOrigins:           allowedOrigins,
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func GetConfig() *Config {
	return AppConfig
}

func GetAccessTokenExpireDuration() time.Duration {
	return time.Duration(AppConfig.AccessTokenExpireMinutes) * time.Minute
}
