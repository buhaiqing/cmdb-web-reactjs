# 数据库配置指南

CMDB Go 后端支持多种数据库系统，包括 **SQLite**、**PostgreSQL** 和 **MySQL**。

## 🎯 快速开始

### 开发环境（推荐 SQLite）

SQLite 是开发环境的默认选择，无需额外配置：

```bash
# 1. 复制环境配置
cp .env.example .env

# 2. 启动服务（自动使用 SQLite）
go run cmd/main.go
```

SQLite 数据库文件将自动创建在 `./cmdb.db`。

### 生产环境（PostgreSQL/MySQL）

生产环境建议使用 PostgreSQL 或 MySQL：

```bash
# PostgreSQL 配置
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://cmdb:cmdb@localhost:5432/cmdb?sslmode=disable

# MySQL 配置
DATABASE_TYPE=mysql
DATABASE_URL=user:password@tcp(127.0.0.1:3306)/cmdb?charset=utf8mb4&parseTime=True&loc=Local
```

## 📋 环境变量配置

### 核心变量

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `DATABASE_TYPE` | 数据库类型 | `sqlite` | `sqlite`, `postgres`, `mysql` |
| `DATABASE_URL` | 数据库连接字符串 | `./cmdb.db` | 见下方各数据库示例 |

### SQLite 配置

```env
DATABASE_TYPE=sqlite
DATABASE_URL=./cmdb.db
```

**特点**：
- ✅ 零配置，开箱即用
- ✅ 无需数据库服务器
- ✅ 单文件存储
- ⚠️ 不适合高并发生产环境

### PostgreSQL 配置

```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://cmdb:cmdb@localhost:5432/cmdb?sslmode=disable
```

**连接字符串格式**：
```
postgresql://用户名:密码@主机：端口/数据库名？参数
```

**常用参数**：
- `sslmode=disable` - 禁用 SSL（开发环境）
- `sslmode=require` - 启用 SSL（生产环境）

### MySQL 配置

```env
DATABASE_TYPE=mysql
DATABASE_URL=user:password@tcp(127.0.0.1:3306)/cmdb?charset=utf8mb4&parseTime=True&loc=Local
```

**连接字符串格式**：
```
用户名：密码@tcp(主机：端口)/数据库名？参数
```

**重要参数**：
- `charset=utf8mb4` - 字符集（支持 emoji）
- `parseTime=True` - 支持时间类型
- `loc=Local` - 使用本地时区

## 🚀 使用 Docker Compose

### 使用 PostgreSQL

```bash
docker-compose up -d
```

这将启动：
- CMDB Go 后端服务
- PostgreSQL 数据库

### 使用 MySQL

编辑 `docker-compose.yml`，取消 MySQL 服务注释：

```yaml
services:
  backend:
    environment:
      - DATABASE_TYPE=mysql
      - DATABASE_URL=cmdb:cmdb@tcp(mysql:3306)/cmdb?charset=utf8mb4&parseTime=True&loc=Local
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=cmdb
      - MYSQL_USER=cmdb
      - MYSQL_PASSWORD=cmdb
    ports:
      - "3306:3306"
```

然后启动：
```bash
docker-compose up -d
```

## 🔄 数据库迁移

GORM 会在应用启动时自动执行数据库迁移，创建所有必要的表。

### 手动触发迁移

```bash
go run cmd/main.go
```

启动日志会显示：
```
Database migration completed
Database connection established
```

### 查看表结构

**SQLite**:
```bash
sqlite3 cmdb.db ".tables"
```

**PostgreSQL**:
```bash
psql -U cmdb -d cmdb -c "\dt"
```

**MySQL**:
```bash
mysql -u cmdb -p cmdb -e "SHOW TABLES;"
```

## 📊 数据库选择建议

### 开发环境
- **推荐**: SQLite
- **理由**: 
  - 零配置
  - 快速启动
  - 便于调试

### 测试环境
- **推荐**: SQLite 或 PostgreSQL
- **理由**: 
  - SQLite 快速测试
  - PostgreSQL 接近生产环境

### 生产环境
- **推荐**: PostgreSQL 或 MySQL
- **理由**:
  - 高并发支持
  - 数据可靠性
  - 备份恢复
  - 监控告警

## 🔧 数据库切换

### 从 SQLite 切换到 PostgreSQL

1. **修改环境变量**
```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://cmdb:cmdb@localhost:5432/cmdb
```

2. **导出数据（可选）**
使用工具导出 SQLite 数据

3. **启动应用**
```bash
go run cmd/main.go
```

4. **导入数据（可选）**
使用工具导入到 PostgreSQL

### 从 PostgreSQL 切换到 MySQL

1. **修改环境变量**
```env
DATABASE_TYPE=mysql
DATABASE_URL=user:password@tcp(127.0.0.1:3306)/cmdb
```

2. **启动应用**
```bash
go run cmd/main.go
```

## 📈 性能对比

| 数据库 | 并发能力 | 查询性能 | 适用场景 |
|--------|----------|----------|----------|
| SQLite | 低 (~100 QPS) | 中等 | 开发、测试、小型应用 |
| PostgreSQL | 高 (~10,000 QPS) | 优秀 | 生产环境、复杂查询 |
| MySQL | 高 (~10,000 QPS) | 优秀 | 生产环境、简单查询 |

## 🛠️ 数据库工具

### SQLite
- **DB Browser for SQLite** - 可视化数据库浏览器
- **sqlite3** - 命令行工具

### PostgreSQL
- **pgAdmin** - 官方管理工具
- **DBeaver** - 通用数据库工具
- **psql** - 命令行工具

### MySQL
- **MySQL Workbench** - 官方图形化工具
- **DBeaver** - 通用数据库工具
- **mysql** - 命令行工具

## ⚠️ 注意事项

### SQLite
- 不支持并发写入（适合开发环境）
- 数据库文件大小限制（通常 < 10GB）
- 需要定期 VACUUM 优化

### PostgreSQL
- 生产环境请启用 SSL
- 建议配置连接池
- 定期备份和监控

### MySQL
- 确保使用 `utf8mb4` 字符集
- 配置适当的连接池大小
- 启用慢查询日志

## 🎓 最佳实践

### 开发环境
```env
DATABASE_TYPE=sqlite
DATABASE_URL=./cmdb.db
# 启用 GORM 日志
# 在 database.go 中修改 Logger 级别
```

### 生产环境
```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://cmdb:cmdb@rds.example.com:5432/cmdb?sslmode=require

# 连接池配置（通过环境变量或代码）
# 最大连接数：25
# 最小空闲连接：5
# 连接超时：30s
```

### 性能优化
1. **使用连接池** - 避免频繁创建连接
2. **启用索引** - 优化查询性能
3. **定期清理** - 删除过期数据
4. **监控告警** - 及时发现性能问题

## 📚 参考资源

- [GORM SQLite Driver](https://gorm.io/docs/connects_to_sqlite.html)
- [GORM PostgreSQL Driver](https://gorm.io/docs/connects_to_postgresql.html)
- [GORM MySQL Driver](https://gorm.io/docs/connects_to_mysql.html)
- [SQLite 官方文档](https://www.sqlite.org/docs.html)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [MySQL 官方文档](https://dev.mysql.com/doc/)

---

**最后更新**: 2026-04-06
**版本**: v1.0.0
