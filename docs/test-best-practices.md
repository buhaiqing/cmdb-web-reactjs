# 自动化测试最佳实践

## 1. 概述

本文档定义了 CMDB 项目自动化测试的最佳实践和执行规则，旨在确保测试的可靠性、可维护性和有效性。所有参与自动化测试的开发人员和测试人员都应遵循本文档中的规范。

## 3. 开发规范：data-testid 强制要求

### 3.1 核心原则（强制遵守）

**所有用于E2E测试的UI元素必须添加 data-testid属性**。

这是**强制性要求**，不是可选项。任何新增或修改的前端组件，如果涉及到E2E测试覆盖**必须**在开发时添加对应的 data-testid 属性。

**违反此规范的代码不得合并到主分支**。

### 3.2 data-testid 命名规范

| 元素类型 | 命名格式 | 示例 |
|---------|---------|------|
| 页面容器 | `page-{page-name}` | `page-relation-graph` |
| 表单 | `form-{action}` | `form-ci-create`, `form-login` |
| 输入框 | `input-{field-name}` | `input-ci-name`, `input-login-username` |
| 选择器 | `select-{field-name}` | `select-ci-type`, `select-relation-type` |
| 按钮 | `button-{action}` | `button-ci-submit`, `button-login-submit` |
| 表格 | `table-{item-type}` | `table-ci-list`, `table-user-list` |
| 表格行 | `table-row-{entity}-${index}` | `table-row-user-0`, `table-row-ci-1` |
| 表格单元格 | `cell-{entity}-{field}-{id}` | `cell-user-name-123` |
| 卡片 | `card-{purpose}` | `card-filter-panel`, `card-detail` |
| 动态元素 | `{type}-{identifier}` | `relation-node-ci-001`, `ci-item-123` |
| 通用元素 | `{type}-{purpose}` | `zoom-in-button`, `search-node-input` |

### 3.3 数组/列表渲染规范（**关键**）

**必须同时提供索引和 ID 两种标识符**：

```tsx
// ✅ 正确实现
{users.map((user, index) => (
  <tr 
    key={user.id}
    data-testid={`table-row-user-${index}`}        // 索引标识
    data-user-id={user.id}                          // 数据 ID
  >
    <td data-testid={`cell-user-name-${user.id}`}>{user.name}</td>
    <td>
      <button data-testid={`button-user-edit-${user.id}`}>编辑</button>
    </td>
  </tr>
))}

// ❌ 错误实现：只有 ID，没有索引标识
{users.map((user) => (
  <tr key={user.id} data-user-id={user.id}>
    <td>{user.name}</td>
  </tr>
))}
```

### 3.4 必须添加 data-testid 的元素清单

**页面级别**：
- ✅ 页面根容器
- ✅ 主要功能区域
- ✅ 导航/面包屑

**交互元素**：
- ✅ 所有按钮（提交、取消、编辑、删除、筛选等）
- ✅ 所有输入框（文本、密码、搜索等）
- ✅ 所有选择器（下拉框、单选、多选等）
- ✅ 所有复选框和开关

**数据展示**：
- ✅ 表格（列表容器）
- ✅ 表格行（使用索引标识）
- ✅ 表格单元格（使用 ID 标识）
- ✅ 卡片（详情容器）
- ✅ 图表容器（使用 `data-testid="chart-{type}"`)
- ✅ 动态生成的列表项（使用模板：`{type}-{id}` 或 `{type}-{index}`)

**测试用例中引用的所有元素**：
- ✅ 测试中断言用到的元素
- ✅ 测试中点击/输入用到的元素
- ✅ 用于验证状态的元素

### 3.5 特殊场景处理

**Canvas/SVG 图表组件**（如 G6、ECharts等）：

由于 Canvas 是像素级渲染，无法直接在 DOM 上添加 data-testid，需要采用以下替代方案：

