/**
 * 测试数据生成工具
 * 为测试生成唯一的测试数据，确保测试间的隔离性
 */

/**
 * 生成测试数据
 * @param prefix 数据前缀
 * @returns 生成的测试数据
 */
export const generateTestData = (prefix: string) => {
  const timestamp = Date.now()
  const randomNum = Math.floor(Math.random() * 1000)
  
  return {
    // 配置项测试数据
    ci: {
      name: `${prefix}-服务器-${timestamp}`,
      type: '服务器',
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      project: `${prefix}-项目`,
      environment: '开发环境',
      description: `${prefix}配置项描述 - ${timestamp}`
    },
    
    // 变更请求测试数据
    change: {
      title: `${prefix}-变更请求-${timestamp}`,
      ciId: `ci-${timestamp}`,
      ciName: `${prefix}-服务器-${timestamp}`,
      changeType: '更新配置',
      changeTypeLabel: '更新配置',
      description: `${prefix}变更请求描述 - ${timestamp}`,
      status: 'pending',
      statusLabel: '待审批'
    },
    
    // 关系测试数据
    relation: {
      sourceId: `ci-${timestamp}`,
      targetId: `ci-${timestamp + 1}`,
      relationType: 'uses',
      relationLabel: '使用'
    },
    
    // 用户测试数据
    user: {
      username: `${prefix}-user-${timestamp}`,
      password: 'password123',
      email: `${prefix}-user-${timestamp}@example.com`
    }
  }
}

/**
 * 生成唯一的测试 ID
 * @param prefix ID 前缀
 * @returns 唯一的测试 ID
 */
export const generateTestId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

/**
 * 生成随机 IP 地址
 * @returns 随机 IP 地址
 */
export const generateRandomIp = (): string => {
  return `192.168.1.${Math.floor(Math.random() * 255)}`
}

/**
 * 生成随机项目名称
 * @param prefix 前缀
 * @returns 随机项目名称
 */
export const generateProjectName = (prefix: string): string => {
  return `${prefix}-项目-${Math.floor(Math.random() * 1000)}`
}

/**
 * 生成随机环境名称
 * @returns 随机环境名称
 */
export const generateEnvironment = (): string => {
  const environments = ['开发环境', '测试环境', '预发布环境', '生产环境']
  return environments[Math.floor(Math.random() * environments.length)]
}

/**
 * 生成随机配置项类型
 * @returns 随机配置项类型
 */
export const generateCIType = (): string => {
  const types = ['服务器', '数据库', '中间件', '容器', '应用程序', '云资源']
  return types[Math.floor(Math.random() * types.length)]
}

/**
 * 生成随机变更类型
 * @returns 随机变更类型
 */
export const generateChangeType = (): string => {
  const types = ['更新配置', '重启服务', '扩缩容', '版本升级', '安全补丁']
  return types[Math.floor(Math.random() * types.length)]
}
