# CMDB 系统架构设计文档

## 1. 系统架构概览

### 1.1 整体架构图

```mermaid
graph TB
    subgraph "客户端层"
        Browser[浏览器]
    end

    subgraph "接入层"
        Nginx[Nginx 负载均衡器]
    end

    subgraph "应用层"
        Frontend[Next.js 15 前端 (React 19)]
        Backend[Go + Gin 后端 API]
        Auth[JWT 认证中间件]
    end

    subgraph "数据层"
        DB[(SQLite / PostgreSQL / MySQL)]
    end

    subgraph "外部系统"
        K8s[Kubernetes 集群]
        Aliyun[阿里云 API]
        Prometheus[Prometheus]
    end

    Browser --> Nginx
    Nginx --> Frontend
    Nginx --> Backend
    Frontend --> Backend
    Backend --> Auth
    Backend --> DB
```

### 1.2 架构分层说明

| 层级 | 组件 | 技术选型 | 职责 |
|------|------|----------|------|
| 客户端层 | 浏览器 | Chrome、Safari、Edge | 用户交互界面 |
| 接入层 | Nginx | Nginx | 负载均衡、SSL 终止、静态资源 |
| 应用层 | 前端、后端 | Next.js 15 (React 19)、Go + Gin | 业务逻辑处理、API 服务、JWT 认证 |
| 数据层 | 数据库 | SQLite / PostgreSQL / MySQL | 数据存储（可切换） |
| 外部系统 | K8s、阿里云、Prometheus | — | 集成对接（预留） |

## 2. 技术栈说明

### 2.1 前端技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| React | 19.x | 前端框架 | Server Components、并发渲染、生态丰富 |
| Next.js | 15.x | 全栈框架 (App Router) | 文件路由、SSR/SSG、Turbopack |
| TypeScript | 5.x | 类型系统 | 类型安全、代码提示、减少运行时错误 |
| Zustand | 5.x | 状态管理 | 轻量、persist 中间件、TypeScript 友好 |
| Ant Design | 6.x | UI 组件库 | 企业级组件、主题定制、Design Tokens |
| @antv/g6 | 5.x | 关系图谱 | 图可视化、拓扑布局 |
| Axios | 1.x | HTTP 客户端 | 拦截器、Bearer token 注入 |
| Playwright | 1.x | E2E 测试 | 跨浏览器、Page Object Model |
| dayjs | 1.x | 日期处理 | 轻量、moment 替代 |

### 2.2 后端技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| Go | 1.27+ | 编程语言 | 高性能、静态编译、并发友好 |
| Gin | 1.12 | Web 框架 | 高性能、中间件链、路由分组 |
| GORM | 1.25 | ORM 框架 | AutoMigrate、多数据库支持、链式查询 |
| jwt-go | v5 | Token 认证 | JWT 签发与验证 |
| SQLite/Postgres/MySQL | — | 数据库 | 可切换（DATABASE_TYPE） |
| testify | 1.11 | 测试断言 | 断言库、mock 支持 |

### 2.3 基础设施

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| Docker | 24+ | 容器化 | 标准化部署、环境隔离 |
| Docker Compose | — | 容器编排 | 本地开发、多容器管理 |
| Nginx | — | 反向代理 | 负载均衡、SSL 终止、静态资源 |

## 3. 组件划分

### 3.1 前端组件架构

