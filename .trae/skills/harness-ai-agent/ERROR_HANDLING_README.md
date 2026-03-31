# 错误处理模块使用指南

## 概述

错误处理模块提供了分类错误处理、智能修复建议和结构化日志功能，帮助开发者更好地管理和处理错误。

## 功能特性

1. **分类错误处理** - 将错误分为配置错误、模板错误、生成错误、环境错误等类别
2. **智能修复建议** - 根据错误类型和上下文提供具体的修复建议
3. **日志和调试增强** - 提供结构化日志和详细的调试信息
4. **错误代码系统** - 使用标准化的错误代码便于文档查阅和问题排查

## 错误类别

| 类别 | 描述 | 示例错误代码 |
|------|------|-------------|
| CONFIGURATION_ERROR | 配置错误 | CONFIG-001, CONFIG-002, CONFIG-003 |
| TEMPLATE_ERROR | 模板错误 | TEMPLATE-001, TEMPLATE-002, TEMPLATE-003 |
| GENERATION_ERROR | 生成错误 | GENERATION-001, GENERATION-002, GENERATION-003 |
| ENVIRONMENT_ERROR | 环境错误 | ENV-001, ENV-002, ENV-003 |
| NETWORK_ERROR | 网络错误 | NETWORK-001, NETWORK-002, NETWORK-003 |
| PERMISSION_ERROR | 权限错误 | PERMISSION-001, PERMISSION-002 |
| VALIDATION_ERROR | 验证错误 | VALIDATION-001, VALIDATION-002 |
| UNKNOWN_ERROR | 未知错误 | UNKNOWN-999 |

## 基本使用

### 创建错误

```python
from agents.error_handling import (
    ErrorCategory,
    ErrorCode,
    ErrorContext,
    create_agent_error,
)

# 创建错误上下文
context = ErrorContext(
    component="example_component",
    operation="process_data",
    input_data={"data_id": "12345"},
    environment={"env": "production"},
    related_files=["data.json", "processor.py"],
)

# 创建错误对象
error = create_agent_error(
    category=ErrorCategory.CONFIGURATION_ERROR,
    code=ErrorCode.CONFIG_MISSING_KEY,
    message="配置文件缺少必要的数据库连接参数",
    context=context,
    retryable=False,
)
```

### 处理错误

```python
from agents.error_handling import get_error_handler

# 获取错误处理器
error_handler = get_error_handler(log_level="DEBUG")

# 处理错误并返回标准化响应
response = error_handler.handle_error(error)
print(response)
```

## 错误上下文

错误上下文包含以下信息：

- `component`: 组件名称
- `operation`: 操作名称
- `input_data`: 输入数据
- `environment`: 环境信息
- `stack_trace`: 堆栈跟踪
- `related_files`: 相关文件列表

## 修复建议

修复建议包含以下信息：

- `suggestion`: 建议描述
- `confidence`: 置信度 (0-1)
- `steps`: 修复步骤列表
- `code_example`: 代码示例
- `documentation_link`: 文档链接

## 示例

查看 `examples/error_handling_example.py` 文件获取完整示例。

## 集成到现有代码

1. 在需要错误处理的模块中导入错误处理功能
2. 创建错误上下文
3. 使用 `create_agent_error` 创建错误对象
4. 记录错误并返回标准化响应

## 日志配置

错误处理模块使用 Python 标准库的 logging 模块。可以通过环境变量或代码配置日志级别：

```python
import logging

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

## 依赖

- Python 3.8+
- pydantic>=2.0.0
