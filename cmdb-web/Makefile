.PHONY: help install dev test test:e2e test:e2e:ui test:e2e:headed test:report build clean kill-ports

# 默认目标
help:
	@echo "CMDB Frontend Makefile"
	@echo ""
	@echo "可用命令:"
	@echo "  make install        - 安装依赖"
	@echo "  make dev           - 启动开发服务器 (端口 3000)"
	@echo "  make test:e2e      - 运行 E2E 测试"
	@echo "  make test:e2e:ui   - 运行 E2E 测试 (UI 模式)"
	@echo "  make test:e2e:headed - 运行 E2E 测试 (有头模式)"
	@echo "  make test:report   - 查看测试报告"
	@echo "  make build         - 生产环境构建"
	@echo "  make clean         - 清理构建产物"
	@echo "  make kill-ports    - 清理占用端口的进程"

# 安装依赖
install:
	cd cmdb-web/frontend && npm install --legacy-peer-deps

# 启动开发服务器
dev:
	@echo "启动开发服务器..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3002 | xargs kill -9 2>/dev/null || true
	@echo "等待端口释放..."
	@sleep 2
	cd cmdb-web/frontend && npm run dev

# 运行 E2E 测试
test:e2e:
	@echo "停止占用端口的进程..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:9323 | xargs kill -9 2>/dev/null || true
	@sleep 2
	@echo "启动开发服务器..."
	cd cmdb-web/frontend && npm run dev &
	@sleep 5
	@echo "运行 E2E 测试..."
	cd cmdb-web/frontend && npm run test:e2e

# 运行 E2E 测试 (UI 模式)
test:e2e:ui:
	cd cmdb-web/frontend && npm run test:e2e:ui

# 运行 E2E 测试 (有头模式)
test:e2e:headed:
	cd cmdb-web/frontend && npm run test:e2e:headed

# 查看测试报告
test:report:
	@lsof -ti:9323 | xargs kill -9 2>/dev/null || true
	@sleep 1
	cd cmdb-web/frontend && npx playwright show-report

# 生产环境构建
build:
	cd cmdb-web/frontend && npm run build

# 清理构建产物
clean:
	cd cmdb-web/frontend && rm -rf .next node_modules/.cache playwright-report test-results

# 清理占用端口的进程
kill-ports:
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "端口 3000 无进程"
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "端口 3001 无进程"
	@lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "端口 3002 无进程"
	@lsof -ti:9323 | xargs kill -9 2>/dev/null || echo "端口 9323 无进程"
	@echo "端口已清理"
