# CMDB-WEB PROJECT KNOWLEDGE BASE

**Generated:** 2025-04-11 (corrected 2026-11-14)
**Commit:** current
**Branch:** main

## OVERVIEW

CMDB (Configuration Management Database) web application. Manages configuration items, change requests, audit logs, and relation graphs for IT infrastructure.

**Stack**: React 19 + Next.js 15 (App Router) + TypeScript + Zustand 5 + Ant Design 6.x (frontend, in `cmdb-web/frontend/`) | Go 1.27 + Gin + GORM (backend, in `cmdb-web/backend-go/`). SQLite/Postgres/MySQL switchable via `DATABASE_TYPE`.

## AGENT ROUTING（omp agent 路由契约）

omp 没有「关键词 → 自动派发 agent」的路由器；派发只设 `agent`，由调用方显式选。本段是**每次自动加载 ⇒ 每次生效**的路由契约，弥补 omp 的惰性元数据缺陷。

### 编排类请求 → chief

触发条件（任一命中即委派 `.omp/agents/chief.md`）：
- 用户提到：编排 / 派活 / 拆活 / 路由 / 多域任务 / 并行推进 / 协调 / 项目经理 / orchestrate / fan-out / 复核 / 精简 / 复盘沉淀
- 任务涉及 ≥2 个互不相交的文件域（前端 + 后端 / 代码 + 文档 / 代码 + 测试）
- 任务需要切片、并行推进、独立判决

chief 是协调者，不写业务代码。chief 会：
1. 输出接管宣告（§0）
2. 切成互不相交的文件所有权切片
3. 派发 worker agent：前端切片 → `frontend-dev`；后端切片 → `backend-dev`；只读调研 → `scout-free`；独立判决 → `verifier`
4. 统一跑门禁，自行裁决

### Worker agent 职责边界

| agent | 文件 | 职责 | 只动这些路径 |
|---|---|---|---|
| `frontend-dev` | `.omp/agents/frontend-dev.md` | React/Next.js/AntD/Zustand 实现 | `cmdb-web/frontend/**` |
| `backend-dev` | `.omp/agents/backend-dev.md` | Go/Gin/GORM 实现 | `cmdb-web/backend-go/**` |
| `scout-free` | `.omp/agents/scout-free.md` | 只读调研 | 任意（只读） |
| `verifier` | `.omp/agents/verifier.md` | 独立判决 | 任意（只读） |

**契约耦合规则**：一个 response shape 变更 = 一个切片，必须同 lane 连带改前后端。详见 `.omp/agents/chief.md` §1.6.4。

---

## STRUCTURE

