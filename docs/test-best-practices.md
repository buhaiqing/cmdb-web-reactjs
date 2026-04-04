# 自动化测试最佳实践

## 1. 概述

本文档定义了 CMDB 项目自动化测试的最佳实践和执行规则，旨在确保测试的可靠性、可维护性和有效性。所有参与自动化测试的开发人员和测试人员都应遵循本文档中的规范。

## 2. 测试配置

### 2.1 Playwright 配置
- **测试目录**：`frontend/tests/e2e/`
- **基础 URL**：`http://localhost:3001`
- **浏览器**：Chromium（默认）
- **报告格式**：HTML
- **测试超时**：默认值

### 2.2 测试命令

| 命令 | 描述 | 命令行 |
|------|------|--------|
| 运行 E2E 测试（路由拦截） | 使用 API 拦截模拟数据 | `make test-e2e-mock` |
| 运行 E2E 测试（UI 模式） | 可视化测试执行 | `make test-e2e-ui` |
| 运行 E2E 测试（有头模式） | 查看浏览器执行过程 | `make test-e2e-headed` |
| 运行完整测试 | 前后端一体化测试 | `make test-full` |
| 查看测试报告 | 启动报告服务器 | `make test-report` |

## 3. 测试文件结构

```
frontend/tests/e2e/
├── pages/          # 页面对象模型（POM）
│   ├── AppLayout.ts
│   ├── CICreatePage.ts
│   ├── CIDetailPage.ts
│   ├── CIEditPage.ts
│   ├── CIListPage.ts
│   ├── ChangeRequestPage.ts
│   ├── DashboardPage.ts
│   ├── LoginPage.ts
│   └── SystemPages.ts
├── app.spec.ts             # 应用核心功能测试
├── change-management.spec.ts  # 变更管理测试
├── ci-create.spec.ts       # 配置项创建测试
├── ci-delete.spec.ts       # 配置项删除测试
├── ci-detail.spec.ts       # 配置项详情测试
├── ci-edit.spec.ts         # 配置项编辑测试
├── login.spec.ts           # 登录功能测试
└── permission-control.spec.ts  # 权限控制测试
```

## 4. 测试执行规则

### 4.1 Fail-Fast 模式
- **失败停止规则**：当出现 **3 个或更多** 测试失败时，测试自动停止执行
- **目的**：及时发现并修复系统性问题，避免继续执行可能会失败的测试
- **实现**：使用 `--max-failures=3` 参数

### 4.2 系统性问题处理规则（重要）

**⚠️ 重要规则**：如果出现 **三个或以上的测试用例因同一原因导致测试失败**，必须立即停止后续测试执行，优先彻底修复此问题后再继续执行测试。

**执行步骤**：
1. **立即停止**：一旦发现多个测试因同一原因失败，立即停止测试执行
2. **问题定位**：分析失败原因，确定是环境问题、代码缺陷还是测试用例本身的问题
3. **彻底修复**：修复根本问题，确保问题彻底解决
4. **重新执行**：修复完成后，重新执行所有测试，验证问题是否已解决

**目的**：
- 避免浪费时间和资源执行大量注定失败的测试
- 强制优先解决系统性问题，提高测试效率
- 确保测试环境的稳定性和可靠性

### 4.3 测试隔离
- 每个测试用例应独立运行，不依赖其他测试的状态
- 使用 `test.beforeEach` 进行测试前的环境准备
- 使用 `page.route` 拦截 API 请求，提供一致的测试数据

### 4.3 测试覆盖范围
- **登录功能**：登录页面加载、表单验证、登录成功跳转
- **配置项管理**：创建、编辑、删除、查看详情、搜索等操作
- **变更管理**：创建变更请求、查看详情、状态流转
- **系统管理**：用户管理、角色管理、审计日志
- **权限控制**：不同角色的访问权限测试

## 5. 测试命名规范

- 测试用例使用 `test('测试描述', async ({ page }) => { ... })` 格式
- 测试描述应清晰明了，包含功能模块和测试场景
- 示例：`test('配置项创建测试 - 填写表单创建配置项', async ({ page }) => { ... })`

