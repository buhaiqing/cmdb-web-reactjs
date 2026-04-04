// 测试模式配置
export const TEST_MODE = process.env.TEST_MODE || 'mock'

export const isMockMode = () => TEST_MODE === 'mock'
export const isFullMode = () => TEST_MODE === 'full'

// 根据模式决定是否拦截 API
export const shouldInterceptAPI = () => isMockMode()
