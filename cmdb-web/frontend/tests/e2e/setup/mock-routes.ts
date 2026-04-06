import { Page } from '@playwright/test'

/**
 * 统一的 Mock 路由管理
 * 处理所有 API 请求的 Mock 响应
 */
export const setupMockRoutes = async (page: Page) => {
  console.log('设置统一的 Mock 路由...')
  
  // 统一处理所有 API 请求
  await page.route('**/api/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()
    console.log('拦截到 API 请求:', url, method)
    
    // 处理认证请求
    if (url.includes('/api/auth/')) {
      await handleAuthRequest(route)
      return
    }
    
    // 处理 CI 请求
    if (url.includes('/api/ci')) {
      await handleCIRequest(route, method)
      return
    }
    
    // 处理变更请求
    if (url.includes('/api/changes')) {
      await handleChangeRequest(route, method)
      return
    }
    
    // 处理关系请求
    if (url.includes('/api/relation')) {
      await handleRelationRequest(route, method)
      return
    }
    
    // 处理 Dashboard 请求
    if (url.includes('/api/dashboard/')) {
      await handleDashboardRequest(route)
      return
    }
    
    // 其他请求继续
    console.log('继续处理其他请求:', url)
    await route.continue()
  })
  
  console.log('统一 Mock 路由设置完成')
}

/**
 * 处理认证请求
 */
async function handleAuthRequest(route: any) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          permissions: ['*'],
        },
      },
    }),
  })
  console.log('处理认证请求成功')
}

/**
 * 处理 CI 请求
 */
async function handleCIRequest(route: any, method: string) {
  if (method === 'POST') {
    const requestBody = JSON.parse(route.request().postData() || '{}')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'new-ci-' + Date.now(),
          ...requestBody,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
        },
      }),
    })
    console.log('处理 POST /api/ci 请求成功')
  } else if (method === 'GET') {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          items: [],
          total: 0,
        },
      }),
    })
    console.log('处理 GET /api/ci 请求成功')
  } else {
    // 其他方法的处理
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: null,
      }),
    })
    console.log('处理其他 CI 请求成功')
  }
}

/**
 * 处理变更请求
 */
async function handleChangeRequest(route: any, method: string) {
  const url = route.request().url()
  
  if (method === 'POST') {
    const requestBody = JSON.parse(route.request().postData() || '{}')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'new-change-' + Date.now(),
          ...requestBody,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      }),
    })
    console.log('处理 POST /api/changes 请求成功')
  } else if (method === 'GET') {
    // 处理变更详情请求
    if (url.includes('/api/changes/') && !url.includes('/api/changes?')) {
      const id = url.split('/api/changes/')[1]
      // 根据ID返回不同状态（用于状态流转测试）
      let status = 'pending'
      if (id === 'change-approved') status = 'approved'
      if (id === 'change-rejected') status = 'rejected'
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: id,
            title: '测试变更请求',
            ciId: 'ci-001',
            ciName: '测试服务器-01',
            changeType: 'update',
            changeTypeLabel: '更新配置',
            description: '这是一个测试变更请求的描述',
            status: status,
            statusLabel: status === 'pending' ? '待审批' : status === 'approved' ? '已批准' : '已拒绝',
            createdBy: 'admin',
            createdAt: '2024-01-01 10:00:00',
          },
        }),
      })
      console.log(`处理 GET /api/changes/${id} 请求成功`)
    } else {
      // 处理变更列表请求
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'change-001',
                title: '测试变更请求',
                ciId: 'ci-001',
                ciName: '测试服务器-01',
                changeType: 'update',
                changeTypeLabel: '更新配置',
                description: '这是一个测试变更请求的描述',
                status: 'pending',
                statusLabel: '待审批',
                createdBy: 'admin',
                createdAt: '2024-01-01 10:00:00',
              },
            ],
            total: 1,
          },
        }),
      })
      console.log('处理 GET /api/changes 请求成功')
    }
  } else {
    // 其他方法的处理
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: null,
      }),
    })
    console.log('处理其他变更请求成功')
  }
}