1. **方案 A：容器级验证**（推荐）
```tsx
// 为图表容器添加标识
<div data-testid="relation-graph" />

// 测试中验证容器存在 + 统计数据标签
await expect(page.locator('[data-testid="relation-graph"]')).toBeVisible()
const nodeTag = await page.locator('text=节点:').textContent()
expect(nodeTag).toContain('节点：5')
```

2. **方案 B：Overlay DOM 层**（需要额外实现）
```tsx
// 在 Canvas 上层添加透明的 DOM overlay
<div ref={containerRef} data-testid="relation-graph">
  <canvas /> {/* G6 渲染 */}
  <div className="overlay">
    {nodes.map((node, i) => (
      <div
        key={node.id}
        data-testid={`relation-node-${i}`}
        style={{ position: 'absolute', left: node.x, top: node.y }}
      />
    ))}
  </div>
</div>
```

3. **方案 C：ARIA 标签**（辅助功能）
```tsx
<canvas 
  aria-label="关系图谱，包含{nodes.length}个节点，{edges.length}条边"
  data-testid="relation-graph"
/>
```

### 3.6 禁止行为

| ❌ 禁止做法 | ✅ 正确做法 |
|------------|------------|
| 使用 CSS 选择器定位 | 使用 `[data-testid="xxx"]` |
| 使用 XPath 定位 | 使用 `[data-testid="xxx"]` |
| 依赖文本内容定位 | 使用 `[data-testid="xxx"]` + 文本验证 |
| 依赖 DOM 层级定位 | 使用 `[data-testid="xxx"]` |
| 开发完成后再补 data-testid | **开发时同步添加** |
| 数组渲染只有ID没有索引 | **索引和ID同时提供** |

### 3.7 Code Review检查清单

PR 合并前**必须**检查：
- [ ] 新增的交互元素是否添加了 data-testid？
- [ ] 测试用例中引用的元素是否都能通过 data-testid 定位？
- [ ] data-testid 命名是否符合规范？
- [ ] 动态生成的元素是否使用了正确的命名模式？
- [ ] 数组渲染是否同时提供了索引和ID标识符？
- [ ] Canvas/SVG图表是否有合适的替代测试方案？

**违反上述任何一项，PR 应被拒绝合并**。

### 3.8 违反后果

违反此规范将导致：
1. **测试无法编写**：测试人员无法定位元素
2. **测试脆弱**：CSS 变更会导致测试失败
3. **维护成本高**：每次 UI 调整都要修改测试
4. **PR 被拒绝**：缺少 data-testid 的 PR 不应通过 Code Review
5. **违反 Harness AI Agent Skill 强制性规则**：不符合 `harness-ai-agent` Skill 中 UI 自动化测试要求

---

## 4. 测试模式

### 2.1 Mock 模式（test-e2e-mock）
- **定义**：使用 Playwright 路由拦截模拟 API 响应
- **适用场景**：前端独立开发、快速验证 UI 交互
- **数据管理**：通过 `page.route` 拦截器返回模拟数据
- **特点**：不依赖后端服务，测试执行速度快

### 2.2 Full 模式（test-full）
- **定义**：前后端一体化测试，使用真实后端服务和数据库
- **适用场景**：集成测试、端到端验证、CI/CD 流程
- **数据管理**：测试用例负责创建和清理测试数据
- **特点**：最接近生产环境，能发现集成问题

## 3. 测试数据管理最佳实践

### 3.1 核心原则

**测试数据生命周期应由测试用例管理，而非硬编码到后端源码中。**

| 做法 | 推荐程度 | 说明 |
|------|----------|------|
| 在测试用例中创建/清理数据 | ✅ 推荐 | 测试自治，数据与测试逻辑绑定 |
| 使用 API 创建测试数据 | ✅ 推荐 | 通过真实接口创建，确保数据一致性 |
| 在 seed 中创建通用基础数据 | ⚠️ 可接受 | 仅用户、角色等基础数据 |
| 在后端源码中硬编码测试数据 | ❌ 不推荐 | 污染生产代码，难以维护 |
| 直接使用生产数据 | ❌ 禁止 | 风险极高，可能破坏生产环境 |