```
cmdb-web/frontend/
├── src/
│   ├── app/                    # App Router 页面
│   │   ├── (app)/             # 主应用路由组
│   │   │   ├── ci/            # CI 管理（list/[id]/[id]/edit/[id]/relations/types/tags）
│   │   │   ├── relation/      # 关系图谱
│   │   │   ├── change/        # 变更管理
│   │   │   ├── dashboard/     # 仪表盘
│   │   │   └── system/        # audit/notification/role/user
│   │   ├── login/             # 登录页
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首页
│   │   └── globals.css        # 全局样式（125 行，无 CSS Modules）
│   ├── components/            # React 组件
│   │   ├── layout/            # 布局组件
│   │   ├── dashboard/         # 仪表盘组件（ActivityFeed/CIDistribution/ResourceTrend）
│   │   └── relation/          # 关系图组件（RelationGraph, @antv/g6）
│   └── stores/                # Zustand stores
│       ├── user.ts            # 用户/token/axios 实例（persist: cmdb-user-storage）
│       ├── ci.ts              # CI 状态
│       ├── change.ts          # 变更状态
│       ├── relation.ts        # 关系/图谱状态
│       ├── tag.ts             # 标签状态
│       ├── permission.ts      # 权限状态
│       ├── layout.ts          # 布局状态
│       └── index.ts           # 导出
├── tests/e2e/                 # Playwright E2E（Page Object Model）
│   ├── pages/                 # POM 页面对象
│   ├── setup/                 # mock-routes.ts（拦截 **/api/**）
│   └── *.spec.ts              # 测试用例
├── package.json               # 无 typecheck 脚本；lint = next lint（已弃用）
├── playwright.config.ts       # baseURL 127.0.0.1:3001, channel 'chrome'
└── next.config.mjs            # eslint.ignoreDuringBuilds:true, typescript.ignoreBuildErrors:false
```

### 3.2 后端服务架构

```
cmdb-web/backend-go/
├── cmd/main.go                # 入口（AutoMigrate 6/10 模型；gin.DebugMode 硬编码）
├── internal/
│   ├── config/                # 配置（SECRET_KEY 默认弱密钥）
│   ├── database/              # DB 操作（SQLite/Postgres/MySQL 可切换）
│   ├── middleware/            # JWT 鉴权（无权限校验）
│   ├── models/                # GORM 模型（snake_case json tag + TimestampMixin）
│   ├── routes/                # Gin handlers（camelCase gin.H + snake_case 模型混用）
│   ├── schemas/               # 请求/响应 struct（死契约：零 handler 使用）
│   ├── security/              # 安全相关
│   ├── seed/                  # 种子数据（启动时写 ciTypes/tags，不检查错误）
│   └── utils/                 # 工具（json.go 有 StringToJSON，未被复用）
├── Makefile                   # test/test-fast/test-ci/test-cover/test-unit/test-integration/build
├── .env.example               # GIN_MODE=release（被 cmd/main.go:45 覆盖）
└── Dockerfile
```

### 3.3 服务间调用关系

```mermaid
sequenceDiagram
    participant User as 用户
    participant FE as Next.js 前端
    participant BE as Go + Gin 后端
    participant Auth as JWT 中间件
    participant DB as 数据库

    User->>FE: 登录请求
    FE->>BE: POST /api/auth/login
    BE->>Auth: 验证用户凭证
    Auth->>DB: 查询用户信息
    DB-->>Auth: 返回用户数据
    Auth->>Auth: 生成 JWT Token
    Auth-->>BE: 返回 Token
    BE-->>FE: 返回登录结果
    FE->>FE: 存储 Token (localStorage)
    FE-->>User: 登录成功

    User->>FE: 查询 CI 列表
    FE->>BE: GET /api/ci
    BE->>Auth: 验证 Token
    Auth-->>BE: 验证通过
    BE->>DB: 查询 CI 数据
    DB-->>BE: 返回 CI 列表
    BE-->>FE: 返回 CI 数据
    FE-->>User: 展示 CI 列表
```

## 4. 部署架构

### 4.1 开发环境

```bash
# 前端
cd cmdb-web/frontend
npm install --legacy-peer-deps
npm run dev          # port 3000

# 后端
cd cmdb-web/backend-go
go mod download
go run cmd/main.go   # port 8000
```

### 4.2 Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    build:
      context: ./backend-go
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    environment:
      - DATABASE_TYPE=postgres
      - DATABASE_URL=postgresql://cmdb:cmdb@postgres:5432/cmdb
      - SECRET_KEY=your-secret-key

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=cmdb
      - POSTGRES_USER=cmdb
      - POSTGRES_PASSWORD=cmdb
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 5. 数据流设计