## 6. 测试执行流程

1. **环境准备**：使用 `test.beforeEach` 进行测试前的准备工作
2. **API 拦截**：使用 `page.route` 拦截 API 请求，返回模拟数据
3. **页面操作**：使用页面对象模型的方法执行页面操作
4. **断言验证**：使用 `expect` 断言验证测试结果
5. **测试清理**：测试完成后自动清理环境

## 7. 页面对象模型 (POM)

### 7.1 命名规范
- 页面类名：`[PageName]Page`（如 `CICreatePage`）
- 文件命名：`[PageName]Page.ts`（如 `CICreatePage.ts`）

### 7.2 方法命名
- 导航方法：`goto()`
- 验证方法：`expect[Element]Visible()`
- 操作方法：`click[ButtonName]()`, `fill[Form]()`, `submit()`

### 7.3 示例

```typescript
class CICreatePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/ci/create')
  }

  async expectFormVisible() {
    await expect(this.page.locator('[data-testid="form-ci-create"]')).toBeVisible()
  }

  async fillForm(data: { name: string; type: string; ip?: string }) {
    await this.page.fill('[data-testid="input-ci-name"]', data.name)
    await this.page.click('[data-testid="select-ci-type"]')
    await this.page.click(`text=${data.type}`)
    if (data.ip) {
      await this.page.fill('[data-testid="input-ci-ip"]', data.ip)
    }
  }

  async submit() {
    await this.page.click('[data-testid="button-ci-submit"]')
  }

  async expectCreateSuccess() {
    await this.page.waitForURL((url: URL) => url.pathname.includes('/ci/list'), { timeout: 10000 })
  }
}
```

## 8. API 拦截策略

- **登录请求**：返回模拟的 JWT token 和用户信息
- **数据请求**：返回结构化的模拟数据，确保测试数据的一致性
- **提交请求**：返回成功响应，模拟操作成功
- **错误处理**：可选择性地模拟错误响应，测试错误处理逻辑

## 9. 测试报告

- **报告格式**：HTML 格式，包含测试结果、截图和错误信息
- **查看方式**：运行 `make test-report` 启动报告服务器
- **报告内容**：测试执行时间、成功/失败数量、失败原因、截图证据

## 10. 最佳实践总结

1. **系统性问题优先处理**：⚠️ 出现三个以上用例因同一原因失败时，立即停止测试，彻底修复后再执行
2. **Fail-Fast 模式**：出现 3 个以上失败时停止测试，先修复问题
3. **测试隔离**：每个测试用例独立运行，不依赖其他测试状态
4. **页面对象模型**：使用 POM 封装页面操作，提高代码复用性
5. **API 拦截**：使用 `page.route` 提供一致的测试数据
6. **详细报告**：生成 HTML 测试报告，包含截图和错误信息
7. **清晰命名**：测试用例和方法命名清晰明了，便于理解和维护
8. **全面覆盖**：测试覆盖核心功能和关键业务流程
9. **定期执行**：在 CI/CD 流程中集成测试，确保代码变更不破坏现有功能

## 11. 常见问题与解决方案

| 问题 | 解决方案 |
|------|----------|
| 测试超时 | 增加 `timeout` 参数，检查网络请求是否被正确拦截 |
| 元素定位失败 | 检查 `data-testid` 是否正确，使用更稳定的定位方式 |
| API 拦截失败 | 检查 URL 匹配规则，确保拦截路径正确 |
| 测试环境不一致 | 使用 `test.beforeEach` 确保每次测试环境一致 |

## 12. 版本控制

- **文档版本**：1.1
- **更新日期**：2026-04-04
- **更新内容**：
  - 初始版本
  - 添加失败停止规则（3个以上失败时停止测试）
  - **添加系统性问题处理规则（重要）**：三个以上用例因同一原因失败时必须停止并彻底修复
  - 完善测试执行流程和最佳实践

---

**注意**：本文档应随着项目的发展和测试需求的变化进行定期更新，确保测试实践与项目保持同步。