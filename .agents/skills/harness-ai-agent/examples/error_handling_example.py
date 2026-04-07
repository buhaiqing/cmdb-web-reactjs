"""错误处理模块使用示例."""

from __future__ import annotations

import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.error_handling import (
    ErrorCategory,
    ErrorCode,
    ErrorContext,
    FixSuggestion,
    create_agent_error,
    get_error_handler,
)


def example_error_handling():
    """错误处理示例."""
    print("=== 错误处理模块示例 ===\n")
    
    # 获取错误处理器
    error_handler = get_error_handler(log_level="DEBUG")
    
    # 创建错误上下文
    context = ErrorContext(
        component="example_component",
        operation="process_data",
        input_data={
            "data_id": "12345",
            "data_type": "json",
        },
        environment={
            "env": "production",
            "version": "1.0.0",
        },
        related_files=["data.json", "processor.py"],
    )
    
    # 创建配置错误
    print("1. 创建配置错误:")
    config_error = create_agent_error(
        category=ErrorCategory.CONFIGURATION_ERROR,
        code=ErrorCode.CONFIG_MISSING_KEY,
        message="配置文件缺少必要的数据库连接参数",
        context=context,
        retryable=False,
    )
    
    print(f"   - 错误类别: {config_error.category.value}")
    print(f"   - 错误代码: {config_error.code.value}")
    print(f"   - 错误消息: {config_error.message}")
    print(f"   - 可重试: {config_error.retryable}")
    print(f"   - 修复建议数量: {len(config_error.suggestions)}")
    
    for i, suggestion in enumerate(config_error.suggestions, 1):
        print(f"   - 建议 {i}: {suggestion.suggestion} (置信度: {suggestion.confidence})")
        for step in suggestion.steps:
            print(f"     * {step}")
    
    print()
    
    # 创建生成错误
    print("2. 创建生成错误:")
    generation_error = create_agent_error(
        category=ErrorCategory.GENERATION_ERROR,
        code=ErrorCode.GENERATION_TIMEOUT,
        message="代码生成超时",
        context=context,
        retryable=True,
        retry_after=60,
    )
    
    print(f"   - 错误类别: {generation_error.category.value}")
    print(f"   - 错误代码: {generation_error.code.value}")
    print(f"   - 错误消息: {generation_error.message}")
    print(f"   - 可重试: {generation_error.retryable}")
    print(f"   - 重试间隔: {generation_error.retry_after}秒")
    
    print()
    
    # 处理错误并返回标准化响应
    print("3. 处理错误并返回标准化响应:")
    response = error_handler.handle_error(config_error)
    print(f"   响应结构:")
    print(f"   - 错误类别: {response['error']['category']}")
    print(f"   - 错误代码: {response['error']['code']}")
    print(f"   - 错误消息: {response['error']['message']}")
    print(f"   - 建议数量: {len(response['error']['suggestions'])}")
    
    print("\n=== 示例完成 ===")


if __name__ == "__main__":
    example_error_handling()
