# Go 后端测试指南

## 📋 测试概览

本项目使用 Go 标准测试框架 `testing` 和 `testify` 断言库进行单元测试和集成测试。

### 测试结构

```
tests/
├── auth_test.go          # 认证模块测试
├── ci_test.go            # CI管理测试
├── integration_test.go   # 集成测试
└── README.md             # 本文档
```

---

## 🚀 快速开始

### 运行所有测试

```bash
cd backend-go
go test ./tests/... -v
```

### 运行特定测试

```bash
# 运行认证测试
go test ./tests/ -run TestAuth -v

# 运行CI测试
go test ./tests/ -run TestCI -v

# 运行集成测试
go test ./tests/ -run TestIntegration -v
```

### 运行测试并显示覆盖率

```bash
go test ./tests/... -cover -v
```

### 生成覆盖率报告

```bash
go test ./tests/... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

---

## 📝 测试类型

### 1. 单元测试 (Unit Tests)

测试单个函数或方法的逻辑。

**示例**: `auth_test.go`
```go
func TestLogin(t *testing.T) {
    // 测试登录功能
}
```

### 2. 集成测试 (Integration Tests)

测试多个组件协同工作。

**示例**: `integration_test.go`
```go
func TestAuthIntegration(t *testing.T) {
    // 测试完整的认证流程
}
```

---

## 🔧 测试环境

### 数据库

测试使用 **内存 SQLite** 数据库，确保：
- ✅ 测试隔离（每个测试独立）
- ✅ 快速执行（无需外部数据库）
- ✅ 自动清理（测试结束后数据消失）

```go
database.InitDB("sqlite", ":memory:")
database.AutoMigrate()
```

### 测试数据

每个测试套件都会自动创建种子数据：
- 管理员角色
- 管理员用户 (admin/admin123)

---

## 📊 测试覆盖的模块

### ✅ 已实现测试

#### 认证模块 (auth_test.go)
- [x] 登录成功
- [x] 密码错误
- [x] 用户不存在
- [x] 获取当前用户信息
- [x] 未授权访问
- [x] 登出

#### CI管理 (ci_test.go)
- [x] 获取CI列表
- [x] 按条件筛选
- [x] 创建CI
- [x] 获取CI详情
- [x] 更新CI
- [x] 删除CI
- [x] 参数验证

#### 集成测试 (integration_test.go)
- [x] 认证流程
- [x] 用户管理
- [x] CI管理
- [x] 仪表板
- [x] 健康检查

---

## 🎯 测试最佳实践

### 1. 测试命名规范

```go
// ✅ 好的命名
func TestLoginSuccess(t *testing.T)
func TestLoginWrongPassword(t *testing.T)
func TestCreateCIWithValidData(t *testing.T)

// ❌ 不好的命名
func Test1(t *testing.T)
func TestLogin(t *testing.T)  // 太模糊
```

### 2. 使用子测试组织

```go
func TestLogin(t *testing.T) {
    t.Run("登录成功", func(t *testing.T) {
        // 测试逻辑
    })
    
    t.Run("密码错误", func(t *testing.T) {
        // 测试逻辑
    })
}
```

### 3. 断言清晰

```go
// ✅ 清晰的断言
assert.Equal(t, http.StatusOK, w.Code)
assert.True(t, response.Success)
assert.NotEmpty(t, response.Data.Token)

// ❌ 不清晰的断言
if w.Code != 200 {
    t.Error("Wrong code")
}
```

### 4. 测试隔离

每个测试都应该独立，不依赖其他测试的执行顺序：

```go
func TestExample(t *testing.T) {
    setupTestEnvironment()  // 每个测试都重新初始化
    defer cleanup()         // 清理资源
    // 测试逻辑
}
```

---

## 🐛 常见问题

### Q1: 测试失败 "table already exists"

**原因**: 数据库未正确初始化

**解决**:
```go
func TestExample(t *testing.T) {
    database.InitDB("sqlite", ":memory:")
    database.AutoMigrate()
    // ...
}
```

### Q2: 认证失败 "token invalid"

**原因**: Token 生成错误或过期

**解决**:
```go
token := getTestToken()  // 使用辅助函数生成有效 token
req.Header.Set("Authorization", "Bearer "+token)
```

### Q3: 路由未找到

**原因**: 路由未正确注册

**解决**:
```go
router := gin.New()
routes.RegisterRoutes(router)  // 确保注册所有路由
```

---

## 📈 测试统计

### 当前状态

```
测试文件:     3个
测试函数:     15+个
测试用例:     25+个
预计覆盖率:   60%+
```

### 目标

- 单元测试覆盖率: **80%+**
- 集成测试覆盖率: **70%+**
- 关键路径覆盖: **100%**

---

## 🔍 调试测试

### 查看详细输出

```bash
go test ./tests/... -v
```

### 运行单个测试

```bash
go test ./tests/ -run TestLogin/login_success -v
```

### 显示日志

```go
t.Log("Debug message")
t.Logf("Value: %v", value)
```

---

## 🚀 持续集成

### GitHub Actions 示例

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Go
        uses: actions/setup-go@v2
        with:
          go-version: '1.21'
      
      - name: Run tests
        run: |
          cd backend-go
          go test ./tests/... -v -coverprofile=coverage.out
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          file: ./backend-go/coverage.out
```

---

## 📚 参考资源

- [Go Testing 官方文档](https://pkg.go.dev/testing)
- [Testify 断言库](https://github.com/stretchr/testify)
- [Gin 测试指南](https://gin-gonic.com/docs/testing/)
- [Go 测试最佳实践](https://go.dev/doc/tutorial/add-a-test)

---

## 📝 待完成的测试

### 高优先级
- [ ] 角色管理测试
- [ ] 关系管理测试
- [ ] 变更管理测试
- [ ] 审计日志测试

### 中优先级
- [ ] 边界条件测试
- [ ] 错误处理测试
- [ ] 并发测试

### 低优先级
- [ ] 性能基准测试
- [ ] 压力测试
- [ ] 内存泄漏检测

---

**最后更新**: 2026-04-06  
**维护者**: CMDB 开发团队
