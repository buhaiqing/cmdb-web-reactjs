'use client'

import React, { useState, useEffect } from 'react'
import { Table, Card, Space, Button, Input, Select, DatePicker, Tag, Tooltip, Drawer, Descriptions, Badge } from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface AuditLog {
  id: string
  user: string
  userId: string
  action: string
  actionName: string
  resource: string
  resourceType: string
  resourceId: string
  ip: string
  userAgent: string
  createdAt: string
  status: 'success' | 'failed'
  details?: string
  oldValue?: string
  newValue?: string
}

const actionMap: Record<string, { color: string; label: string; icon: string }> = {
  create: { color: 'green', label: '创建', icon: '➕' },
  update: { color: 'blue', label: '更新', icon: '✏️' },
  delete: { color: 'red', label: '删除', icon: '🗑️' },
  login: { color: 'purple', label: '登录', icon: '🔑' },
  logout: { color: 'orange', label: '登出', icon: '🚪' },
  export: { color: 'cyan', label: '导出', icon: '📤' },
  import: { color: 'geekblue', label: '导入', icon: '📥' },
  approve: { color: 'success', label: '审批', icon: '✅' },
  reject: { color: 'error', label: '拒绝', icon: '❌' },
}

const resourceTypeMap: Record<string, string> = {
  ci: '配置项',
  change: '变更',
  user: '用户',
  role: '角色',
  permission: '权限',
  system: '系统',
}

// 生成模拟审计日志数据
const generateMockData = (): AuditLog[] => {
  const actions = Object.keys(actionMap)
  const resourceTypes = Object.keys(resourceTypeMap)
  const users = ['admin', 'operator', 'viewer', 'manager']
  const ips = ['192.168.1.100', '192.168.1.101', '10.0.0.50', '172.16.0.20']
  
  const data: AuditLog[] = []
  const now = dayjs()
  
  for (let i = 0; i < 50; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)]
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]
    const user = users[Math.floor(Math.random() * users.length)]
    const ip = ips[Math.floor(Math.random() * ips.length)]
    const status = Math.random() > 0.1 ? 'success' : 'failed'
    
    data.push({
      id: `audit-${i + 1}`,
      user,
      userId: `user-${Math.floor(Math.random() * 100)}`,
      action,
      actionName: actionMap[action]?.label || action,
      resource: `${resourceTypeMap[resourceType]}-${Math.floor(Math.random() * 1000)}`,
      resourceType: resourceTypeMap[resourceType],
      resourceId: `res-${Math.floor(Math.random() * 10000)}`,
      ip,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: now.subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm:ss'),
      status,
      details: status === 'failed' ? '操作失败：权限不足' : undefined,
      oldValue: action === 'update' ? '{"name": "旧名称"}' : undefined,
      newValue: action === 'update' ? '{"name": "新名称"}' : undefined,
    })
  }
  
  return data.sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix())
}

