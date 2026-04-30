# Go 后端开发规范

> **Go 1.25+** | **Gin / Echo / Fiber** | 企业级生产规范
> 融合 Go 社区最佳实践与一线工程经验，作为团队编码规范与代码评审基准。

---

## 1. 技术栈

| 类别 | 选型 | 版本 |
|------|------|------|
| 语言 | Go | 1.25+ |
| Web 框架 | Gin / Echo / Fiber | latest |
| ORM | GORM / Ent | latest |
| 数据库驱动 | pgx / go-redis / modernc.org/sqlite（纯 Go，无需 CGO） | latest |
| 测试 | testing + testify + testing/synctest | latest |
| 日志 | slog（首选，stdlib）/ zap / zerolog | latest |
| 配置 | viper | latest |
| 验证 | go-playground/validator | latest |
| 文档 | swaggo/swag | latest |
| 监控 | prometheus/client_golang | latest |
| 追踪 | opentelemetry-go | v1.0+ |
| 任务调度 | asynq / machinery | latest |

---

## 2. 项目结构

```
project/
├── cmd/
│   ├── api/main.go              # HTTP API 入口
│   ├── worker/main.go           # 后台任务入口
│   └── migrate/main.go          # 数据库迁移
├── internal/                    # 私有代码
│   ├── config/                  # 配置
│   ├── domain/                  # 领域模型
│   ├── repository/              # 数据访问层
│   ├── service/                 # 业务逻辑层
│   ├── handler/                 # HTTP 处理器
│   ├── middleware/              # 中间件
│   └── pkg/                     # 内部工具包
├── pkg/                         # 公共库（可被外部导入）
├── api/                         # API 定义（swagger / proto）
├── configs/                     # 配置文件
├── deployments/                 # 部署配置（docker / k8s）
├── scripts/                     # 脚本
├── tests/                       # 集成 / E2E 测试
├── Makefile / go.mod / go.sum
```

### 分层与依赖

```
Handler → Service → Repository → Model
```

- 单向依赖，禁止反向引用；循环依赖说明包划分有问题。
- `cmd/main.go` 仅组装依赖树，不做业务逻辑。

### 代码结构要求

| 规则 | 限制 |
|------|------|
| 职责单一 | 每个包/文件只做一件事 |
| 文件长度 | ≤ 300 行 |
| 函数长度 | ≤ 50 行，超过 80 行必须拆分 |
| 无重复代码 | 三处以上抽取公共函数/包 |
| 显式依赖 | 构造函数注入，禁全局变量，禁 panic/recover 控制流 |

---

## 3. 代码风格

- `gofmt` / `goimports` / `gofumpt` 统一格式化，编辑器保存时自动执行。
- Import 分三组：标准库 → 第三方 → 本项目，组间空行，组内字母序。
- 行宽 ≤ 120 字符。

项目根目录放置 `.golangci.yml`，启用：`errcheck` `gosimple` `govet` `ineffassign` `staticcheck` `unused` `goimports` `misspell` `revive` `unconvert` `prealloc` `testifylint`

推荐 `testifylint` 配置：
```yaml
linters-settings:
  testifylint:
    enable-all: true
```

---

## 4. 命名规范

| 规则 | ✅ 正确 | ❌ 错误 |
|------|--------|--------|
| 包名全小写单数，无下划线 | `package user` | `package utils` |
| 变量驼峰，常量大写驼峰 | `userID` / `MaxRetryCount` | `user_id` |
| 导出 PascalCase，不导出 camelCase | `func NewClient()` | — |
| Getter 不加 `Get` 前缀 | `func Name() string` | `func GetName()` |
| 单方法接口 `-er` 结尾 | `Reader` / `Writer` / `Closer` | — |
| 接口小而专注，在使用方定义 | — | 大而全接口 |
| 缩略词全大/全小写 | `userID` / `parseURL` | `userId` / `parseUrl` |
| 错误变量 `Err` 前缀 | `ErrNotFound` | `ErrorNotFound` |

