#!/bin/bash

# WAL模式压力测试脚本
# 用于验证SQLite WAL模式的并发性能提升

set -e

echo "=========================================="
echo "SQLite WAL模式压力测试"
echo "=========================================="
echo ""

# 检查是否安装了wrk或ab
if command -v wrk &> /dev/null; then
    TOOL="wrk"
    echo "✅ 检测到wrk工具"
elif command -v ab &> /dev/null; then
    TOOL="ab"
    echo "✅ 检测到ab (Apache Bench) 工具"
else
    echo "❌ 未检测到wrk或ab工具"
    echo "请安装其中一个："
    echo "  macOS: brew install wrk  或  brew install httpd"
    echo "  Linux: sudo apt-get install wrk  或  sudo apt-get install apache2-utils"
    exit 1
fi

echo ""
echo "启动Go后端服务..."

# 启动Go后端服务（后台运行）
cd "$(dirname "$0")"
go run cmd/main.go > /tmp/cmdb_server.log 2>&1 &
SERVER_PID=$!

# 等待服务启动
echo "等待服务启动..."
sleep 3

# 检查服务是否启动成功
if ! curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "❌ 服务启动失败"
    cat /tmp/cmdb_server.log
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo "✅ 服务已启动 (PID: $SERVER_PID)"
echo ""

# 获取认证token
echo "获取认证Token..."
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ 获取Token失败"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Token获取成功"
echo ""

# 执行压力测试
echo "=========================================="
echo "开始压力测试"
echo "=========================================="
echo ""

if [ "$TOOL" = "wrk" ]; then
    echo "使用wrk进行压力测试..."
    echo ""
    
    # 测试1: 并发读操作
    echo "📊 测试1: 并发读操作 (GET /api/ci)"
    echo "   配置: 12线程, 100连接, 30秒"
    wrk -t12 -c100 -d30s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/ci
    
    echo ""
    echo "----------------------------------------"
    echo ""
    
    # 测试2: 并发写操作
    echo "📊 测试2: 并发写操作 (POST /api/ci)"
    echo "   配置: 8线程, 50连接, 30秒"
    
    # 创建wrk Lua脚本用于POST请求
    cat > /tmp/post_ci.lua << 'EOF'
wrk.method = "POST"
wrk.headers["Content-Type"] = "application/json"
wrk.headers["Authorization"] = "Bearer " .. os.getenv("AUTH_TOKEN")
wrk.body = string.format('{"name":"test-server-%d","type":"server","ip":"192.168.1.%d"}', math.random(10000), math.random(254))
EOF
    
    export AUTH_TOKEN="$TOKEN"
    wrk -t8 -c50 -d30s -s /tmp/post_ci.lua http://localhost:8080/api/ci
    
    echo ""
    echo "----------------------------------------"
    echo ""
    
    # 测试3: 混合读写操作
    echo "📊 测试3: 混合读写操作"
    echo "   配置: 12线程, 100连接, 30秒"
    
    cat > /tmp/mixed_ops.lua << 'EOF'
local counter = 0
local token = os.getenv("AUTH_TOKEN")

request = function()
    counter = counter + 1
    if counter % 3 == 0 then
        -- 写操作 (33%)
        wrk.method = "POST"
        wrk.headers["Content-Type"] = "application/json"
        wrk.headers["Authorization"] = "Bearer " .. token
        wrk.body = string.format('{"name":"mixed-test-%d","type":"server","ip":"10.0.0.%d"}', counter, (counter % 254) + 1)
        return wrk.format(nil, "/api/ci", nil, wrk.body)
    else
        -- 读操作 (67%)
        wrk.method = "GET"
        wrk.headers["Authorization"] = "Bearer " .. token
        return wrk.format(nil, "/api/ci", nil, nil)
    end
end
EOF
    
    wrk -t12 -c100 -d30s -s /tmp/mixed_ops.lua http://localhost:8080/api/ci

elif [ "$TOOL" = "ab" ]; then
    echo "使用ab进行压力测试..."
    echo ""
    
    # 测试1: 并发读操作
    echo "📊 测试1: 并发读操作 (GET /api/ci)"
    echo "   配置: 100并发, 1000请求"
    ab -n 1000 -c 100 -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/ci
    
    echo ""
    echo "----------------------------------------"
    echo ""
    
    # 测试2: 并发写操作
    echo "📊 测试2: 并发写操作 (POST /api/ci)"
    echo "   配置: 50并发, 500请求"
    
    cat > /tmp/post_data.json << EOF
{"name":"test-server","type":"server","ip":"192.168.1.100"}
EOF
    
    ab -n 500 -c 50 -p /tmp/post_data.json -T "application/json" -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/ci
fi

echo ""
echo "=========================================="
echo "压力测试完成"
echo "=========================================="
echo ""

# 清理
echo "清理..."
kill $SERVER_PID 2>/dev/null || true
rm -f /tmp/post_ci.lua /tmp/mixed_ops.lua /tmp/post_data.json /tmp/cmdb_server.log

echo ""
echo "✅ 测试完成！"
echo ""
echo "查看WAL文件:"
ls -lh cmdb.db* 2>/dev/null || echo "未找到数据库文件"
echo ""
echo "检查WAL模式状态:"
sqlite3 cmdb.db "PRAGMA journal_mode;" 2>/dev/null || echo "无法查询数据库"
