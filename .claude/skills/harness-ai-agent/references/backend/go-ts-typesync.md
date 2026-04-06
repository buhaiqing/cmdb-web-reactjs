# Go + TypeScript 类型自动同步最佳实践

> **Version**: 2026.1  
> **Status**: 推荐使用

---

## 一、概述

### 1.1 什么是类型自动同步

**Go + TypeScript 类型自动同步** 是一种让前后端类型完全对齐的开发模式：

1. **Go 后端**是唯一数据源（定义结构体、接口）
2. **自动生成 OpenAPI/Swagger 文档**（使用 swag）
3. **自动生成 TypeScript 类型**（使用 openapi-typescript）
4. **前端直接使用**，永远和后端一致

### 1.2 核心优势

| 问题 | 传统方式 | 类型自动同步 |
|------|---------|------------|
| 字段名不一致 | ❌ 容易出错 | ✅ 100% 一致 |
| 类型错误 | ❌ 运行时发现 | ✅ 编译时发现 |
| 后端修改后同步 | ❌ 手动同步 | ✅ 自动重新生成 |
| AI 代码生成 | ❌ 容易瞎编字段 | ✅ 类型严格约束 |

---

## 二、快速开始

### 2.1 整体流程

```mermaid
graph LR
    A[Go 后端定义结构体] --> B[swag init 生成 swagger.json]
    B --> C[openapi-typescript 生成 TS 类型]
    C --> D[前端直接使用]
```

---

## 三、Go 后端配置

### 3.1 安装依赖

```bash
# Gin 框架
go get github.com/gin-gonic/gin

# Swag 工具
go install github.com/swaggo/swag/cmd/swag@latest
go get github.com/swaggo/gin-swagger
go get github.com/swaggo/files
```

### 3.2 完整示例代码

```go
package main

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"net/http"
)

// 1. 定义请求结构体（后端唯一来源）
type CreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Age      int    `json:"age"`
}

// 2. 定义返回结构体
type UserResponse struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

// CreateUser 创建用户
// @Summary 创建用户
// @Accept json
// @Produce json
// @Param data body CreateUserRequest true "用户信息"
// @Success 200 {object} UserResponse
// @Router /user [post]
func CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// 模拟返回
	c.JSON(http.StatusOK, UserResponse{
		ID:       1001,
		Username: req.Username,
		Email:    req.Email,
	})
}

// @title Go+TS 类型同步示例 API
// @version 1.0
// @description 自动生成 TS 类型
func main() {
	r := gin.Default()

	// swagger 路由
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 接口
	r.POST("/user", CreateUser)

	_ = r.Run(":8080")
}
```

### 3.3 生成 swagger.json

```bash
# 在 Go 项目根目录执行
swag init
```

**生成的文件**：
- `docs/docs.go`
- `docs/swagger.json` - 这是前后端的契约

---

## 四、前端 TypeScript 配置

### 4.1 安装依赖

```bash
npm install axios openapi-typescript
```

### 4.2 复制 swagger.json

```bash
# 从 Go 项目复制
cp ../go-backend/docs/swagger.json ./swagger.json
```

### 4.3 自动生成 TypeScript 类型

```bash
npx openapi-typescript swagger.json -o src/api/types.ts
```

**生成结果**：`src/api/types.ts`

---

## 五、自动生成的 TypeScript 类型示例

```typescript
// 这是自动生成的，100% 和 Go 对齐
export interface CreateUserRequest {
  username: string;
  email: string;
  age?: number;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
}

export interface paths {
  "/user": {
    post: {
      requestBody: {
        content: {
          "application/json": CreateUserRequest;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": UserResponse;
          };
        };
      };
    };
  };
}
```

✅ **字段名完全一致**  
✅ **类型完全一致**  
✅ **必填/可选完全一致**  
✅ **后端一改，重新生成就同步**

---

## 六、前端使用示例

### 6.1 API 调用示例

```typescript
import axios from "axios";
import type { CreateUserRequest, UserResponse } from "./api/types";

// 类型严格绑定！写错直接爆红
async function createUser(data: CreateUserRequest): Promise<UserResponse> {
  const res = await axios.post<UserResponse>("/user", data);
  return res.data;
}

// 使用示例
createUser({
  username: "zhangsan",
  email: "test@example.com",
  age: 25,
}).then(user => {
  console.log(user.id);
  console.log(user.username);
  console.log(user.email);
});
```

### 6.2 获得的类型安全

- ✅ **写错字段 → TS 直接报错**
- ✅ **类型不对 → TS 直接报错**
- ✅ **后端改字段 → 重新生成即可**
- ✅ **AI 写代码不会再瞎编字段**

---

## 七、集成到现有项目（cmdb-web）

### 7.1 后端 Go 配置

#### 7.1.1 在 backend-go 中安装 swag

```bash
cd cmdb-web/backend-go
go install github.com/swaggo/swag/cmd/swag@latest
go get github.com/swaggo/gin-swagger
go get github.com/swaggo/files
```

#### 7.1.2 添加 Swagger 注解到现有代码

在 `internal/routes/` 目录下的每个文件中添加 Swagger 注解：