```go
package user

type UserRepository interface {
    GetByID(ctx context.Context, id string) (*User, error)
}

type UserService struct {
    repo UserRepository
    log  *zap.Logger
}

const MaxRetryCount = 3

var ErrUserNotFound = errors.New("user not found")

func (s *UserService) CreateUser(ctx context.Context, req *CreateUserRequest) (*User, error) {
    return nil, nil
}

func (s *UserService) validateEmail(email string) error { return nil }
```

---

## 5. 注释规范

- 导出符号必须 godoc 格式注释，以名称开头。
- 简单逻辑不注释，用自解释代码；复杂逻辑解释 **why** 非 what。
- 标记格式：`// TODO(author): reason` / `// FIXME(author): reason` / `// HACK(author): reason`

---

## 6. 错误处理

### 原则

- 错误是值，必须显式处理，**不允许多处 `_` 忽略**。
- 中间层只返回错误不记日志（避免噪音），边界层统一处理。
- `fmt.Errorf("context: %w", err)` 包装保留 cause chain，上层用 `errors.Is/As` 检查。
- **panic 仅限 main/init 不可恢复启动错误**，业务逻辑一律返回 error。

### AppError 类型体系

```go
type AppError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
    Err     error  `json:"-"`
}

func (e *AppError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("%s: %v", e.Message, e.Err)
    }
    return e.Message
}

func (e *AppError) Unwrap() error { return e.Err }

func New(code, message string) *AppError {
    return &AppError{Code: code, Message: message}
}

func Wrap(err error, code, message string) *AppError {
    return &AppError{Code: code, Message: message, Err: err}
}

var (
    ErrNotFound     = New("NOT_FOUND", "resource not found")
    ErrInvalidInput = New("INVALID_INPUT", "invalid input")
    ErrUnauthorized = New("UNAUTHORIZED", "unauthorized")
    ErrForbidden    = New("FORBIDDEN", "forbidden")
    ErrInternal     = New("INTERNAL_ERROR", "internal server error")
)
```

---

## 7. 日志规范

- 结构化日志库（**slog 首选** / zap / zerolog），作为单例通过 DI 传递。
- 级别：DEBUG（诊断）→ INFO（关键节点）→ WARN（可恢复异常）→ ERROR（需人工介入）。
- **敏感信息（密码/Token/AK/SK/手机号）禁止原样记录，必须脱敏**。
- 请求级日志必须包含 `trace_id` / `request_id`，通过 context 传播。

```go
func New(env string) (*zap.Logger, error) {
    var config zap.Config
    if env == "production" {
        config = zap.NewProductionConfig()
        config.EncoderConfig.TimeKey = "timestamp"
        config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
    } else {
        config = zap.NewDevelopmentConfig()
        config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
    }
    return config.Build(zap.AddCaller(), zap.AddCallerSkip(1))
}

func (s *UserService) GetUser(ctx context.Context, id string) (*User, error) {
    s.log.Info("getting user", zap.String("user_id", id), zap.String("request_id", GetRequestID(ctx)))
    user, err := s.repo.GetByID(ctx, id)
    if err != nil {
        s.log.Error("failed to get user", zap.String("user_id", id), zap.Error(err))
        return nil, err
    }
    return user, nil
}
```

---

## 8. 并发编程

- **Context 始终作为函数第一参数**，不在 struct 中存储。
- 网络/DB 调用必须 `context.WithTimeout`，`defer cancel()` 不能遗漏。
- 每个 goroutine 必须明确退出路径，后台任务用 `select <-ctx.Done()` 优雅关闭。

| 场景 | 同步原语 |
|------|---------|
| 初始化一次 | `sync.Once` |
| 读多写少 | `sync.RWMutex` |
| 简单互斥 | `sync.Mutex` |
| goroutine 通信 | channel |
| 等待多 goroutine | `sync.WaitGroup` |

**常见陷阱**：map 须加锁或 `sync.Map`；`defer cancel()` 必须存在。

### Context 使用模式

```go
type contextKey string

const (
    UserIDKey    contextKey = "user_id"
    RequestIDKey contextKey = "request_id"
)

func WithUserID(ctx context.Context, userID string) context.Context {
    return context.WithValue(ctx, UserIDKey, userID)
}

func UserIDFromContext(ctx context.Context) (string, bool) {
    userID, ok := ctx.Value(UserIDKey).(string)
    return userID, ok
}
```

