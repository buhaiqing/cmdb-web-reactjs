import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
    // 使用系统已安装的 Chrome 浏览器
    channel: 'chrome',
  },
  projects: [
    // Setup project - 执行登录并保存 storage state
    {
     name: 'setup',
     testMatch: '**/setup/auth.setup.ts',
      use: { ...devices['Desktop Chrome'] },
   },
   // 登录页面测试（不需要 setup，独立运行）
   {
     name: 'login',
     testMatch: '**/login.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    // 其他项目依赖 setup，复用登录状态
    {
      name: 'ci-management',
      testMatch: '**/ci-*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'ci-type-management',
      testMatch: '**/ci-type-management.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'tag-management',
      testMatch: '**/tag-management.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'notification',
      testMatch: '**/notification.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'change-management',
      testMatch: '**/change-management.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'relation-management',
      testMatch: '**/relation-management.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'app-main',
      testMatch: '**/app.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3001,
    reuseExistingServer: true,
    timeout: 120000,
  },
})