```go
// 示例：ci.go
package routes

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

// CreateCI 创建配置项
// @Summary 创建配置项
// @Description 创建新的配置项
// @Tags CI
// @Accept json
// @Produce json
// @Param data body CreateCIRequest true "配置项信息"
// @Success 200 {object} CIResponse
// @Failure 400 {object} ErrorResponse
// @Router /api/ci [post]
func CreateCI(c *gin.Context) {
	// 现有实现
}

// ListCI 获取配置项列表
// @Summary 获取配置项列表
// @Description 获取所有配置项的列表
// @Tags CI
// @Accept json
// @Produce json
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Success 200 {object} ListCIResponse
// @Router /api/ci [get]
func ListCI(c *gin.Context) {
	// 现有实现
}
```

#### 7.1.3 更新 main.go 添加 Swagger 路由

```go
// cmd/main.go
package main

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	// 导入自动生成的 docs 包
	_ "cmdb-web/backend-go/docs"
)

// @title CMDB API
// @version 1.0
// @description CMDB 配置管理数据库 API
// @host localhost:8000
// @BasePath /api
func main() {
	r := gin.Default()

	// Swagger 文档路由
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 现有路由配置
	// ...
}
```

#### 7.1.4 生成 swagger.json

```bash
cd cmdb-web/backend-go
swag init -g cmd/main.go
```

### 7.2 前端 TypeScript 配置

#### 7.2.1 在 frontend 中安装依赖

```bash
cd cmdb-web/frontend
npm install openapi-typescript --save-dev
```

#### 7.2.2 添加脚本到 package.json

```json
{
  "scripts": {
    "generate:types": "openapi-typescript ../backend-go/docs/swagger.json -o src/api/generated-types.ts",
    "dev": "next dev",
    "build": "next build"
  }
}
```

#### 7.2.3 生成类型

```bash
cd cmdb-web/frontend
npm run generate:types
```

#### 7.2.4 使用生成的类型

```typescript
// src/api/ci.ts
import { apiRequest } from '@/lib/api';
import type { paths } from './generated-types';

type CreateCIRequest = paths['/ci']['post']['requestBody']['content']['application/json'];
type CIResponse = paths['/ci']['post']['responses']['200']['content']['application/json'];

export async function createCI(data: CreateCIRequest): Promise<CIResponse> {
  return apiRequest<CIResponse>('/ci', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

---

## 八、Makefile 自动化配置

### 8.1 在 cmdb-web/Makefile 中添加

```makefile
# 生成 API 类型
generate-api-types:
	@echo "生成 Swagger 文档..."
	cd backend-go && swag init -g cmd/main.go
	@echo "生成 TypeScript 类型..."
	cd frontend && npm run generate:types
	@echo "类型同步完成！"
```

### 8.2 使用方式

```bash
cd cmdb-web
make generate-api-types
```

---

## 九、最佳实践

### 9.1 Go 结构体注解规范

```go
// ✅ 好的做法
type User struct {
	ID        int       `json:"id" example:"1"`
	Username  string    `json:"username" binding:"required" example:"admin"`
	Email     string    `json:"email" binding:"required,email" example:"admin@example.com"`
	CreatedAt time.Time `json:"created_at"`
}

// ❌ 避免的做法
type User struct {
	ID        int
	Username  string
	Email     string
	CreatedAt time.Time
}
```

### 9.2 前端使用规范

```typescript
// ✅ 只导入类型
import type { CreateUserRequest, UserResponse } from './api/generated-types';

// ✅ 使用类型而不是 any
async function createUser(data: CreateUserRequest): Promise<UserResponse> {
  // ...
}

// ❌ 避免使用 any
async function createUser(data: any): Promise<any> {
  // ...
}
```

### 9.3 工作流程

```bash
# 1. 修改 Go 后端代码
# 2. 重新生成类型
make generate-api-types
# 3. 前端自动获得最新类型
```

---

## 十、故障排查

### 10.1 swag init 失败

**问题**：找不到 swag 命令

**解决**：
```bash
# 确保 GOPATH/bin 在 PATH 中
export PATH=$PATH:$(go env GOPATH)/bin

# 重新安装
go install github.com/swaggo/swag/cmd/swag@latest
```

### 10.2 openapi-typescript 生成失败

**问题**：swagger.json 格式错误

**解决**：
1. 确保 Go 代码中的 Swagger 注解正确
2. 访问 http://localhost:8000/swagger/index.html 检查文档
3. 重新运行 `swag init`

### 10.3 类型不匹配

**问题**：前端类型和后端不一致

**解决**：
```bash
# 重新生成类型
make generate-api-types
```

---

## 十一、相关工具链接

- **swag**: https://github.com/swaggo/swag
- **gin-swagger**: https://github.com/swaggo/gin-swagger
- **openapi-typescript**: https://github.com/drwpow/openapi-typescript
- **Gin 框架**: https://github.com/gin-gonic/gin

---

## 总结

Go + TypeScript 类型自动同步是 2026 年全栈开发的最佳实践：

✅ **后端 Go 是唯一数据源**  
✅ **自动生成 OpenAPI 文档**  
✅ **自动生成 TS 类型**  
✅ **前后端永远一致**  
✅ **AI 写代码最准、联调最快、bug 最少**