---

## 9. 配置管理

优先级：`命令行参数 > 环境变量 > 配置文件 > 默认值`

```go
type Config struct {
    Server ServerConfig `yaml:"server"`
}
type ServerConfig struct {
    Port int `yaml:"port" default:"8080"`
}
func (c Config) Validate() error { /* fail-fast 校验 */ }
```

- main 中尽早 `Validate()`，失败立即退出。
- 环境差异通过外部注入，禁止代码中 `if env == "production"`。

---

## 10. 接口设计

- 接口在使用方定义（Go 隐式接口），不预定义大接口。
- 小接口组合大接口，遵循接口隔离原则。
- 用途分类：抽象多实现 / 依赖反转 / 测试替身 / 解耦边界。

---

## 11. 依赖注入

```go
// ✅ 构造函数注入
type Service struct {
    repo Repository // 接口类型
}
func NewService(repo Repository) *Service { return &Service{repo: repo} }

// ❌ 全局变量 / 硬编码依赖
```

`cmd/main.go` 中一次性组装完整依赖树：

```go
func main() {
    cfg := config.Load()
    logger, _ := zap.NewProduction()
    defer logger.Sync()

    db, err := repository.NewDB(cfg.Database)
    if err != nil {
        log.Fatal(err)
    }

    userRepo := repository.NewUserRepository(db)
    userService := service.NewUserService(userRepo, logger)
    userHandler := handler.NewUserHandler(userService)
    // ...
}
```

---

## 12. Web 框架规范（Gin）

在 `cmd/main.go` 中完成 DI 组装后，配置路由与中间件：

```go
r := gin.New()
r.Use(middleware.Logger(logger), middleware.Recovery(logger), middleware.RequestID(), middleware.CORS())

r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
r.GET("/healthz", func(c *gin.Context) { /* 验证所有依赖可用 */ })

v1 := r.Group("/api/v1")
{
    users := v1.Group("/users")
    {
        users.GET("", userHandler.List)
        users.GET("/:id", userHandler.Get)
        users.POST("", userHandler.Create)
        users.PUT("/:id", userHandler.Update)
        users.DELETE("/:id", userHandler.Delete)
    }
}
```

### Handler 规范

```go
type UserHandler struct {
    service  service.UserService
    validate *validator.Validate
}

func NewUserHandler(s service.UserService) *UserHandler {
    return &UserHandler{service: s, validate: validator.New()}
}

// Create godoc
// @Summary      Create user
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        user  body  CreateUserRequest  true  "User info"
// @Success      201   {object}  domain.User
// @Router       /users [post]
func (h *UserHandler) Create(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, ErrorResponse(err))
        return
    }
    if err := h.validate.Struct(req); err != nil {
        c.JSON(http.StatusBadRequest, ValidationErrorResponse(err))
        return
    }
    user, err := h.service.Create(c.Request.Context(), &req)
    if err != nil {
        handleError(c, err)
        return
    }
    c.JSON(http.StatusCreated, user)
}

type CreateUserRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Name     string `json:"name" binding:"required,min=2,max=50"`
    Password string `json:"password" binding:"required,min=8"`
}

type PaginatedResponse struct {
    Data  interface{} `json:"data"`
    Total int64       `json:"total"`
    Page  int         `json:"page"`
    Size  int         `json:"size"`
}

func ErrorResponse(err error) gin.H {
    return gin.H{"error": err.Error()}
}

func ValidationErrorResponse(err error) gin.H {
    if ves, ok := err.(validator.ValidationErrors); ok {
        errs := make(map[string]string)
        for _, e := range ves {
            errs[e.Field()] = e.Tag()
        }
        return gin.H{"errors": errs}
    }
    return gin.H{"error": err.Error()}
}

func handleError(c *gin.Context, err error) {
    switch {
    case errors.Is(err, ErrNotFound):
        c.JSON(http.StatusNotFound, ErrorResponse(err))
    case errors.Is(err, ErrInvalidInput):
        c.JSON(http.StatusBadRequest, ErrorResponse(err))
    case errors.Is(err, ErrUnauthorized):
        c.JSON(http.StatusUnauthorized, ErrorResponse(err))
    default:
        c.JSON(http.StatusInternalServerError, ErrorResponse(err))
    }
}
```

