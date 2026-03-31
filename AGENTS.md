# CMDB-WEB PROJECT KNOWLEDGE BASE

**Generated:** 2025-03-29
**Commit:** current
**Branch:** main

## OVERVIEW

CMDB (Configuration Management Database) web application with React 19 frontend and FastAPI backend. Manages configuration items, change requests, and audit logs for IT infrastructure.

**Stack**: React 19 + Next.js 15 (App Router) + TypeScript + Zustand + Ant Design 5.x (frontend) | Python + FastAPI + SQLAlchemy (backend)

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
├── backend/              # FastAPI REST API
│   └── app/             # Routes, services, models, schemas
└── docs/                # Documentation
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new page/view | `src/app/(main)/` | Use React + Ant Design, follow App Router conventions |
| Add new API endpoint | `src/api/` + `backend/app/api/routes/` | Follow existing patterns |
| Modify CI management | `src/app/(main)/ci/` + `backend/app/api/routes/ci.py` | Core domain logic |
| Add Zustand store | `src/stores/` | Use create() with persist middleware |
| Add React hook | `src/hooks/` | Custom hooks for shared logic |
| Mock API for dev | API route handlers in `src/app/api/` | Next.js API routes |
| Add backend test | `backend/tests/` | Use pytest with in-memory SQLite |

## CONVENTIONS

### Frontend (React 19 + Next.js 15)
- **Components**: Use React Server Components by default, add `'use client'` directive for interactivity
- **State Management**: Zustand stores with `persist` middleware for global state
- **Styling**: CSS Modules (`.module.css`) + Ant Design Design Tokens
- **API**: Next.js API routes or direct fetch with `apiRequest` utility
- **Routing**: Next.js App Router with route groups `(auth)` and `(main)` for layout sharing
- **Auth**: NextAuth.js with JWT tokens

### Backend
- **Routes**: FastAPI routers under `/api` prefix
- **Schemas**: Pydantic models with `model_config = ConfigDict(from_attributes=True)`
- **Services**: Business logic in `app/services/`, not in routes
- **Models**: SQLAlchemy with `Base` class and `TimestampMixin`
- **Responses**: Use `BaseResponse` and `PaginatedResponse` schemas

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

# Backend development
cd cmdb-web/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # Start dev server
pytest --cov=app --cov-report=html  # Run tests with coverage
```

## NOTES

- **Auth**: NextAuth.js with JWT strategy, sessions stored in HttpOnly cookies
- **State**: Zustand stores persist to localStorage via `persist` middleware
- **UI Library**: Ant Design 5.x with ConfigProvider for theme customization
- **API Calls**: Use `apiRequest` utility in `lib/api.ts` for consistent error handling
- **Testing**: Frontend uses Playwright E2E tests; backend uses pytest with isolated SQLite
- **CI**: Test artifacts should be gitignored; use `.gitignore` rules for generated files