### 5.1 CI 数据流

```mermaid
flowchart LR
    subgraph "数据源"
        ManualSource[手动录入]
        K8sSource[K8s API (预留)]
        CloudSource[云 API (预留)]
    end

    subgraph "数据处理"
        Validate[数据验证]
        Transform[数据转换 (Tags JSON→Array)]
    end

    subgraph "数据存储"
        CI[configuration_items 表]
        Relation[relations 表]
        History[audit_logs 表]
    end

    ManualSource --> Validate
    K8sSource --> Validate
    CloudSource --> Validate
    Validate --> Transform
    Transform --> CI
    Transform --> Relation
    CI --> History
    Relation --> History
```

### 5.2 变更管理数据流

```mermaid
sequenceDiagram
    participant User as 用户
    participant FE as 前端
    participant BE as 后端
    participant Change as 变更服务
    participant DB as 数据库
    participant Notify as 通知服务

    User->>FE: 提交变更申请
    FE->>BE: POST /api/changes
    BE->>Change: 创建变更记录
    Change->>DB: 保存变更数据 (pending)
    DB-->>Change: 保存成功

    alt 需要审批
        Change->>Notify: 发送审批通知
        Notify-->>User: 通知审批人
        User->>FE: 审批变更
        FE->>BE: POST /api/changes/:id/approve
        BE->>Change: 更新变更状态
        Change->>DB: 更新状态 (approved)
    end

    Change->>DB: 记录审计日志
    Change->>Notify: 发送变更通知
    Notify-->>User: 通知申请人
```

## 6. 安全设计

### 6.1 认证流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant FE as 前端
    participant BE as 后端
    participant Auth as JWT 中间件
    participant DB as 数据库

    User->>FE: 输入用户名密码
    FE->>BE: POST /api/auth/login
    BE->>Auth: 验证凭证
    Auth->>DB: 查询用户
    DB-->>Auth: 用户数据
    Auth->>Auth: 验证密码 (bcrypt)
    Auth->>Auth: 生成 JWT Token (HS256, 7天)

    alt 验证成功
        Auth-->>BE: 返回 Token
        BE-->>FE: 返回登录结果
        FE->>FE: 存储 Token (localStorage)
        FE-->>User: 登录成功
    else 验证失败
        Auth-->>BE: 返回错误
        BE-->>FE: 返回错误信息
        FE-->>User: 显示错误
    end