/**
 * 处理关系请求
 */
async function handleRelationRequest(route: any, method: string) {
  const url = route.request().url()
  
  if (method === 'GET') {
    // 处理关系图谱请求
    if (url.includes('/api/relations/graph')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            nodes: [
              { id: 'ci-001', name: '应用服务器-01', type: 'server', status: 'running', ip: '10.0.1.101' },
              { id: 'ci-002', name: 'MySQL主库', type: 'database', status: 'running', ip: '10.0.1.102' },
              { id: 'ci-003', name: '负载均衡器', type: 'loadbalancer', status: 'running', ip: '10.0.1.103' },
              { id: 'ci-004', name: '容器实例-01', type: 'container', status: 'running', ip: '10.0.1.104' },
              { id: 'ci-005', name: '物理主机-01', type: 'host', status: 'running', ip: '10.0.1.105' },
            ],
            edges: [
              { id: 'rel-001', source: 'ci-001', target: 'ci-002', relationType: 'depends_on', description: '应用服务依赖数据库' },
              { id: 'rel-002', source: 'ci-003', target: 'ci-001', relationType: 'connected_to', description: '负载均衡连接应用服务' },
              { id: 'rel-003', source: 'ci-004', target: 'ci-005', relationType: 'runs_on', description: '容器运行在主机上' },
            ],
          },
        }),
      })
      console.log('处理 GET /api/relations/graph 请求成功')
    } else if (url.includes('/api/relations/impact/')) {
      // 处理影响分析请求
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            upstream: [
              { id: 'ci-003', name: '负载均衡器', type: 'loadbalancer', status: 'running' },
            ],
            downstream: [
              { id: 'ci-002', name: 'MySQL主库', type: 'database', status: 'running' },
            ],
            directRelations: [
              {
                id: 'rel-001',
                sourceCI: 'ci-001',
                targetCI: 'ci-002',
                relationType: 'depends_on',
                description: '应用服务依赖数据库',
              },
              {
                id: 'rel-002',
                sourceCI: 'ci-003',
                targetCI: 'ci-001',
                relationType: 'connected_to',
                description: '负载均衡连接应用服务',
              },
            ],
          },
        }),
      })
      console.log('处理 GET /api/relations/impact/ 请求成功')
    } else {
      // 处理关系列表请求
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'rel-001',
              sourceCI: 'ci-001',
              targetCI: 'ci-002',
              relationType: 'depends_on',
              description: '应用服务依赖数据库',
              createdAt: '2024-01-15 08:00:00',
              updatedAt: '2024-01-15 08:00:00',
            },
            {
              id: 'rel-002',
              sourceCI: 'ci-003',
              targetCI: 'ci-001',
              relationType: 'connected_to',
              description: '负载均衡连接应用服务',
              createdAt: '2024-01-16 10:30:00',
              updatedAt: '2024-01-16 10:30:00',
            },
          ],
        }),
      })
      console.log('处理 GET /api/relations 请求成功')
    }
  } else if (method === 'POST') {
    // 处理创建关系请求
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: '关系创建成功',
        data: { id: 'rel-new-' + Date.now() },
      }),
    })
    console.log('处理 POST /api/relations 请求成功')
  } else if (method === 'DELETE') {
    // 处理删除关系请求
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: '关系删除成功',
      }),
    })
    console.log('处理 DELETE /api/relations 请求成功')
  } else {
    // 其他方法的处理
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: null,
      }),
    })
    console.log('处理其他关系请求成功')
  }
}

/**
 * 处理 Dashboard 请求
 */
async function handleDashboardRequest(route: any) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: {
        server: 128,
        database: 45,
        middleware: 32,
        container: 156,
        changePending: 7,
      },
    }),
  })
  console.log('处理 Dashboard 请求成功')
}
