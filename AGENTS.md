# CMDB-WEB PROJECT KNOWLEDGE BASE

**Generated:** 2025-04-11
**Commit:** current
**Branch:** main

## OVERVIEW

CMDB (Configuration Management Database) web application with React 19 frontend and Go backend. Manages configuration items, change requests, and audit logs for IT infrastructure.

**Stack**: React 19 + Next.js 15 (App Router) + TypeScript + Zustand + Ant Design 6.x (frontend) | Go + Gin + GORM (backend)

## STRUCTURE

```
cmdb-web/
├── src/                    # React 19 + Next.js 15 App Router
│   ├── app/              # Next.js App Router pages
│   │   ├── (auth)/       # Auth group routes
│   │   │   └── login/
│   │   ├── (main)/       # Main app group routes
│   │   │   ├── ci/
│   │   │   ├── relation/
│   │   │   ├── change/
│   │   │   ├── report/
│   │   │   └── system/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── not-found.tsx
│   ├── components/       # React components
│   │   └── layout/      # Layout components
│   ├── stores/          # Zustand state stores
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── api/              # API client modules
│   └── types/            # TypeScript type definitions
├── backend-go/           # Go REST API
│   ├── cmd/             # Command line entry point
│   ├── internal/        # Internal packages
│   │   ├── config/      # Configuration management
│   │   ├── database/    # Database operations
│   │   ├── middleware/  # Middleware
│   │   ├── models/      # Data models
│   │   ├── routes/      # API routes
│   │   ├── schemas/     # Data structures
│   │   ├── security/    # Security related
│   │   └── utils/       # Utility functions
│   └── tests/           # Test code
└── docs/                # Documentation
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new page/view | `src/app/(main)/` | Use React + Ant Design, follow App Router conventions |
| Add new API endpoint | `src/api/` + `backend-go/internal/routes/` | Follow existing patterns |
| Modify CI management | `src/app/(main)/ci/` + `backend-go/internal/routes/ci.go` | Core domain logic |
| Add Zustand store | `src/stores/` | Use create() with persist middleware |
| Add React hook | `src/hooks/` | Custom hooks for shared logic |
| Mock API for dev | API route handlers in `src/app/api/` | Next.js API routes |
| Add backend test | `backend-go/tests/` | Use Go testing with in-memory SQLite |
| Add frontend E2E test | `frontend/tests/e2e/` | Use Playwright with Page Object Model |

## CONVENTIONS

### Frontend (React 19 + Next.js 15)
- **Components**: Use React Server Components by default, add `'use client'` directive for interactivity
- **State Management**: Zustand stores with `persist` middleware for global state
- **Styling**: CSS Modules (`.module.css`) + Ant Design Design Tokens
- **API**: Next.js API routes or direct fetch with `apiRequest` utility
- **Routing**: Next.js App Router with route groups `(auth)` and `(main)` for layout sharing
- **Auth**: NextAuth.js with JWT tokens

### Backend
- **Routes**: Gin routers under `/api` prefix
- **Schemas**: Go structs with validation tags
- **Services**: Business logic in `internal/routes/`, not in handlers
- **Models**: GORM models with struct definitions and automatic migrations
- **Responses**: Use `BaseResponse` struct for consistent response format

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** use `as any` or `@ts-ignore` in frontend code
- **NEVER** store tokens in localStorage in production (use HttpOnly cookies or NextAuth.js)
- **NEVER** use `use client` directive unless necessary (prefer Server Components)
- **NEVER** mix Vue patterns with React patterns
- **NEVER** use `Base.metadata.create_all()` in production startup (use Alembic migrations)
- **NEVER** commit `dist/`, `.next/`, `playwright-report/`, `.DS_Store`, or `.omc/`

## COMMANDS

```bash
# Frontend development
cd cmdb-web
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Build for production
npm run lint             # ESLint check
npm run typecheck        # TypeScript type check

# Frontend E2E tests
make test-e2e-mock        # Run E2E tests with API mocking
make test-e2e-ui          # Run E2E tests in UI mode
make test-e2e-headed      # Run E2E tests with visible browser
make test-full            # Run full test suite
make test-report          # View test reports

# Backend development
cd cmdb-web/backend-go
go mod download
# Start dev server
go run cmd/main.go
# Run tests
go test ./...
# Build production binary
go build -o cmdb-backend cmd/main.go
```

## NOTES

- **Auth**: NextAuth.js with JWT strategy, sessions stored in HttpOnly cookies
- **State**: Zustand stores persist to localStorage via `persist` middleware
- **UI Library**: Ant Design 6.x with ConfigProvider for theme customization
- **API Calls**: Use `apiRequest` utility in `lib/api.ts` for consistent error handling
- **Testing**: Frontend uses Playwright E2E tests with Page Object Model; backend uses Go testing with isolated SQLite. See [测试最佳实践](docs/test-best-practices.md) for detailed testing guidelines including Fail-Fast mode, test isolation, and API mocking strategies.
- **CI**: Test artifacts should be gitignored; use `.gitignore` rules for generated files
- **Data-testid**: Critical for E2E testing - never modify without test updates

## TECHNOLOGY STACK UPGRADE (2025-04-11)

### Current Versions → Target Versions
- Next.js: 14.2.0 → 15.x (latest stable: 15.5.15)
- Ant Design: 5.21.0 → 6.x (latest stable: 6.3.5)
- TypeScript: 5.6.0 → 5.x (保持)
- @ant-design/icons: 5.4.0 → 6.x (latest stable: 6.1.1)
- @ant-design/nextjs-registry: 1.0.1 → 1.3.0


#### React 19 Breaking Changes
2. use() hook for reading resources in render
1. Ref forwarding changes - automatic in many cases
3. Enhanced Server Components support
4. Deprecated lifecycle methods removed

#### Next.js 15 Breaking Changes
1. Turbopack default in development mode
2. Async request APIs (cookies, headers, params, searchParams)
3. Enhanced caching and fetch() behavior
4. Node.js 18.17+ required
1. New CSS-in-JS Design Tokens system

#### Ant Design 6.x Migration
2. Updated component APIs for several components
3. Legacy/deprecated components removed
4. New theme configuration approach

### Migration Strategy
1. Update package.json dependencies to target versions
2. Handle Next.js 15 async request APIs changes
3. Update React 19 type definitions and ref handling
4. Migrate Ant Design components to v6 APIs
5. PRESERVE all data-testid attributes (critical for E2E tests)
6. Update E2E tests to ensure mock and full mode compatibility
