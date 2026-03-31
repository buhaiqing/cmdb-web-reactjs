"""错误处理模块 - 提供分类错误处理和智能修复建议.

该模块实现:
1. 分类错误处理 - 将错误分为配置错误、模板错误、生成错误、环境错误等类别
2. 智能修复建议 - 根据错误类型和上下文提供具体的修复建议
3. 日志和调试增强 - 提供结构化日志和详细的调试信息
"""

from __future__ import annotations

import logging
import json
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class ErrorCategory(str, Enum):
    """错误类别."""
    CONFIGURATION_ERROR = "configuration_error"
    TEMPLATE_ERROR = "template_error"
    GENERATION_ERROR = "generation_error"
    ENVIRONMENT_ERROR = "environment_error"
    NETWORK_ERROR = "network_error"
    PERMISSION_ERROR = "permission_error"
    VALIDATION_ERROR = "validation_error"
    UNKNOWN_ERROR = "unknown_error"


class ErrorCode(str, Enum):
    """错误代码."""
    # 配置错误
    CONFIG_MISSING_KEY = "CONFIG-001"
    CONFIG_INVALID_VALUE = "CONFIG-002"
    CONFIG_PARSE_ERROR = "CONFIG-003"
    
    # 模板错误
    TEMPLATE_NOT_FOUND = "TEMPLATE-001"
    TEMPLATE_SYNTAX_ERROR = "TEMPLATE-002"
    TEMPLATE_RENDER_ERROR = "TEMPLATE-003"
    
    # 生成错误
    GENERATION_FAILED = "GENERATION-001"
    GENERATION_TIMEOUT = "GENERATION-002"
    GENERATION_INVALID_OUTPUT = "GENERATION-003"
    
    # 环境错误
    ENV_DEPENDENCY_MISSING = "ENV-001"
    ENV_PERMISSION_DENIED = "ENV-002"
    ENV_RESOURCE_EXHAUSTED = "ENV-003"
    
    # 网络错误
    NETWORK_CONNECTION_FAILED = "NETWORK-001"
    NETWORK_TIMEOUT = "NETWORK-002"
    NETWORK_AUTHENTICATION_FAILED = "NETWORK-003"
    
    # 权限错误
    PERMISSION_ACCESS_DENIED = "PERMISSION-001"
    PERMISSION_INSUFFICIENT = "PERMISSION-002"
    
    # 验证错误
    VALIDATION_FAILED = "VALIDATION-001"
    VALIDATION_SCHEMA_MISMATCH = "VALIDATION-002"
    
    # 未知错误
    UNKNOWN = "UNKNOWN-999"


@dataclass
class ErrorContext:
    """错误上下文信息."""
    component: str
    operation: str
    input_data: Dict[str, Any] = field(default_factory=dict)
    environment: Dict[str, Any] = field(default_factory=dict)
    stack_trace: Optional[str] = None
    related_files: List[str] = field(default_factory=list)


@dataclass
class FixSuggestion:
    """修复建议."""
    suggestion: str
    confidence: float
    steps: List[str] = field(default_factory=list)
    code_example: Optional[str] = None
    documentation_link: Optional[str] = None


@dataclass
class AgentError:
    """Agent错误模型."""
    category: ErrorCategory
    code: ErrorCode
    message: str
    context: ErrorContext
    suggestions: List[FixSuggestion] = field(default_factory=list)
    retryable: bool = False
    retry_after: Optional[int] = None  # 重试间隔(秒)


