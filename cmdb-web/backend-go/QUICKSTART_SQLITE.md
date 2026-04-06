# 开发环境快速启动指南（SQLite）

## 🚀 5 分钟快速启动

### 前置要求

- Go 1.21+
- Git

### 步骤 1: 克隆项目

```bash
cd cmdb-web/backend-go
```

### 步骤 2: 下载依赖

```bash
go mod download
```

### 步骤 3: 配置环境

```bash
# 复制环境配置模板
cp .env.example .env

# 确认使用 SQLite（默认配置）
cat .env
# 应该看到:
# DATABASE_TYPE=sqlite
# DATABASE_URL=./cmdb.db
```

### 步骤 4: 启动服务

```bash
go run cmd/main.go
```

你会看到类似输出：
```
Using SQLite database
Database connection established
Database migration completed
Starting server on port 8000
```

### 步骤 5: 验证服务

打开浏览器访问：
```
http://localhost:8000/api/health
```

应该返回：
```json
{
  "status": "ok",
  "service": "cmdb-backend-go"
}
```

## 🎯 测试 API

### 1. 登录

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 2. 获取当前用户信息

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 创建配置项

```bash
curl -X POST http://localhost:8000/api/ci \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-server-01",
    "type": "server",
    "ip": "192.168.1.100",
    "cpu": "4 核",
    "memory": "8GB",
    "description": "测试服务器"
  }'
```

## 📁 项目结构

```
backend-go/
├── cmd/
│   └── main.go              # 主程序入口
├── internal/
│   ├── config/              # 配置管理
│   ├── database/            # 数据库连接
│   ├── models/              # 数据模型
│   ├── schemas/             # 请求/响应模式
│   ├── security/            # 安全认证
│   ├── middleware/          # 中间件
│   ├── routes/              # 路由框架
│   └── utils/               # 工具函数
├── .env                     # 环境配置
├── cmdb.db                  # SQLite 数据库文件（自动生成）
├── go.mod                   # Go 模块定义
└── README.md                # 项目文档
```

## 🔍 查看数据库

### 使用 sqlite3 命令行

```bash
# 安装 sqlite3（如果未安装）
# macOS
brew install sqlite3

# Ubuntu/Debian
sudo apt-get install sqlite3

# 查看数据库
sqlite3 cmdb.db

# 查看所有表
.tables

# 查看配置项表结构
.schema configuration_items

# 查看配置项数据
SELECT * FROM configuration_items;

# 退出
.quit
```

### 使用图形化工具

推荐工具：
- **DB Browser for SQLite** (跨平台)
- **SQLiteStudio** (跨平台)
- **DBeaver** (支持多种数据库)

## 🛠️ 常用操作

### 重置数据库

```bash
# 删除数据库文件
rm cmdb.db

# 重启服务（会自动重建）
go run cmd/main.go
```

### 查看日志

```bash
# 启动时会自动显示日志
go run cmd/main.go

# 输出示例：
# Using SQLite database
# Database connection established
# Database migration completed
# Starting server on port 8000
```

### 修改端口

编辑 `.env` 文件：
```env
PORT=8080
```

重启服务：
```bash
go run cmd/main.go
```

访问：`http://localhost:8080`

## 📊 数据库表结构

启动后会自动创建以下表：

```sql
-- 角色表
roles

-- 用户表
users

-- 配置项表
configuration_items

-- 关系表
relations

-- 审计日志表
audit_logs

-- 变更请求表
change_requests
```

## ⚡ 性能提示

### SQLite 优化

1. **启用 WAL 模式**（提高并发）
```sql
PRAGMA journal_mode=WAL;
```

2. **定期 VACUUM**（优化数据库大小）
```sql
VACUUM;
```

3. **分析表**（优化查询计划）
```sql
ANALYZE;
```

### GORM 配置

对于生产环境，建议调整 GORM 配置：

```go
// 在 database.go 中
DB, err = gorm.Open(dialector, &gorm.Config{
    Logger: logger.Default.LogMode(logger.Info), // 启用日志
})

// 配置连接池
sqlDB, _ := DB.DB()
sqlDB.SetMaxIdleConns(10)
sqlDB.SetMaxOpenConns(100)
```

## 🐛 故障排查

### 问题：启动失败

**错误**: `failed to connect to database`

**解决**:
1. 检查 `.env` 配置
2. 确保有写入权限
3. 删除 `cmdb.db` 重新启动

### 问题：端口被占用

**错误**: `bind: address already in use`

**解决**:
1. 修改 `.env` 中的 `PORT`
2. 或者关闭占用端口的进程

### 问题：依赖下载失败

**错误**: `no required module provides package`

**解决**:
```bash
go mod tidy
go mod download
```

## 🎓 下一步

1. **阅读 API 文档** - 了解所有可用接口
2. **编写测试** - 确保功能正常
3. **切换到 PostgreSQL** - 准备生产环境
4. **部署到服务器** - Docker 或二进制部署

## 📚 参考资源

- [数据库配置指南](DATABASE_GUIDE.md)
- [项目 README](README.md)
- [GORM 文档](https://gorm.io/docs/)
- [SQLite 文档](https://www.sqlite.org/docs.html)

---

**提示**: SQLite 适合开发和测试，生产环境请使用 PostgreSQL 或 MySQL。