---

## 13. 数据库规范（GORM）

```go
func NewDB(cfg config.DatabaseConfig) (*gorm.DB, error) {
    dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
        cfg.Host, cfg.User, cfg.Password, cfg.Name, cfg.Port, cfg.SSLMode)
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
        Logger:  logger.Default.LogMode(logger.Silent),
        NowFunc: func() time.Time { return time.Now().UTC() },
    })
    if err != nil {
        return nil, err
    }
    sqlDB, err := db.DB()
    if err != nil {
        return nil, err
    }
    sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
    sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
    sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)
    return db, nil
}
```

### Repository 模式

```go
type userRepository struct {
    db *gorm.DB
}

func NewUserRepository(db *gorm.DB) domain.UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
    var user domain.User
    if err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, errors.Wrap(errors.ErrNotFound, "USER_NOT_FOUND", "user not found")
        }
        return nil, errors.Wrap(err, "DB_ERROR", "database error")
    }
    return &user, nil
}

func (r *userRepository) List(ctx context.Context, page, size int) ([]*domain.User, int64, error) {
    var users []*domain.User
    var total int64
    query := r.db.WithContext(ctx).Model(&domain.User{})
    if err := query.Count(&total).Error; err != nil {
        return nil, 0, err
    }
    if err := query.Offset((page - 1) * size).Limit(size).Find(&users).Error; err != nil {
        return nil, 0, err
    }
    return users, total, nil
}
```

---

## 14. API 设计

- RESTful：`GET/POST/PUT/PATCH/DELETE /api/v1/{resources}/:id`，资源名复数。
- 嵌套不超过两层；字段 snake_case；响应包在 `data` 中。
- 版本化通过 URL 路径（`/api/v1/`），废弃版本保留至少一个发布周期。
- 向后兼容：新增字段 ✅ / 修改/删除字段 ❌。

---

## 15. 测试规范

### 框架与命名

- `testing` + `testify/require`（遇错停止）/ `testify/assert`（遇错继续）。**禁止 ginkgo/gomega**。
- testify 内部取舍：`assert`/`require` ✅ 使用 | `mock` ❌ 避免（手写更清晰） | `suite` ❌ 避免（不支持并行）
- 命名：`func Test{Package}_{Method}_{Scenario}(t *testing.T)`

### 并发测试利器：testing/synctest（Go 1.25+）

`testing/synctest` 通过虚拟化时间，让并发/异步代码的测试从慢且 flaky 变为可靠且近乎瞬时：

```go
func TestWithTimeout(t *testing.T) {
    synctest.Test(t, func(t *testing.T) {
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()

        // 在 synctest 中，5 秒超时会立即触发，无需真实等待
        result, err := service.FetchWithTimeout(ctx)
        require.ErrorIs(t, err, context.DeadlineExceeded)
    })
}
```

适用场景：超时逻辑、重试机制、定时任务、goroutine 协调——传统上最难测试的并发代码。

### 表驱动测试

```go
tests := []struct {
    name  string
    input string
    want  int
}{
    {"valid", "abc", 200},
    {"empty", "", 400},
}
for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        require.Equal(t, tt.want, process(tt.input))
    })
}
```

### Mock 策略

- HTTP API：`httptest.NewServer`；数据库：SQLite in-memory 或 testcontainers。
- 接口 Mock：手写实现，不用代码生成工具。

### 并发测试（强制要求）

所有涉及共享状态的 Service 必须覆盖：

| 场景 | goroutine 数 | 验证要点 |
|------|:---:|------|
| 并发读 | ≥ 50 | 无 panic、数据不窜 |
| 并发写 | ≥ 50 | 修改安全、状态一致 |
| 读写混合 | ≥ 50 | RWMutex 保护有效 |
| 并发注册+取消 | ≥ 50 | map 安全 |
| 压力测试 | ≥ 1000 次 | 无死锁、无 goroutine 泄漏 |