class ErrorHandler:
    """错误处理器.
    
    提供分类错误处理、智能修复建议和结构化日志功能。
    """
    
    def __init__(self, log_level: str = "INFO"):
        """初始化错误处理器.
        
        Args:
            log_level: 日志级别 (DEBUG, INFO, WARNING, ERROR)
        """
        # 配置日志
        self.logger = logging.getLogger("agent_error_handler")
        self._set_log_level(log_level)
    
    def _set_log_level(self, level: str) -> None:
        """设置日志级别."""
        numeric_level = getattr(logging, level.upper(), None)
        if numeric_level is None:
            raise ValueError(f"无效的日志级别: {level}")
        logging.basicConfig(level=numeric_level)
    
    def create_error(
        self,
        category: ErrorCategory,
        code: ErrorCode,
        message: str,
        context: ErrorContext,
        suggestions: Optional[List[FixSuggestion]] = None,
        retryable: bool = False,
        retry_after: Optional[int] = None,
    ) -> AgentError:
        """创建错误对象.
        
        Args:
            category: 错误类别
            code: 错误代码
            message: 错误消息
            context: 错误上下文
            suggestions: 修复建议列表
            retryable: 是否可重试
            retry_after: 重试间隔(秒)
        
        Returns:
            错误对象
        """
        if suggestions is None:
            suggestions = self._generate_suggestions(category, code, context)
        
        error = AgentError(
            category=category,
            code=code,
            message=message,
            context=context,
            suggestions=suggestions,
            retryable=retryable,
            retry_after=retry_after,
        )
        
        # 记录错误日志
        self._log_error(error)
        
        return error
    
    def _generate_suggestions(
        self,
        category: ErrorCategory,
        code: ErrorCode,
        context: ErrorContext,
    ) -> List[FixSuggestion]:
        """根据错误类型生成修复建议.
        
        Args:
            category: 错误类别
            code: 错误代码
            context: 错误上下文
        
        Returns:
            修复建议列表
        """
        suggestions = []
        
        # 配置错误建议
        if category == ErrorCategory.CONFIGURATION_ERROR:
            if code == ErrorCode.CONFIG_MISSING_KEY:
                suggestions.append(FixSuggestion(
                    suggestion="添加缺失的配置项",
                    confidence=0.9,
                    steps=[
                        f"检查配置文件是否包含必要的键: {context.input_data.get('missing_key')}",
                        "参考文档或示例配置添加缺失的配置项",
                        "验证配置格式是否正确"
                    ],
                    documentation_link="https://example.com/config-guide"
                ))
            
            elif code == ErrorCode.CONFIG_INVALID_VALUE:
                suggestions.append(FixSuggestion(
                    suggestion="修正配置值",
                    confidence=0.85,
                    steps=[
                        f"检查配置项 '{context.input_data.get('key')}' 的值是否符合要求",
                        "参考配置文档确认有效值范围",
                        "更新配置文件并重新验证"
                    ]
                ))
        
        # 模板错误建议
        elif category == ErrorCategory.TEMPLATE_ERROR:
            if code == ErrorCode.TEMPLATE_NOT_FOUND:
                suggestions.append(FixSuggestion(
                    suggestion="检查模板路径",
                    confidence=0.95,
                    steps=[
                        f"确认模板文件是否存在: {context.input_data.get('template_path')}",
                        "检查文件路径是否正确",
                        "验证文件权限是否正确"
                    ]
                ))
            
            elif code == ErrorCode.TEMPLATE_SYNTAX_ERROR:
                suggestions.append(FixSuggestion(
                    suggestion="修复模板语法错误",
                    confidence=0.8,
                    steps=[
                        f"检查模板文件: {context.input_data.get('template_path')}",
                        "修复语法错误 (通常在第 {context.input_data.get('line_number')} 行)",
                        "使用模板验证工具检查语法"
                    ]
                ))
        
        # 环境错误建议
        elif category == ErrorCategory.ENVIRONMENT_ERROR:
            if code == ErrorCode.ENV_DEPENDENCY_MISSING:
                suggestions.append(FixSuggestion(
                    suggestion="安装缺失的依赖",
                    confidence=0.9,
                    steps=[
                        f"安装缺失的依赖: {context.input_data.get('dependency')}",
                        "使用包管理器安装依赖",
                        "验证依赖安装是否成功"
                    ],
                    code_example=f"pip install {context.input_data.get('dependency')}"
                ))
        
        # 网络错误建议
        elif category == ErrorCategory.NETWORK_ERROR:
            if code == ErrorCode.NETWORK_CONNECTION_FAILED:
                suggestions.append(FixSuggestion(
                    suggestion="检查网络连接",
                    confidence=0.8,
                    steps=[
                        "检查网络连接是否正常",
                        f"验证目标服务器是否可访问: {context.input_data.get('host')}",
                        "检查防火墙设置",
                        "尝试使用 ping 命令测试连接"
                    ],
                    code_example=f"ping {context.input_data.get('host')}"
                ))
        
        # 默认建议
        if not suggestions:
            suggestions.append(FixSuggestion(
                suggestion="检查相关日志和文档",
                confidence=0.5,
                steps=[
                    "查看详细日志获取更多信息",
                    "检查相关文档",
                    "尝试重新运行任务"
                ]
            ))
        
        return suggestions
    
    def _log_error(self, error: AgentError) -> None:
        """记录错误日志.
        
        Args:
            error: 错误对象
        """
        log_data = {
            "error_category": error.category.value,
            "error_code": error.code.value,
            "message": error.message,
            "component": error.context.component,
            "operation": error.context.operation,
            "input_data": error.context.input_data,
            "environment": error.context.environment,
            "retryable": error.retryable,
            "suggestions_count": len(error.suggestions),
        }
        
        if error.context.stack_trace:
            log_data["stack_trace"] = error.context.stack_trace
        
        if error.context.related_files:
            log_data["related_files"] = error.context.related_files
        
        # 将日志数据转换为JSON字符串
        log_message = json.dumps(log_data, ensure_ascii=False)
        
        # 根据错误类别选择日志级别
        if error.category in [
            ErrorCategory.PERMISSION_ERROR,
            ErrorCategory.ENVIRONMENT_ERROR,
            ErrorCategory.NETWORK_ERROR,
        ]:
            self.logger.error(f"Agent Error: {log_message}")
        elif error.category == ErrorCategory.CONFIGURATION_ERROR:
            self.logger.warning(f"Agent Configuration Error: {log_message}")
        else:
            self.logger.error(f"Agent Error: {log_message}")
    
    def handle_error(self, error: AgentError) -> Dict[str, Any]:
        """处理错误并返回标准化响应.
        
        Args:
            error: 错误对象
        
        Returns:
            标准化的错误响应
        """
        return {
            "error": {
                "category": error.category.value,
                "code": error.code.value,
                "message": error.message,
                "retryable": error.retryable,
                "suggestions": [
                    {
                        "suggestion": s.suggestion,
                        "confidence": s.confidence,
                        "steps": s.steps,
                        "code_example": s.code_example,
                        "documentation_link": s.documentation_link
                    }
                    for s in error.suggestions
                ]
            },
            "context": {
                "component": error.context.component,
                "operation": error.context.operation,
                "related_files": error.context.related_files
            }
        }


# 全局错误处理器实例
_error_handler: ErrorHandler | None = None


def get_error_handler(log_level: str = "INFO") -> ErrorHandler:
    """获取错误处理器实例.
    
    Args:
        log_level: 日志级别
    
    Returns:
        错误处理器实例
    """
    global _error_handler
    if _error_handler is None:
        _error_handler = ErrorHandler(log_level=log_level)
    return _error_handler


def create_agent_error(
    category: ErrorCategory,
    code: ErrorCode,
    message: str,
    context: ErrorContext,
    suggestions: Optional[List[FixSuggestion]] = None,
    retryable: bool = False,
    retry_after: Optional[int] = None,
) -> AgentError:
    """创建错误的便捷函数.
    
    Args:
        category: 错误类别
        code: 错误代码
        message: 错误消息
        context: 错误上下文
        suggestions: 修复建议列表
        retryable: 是否可重试
        retry_after: 重试间隔(秒)
    
    Returns:
        错误对象
    """
    handler = get_error_handler()
    return handler.create_error(
        category=category,
        code=code,
        message=message,
        context=context,
        suggestions=suggestions,
        retryable=retryable,
        retry_after=retry_after,
    )