export default function AuditLogPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AuditLog[]>([])
  const [filteredData, setFilteredData] = useState<AuditLog[]>([])
  const [searchText, setSearchText] = useState('')
  const [actionFilter, setActionFilter] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<string>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  // 加载数据
  const loadData = () => {
    setLoading(true)
    setTimeout(() => {
      const mockData = generateMockData()
      setData(mockData)
      setFilteredData(mockData)
      setPagination(prev => ({ ...prev, total: mockData.length }))
      setLoading(false)
    }, 500)
  }

  useEffect(() => {
    loadData()
  }, [])

  // 筛选数据
  useEffect(() => {
    let result = [...data]
    
    if (searchText) {
      result = result.filter(item => 
        item.user.includes(searchText) || 
        item.resource.includes(searchText) ||
        item.ip.includes(searchText)
      )
    }
    
    if (actionFilter) {
      result = result.filter(item => item.action === actionFilter)
    }
    
    if (statusFilter) {
      result = result.filter(item => item.status === statusFilter)
    }
    
    if (dateRange) {
      result = result.filter(item => {
        const itemDate = dayjs(item.createdAt)
        return itemDate.isAfter(dateRange[0]) && itemDate.isBefore(dateRange[1])
      })
    }
    
    setFilteredData(result)
    setPagination(prev => ({ ...prev, total: result.length, current: 1 }))
  }, [searchText, actionFilter, statusFilter, dateRange, data])

  const handleViewDetail = (record: AuditLog) => {
    setSelectedLog(record)
    setDrawerVisible(true)
  }

  const handleExport = () => {
    // 导出 CSV
    const headers = ['ID', '用户', '操作', '资源类型', '资源', 'IP地址', '时间', '状态']
    const rows = filteredData.map(item => [
      item.id,
      item.user,
      item.actionName,
      item.resourceType,
      item.resource,
      item.ip,
      item.createdAt,
      item.status === 'success' ? '成功' : '失败',
    ])
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit-log-${dayjs().format('YYYY-MM-DD')}.csv`
    link.click()
  }

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text}</span>,
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      width: 100,
      render: (text: string) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => {
        const config = actionMap[action] || { color: 'default', label: action, icon: '📝' }
        return (
          <Tag color={config.color} style={{ fontSize: '13px' }}>
            <span style={{ marginRight: '4px' }}>{config.icon}</span>
            {config.label}
          </Tag>
        )
      },
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 100,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      ellipsis: true,
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>{text}</span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ color: '#666' }}>{dayjs(text).format('MM-DD HH:mm')}</span>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Badge 
          status={status === 'success' ? 'success' : 'error'} 
          text={status === 'success' ? '成功' : '失败'}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title="查看详情">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetail(record)}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <div className="page-audit-log" data-testid="page-audit-log">
      <div className="page-header">
        <h1 className="page-title">审计日志</h1>
        <Space>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
            data-testid="button-audit-export"
          >
            导出
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadData}
            loading={loading}
            data-testid="button-audit-refresh"
          >
            刷新
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }} data-testid="card-audit-filters">
        <Space wrap>
          <Input
            placeholder="搜索用户/资源/IP"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
            data-testid="input-audit-search"
          />
          <Select
            placeholder="操作类型"
            style={{ width: 120 }}
            allowClear
            value={actionFilter}
            onChange={setActionFilter}
            options={Object.entries(actionMap).map(([key, value]) => ({
              value: key,
              label: `${value.icon} ${value.label}`,
            }))}
            data-testid="select-audit-action"
          />
          <Select
            placeholder="状态"
            style={{ width: 100 }}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'success', label: '成功' },
              { value: 'failed', label: '失败' },
            ]}
            data-testid="select-audit-status"
          />
          <RangePicker 
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            data-testid="picker-audit-range" 
          />
        </Space>
      </Card>

      <Card data-testid="card-audit-table">
        <Table
          columns={columns}
          dataSource={filteredData.slice((pagination.current - 1) * pagination.pageSize, pagination.current * pagination.pageSize)}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize: pageSize || 10 }),
          }}
          data-testid="table-audit-list"
        />
      </Card>

      <Drawer
        title="审计日志详情"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedLog && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="日志ID">{selectedLog.id}</Descriptions.Item>
            <Descriptions.Item label="操作用户">{selectedLog.user}</Descriptions.Item>
            <Descriptions.Item label="用户ID">{selectedLog.userId}</Descriptions.Item>
            <Descriptions.Item label="操作类型">
              <Tag color={actionMap[selectedLog.action]?.color}>
                {actionMap[selectedLog.action]?.icon} {selectedLog.actionName}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="资源类型">{selectedLog.resourceType}</Descriptions.Item>
            <Descriptions.Item label="资源名称">{selectedLog.resource}</Descriptions.Item>
            <Descriptions.Item label="资源ID">{selectedLog.resourceId}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{selectedLog.ip}</Descriptions.Item>
            <Descriptions.Item label="用户代理">{selectedLog.userAgent}</Descriptions.Item>
            <Descriptions.Item label="操作时间">{selectedLog.createdAt}</Descriptions.Item>
            <Descriptions.Item label="操作状态">
              <Badge 
                status={selectedLog.status === 'success' ? 'success' : 'error'} 
                text={selectedLog.status === 'success' ? '成功' : '失败'}
              />
            </Descriptions.Item>
            {selectedLog.details && (
              <Descriptions.Item label="详细信息">{selectedLog.details}</Descriptions.Item>
            )}
            {selectedLog.oldValue && (
              <Descriptions.Item label="修改前">
                <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>{selectedLog.oldValue}</pre>
              </Descriptions.Item>
            )}
            {selectedLog.newValue && (
              <Descriptions.Item label="修改后">
                <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>{selectedLog.newValue}</pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}