所有并发测试必须包含超时检测（`select + time.After`），推荐 `-race` 标志运行。

### 覆盖率与隔离

| 指标 | 目标 |
|------|:----:|
| 整体行覆盖率 | ≥ 70% |
| 核心业务逻辑 | ≥ 85% |
| 错误分支 | 100% |

- 测试间独立，不依赖执行顺序，使用 `t.Cleanup()` 清理资源。
- 集成测试放入 `test/` 或标记 `//go:build integration`。

### 单元测试示例

```go
type mockUserRepository struct {
    mock.Mock
}

func (m *mockUserRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
    args := m.Called(ctx, id)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*domain.User), args.Error(1)
}

func TestUserService_GetUser_Success(t *testing.T) {
    mockRepo := new(mockUserRepository)
    svc := NewUserService(mockRepo, zap.NewNop())
    expected := &domain.User{ID: "123", Email: "test@example.com"}
    mockRepo.On("GetByID", mock.Anything, "123").Return(expected, nil)
    user, err := svc.GetUser(context.Background(), "123")
    assert.NoError(t, err)
    assert.Equal(t, expected, user)
}
```

---

## 16. 性能优化

- 先正确后性能，以 pprof 数据为依据，不凭直觉优化。
- 预分配 slice 容量：`make([]Item, 0, size)`
- 循环拼接字符串用 `strings.Builder`，不用 `+`
- HTTP Client 复用，配置连接池与超时：

```go
var client = &http.Client{
    Timeout: 10 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns: 100, MaxIdleConnsPerHost: 10, IdleConnTimeout: 90 * time.Second,
    },
}
```

### 基准测试（Go 1.25+ B.Loop）

```go
func BenchmarkProcess(b *testing.B) {
    for b.Loop() {
        process(input)
    }
}
```

`B.Loop` 替代传统 `for i := 0; i < b.N; i++`，自动处理编译器优化逃逸、定时器暂停等陷阱。

### 容器感知调度（Go 1.25+）

`GOMAXPROCS` 自动适配容器 CPU 限制，无需再引入 `go.uber.org/automaxprocs`。

---

## 17. 安全规范

- **输入校验**：所有外部输入在 handler 层校验（长度/格式/业务规则/注入风险）。
- **SQL 防护**：参数化查询 `db.Query("... WHERE id = ?", id)`，禁止字符串拼接。
- **密钥管理**：不硬编码、不提交仓库，通过环境变量/KMS 注入，`.gitignore` 覆盖。
- **依赖安全**：`go mod tidy` + CI 集成 `govulncheck`。

---

## 18. 可观测性

### 指标（Prometheus）

```go
var (
    HTTPRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{Name: "http_requests_total", Help: "Total number of HTTP requests"},
        []string{"method", "endpoint", "status"},
    )
    HTTPRequestDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{Name: "http_request_duration_seconds", Help: "HTTP request duration", Buckets: prometheus.DefBuckets},
        []string{"method", "endpoint"},
    )
)
```

覆盖 RED 指标（Rate / Error / Duration）。

Gin 中间件集成：

```go
func PrometheusMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        c.Next()
        duration := time.Since(start).Seconds()
        status := strconv.Itoa(c.Writer.Status())
        HTTPRequestsTotal.WithLabelValues(c.Request.Method, c.FullPath(), status).Inc()
        HTTPRequestDuration.WithLabelValues(c.Request.Method, c.FullPath()).Observe(duration)
    }
}
```

### 健康检查

- `/health` — 存活探针
- `/healthz` — 就绪探针（验证所有依赖可用）

### 执行追踪 Flight Recorder（Go 1.25+）

生产环境"黑匣子"，出事后回溯，无需持续全量采集：

```go
import "runtime/trace"

func init() {
    fr := trace.NewFlightRecorder()
    fr.Start()
    defer fr.Stop()

    // 出现异常时手动触发快照
    // snapshot, _ := fr.TakeSnapshot()
}
```