```

### 6.2 授权机制

- **RBAC**：13 个内置权限码（`ci:read`、`ci:write`、`change:approve` 等），定义在 `internal/routes/permission.go:12-26`
- **前端**：`stores/permission.ts` + `stores/user.ts` 消费权限码；`hasPermission()` 靠 `user.role === 'admin'` 短路
- **后端**：`internal/middleware/auth.go` 只验 JWT、只塞 `user_id/username/role`；**无权限校验中间件**（D2 债务）
- **权限数据格式**：三处不一致（seed 写 JSON 串、UpdateRolePermissions 写逗号串、Login/GetMe 塞进单元素数组）— D3 债务

### 6.3 安全注意事项

- SECRET_KEY 默认值 `cmdb-secret-key-change-in-production`（弱默认，D5）
- CORS 读 `CORS_ALLOWED_ORIGINS` 而 `.env.example` 用 `ALLOWED_ORIGINS`（D6）
- Token 存 localStorage（违反自有反模式，D7）
- 登录有 mock 回退（`admin/admin123` → `mock-jwt-token-*`，D7b）
- `gin.SetMode(gin.DebugMode)` 硬编码覆盖 `GIN_MODE=release`（D1c）

## 7. API 设计规范

### 7.1 响应格式

```json
{
    "success": true,
    "message": "ok",
    "data": {}
}
```

所有端点统一使用 `schemas.BaseResponse{Success, Message, Data}`。

### 7.2 分页格式

```json
{
    "success": true,
    "message": "ok",
    "data": {
        "items": [],
        "total": 100
    }
}
```

部分端点（audit、ci-types、tags、notifications）返回 `items` + `total`；部分端点（changes、ci）返回 `items` + `total`；部分端点（users、roles）使用 `schemas.PaginatedResponse`（`data` + `total` + `page` + `page_size`）。

### 7.3 路由注册顺序

Gin 中静态段必须先于 `:id`。`internal/routes/router.go` 中以下路径已标注「必须在 :id 之前」：
- `/relations/graph`、`/relations/impact/:ciId`
- `/changes/recent`、`/changes/:id/approve`、`/changes/:id/reject`

### 7.4 权限码

后端内置 13 个码（`internal/routes/permission.go:12-26`）：`ci:read`、`ci:write`、`change:read`、`change:write`、`change:approve`、`user:read`、`user:write`、`role:read`、`role:write`、`relation:read`、`relation:write`、`audit:read`、`dashboard:read`。

前端/文档使用 `ci:create`（`docs/rbac-matrix.md`）— 命名漂移（D4）。

## 8. 实体对齐契约

详见 `.omp/agents/chief.md` §1.6。核心发现：

- **3 个实体完全对齐**：CI（列表+详情）、Relation 列表、Relation 图谱
- **5 个实体错位**：AuditLog（4 列永远为空）、CIType（字段全 undefined）、Tag（同病）、Notification（isRead 恒 undefined ⇒ 所有通知显示「已读」）、Change（changeType 语义错位 + createdBy 不存在）
- **权限数据**：Role.permissions 类型错位（前端期望对象数组，后端给 JSON 串单元素数组）

### 8.1 命名约定

- 线上统一 **camelCase**（前端期望）
- 后端 handler 手搓 `gin.H` 已是 camelCase
- 直接返回 GORM 模型的端点（AuditLog/Tag/CIType/Notification）必须改为手搓映射或加 json tag
- **禁止**混用 camelCase 和 snake_case

### 8.2 契约文件状态

`internal/schemas/schemas.go` 定义了 CIResponse/RelationResponse/ChangeResponse（snake_case）但**零 handler 使用** —— 死契约，需清理或真正接入。

## 9. 监控与日志

### 9.1 日志

Go 标准 `log` 包，启动时打印路由表（`gin.DebugMode` 硬编码）。生产环境应设 `GIN_MODE=release`。

### 9.2 测试

- **前端**：Playwright E2E only（无单元测试）。Mock 模式拦截 `**/api/**`，按 `url.includes` 分派
- **后端**：Go testing + SQLite in-memory（`:memory:` 每连接独立库 ⇒ flaky）
- **门禁**：`go build ./...` ✅、`go vet ./...` ✅、`go test ./...` ⚠️ flaky、`npm run build` ⚠️（需先 install）、`npm run lint` ❌ 不可用

## 10. 已知债务

详见 `.omp/agents/chief.md` §1.5（D1–D18）。关键项：

| # | 债务 | 影响 |
|---|---|---|
| D1 | `go test` flaky（`:memory:` 每连接独立） | 门禁不可信 |
| D1b | 生产启动缺 4 张表（Tag/Notification/CIType/CIVersion） | `/api/tags`、`/api/ci-types`、`/api/notifications`、`/api/versions` 全挂 |
| D3 | 权限存储格式三处不一致 | 前端权限判断恒失效 |
| D7 | token 落 localStorage | XSS 可窃 token |
| D7b | 前端登录 mock 回退 | 后端宕机仍可「登录」 |
| D10 | AGENTS.md 事实性失实（已修正） | AI 会照着写出错误代码 |
| D11 | docs/architecture.md Vue 3 + FastAPI（**已修正 2026-11-14**） | 重写为 React 19 + Next.js 15 + Go + Gin + GORM；详见 §1–§9 |
| D12 | Python/FastAPI 残留 33 个 .py（`cmdb-web/backend/`） | 双后端并存；Go 侧唯一缺失端点 `GET /api/audit/export`（`backend/app/api/routes/audit.py:98`） |
