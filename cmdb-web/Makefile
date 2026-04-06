.PHONY: help install dev test test-e2e-ui test-e2e-headed test-e2e-mock test-report test-full build clean kill-ports

# 默认目标
help:
	@echo "CMDB Frontend Makefile"
	@echo ""
	@echo "可用命令:"
	@echo "  make install        - 安装依赖"
	@echo "  make dev           - 启动开发服务器 (端口 3000)"
	@echo "  make test-e2e-mock  - 运行前端 E2E 测试 (使用 Playwright 路由拦截)"
	@echo "  make test-e2e-ui   - 运行前端 E2E 测试 (UI 模式)"
	@echo "  make test-e2e-headed - 运行前端 E2E 测试 (有头模式)"
	@echo "  make test-report   - 查看测试报告"
	@echo "  make test-full     - 运行前后端一体化测试 (真实数据库 + 前端 E2E 测试)"
	@echo "  make build         - 生产环境构建"
	@echo "  make clean         - 清理构建产物"
	@echo "  make kill-ports    - 清理占用端口的进程"

# 安装依赖
install:
	cd frontend && npm install --legacy-peer-deps

# 启动开发服务器
dev:
	@echo "启动开发服务器..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3002 | xargs kill -9 2>/dev/null || true
	@echo "等待端口释放..."
	@sleep 2
	cd frontend && npm run dev



# 运行 E2E 测试（使用 Playwright 路由拦截）
test-e2e-mock:
	@echo "停止占用端口的进程..."
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@lsof -ti:9323 | xargs kill -9 2>/dev/null || true
	@sleep 2
	
	@echo "启动开发服务器（端口 3001）..."
	@cd frontend && npm run dev -- -p 3001 & \
	FRONTEND_PID=$$! && \
	sleep 5 && \
	echo "检查前端服务启动状态..." && \
	for i in $$(seq 1 10); do \
		if curl -s http://localhost:3001 >/dev/null 2>&1; then \
			echo "前端服务启动成功"; \
			break; \
		fi; \
		echo "等待前端服务启动... ($$i/10)"; \
		sleep 2; \
	done; \
	if ! curl -s http://localhost:3001 >/dev/null 2>&1; then \
		echo "错误: 前端服务启动失败"; \
		kill $$FRONTEND_PID 2>/dev/null || true; \
		lsof -ti:3001 | xargs kill -9 2>/dev/null || true; \
		lsof -ti:9323 | xargs kill -9 2>/dev/null || true; \
		exit 1; \
	fi && \
	echo "运行 E2E 测试（使用路由拦截）..." && \
	cd frontend && npm run test:e2e -- --max-failures=3 && \
	echo "清理进程..." && \
	kill $$FRONTEND_PID 2>/dev/null || true && \
	lsof -ti:3001 | xargs kill -9 2>/dev/null || true && \
	lsof -ti:9323 | xargs kill -9 2>/dev/null || true

# 分析测试结果
test-analyze:
	@echo "分析测试结果..."
	@cd frontend && node tests/e2e/test-analyzer.js

# 运行 E2E 测试 (UI 模式)
test-e2e-ui:
	cd frontend && npm run test:e2e:ui -- --max-failures=3

# 运行 E2E 测试 (有头模式)
test-e2e-headed:
	cd frontend && npm run test:e2e:headed -- --max-failures=3

# 运行指定业务模块的 E2E 测试
test-e2e-module:
	@echo "停止占用端口的进程..."
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@lsof -ti:9323 | xargs kill -9 2>/dev/null || true
	@sleep 2
	
	@echo "启动开发服务器（端口 3001）..."
	@cd frontend && npm run dev -- -p 3001 & \
	FRONTEND_PID=$$! && \
	sleep 5 && \
	echo "检查前端服务启动状态..." && \
	for i in $$(seq 1 10); do \
		if curl -s http://localhost:3001 >/dev/null 2>&1; then \
			echo "前端服务启动成功"; \
			break; \
		fi; \
		echo "等待前端服务启动... ($$i/10)"; \
		sleep 2; \
	done; \
	if ! curl -s http://localhost:3001 >/dev/null 2>&1; then \
		echo "错误: 前端服务启动失败"; \
		kill $$FRONTEND_PID 2>/dev/null || true; \
		lsof -ti:3001 | xargs kill -9 2>/dev/null || true; \
		lsof -ti:9323 | xargs kill -9 2>/dev/null || true; \
		exit 1; \
	fi && \
	echo "运行指定业务模块的 E2E 测试..." && \
	cd frontend && npm run test:e2e -- --max-failures=3 --project "$$@" && \
	echo "清理进程..." && \
	kill $$FRONTEND_PID 2>/dev/null || true && \
	lsof -ti:3001 | xargs kill -9 2>/dev/null || true && \
	lsof -ti:9323 | xargs kill -9 2>/dev/null || true

# 查看测试报告
test-report:
	@lsof -ti:9323 | xargs kill -9 2>/dev/null || true
	@sleep 1
	cd frontend && npx playwright show-report

# 生产环境构建
build:
	cd frontend && npm run build

# 清理构建产物
clean:
	cd frontend && rm -rf .next node_modules/.cache playwright-report test-results

# 检查端口是否被占用
check_port = \
	@if lsof -Pi :$(1) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "端口 $(1) 已被占用，尝试清理..."; \
		lsof -ti:$(1) | xargs kill -9 2>/dev/null || echo "清理端口 $(1) 失败"; \
		sleep 2; \
		if lsof -Pi :$(1) -sTCP:LISTEN -t >/dev/null 2>&1; then \
			echo "错误: 端口 $(1) 仍然被占用，请手动清理后重试"; \
			exit 1; \
		fi; \
	fi

# 等待端口可用
wait_for_port = \
	@echo "等待端口 $(1) 可用..."; \
	for i in $$(seq 1 10); do \
		if ! lsof -Pi :$(1) -sTCP:LISTEN -t >/dev/null 2>&1; then \
			echo "端口 $(1) 已释放"; \
			break; \
		fi; \
		echo "等待中... ($$i/10)"; \
		sleep 1; \
	done; \
	if lsof -Pi :$(1) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "错误: 端口 $(1) 长时间无法释放，请手动清理"; \
		exit 1; \
	fi

# 运行前后端一体化测试（使用 backend-go）
test-full:
	@chmod +x scripts/test-full.sh
	@./scripts/test-full.sh

# 清理占用端口的进程
kill-ports:
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "端口 3000 无进程"
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "端口 3001 无进程"
	@lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "端口 3002 无进程"
	@lsof -ti:9323 | xargs kill -9 2>/dev/null || echo "端口 9323 无进程"
	@echo "端口已清理"
