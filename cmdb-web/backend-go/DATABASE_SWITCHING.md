# 数据库切换指南

## 🎯 快速切换

### 从 SQLite 切换到 PostgreSQL

```bash
# 1. 修改 .env 文件
cat > .env << EOF
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://cmdb:cmdb@localhost:5432/cmdb?sslmode=disable
SECRET_KEY=cmdb-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
PROJECT_NAME=CMDB Backend
EOF

# 2. 启动 PostgreSQL（使用 Docker）
docker-compose up -d postgres

# 3. 启动应用
go run cmd/main.go
```

### 从 SQLite 切换到 MySQL

```bash
# 1. 修改 .env 文件
cat > .env << EOF
DATABASE_TYPE=mysql
DATABASE_URL=cmdb:cmdb@tcp(localhost:3306)/cmdb?charset=utf8mb4&parseTime=True&loc=Local
SECRET_KEY=cmdb-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
PROJECT_NAME=CMDB Backend
EOF

# 2. 启动 MySQL（使用 Docker）
docker run --name mysql-cmdb -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=cmdb -e MYSQL_USER=cmdb -e MYSQL_PASSWORD=cmdb \
  -p 3306:3306 -d mysql:8.0

# 3. 启动应用
go run cmd/main.go
```

## 📋 各数据库配置示例

### SQLite（开发环境）

```env
# .env
DATABASE_TYPE=sqlite
DATABASE_URL=./cmdb.db
SECRET_KEY=cmdb-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
PROJECT_NAME=CMDB Backend
```

**特点**:
- ✅ 零配置
- ✅ 单文件存储
- ✅ 无需数据库服务器
- ⚠️ 不适合高并发

### PostgreSQL（生产环境）

```env
# .env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://cmdb:cmdb@localhost:5432/cmdb?sslmode=disable
SECRET_KEY=cmdb-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
PROJECT_NAME=CMDB Backend
```

**Docker Compose**:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cmdb
      POSTGRES_USER: cmdb
      POSTGRES_PASSWORD: cmdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

### MySQL（生产环境）

```env
# .env
DATABASE_TYPE=mysql
DATABASE_URL=cmdb:cmdb@tcp(localhost:3306)/cmdb?charset=utf8mb4&parseTime=True&loc=Local
SECRET_KEY=cmdb-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
PROJECT_NAME=CMDB Backend
```

**Docker Compose**:
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: cmdb
      MYSQL_USER: cmdb
      MYSQL_PASSWORD: cmdb
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
volumes:
  mysql_data:
```

## 🔄 使用 Makefile 切换

如果项目包含 Makefile，可以使用以下命令：

```bash
# 开发环境（SQLite）
make dev

# 生产环境（PostgreSQL）
make prod-pg

# 生产环境（MySQL）
make prod-mysql

# 重置数据库
make db-reset

# 打开数据库命令行
make db-shell
```

## 📊 数据库迁移

### 数据导出（SQLite → PostgreSQL）

```bash
# 1. 从 SQLite 导出数据
sqlite3 cmdb.db .dump > backup.sql

# 2. 修改 SQL 语法（SQLite → PostgreSQL）
# 需要手动调整部分语法

# 3. 导入到 PostgreSQL
psql -U cmdb -d cmdb -f backup.sql
```

### 使用专业工具

推荐工具：
- **pgloader** - 强大的数据库迁移工具
- **DBConvert** - 图形化迁移工具
- **mysqldump + mysql** - MySQL 之间迁移

## 🎯 环境建议

| 环境 | 推荐数据库 | 理由 |
|------|------------|------|
| 开发 | SQLite | 零配置，快速启动 |
| 测试 | SQLite/PostgreSQL | 快速测试/接近生产 |
| 生产 | PostgreSQL/MySQL | 高并发，可靠性 |

## ⚠️ 注意事项

### SQLite 限制
- 不支持并发写入
- 数据库大小限制（建议 < 10GB）
- 功能相对简单

### PostgreSQL 配置
- 生产环境启用 SSL
- 配置连接池
- 启用 WAL 日志

### MySQL 配置
- 使用 `utf8mb4` 字符集
- 配置适当的连接池
- 启用慢查询日志

## 🔍 验证数据库连接

```bash
# 启动应用
go run cmd/main.go

# 查看日志，应该看到：
# - "Using SQLite database" 或
# - "Using PostgreSQL database" 或
# - "Using MySQL database"

# 访问健康检查端点
curl http://localhost:8000/api/health
```

## 📚 参考资源

- [数据库配置指南](DATABASE_GUIDE.md)
- [SQLite 快速启动](QUICKSTART_SQLITE.md)
- [GORM 文档](https://gorm.io/docs/)

---

**最后更新**: 2026-04-06
