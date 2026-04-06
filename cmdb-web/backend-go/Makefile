.PHONY: help dev prod-pg prod-mysql test clean db-reset db-shell

# 默认目标
help:
	@echo "CMDB Go Backend - Makefile Commands"
	@echo ""
	@echo "开发环境:"
	@echo "  make dev          - 使用 SQLite 启动开发服务"
	@echo "  make db-reset     - 重置 SQLite 数据库"
	@echo "  make db-shell     - 打开 SQLite 命令行"
	@echo ""
	@echo "生产环境:"
	@echo "  make prod-pg      - 使用 PostgreSQL 启动生产服务"
	@echo "  make prod-mysql   - 使用 MySQL 启动生产服务"
	@echo ""
	@echo "测试:"
	@echo "  make test         - 运行所有测试"
	@echo "  make test-cover   - 运行测试并生成覆盖率报告"
	@echo ""
	@echo "清理:"
	@echo "  make clean        - 清理编译文件和数据库"
	@echo ""

# 开发环境（SQLite）
dev:
	@echo "Starting development server with SQLite..."
	@cp -n .env.example .env || true
	@go run cmd/main.go

# 使用 PostgreSQL
prod-pg:
	@echo "Starting production server with PostgreSQL..."
	@echo "DATABASE_TYPE=postgres" > .env
	@echo "DATABASE_URL=postgresql://cmdb:cmdb@localhost:5432/cmdb?sslmode=disable" >> .env
	@go run cmd/main.go

# 使用 MySQL
prod-mysql:
	@echo "Starting production server with MySQL..."
	@echo "DATABASE_TYPE=mysql" > .env
	@echo "DATABASE_URL=cmdb:cmdb@tcp(localhost:3306)/cmdb?charset=utf8mb4&parseTime=True&loc=Local" >> .env
	@go run cmd/main.go

# 重置数据库（SQLite）
db-reset:
	@echo "Resetting SQLite database..."
	@rm -f cmdb.db
	@echo "Database reset. It will be recreated on next startup."

# SQLite 命令行
db-shell:
	@echo "Opening SQLite shell..."
	@sqlite3 cmdb.db

# 运行测试
test:
	@echo "Running tests..."
	@go test -v ./...

# 运行测试并生成覆盖率报告
test-cover:
	@echo "Running tests with coverage..."
	@go test -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# 清理
clean:
	@echo "Cleaning up..."
	@rm -f cmdb.db
	@rm -f coverage.out
	@rm -f coverage.html
	@rm -rf dist/
	@echo "Cleanup completed."

# 构建二进制文件
build:
	@echo "Building binary..."
	@CGO_ENABLED=1 go build -o cmdb-go cmd/main.go
	@echo "Binary built: cmdb-go"

# Docker 相关
docker-up:
	@echo "Starting Docker containers..."
	@docker-compose up -d

docker-down:
	@echo "Stopping Docker containers..."
	@docker-compose down

docker-logs:
	@docker-compose logs -f backend

docker-build:
	@docker-compose build --no-cache
