# CMDB Web

CMDB 配置管理数据库 Web 应用，基于 React + Next.js + Go 构建。

## 技术栈

### 前端
- **前端框架**: React 18 + Next.js 14 (App Router)
- **UI 组件库**: Ant Design 5.x
- **状态管理**: Zustand
- **语言**: TypeScript
- **测试**: Playwright E2E

### 后端
- **框架**: Gin
- **语言**: Go 1.22+
- **ORM**: GORM (SQLite)
- **数据验证**: 内置验证
- **测试**: Go testing

## 快速开始

### 安装依赖

```bash
cd cmdb-web/frontend
npm install --legacy-peer-deps
```

### 启动开发服务器

```bash
npm run dev
```

- **前端应用地址**: http://localhost:3000
- **登录账号**: admin / admin123

### 构建生产版本

```bash
npm run build
```

## E2E 测试

### 运行测试

```bash
npm run test:e2e
```

### 查看测试报告

```bash
npx playwright show-report
```

### 使用 Makefile

在 `cmdb-web/` 目录下:

```bash
# 启动开发服务器
make dev

# 运行 E2E 测试
make test:e2e

# 查看测试报告
make test:report

# 清理端口
make kill-ports
```

## 项目结构

```
cmdb-web/
├── frontend/              # React 前端
│   ├── src/
│   │   ├── app/               # Next.js App Router 页面
│   │   │   ├── (app)/        # 应用页面
│   │   │   │   ├── dashboard/
│   │   │   │   ├── ci/
│   │   │   │   ├── change/
│   │   │   │   ├── relation/
│   │   │   │   └── system/
│   │   │   └── login/        # 登录页面
│   │   ├── components/       # React 组件
│   │   │   └── layout/       # 布局组件
│   │   ├── stores/           # Zustand 状态管理
│   │   └── types/            # TypeScript 类型定义
│   ├── tests/
│   │   └── e2e/              # E2E 测试
│   └── playwright.config.ts  # Playwright 配置
│
└── backend-go/           # Go 后端
    ├── cmd/             # 命令行入口
    ├── internal/        # 内部包
    │   ├── config/      # 配置管理
    │   ├── database/    # 数据库操作
    │   ├── middleware/  # 中间件
    │   ├── models/      # 数据模型
    │   ├── routes/      # API 路由
    │   ├── schemas/     # 数据结构
    │   ├── security/    # 安全相关
    │   └── utils/       # 工具函数
    └── tests/           # 测试代码
```

## 功能模块

- **仪表盘**: 统计概览
- **配置项管理 (CI)**: 配置项的增删改查
- **关系管理**: 配置项关系图谱
- **变更管理**: 变更申请与审批
- **系统管理**: 用户、角色、审计日志

## 开发说明

### 前端开发
- 使用模拟登录，无需后端即可演示
- 登录账号: admin / admin123
- 前端会自动拦截 API 请求并返回模拟数据

### 后端开发
- Go 后端使用 Gin 框架 + GORM ORM
- 默认使用 SQLite 数据库
- 支持多种数据库（SQLite、MySQL、PostgreSQL）
- 登录账号: admin / admin123