### 分布式追踪

OpenTelemetry，trace_id 通过 context + HTTP Header 跨服务传播。

```go
func InitTracer(serviceName, endpoint string) (*sdktrace.TracerProvider, error) {
    exporter, err := otlptracegrpc.New(context.Background(),
        otlptracegrpc.WithEndpoint(endpoint), otlptracegrpc.WithInsecure())
    if err != nil {
        return nil, err
    }
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(resource.NewWithAttributes(semconv.SchemaURL, semconv.ServiceName(serviceName))),
    )
    otel.SetTracerProvider(tp)
    return tp, nil
}

func (s *UserService) GetUser(ctx context.Context, id string) (*User, error) {
    ctx, span := otel.Tracer("user-service").Start(ctx, "GetUser")
    defer span.End()
    span.SetAttributes(attribute.String("user.id", id))
    user, err := s.repo.GetByID(ctx, id)
    if err != nil {
        span.RecordError(err)
        return nil, err
    }
    return user, nil
}
```

---

## 19. 版本控制

- 分支：中小型服务推荐 GitHub Flow（feature → PR → main）。
- Commit：`[type](scope): description`（type = feat/fix/refactor/perf/test/docs/chore/ci）。
- PR：小而专注，标题含变更摘要，描述含影响范围，链接 Issue，至少一人 Approve。

---

## 20. 常见陷阱

1. **只有一个实现就定义接口** — 等真正需要多态时再抽象。
2. **循环中 `+=` 拼接字符串** — 改用 `strings.Builder`。
3. **`==` 比较时间** — 用 `t1.Equal(t2)`。
4. **大切片的小切片仍引用整个底层数组** — 用 `copy` 复制。
5. **nil slice 序列化为 `null`** — 用 `make([]string, 0)` 得到 `[]`。
6. **goroutine 无退出路径** — 用 `select <-ctx.Done()` 控制。
7. **循环中 `defer fd.Close()`** — 封装到闭包或等值函数中。
8. **`if user, err := ...` 变量遮蔽** — 先声明 error，再赋值。

---

## 21. 代码评审检查清单

### 功能性
- [ ] 逻辑正确，覆盖边界情况
- [ ] 错误处理完善
- [ ] 并发安全：无竞态条件，无 goroutine 泄漏

### 可读性
- [ ] 命名清晰，注释完整
- [ ] 无重复代码（DRY）
- [ ] 函数 ≤ 50 行，文件 ≤ 300 行
- [ ] 不使用 panic 做业务逻辑控制

### 可测试性
- [ ] 核心逻辑有单元测试，错误分支有覆盖
- [ ] 涉及共享状态的 Service 有并发测试（≥ 50 goroutine + 超时检测）
- [ ] 并发测试覆盖读/写/混合三种场景
- [ ] 接口依赖可 mock

### 代码质量
- [ ] `go vet ./...` / `golangci-lint run`（含 testifylint）无告警
- [ ] `go test ./...` 全部通过
- [ ] 无硬编码配置、无未使用 import

### 安全
- [ ] 无密钥泄露（硬编码/日志）
- [ ] 输入校验完整
- [ ] `go mod tidy` 已执行
- [ ] `govulncheck ./...` 无已知漏洞

### 性能
- [ ] 无性能反模式
- [ ] 网络/DB 操作有超时
- [ ] HTTP Client 复用
- [ ] 基准测试使用 `B.Loop`（Go 1.25+）

### Go 1.25+ 特性利用
- [ ] 并发测试优先使用 `testing/synctest`
- [ ] 容器部署无需 `automaxprocs`（Go 1.25 自动适配）
- [ ] 结构化日志使用 `slog`（stdlib）
- [ ] 生产环境启用 Flight Recorder

### 向后兼容
- [ ] 无破坏性 API 变更

---

**参考**: [Effective Go](https://golang.org/doc/effective_go) | [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments) | [Standard Go Project Layout](https://github.com/golang-standards/project-layout) | [Gin](https://gin-gonic.com/docs/) | [GORM](https://gorm.io/docs/)
