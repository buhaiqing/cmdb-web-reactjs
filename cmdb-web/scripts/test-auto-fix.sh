#!/bin/bash

# CMDB Frontend E2E 测试自动修复脚本
# 功能：自动运行测试，失败后自动重试，最多尝试3次

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 最大尝试次数
MAX_RETRIES=3
RETRY_COUNT=0

# 测试模式（mock 或 full）
TEST_MODE="${1:-mock}"

# 清理函数
cleanup() {
    echo -e "${YELLOW}[自动修复] 清理进程和端口...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:9323 | xargs kill -9 2>/dev/null || true
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
}

# 注册清理钩子
trap cleanup EXIT

# 启动前端服务函数
start_frontend() {
    echo -e "${BLUE}[自动修复] 启动开发服务器（端口 3001）...${NC}"
    cd frontend && npm run dev -- -p 3001 > /dev/null 2>&1 &
    FRONTEND_PID=$!
    
    echo -e "${YELLOW}[自动修复] 等待前端服务启动...${NC}"
    for i in {1..10}; do
        if curl -s http://localhost:3001 >/dev/null 2>&1; then
            echo -e "${GREEN}[自动修复] ✓ 前端服务启动成功${NC}"
            return 0
        fi
        echo -e "${YELLOW}[自动修复] 等待中... ($i/10)${NC}"
        sleep 2
    done
    
    echo -e "${RED}[自动修复] ❌ 前端服务启动失败${NC}"
    return 1
}

# 运行测试函数
run_tests() {
    local attempt=$1
    echo -e "${BLUE}[自动修复] 第 $attempt 次尝试运行测试...${NC}"
    echo -e "${BLUE}[自动修复] 测试模式: $TEST_MODE${NC}"
    
    # 根据模式选择测试命令
    if [ "$TEST_MODE" == "mock" ]; then
        cd frontend && npm run test:e2e -- --max-failures=3 2>&1 | tee test-output.log
    elif [ "$TEST_MODE" == "full" ]; then
        cd frontend && npm run test:e2e:full -- --max-failures=3 2>&1 | tee test-output.log
    else
        echo -e "${RED}[自动修复] ❌ 未知测试模式: $TEST_MODE${NC}"
        return 1
    fi
    
    # 检查测试结果
    if grep -q "passed" test-output.log; then
        echo -e "${GREEN}[自动修复] ✓ 测试通过${NC}"
        return 0
    else
        echo -e "${RED}[自动修复] ❌ 测试失败${NC}"
        return 1
    fi
}

# 分析失败原因函数
analyze_failures() {
    echo -e "${YELLOW}[自动修复] 分析失败原因...${NC}"
    
    # 提取失败的测试用例
    if grep -q "failed" test-output.log; then
        echo -e "${RED}[自动修复] 发现失败的测试用例:${NC}"
        grep -E "(CI-[0-9]+|failed)" test-output.log | head -20
        
        # 检查常见错误模式
        if grep -q "timeout" test-output.log; then
            echo -e "${YELLOW}[自动修复] ⚠ 检测到超时错误，可能需要增加等待时间${NC}"
        fi
        
        if grep -q "not visible" test-output.log; then
            echo -e "${YELLOW}[自动修复] ⚠ 检测到元素不可见错误，可能需要调整等待策略${NC}"
        fi
        
        if grep -q "navigation" test-output.log; then
            echo -e "${YELLOW}[自动修复] ⚠ 检测到导航错误，可能需要检查页面跳转逻辑${NC}"
        fi
    fi
}

# 主循环
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CMDB E2E 测试自动修复系统${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}测试模式: $TEST_MODE${NC}"
echo -e "${BLUE}最大尝试次数: $MAX_RETRIES${NC}"
echo -e "${BLUE}========================================${NC}"

# 清理之前的进程
cleanup

# 启动前端服务
if ! start_frontend; then
    echo -e "${RED}[自动修复] ❌ 无法启动前端服务，退出${NC}"
    exit 1
fi

# 循环尝试测试
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}第 $RETRY_COUNT 次尝试${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # 运行测试
    if run_tests $RETRY_COUNT; then
        echo -e "${GREEN}[自动修复] ✓ 所有测试通过！${NC}"
        echo -e "${GREEN}[自动修复] 总尝试次数: $RETRY_COUNT${NC}"
        exit 0
    else
        echo -e "${RED}[自动修复] ❌ 第 $RETRY_COUNT 次尝试失败${NC}"
        
        # 分析失败原因
        analyze_failures
        
        # 如果还有剩余尝试次数，等待后重试
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}[自动修复] 等待 5 秒后重试...${NC}"
            sleep 5
            
            # 重启前端服务（以防服务崩溃）
            echo -e "${YELLOW}[自动修复] 重启前端服务...${NC}"
            cleanup
            if ! start_frontend; then
                echo -e "${RED}[自动修复] ❌ 无法重启前端服务，退出${NC}"
                exit 1
            fi
        fi
    fi
done

# 达到最大尝试次数仍未通过
echo -e "${RED}========================================${NC}"
echo -e "${RED}[自动修复] ❌ 达到最大尝试次数 ($MAX_RETRIES) 仍未通过${NC}"
echo -e "${RED}[自动修复] 请检查测试日志: frontend/test-output.log${NC}"
echo -e "${RED}========================================${NC}"

# 显示详细的失败信息
echo -e "${YELLOW}[自动修复] 失败的测试用例汇总:${NC}"
grep -E "(CI-[0-9]+|failed)" test-output.log

exit 1