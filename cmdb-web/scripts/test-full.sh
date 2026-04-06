#!/bin/bash

set -e

echo "开始运行前后端一体化测试（使用 Go 后端 + SQLite）..."

# 清理端口
echo "清理端口..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:9323 | xargs kill -9 2>/dev/null || true
sleep 2

# 恢复 .env.local
if [ -f frontend/.env.local.backup ]; then
    mv frontend/.env.local.backup frontend/.env.local
fi

# 设置环境变量
export TEST_MODE=full

# 清理并初始化数据库
echo "初始化 Go 后端数据库（SQLite）..."
rm -f backend-go/cmdb.db

# 临时备份并清空 .env.local，避免覆盖命令行环境变量
if [ -f frontend/.env.local ]; then
    cp frontend/.env.local frontend/.env.local.backup
    > frontend/.env.local
fi

# 启动 Go 后端
echo "启动 Go 后端服务器（SQLite 模式）..."
(cd backend-go && go run cmd/main.go) &
BACKEND_PID=$!

sleep 5

# 等待 Go 后端启动
echo "检查 Go 后端服务启动状态..."
for i in $(seq 1 15); do
    if curl -s http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
        echo "Go 后端服务启动成功"
        break
    fi
    echo "等待 Go 后端服务启动... ($i/15)"
    sleep 2
done

if ! curl -s http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
    echo "错误：Go 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# 启动前端
echo "启动前端开发服务器..."
export NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
(cd frontend && npm run dev -- -p 3001) &
FRONTEND_PID=$!

sleep 8

# 等待前端启动
echo "检查前端服务启动状态..."
for i in $(seq 1 15); do
    if curl -s http://127.0.0.1:3001 >/dev/null 2>&1; then
        echo "前端服务启动成功"
        break
    fi
    echo "等待前端服务启动... ($i/15)"
    sleep 2
done

if ! curl -s http://127.0.0.1:3001 >/dev/null 2>&1; then
    echo "错误：前端服务启动失败"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# 运行测试 - 支持多业务模块并行执行
echo "运行前端 E2E 测试（Go 后端模式）..."
echo "按业务模块并行执行测试..."
(cd frontend && npm run test:e2e:full -- --max-failures=3)
TEST_EXIT_CODE=$?

# 清理
echo "清理进程..."
kill $BACKEND_PID 2>/dev/null || true
kill $FRONTEND_PID 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:9323 | xargs kill -9 2>/dev/null || true

echo "Go 后端一体化测试完成"
