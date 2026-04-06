# Go 后端快速启动指南

## 🚀 快速开始

### 前置要求

- Go 1.21+ 
- PostgreSQL 15 (或使用 SQLite)
- Docker & Docker Compose (可选)

### 方式一：本地运行（推荐开发）

#### 1. 安装依赖

```bash
cd backend-go
go mod download
```

#### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置数据库连接等配置
```

默认配置使用 SQLite（无需额外配置）：
```env
DB_TYPE=sqlite
DB_PATH=./cmdb.db
```

如需使用 PostgreSQL：
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=cmdb
DB_PASSWORD=cmdb_password
DB_NAME=cmdb
```

#### 3. 运行服务

```bash
go run cmd/main.go
```

服务将在 `http://localhost:8080` 启动

---

### 方式二：Docker 运行（推荐生产）

#### 1. 构建镜像

```bash
docker build -t cmdb-go:latest .
```

#### 2. 使用 Docker Compose

```bash
docker-compose up -d
```

这将同时启动：
- Go 后端服务 (端口 8080)
- PostgreSQL 数据库 (端口 5432)

#### 3. 查看日志

```bash
docker-compose logs -f
```

---

## ✅ 验证服务

### 1. 健康检查

```bash
curl http://localhost:8080/api/health
```

预期响应：
```json
{
  "success": true,
  "message": "ok",
  "data": {
    "status": "healthy",
    "version": "1.0.0-beta"
  }
}
```

### 2. 测试登录

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

预期响应：
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "permissions": []
    }
  }
}
```

### 3. 获取用户信息

```bash
TOKEN="your_jwt_token_here"
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. 获取仪表板数据

```bash
curl http://localhost:8080/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

预期响应：
```json
{
  "success": true,
  "message": "ok",
  "data": {
    "ciCount": 0,
    "relationCount": 0,
    "changeCount": 0,
    "userCount": 1
  }
}
```

---

## 📝 API 端点清单

### 认证相关
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/logout` - 用户登出

### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `GET /api/users/:id` - 获取用户详情
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

### 角色管理
- `GET /api/roles` - 获取角色列表
- `POST /api/roles` - 创建角色
- `GET /api/roles/:id` - 获取角色详情
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色

### 配置项管理
- `GET /api/ci` - 获取配置项列表
- `POST /api/ci` - 创建配置项
- `GET /api/ci/:id` - 获取配置项详情
- `PUT /api/ci/:id` - 更新配置项
- `DELETE /api/ci/:id` - 删除配置项

### 关系管理
- `GET /api/relations` - 获取关系列表
- `POST /api/relations` - 创建关系
- `GET /api/relations/:id` - 获取关系详情
- `PUT /api/relations/:id` - 更新关系
- `DELETE /api/relations/:id` - 删除关系

### 变更管理
- `GET /api/changes` - 获取变更列表
- `POST /api/changes` - 创建变更
- `GET /api/changes/:id` - 获取变更详情
- `PUT /api/changes/:id` - 更新变更
- `DELETE /api/changes/:id` - 删除变更

### 审计日志
- `GET /api/audit/logs` - 获取审计日志列表

### 仪表板
- `GET /api/dashboard` - 获取系统统计数据

### 健康检查
- `GET /api/health` - 健康检查

---

## 🔧 常用命令

### 编译

```bash
# 编译为可执行文件
go build -o cmdb-server cmd/main.go

# 交叉编译（Linux）
GOOS=linux GOARCH=amd64 go build -o cmdb-server cmd/main.go
```

### 格式化代码

```bash
gofmt -w .
```

### 运行测试

```bash
# 运行所有测试
go test ./...

# 运行测试并显示覆盖率
go test -cover ./...

# 运行特定包的测试
go test ./internal/routes/...
```

### 清理

```bash
# 清理编译产物
go clean

# 清理模块缓存
go clean -modcache
```

---

## 🐛 故障排查

### 问题 1：端口被占用

**错误**: `listen tcp :8080: bind: address already in use`

**解决**:
```bash
# 查找占用端口的进程
lsof -i :8080

# 终止进程
kill -9 <PID>

# 或修改端口
export PORT=8081
go run cmd/main.go
```

### 问题 2：数据库连接失败

**错误**: `failed to connect to database`

**解决**:
```bash
# 检查 PostgreSQL 是否运行
docker-compose ps

# 查看数据库日志
docker-compose logs postgres

# 使用 SQLite（无需外部数据库）
echo "DB_TYPE=sqlite" > .env
```

### 问题 3：JWT Token 无效

**错误**: `invalid token`

**解决**:
```bash
# 确保 Token 格式正确
curl -H "Authorization: Bearer YOUR_TOKEN" ...

# 检查 Token 是否过期（默认 24 小时）
# 重新登录获取新 Token
```

### 问题 4：依赖下载失败

**错误**: `go: module download failed`

**解决**:
```bash
# 设置国内代理
go env -w GOPROXY=https://goproxy.cn,direct

# 重新下载依赖
go mod download
```

---

## 📊 性能测试

### 基准测试

```bash
# 运行基准测试
go test -bench=. -benchmem ./...

# 示例输出
# BenchmarkLogin-8    10000    120000 ns/op    5000 B/op    50 allocs/op
```

### 压力测试（使用 wrk）

```bash
# 安装 wrk
brew install wrk  # macOS
sudo apt-get install wrk  # Ubuntu

# 测试登录接口
wrk -t12 -c400 -d30s http://localhost:8080/api/health

# 测试结果示例
# Running 30s test @ http://localhost:8080/api/health
#   12 threads and 400 connections
#   Thread Stats   Avg      Stdev     Max   +/- Stdev
#     Latency     2.50ms    1.20ms  15.00ms   75.00%
#     Req/Sec    13.50k     1.20k   15.00k    90.00%
#   4860000 requests in 30.00s, 1.20GB read
# Requests/sec: 162000.00
# Transfer/sec:     40.00MB
```

---

## 🔐 安全建议

### 生产环境配置

1. **修改默认密钥**
```env
JWT_SECRET=your_super_secret_key_here_at_least_32_chars
```

2. **启用 HTTPS**
```bash
# 使用 Nginx 反向代理
# 或使用 Let's Encrypt 证书
```

3. **限制 CORS**
```go
// 在 middleware/cors.go 中修改允许的域名
allowedOrigins := []string{"https://your-domain.com"}
```

4. **数据库密码加密**
```env
DB_PASSWORD=use_strong_password_here
```

5. **启用速率限制**
```go
// 添加速率限制中间件
import "github.com/didip/tollbooth"
```

---

## 📚 更多资源

- [实现完成报告](HANDLER_IMPLEMENTATION_REPORT.md) - 详细的处理器实现说明
- [重构总结](../GO_REFACTOR_SUMMARY.md) - 项目整体进度和规划
- [迁移报告](MIGRATION_TO_GO.md) - Python 到 Go 的迁移细节
- [Gin 官方文档](https://gin-gonic.com/docs/)
- [GORM 官方文档](https://gorm.io/docs/)

---

## 💡 提示

1. **开发模式**: 使用 `air` 实现热重载
   ```bash
   go install github.com/cosmtrek/air@latest
   air
   ```

2. **API 调试**: 使用 Postman 或 Insomnia 导入 API 集合

3. **数据库管理**: 使用 pgAdmin 或 DBeaver 连接 PostgreSQL

4. **日志查看**: 所有请求都会记录到控制台，包含响应时间和状态码

5. **Swagger 文档**: 计划中添加 Swagger UI，访问 `/swagger/index.html`

---

**最后更新**: 2026-04-06  
**版本**: v1.0.0-beta
