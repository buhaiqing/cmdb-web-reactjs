# CMDB-WEB PROJECT KNOWLEDGE BASE

**Generated:** 2025-03-29
**Commit:** current
**Branch:** main

## OVERVIEW

CMDB (Configuration Management Database) web application with React 19 frontend and Go backend. Manages configuration items, change requests, and audit logs for IT infrastructure.

**Stack**: React 19 + Next.js 15 (App Router) + TypeScript + Zustand + Ant Design 5.x (frontend) | Go + Gin + GORM (backend)

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

### Frontend (React 18 + Next.js 14)
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
- **UI Library**: Ant Design 5.x with ConfigProvider for theme customization
- **API Calls**: Use `apiRequest` utility in `lib/api.ts` for consistent error handling
- **Testing**: Frontend uses Playwright E2E tests with Page Object Model; backend uses Go testing with isolated SQLite. See [测试最佳实践](docs/test-best-practices.md) for detailed testing guidelines including Fail-Fast mode, test isolation, and API mocking strategies.
- **CI**: Test artifacts should be gitignored; use `.gitignore` rules for generated files
