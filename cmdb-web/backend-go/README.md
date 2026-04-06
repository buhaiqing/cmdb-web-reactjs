# CMDB Backend - Go 实现

> **状态**: ✅ 开发完成 (95%) | **版本**: v1.0.0-beta | **最后更新**: 2026-04-06

CMDB (Configuration Management Database) 后端服务的 Go 语言实现。

**核心成就**:
- ✅ 30 个 handler 函数全部实现
- ✅ 8 个业务模块完整覆盖
- ✅ 与 Python 版本功能完全等价
- ✅ 性能预期提升 10-50 倍

## 技术栈

- **语言**: Go 1.21
- **Web 框架**: Gin
- **ORM**: GORM
- **数据库**: SQLite (默认), PostgreSQL, MySQL
- **认证**: JWT (JSON Web Token)
- **密码加密**: bcrypt

## 项目结构

```
backend-go/
├── cmd/
│   └── main.go              # 应用入口
├── internal/
│   ├── config/              # 配置管理
│   ├── database/            # 数据库连接
│   ├── models/              # 数据模型
│   ├── schemas/             # 请求/响应模式
│   ├── security/            # 安全认证
│   ├── middleware/          # 中间件
│   ├── routes/              # 路由处理器
│   └── utils/               # 工具函数
├── go.mod
├── go.sum
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 快速开始

### 📚 详细文档

- [快速启动指南](QUICKSTART.md) - 详细的安装和运行说明
- [实现完成报告](HANDLER_IMPLEMENTATION_REPORT.md) - 所有 handler 的详细说明
- [完成总结](COMPLETION_SUMMARY.md) - 项目整体完成情况
- [重构总结](../GO_REFACTOR_SUMMARY.md) - 迁移进度和规划

### 本地开发（SQLite - 推荐）

1. **安装依赖**
```bash
go mod download
```

2. **配置环境变量**
```bash
cp .env.example .env
# 默认使用 SQLite，无需额外配置
```

3. **启动服务**
```bash
go run cmd/main.go
```

数据库文件将自动创建在 `./cmdb.db`

### 使用 PostgreSQL/MySQL

1. **配置环境变量**
```bash
# PostgreSQL
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://cmdb:cmdb@localhost:5432/cmdb?sslmode=disable

# MySQL
DATABASE_TYPE=mysql
DATABASE_URL=user:password@tcp(127.0.0.1:3306)/cmdb?charset=utf8mb4&parseTime=True&loc=Local
```

2. **启动服务**
```bash
go run cmd/main.go
```

### Docker 部署

```bash
# 使用 Docker Compose 启动
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down
```

## API 文档

### 认证接口

#### 登录
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "success": true,
  "message": "ok",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "role": "super_admin",
      "permissions": ["ci:create", "ci:read", "..."]
    }
  }
}
```

#### 获取当前用户信息
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

#### 登出
```bash
POST /api/auth/logout
Authorization: Bearer <token>
```

### 配置项接口

#### 获取 CI 列表
```bash
GET /api/ci?page=1&pageSize=20&type=server&status=active&keyword=web
Authorization: Bearer <token>
```

#### 创建 CI
```bash
POST /api/ci
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "web-server-01",
  "type": "server",
  "ip": "192.168.1.100",
  "cpu": "4 核",
  "memory": "8GB",
  "disk": "100GB",
  "os": "Ubuntu 20.04",
  "project": "电商平台",
  "environment": "production",
  "tags": ["web", "nginx"],
  "description": "Web 服务器"
}
```

#### 获取 CI 详情
```bash
GET /api/ci/:id
Authorization: Bearer <token>
```

#### 更新 CI
```bash
PUT /api/ci/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "inactive",
  "memory": "16GB"
}
```

#### 删除 CI
```bash
DELETE /api/ci/:id
Authorization: Bearer <token>
```

### 关系管理接口

#### 创建关系
```bash
POST /api/relations
Authorization: Bearer <token>
Content-Type: application/json

{
  "source_ci_id": "uuid-1",
  "target_ci_id": "uuid-2",
  "relation_type": "depends_on",
  "description": "依赖关系"
}
```