### 3.2 Mock 模式下的数据管理

```typescript
// 通过路由拦截提供模拟数据
test.beforeEach(async ({ page }) => {
  await page.route('**/api/changes/**', async (route) => {
    const url = route.request().url()
    
    // GET /api/changes/{id} - 返回模拟变更数据
    if (url.match(/\/changes\/[^/]+$/)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-change-001',
            title: '测试变更',
            status: 'pending',
            // ... 其他字段
          }
        })
      })
      return
    }
    
    await route.continue()
  })
})
```

**关键点**：
- 拦截器在 `test.beforeEach` 中设置，确保每个测试独立
- 模拟数据应覆盖测试场景的各种状态（pending, approved, rejected 等）
- 使用正则表达式匹配 URL，确保拦截规则准确

### 3.3 Full 模式下的数据管理

```typescript
test.describe('变更管理测试', () => {
  let createdChangeIds: string[] = []
  
  test.beforeEach(async ({ page, request }) => {
    // 登录获取 token
    const loginResponse = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' }
    })
    const { token } = await loginResponse.json()
    
    // 存储 token 供后续使用
    await page.addInitScript((authToken) => {
      localStorage.setItem('token', authToken)
    }, token)
  })
  
  test.afterEach(async ({ request }) => {
    // 清理测试数据
    for (const changeId of createdChangeIds) {
      await request.delete(`/api/changes/${changeId}`)
    }
    createdChangeIds = []
  })
  
  test('创建变更请求', async ({ page }) => {
    // 通过 UI 创建变更
    await changeRequestPage.gotoCreate()
    await changeRequestPage.fillForm({
      title: '测试变更-' + Date.now(),
      // ...
    })
    await changeRequestPage.submit()
    
    // 验证创建成功
    await changeRequestPage.expectCreateSuccess()
  })
})
```

**关键点**：
- 使用 `test.afterEach` 或 `test.afterAll` 清理测试数据
- 在 Full 模式下，数据通过真实 API 创建和删除
- 使用 `request` fixture 直接调用 API，绕过 UI 操作
- 数据清理确保测试间无干扰

### 3.4 混合模式下的数据策略

当测试用例需要在 Mock 和 Full 模式下都能运行时：

```typescript
import { isMockMode } from './setup/test-config'

test.beforeEach(async ({ page }) => {
  if (isMockMode()) {
    // Mock 模式：设置路由拦截
    await page.route('**/api/changes/**', mockChangeHandler)
  } else {
    // Full 模式：准备真实数据
    await createTestDataViaAPI()
  }
})
```

## 4. 测试配置

### 4.1 Playwright 配置
- **测试目录**：`frontend/tests/e2e/`
- **基础 URL**：`http://localhost:3001`
- **浏览器**：Chromium（默认）
- **报告格式**：HTML
- **测试超时**：默认值

### 4.2 测试命令

| 命令 | 描述 | 命令行 |
|------|------|--------|
| 运行 E2E 测试（路由拦截） | 使用 API 拦截模拟数据 | `make test-e2e-mock` |
| 运行 E2E 测试（UI 模式） | 可视化测试执行 | `make test-e2e-ui` |
| 运行 E2E 测试（有头模式） | 查看浏览器执行过程 | `make test-e2e-headed` |
| 运行完整测试 | 前后端一体化测试 | `make test-full` |
| 查看测试报告 | 启动报告服务器 | `make test-report` |

## 5. 测试文件结构

