import { APIRequestContext } from '@playwright/test'

const API_BASE_URL = 'http://127.0.0.1:8000'

/**
 * 通过 API 登录并获取 token
 */
export async function apiLogin(request: APIRequestContext): Promise<string> {
  const loginResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
    headers: { 'Content-Type': 'application/json' },
    data: { username: 'admin', password: 'admin123' },
  })

  if (!loginResponse.ok()) {
    throw new Error(`API 登录失败: ${loginResponse.status()}`)
  }

  const loginData = await loginResponse.json()
  return loginData.data.token
}

/**
 * 通过 API 创建 CI 并返回 ID
 */
export async function apiCreateCI(
  request: APIRequestContext,
  token: string,
  name: string,
  options?: { type?: string; ip?: string; project?: string; environment?: string }
): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/api/ci`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    data: {
      name,
      type: options?.type || 'server',
      ip: options?.ip || '10.0.1.100',
      project: options?.project || '测试项目',
      environment: options?.environment || 'production',
    },
  })

  if (!response.ok()) {
    throw new Error(`创建 CI 失败: ${response.status()}`)
  }

  const data = await response.json()
  return data.data.id
}

/**
 * 通过 API 删除 CI
 */
export async function apiDeleteCI(
  request: APIRequestContext,
  token: string,
  ciId: string
): Promise<void> {
  await request.delete(`${API_BASE_URL}/api/ci/${ciId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
}