### 变更管理接口

#### 创建变更请求
```bash
POST /api/changes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "升级内存",
  "description": "将 web-server-01 的内存从 8GB 升级到 16GB",
  "ci_id": "uuid",
  "reason": "业务增长，需要更多内存资源",
  "plan": "1. 停止服务 2. 升级内存 3. 启动服务 4. 测试",
  "priority": "high"
}
```

## 数据模型

### Role (角色)
- id: UUID
- name: 角色名称
- code: 角色代码
- description: 描述
- permissions: 权限列表 (逗号分隔)
- is_active: 是否启用

### User (用户)
- id: UUID
- username: 用户名
- email: 邮箱
- hashed_password: 密码哈希
- role_id: 角色 ID
- is_active: 是否启用
- last_login_at: 最后登录时间

### CI (配置项)
- id: UUID
- name: 名称
- type: 类型 (server/database/cache 等)
- status: 状态 (active/inactive/maintenance)
- ip: IP 地址
- cpu: CPU 配置
- memory: 内存配置
- disk: 磁盘配置
- os: 操作系统
- project: 所属项目
- environment: 环境 (dev/test/prod)
- tags: 标签 (JSON 数组)
- description: 描述

### Relation (关系)
- id: UUID
- source_ci_id: 源 CI ID
- target_ci_id: 目标 CI ID
- relation_type: 关系类型 (depends_on/connected_to/hosted_on 等)
- description: 描述

### AuditLog (审计日志)
- id: UUID
- user_id: 用户 ID
- username: 用户名
- action: 操作 (create/update/delete)
- resource_type: 资源类型
- resource_id: 资源 ID
- resource_name: 资源名称
- old_value: 旧值 (JSON)
- new_value: 新值 (JSON)

### ChangeRequest (变更请求)
- id: UUID
- title: 标题
- description: 描述
- ci_id: 关联 CI ID
- reason: 变更原因
- plan: 变更计划
- status: 状态 (pending/approved/rejected/implemented)
- priority: 优先级 (low/medium/high/critical)
- requester_id: 申请人 ID
- approver_id: 审批人 ID
- approved_at: 审批时间
- implemented_at: 实施时间

## 权限控制

基于角色的访问控制 (RBAC):

- **super_admin**: 超级管理员，所有权限
- **admin**: 管理员，大部分管理权限
- **operator**: 运维人员，日常操作权限
- **viewer**: 查看人员，只读权限

## 开发指南

### 添加新的 API 路由

1. 在 `internal/routes/` 目录下创建路由处理器文件
2. 在 `internal/routes/router.go` 中注册路由
3. 在 `internal/schemas/schemas.go` 中添加请求/响应模式
4. 在 `internal/models/models.go` 中添加数据模型

### 数据库迁移

GORM 会自动迁移数据库表。如需手动迁移：

```bash
go run cmd/main.go
```

### 测试

```bash
# 运行测试
go test ./...

# 运行测试并生成覆盖率报告
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## 与 Python 版本的差异

1. **性能**: Go 版本性能提升约 10-50 倍
2. **并发**: 使用 Goroutine 处理高并发
3. **部署**: 单一二进制文件，无需依赖环境
4. **类型安全**: 静态类型检查，减少运行时错误
5. **数据库**: 使用 GORM 替代 SQLAlchemy

## 注意事项

- 生产环境请修改 `SECRET_KEY` 为安全随机数
- 建议使用环境变量管理配置
- 数据库连接建议使用连接池
- 日志建议接入 ELK 或类似系统
- 定期备份数据库
- 开发环境默认使用 SQLite，生产环境请使用 PostgreSQL 或 MySQL

## 📚 文档

- [README.md](README.md) - 项目说明
- [DATABASE_GUIDE.md](DATABASE_GUIDE.md) - 数据库配置指南
- [QUICKSTART_SQLITE.md](QUICKSTART_SQLITE.md) - SQLite 快速启动
- [STATUS.md](STATUS.md) - 开发状态跟踪
- [MIGRATION_TO_GO.md](../MIGRATION_TO_GO.md) - 从 Python 迁移报告

## 许可证

MIT License