```
frontend/tests/e2e/
├── setup/          # 测试配置和工具
│   ├── test-config.ts    # 测试模式判断
│   └── auth.setup.ts     # 认证配置
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

## 6. 测试执行规则

### 6.1 Fail-Fast 模式
- **失败停止规则**：当出现 **3 个或更多** 测试失败时，测试自动停止执行
- **目的**：及时发现并修复系统性问题，避免继续执行可能会失败的测试
- **实现**：使用 `--max-failures=3` 参数

### 6.2 系统性问题处理规则（重要）

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

### 6.3 测试隔离
- 每个测试用例应独立运行，不依赖其他测试的状态
- 使用 `test.beforeEach` 进行测试前的环境准备
- 使用 `page.route` 拦截 API 请求，提供一致的测试数据

### 6.4 测试覆盖范围
- **登录功能**：登录页面加载、表单验证、登录成功跳转
- **配置项管理**：创建、编辑、删除、查看详情、搜索等操作
- **变更管理**：创建变更请求、查看详情、状态流转
- **系统管理**：用户管理、角色管理、审计日志
- **权限控制**：不同角色的访问权限测试

## 7. 批量分析修复方法论（重要）

### 7.1 核心原则

**当测试失败时，应先分析所有失败用例的共同根因，然后批量修复同类问题，而非逐个修复。**

### 7.2 分析步骤

1. **收集失败信息**
   - 运行完整测试套件获取所有失败用例
   - 记录每个失败的错误信息、堆栈、截图
   - 分类失败类型（401/403/404/500/Timeout等）

2. **识别共同模式**
   - 检查失败用例是否集中在特定模块
   - 分析错误代码是否相同（如都是401 Unauthorized）
   - 查看是否涉及相同的API端点或数据ID

3. **定位根因**
   - 对比前端请求与后端路由是否匹配
   - 检查认证流程是否完整
   - 确认测试数据在两种模式下是否一致

4. **批量修复**
   - 修复根本原因（如统一API路径）
   - 扫描所有测试文件，修复同类问题
   - 使用 AST-grep 等工具进行批量替换

### 7.3 案例分析：API路径不匹配

**问题**：变更管理测试在Full模式下全部失败（404 Not Found）

**分析过程**：
```
1. 发现所有失败用例都涉及变更详情页面
2. 后端返回404，说明请求到达但数据不存在
3. 对比发现前端拦截器使用 /api/change，后端使用 /api/changes
4. 使用 grep 扫描所有测试文件，发现多处同样问题
5. 使用 ast_grep_replace 批量替换为正确路径
```

**修复结果**：
- 修复前：3个测试因同一原因失败
- 修复后：所有测试通过
- 效率提升：批量修复 vs 逐个调试

### 7.4 推荐工具

| 场景 | 工具 | 示例 |
|------|------|------|
| 查找API路径不一致 | grep | `grep -r "/api/change" tests/` |
| 批量替换 | ast_grep_replace | `ast_grep_replace pattern="/api/change" rewrite="/api/changes"` |
| 并行分析 | explore agent | 同时分析多个测试文件 |
| 快速验证 | bash | 运行子集测试验证修复 |

### 7.5 常见批量问题模式

1. **API路径不一致**
   - 前端：/api/item，后端：/api/items
   - 解决：统一使用复数形式

2. **认证Token问题**
   - Mock token无法通过后端验证
   - 解决：后端添加mock token支持

3. **测试数据缺失**
   - Full模式下数据库为空
   - 解决：添加seed数据或动态创建

4. **选择器失效**
   - UI改版导致data-testid变更
   - 解决：批量更新选择器映射

## 8. 测试命名规范

- 测试用例使用 `test('测试描述', async ({ page }) => { ... })` 格式
- 测试描述应清晰明了，包含功能模块和测试场景
- 示例：`test('配置项创建测试 - 填写表单创建配置项', async ({ page }) => { ... })`

## 8. 测试执行流程

1. **环境准备**：使用 `test.beforeEach` 进行测试前的准备工作
2. **数据准备**：
   - Mock 模式：设置 API 拦截器
   - Full 模式：通过 API 创建测试数据
3. **页面操作**：使用页面对象模型的方法执行页面操作
4. **断言验证**：使用 `expect` 断言验证测试结果
5. **测试清理**：使用 `test.afterEach` 或 `test.afterAll` 清理测试数据

## 9. 页面对象模型 (POM)

### 9.1 命名规范
- 页面类名：`[PageName]Page`（如 `CICreatePage`）
- 文件命名：`[PageName]Page.ts`（如 `CICreatePage.ts`）

### 9.2 方法命名
- 导航方法：`goto()`
- 验证方法：`expect[Element]Visible()`
- 操作方法：`click[ButtonName]()`, `fill[Form]()`, `submit()`

### 9.3 示例

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

## 10. API 拦截策略

### 10.1 Mock 模式
- **登录请求**：返回模拟的 JWT token 和用户信息
- **数据请求**：返回结构化的模拟数据，确保测试数据的一致性
- **提交请求**：返回成功响应，模拟操作成功
- **错误处理**：可选择性地模拟错误响应，测试错误处理逻辑

### 10.2 Full 模式
- **直接使用真实 API**：不设置拦截器，请求直接发送到后端
- **认证处理**：确保前端发送正确的 Authorization Header
- **数据准备**：通过 API 直接创建测试数据

## 11. 测试报告

- **报告格式**：HTML 格式，包含测试结果、截图和错误信息
- **查看方式**：运行 `make test-report` 启动报告服务器
- **报告内容**：测试执行时间、成功/失败数量、失败原因、截图证据

## 12. 最佳实践总结

1. **系统性问题优先处理**：⚠️ 出现三个以上用例因同一原因失败时，立即停止测试，彻底修复后再执行
2. **测试数据自治**：测试用例负责自己的数据生命周期，不依赖外部数据
3. **Fail-Fast 模式**：出现 3 个以上失败时停止测试，先修复问题
4. **测试隔离**：每个测试用例独立运行，不依赖其他测试状态
5. **页面对象模型**：使用 POM 封装页面操作，提高代码复用性
6. **API 拦截**：Mock 模式下使用 `page.route` 提供一致的测试数据
7. **Full 模式数据管理**：通过 API 创建和清理测试数据
8. **详细报告**：生成 HTML 测试报告，包含截图和错误信息
9. **清晰命名**：测试用例和方法命名清晰明了，便于理解和维护
10. **全面覆盖**：测试覆盖核心功能和关键业务流程
11. **定期执行**：在 CI/CD 流程中集成测试，确保代码变更不破坏现有功能

## 13. 常见问题与解决方案

| 问题 | 解决方案 |
|------|----------|
| 测试超时 | 增加 `timeout` 参数，检查网络请求是否被正确拦截 |
| 元素定位失败 | 检查 `data-testid` 是否正确，使用更稳定的定位方式 |
| API 拦截失败 | 检查 URL 匹配规则，确保拦截路径正确 |
| 测试环境不一致 | 使用 `test.beforeEach` 确保每次测试环境一致 |
| 认证失败 (401) | 检查是否携带 Authorization Header，token 是否有效 |
| 数据不存在 (404) | 确保测试数据已正确创建，或检查路由拦截器 |
| 测试数据残留 | 使用 `test.afterEach` 清理测试数据 |
| Mock/Full 模式切换问题 | 使用 `isMockMode()` 判断，分别处理两种模式 |

## 14. 版本控制

- **文档版本**：1.2
- **更新日期**：2026-04-06
- **更新内容**：
  - 初始版本
  - 添加失败停止规则（3个以上失败时停止测试）
  - 添加系统性问题处理规则（重要）
  - **添加测试数据管理最佳实践（重要）**
    - 明确区分 Mock 模式和 Full 模式的数据管理策略
    - 强调测试数据生命周期应由测试用例管理
    - 提供代码示例说明如何在不同模式下管理数据
  - 完善测试执行流程和最佳实践

---

**注意**：本文档应随着项目的发展和测试需求的变化进行定期更新，确保测试实践与项目保持同步。