```
cmdb-web/
├── frontend/                 # Next.js 15 (App Router) 前端
│   ├── src/
│   │   ├── app/            # App Router 页面（路由组实际为 (app)，另有 login/）
│   │   │   ├── (app)/      # 主应用路由组
│   │   │   │   ├── ci/     # CI 管理（list/[id]/[id]/edit/[id]/relations/types/tags）
│   │   │   │   ├── relation/  # 关系图谱
│   │   │   │   ├── change/ # 变更管理
│   │   │   │   ├── dashboard/
│   │   │   │   └── system/ # audit/notification/role/user
│   │   │   ├── login/      # 登录页
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css # 单一全局样式（无 *.module.css）
│   │   └── stores/         # Zustand stores（change/ci/index/layout/permission/relation/tag/user）

│   ├── tests/e2e/          # Playwright E2E（Page Object Model）
│   ├── package.json        # 无 typecheck 脚本；lint = next lint（Next 15 已弃用）
│   ├── playwright.config.ts # baseURL 127.0.0.1:3001, channel 'chrome'
│   └── next.config.mjs     # eslint.ignoreDuringBuilds:true, typescript.ignoreBuildErrors:false
├── backend-go/             # Go REST API
│   ├── cmd/main.go         # 入口（AutoMigrate 只登记 6 模型，缺 Tag/Notification/CIType/CIVersion）
│   ├── internal/
│   │   ├── config/         # 配置（SECRET_KEY 默认弱密钥）
│   │   ├── database/       # DB 操作（SQLite/Postgres/MySQL）
│   │   ├── middleware/     # JWT 鉴权（无权限校验）
│   │   ├── models/         # GORM 模型（snake_case json tag）
│   │   ├── routes/         # Gin handlers（camelCase gin.H + snake_case 模型混用）
│   │   ├── schemas/        # 请求/响应 struct（死契约：零 handler 使用）
│   │   ├── security/       # 安全相关
│   │   ├── seed/           # 种子数据
│   │   └── utils/          # 工具（json.go 有 StringToJSON 但未被复用）
│   ├── Makefile            # test/test-fast/test-ci/test-cover/test-unit/test-integration/build
│   └── .env.example        # GIN_MODE=release（被 cmd/main.go:45 硬编码 DebugMode 覆盖）
├── backend/                # Python/FastAPI 残留（33 .py，pytest.ini，requirements.txt）
└── docs/                   # 项目文档（architecture.md 仍描述 Vue 3 + FastAPI，已失实）
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Add new page/view | `cmdb-web/frontend/src/app/(app)/` | React 19 + Ant Design 6，App Router；页面内联类型（无 `src/types/`） |
| Add new API endpoint | `cmdb-web/backend-go/internal/routes/` + `internal/schemas/` | Gin handler + Go struct；路由注册在 `router.go`（静态段必须先于 `:id`） |
| Modify CI management | `cmdb-web/frontend/src/app/(app)/ci/` + `cmdb-web/backend-go/internal/routes/ci.go` | 核心域；CI 列表/详情键名一致（camelCase） |
| Add Zustand store | `cmdb-web/frontend/src/stores/` | `create()` + `persist`；类型内联在 store 文件 |
| Mock API for dev | `cmdb-web/frontend/tests/e2e/setup/mock-routes.ts` | 拦截 `**/api/**`，按 `url.includes` 分派；mock login 返回 `permissions:['*']` |
| Add backend test | `cmdb-web/backend-go/internal/*_test.go` | Go testing + SQLite in-memory（`:memory:` 每连接独立库 ⇒ flaky） |
| Add frontend E2E test | `cmdb-web/frontend/tests/e2e/` | Playwright + Page Object Model；需本机 Google Chrome |
| Agent orchestration | `.omp/agents/chief.md` | 协调者；worker：frontend-dev / backend-dev / scout-free / verifier |

## CONVENTIONS

### Frontend (React 19 + Next.js 15)
- **Components**: Server Components by default; add `'use client'` for interactivity (25 of 27 `.tsx` files use it; all 18 `page.tsx` files use it)
- **State Management**: Zustand 5 stores with `persist` middleware; types inlined in store files (no `src/types/`)
- **Styling**: Single `globals.css` (125 lines); **no CSS Modules** (`.module.css` do not exist)
- **API**: Direct axios calls (`src/stores/user.ts`); baseURL `http://127.0.0.1:8000/api`; Bearer token via request interceptor
- **Routing**: App Router with `(app)` route group + `login/`; **not** `(auth)`/`(main)`
- **Auth**: JWT in localStorage (`cmdb-user-storage` persist); **violates** the project's own anti-pattern rule
- **Data-testid**: 248 in `src/` (22 files), 245 in `tests/` (24 files) — never change values unilaterally

### Backend (Go + Gin + GORM)
- **Routes**: Gin routers under `/api` prefix; static segments must precede `:id`
- **Schemas**: Go structs with validation tags in `internal/schemas/` — **dead contract** (zero handlers use them; all output is hand-built `gin.H`)
- **Models**: GORM models with json tags (snake_case); `TimestampMixin` provides `CreatedAt`/`UpdatedAt` (no json tag ⇒ serialized as `CreatedAt`/`UpdatedAt`)
- **Responses**: `schemas.BaseResponse{Success,Message,Data}` wrapper; Data is often `gin.H` (camelCase) or raw model (snake_case) — **two styles coexist**
- **Services**: No service layer; business logic lives in `internal/routes/*.go` handlers
- **Migrations**: `AutoMigrate` in `cmd/main.go` (only 6/10 models registered)
- **Seed**: `internal/seed/seed.go` writes ciTypes/tags at startup without error checks

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** use `as any` or `@ts-ignore` in frontend code
- **NEVER** store tokens in localStorage in production (current code does via `cmdb-user-storage` persist — D7)
- **NEVER** use `use client` unless necessary (25/27 pages currently do)
- **NEVER** mix Vue patterns with React patterns
- **NEVER** commit `dist/`, `.next/`, `playwright-report/`, `.DS_Store`, or `.omc/`
- **NEVER** change `data-testid` values without updating corresponding E2E POM and spec
- **NEVER** change Go response fields without updating frontend TS types in the same commit (§1.6)
- **NEVER** add static routes after `:id` in `router.go` (Gin will swallow them)
- **NEVER** run `npm run lint` expecting it to work (no ESLint config; `next lint` deprecated in Next 15)
- **NEVER** treat `npm run build` success as lint pass (`eslint.ignoreDuringBuilds: true`)
- **NEVER** treat mock-mode E2E green as RBAC proof (mock login returns `permissions:['*']`)
- **NEVER** treat single `go test` run as pass (flaky due to `:memory:` per-connection DB)

## COMMANDS

```bash
# Frontend development (run from cmdb-web/frontend/)
npm install --legacy-peer-deps   # node_modules is currently empty
npm run dev                      # Next.js dev server (port 3000)
npm run build                    # Production build (includes type check; ignoreBuildErrors:false)
npm run start                    # Start production server
npm run lint                     # ESLint (BROKEN: next lint deprecated, no config file)

# Frontend E2E (run from cmdb-web/)
make test-e2e-mock               # Mock mode (intercepts **/api/**)
make test-e2e-ui                 # Playwright UI mode
make test-e2e-headed             # Headed browser
make test-e2e-module -- <proj>   # Single module
make test-e2e-failed             # Only last-failed tests
make test-full                   # Full mode (needs backend on 8000)
make test-report                 # View test reports
make test-auto-fix                # Auto-fix (max 3 retries)

# Backend development (run from cmdb-web/backend-go/)
go mod download
go run cmd/main.go               # Dev server (port 8000)
go build -o cmdb-backend cmd/main.go  # Production binary
go vet ./...                     # Static analysis
go test ./...                    # Full test suite (FLAKY — rerun >=2x)
make test-unit                   # config/utils/security packages
make test-integration             # routes/database packages
make test-ci                     # failfast + race + 30s timeout
make test-cover                   # Coverage report
make test-fast                   # Fast subset
```

## NOTES

- **Auth**: JWT (HS256, 7-day expiry); secret default `cmdb-secret-key-change-in-production` (weak). Token stored in localStorage (violates own anti-pattern). Login has mock fallback (`admin/admin123` → `mock-jwt-token-*`) — backend outage still lets UI "log in"
- **State**: Zustand persist to localStorage (`cmdb-user-storage`). No `src/lib/api.ts` or `apiRequest` utility (AGENTS.md previously claimed these exist — they don't)
- **UI Library**: Ant Design 6.3.5 with ConfigProvider for theme customization
- **API Calls**: Direct axios in `src/stores/user.ts`; no shared API client module
- **Testing**: Frontend = Playwright E2E only (no unit tests). Backend = Go testing with isolated SQLite. See [测试最佳实践](docs/test-best-practices.md)
- **CI**: `.github/workflows/copilot-setup-steps.yml` is broken (`npx run build` invalid; wrong working dir; no real test workflow)
- **Data-testid**: 493 total (248 source / 245 test). Critical for E2E — never modify without test updates
- **Permissions**: 13 built-in codes (`ci:read`, `ci:write`, etc.) in `internal/routes/permission.go:12-26`. Frontend expects `ci:create` (docs/rbac-matrix.md) — naming drift. RBAC stored but never enforced server-side
- **Python residue**: `cmdb-web/backend/` has 33 `.py` files + `pytest.ini` + `requirements.txt`. Go backend is missing only `GET /api/audit/export` (from `backend/app/api/routes/audit.py:98`)
- **Relation graph**: `@antv/g6` 5.x; graph data contract in `src/components/relation/RelationGraph.tsx` + `src/stores/relation.ts`
- **Backend tests/**: `cmdb-web/backend-go/tests/` exists but contains only a stale `README.md` (documents `auth_test.go`/`ci_test.go`/`integration_test.go` that were never committed). Actual tests live in `internal/*_test.go` (18 files). The README is a live trap — do not follow its instructions

## TECHNOLOGY STACK UPGRADE (2025-04-11)

Migration from Next.js 14 + Ant Design 5 to Next.js 15 + Ant Design 6 is **in progress** (partially complete). Target versions already in `package.json`:
- Next.js: 15.5.15, Ant Design: 6.3.5, @ant-design/icons: 6.1.1, @ant-design/nextjs-registry: 1.3.0, TypeScript: 5.x, React: 19.0.5

#### React 19 Breaking Changes (handled)
1. Ref forwarding changes — automatic in many cases
2. use() hook for reading resources in render
3. Enhanced Server Components support
4. Deprecated lifecycle methods removed

#### Next.js 15 Breaking Changes (handled)
1. Turbopack default in development mode
2. Async request APIs (cookies, headers, params, searchParams)
3. Enhanced caching and fetch() behavior
4. Node.js 18.17+ required

#### Ant Design 6.x Migration (in progress)
1. New CSS-in-JS Design Tokens system
2. Updated component APIs for several components
3. Legacy/deprecated components removed
4. New theme configuration approach

### Migration Strategy (remaining work)
1. Fix AGENTS.md/STRUCTURE/COMMANDS factual drift (this commit)
2. Handle Next.js 15 async request APIs changes (ongoing)
3. Update React 19 type definitions and ref handling (ongoing)
4. Migrate Ant Design components to v6 APIs (ongoing)
5. PRESERVE all data-testid attributes (critical for E2E tests)
6. Update E2E tests to ensure mock and full mode compatibility