'use client'

import React, { useEffect, useState } from 'react'
import { Card, Timeline, Tag, Skeleton, Empty } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { api } from '@/stores/user'

interface Activity {
  id: string
  action: string
  resourceType: string
  resourceName: string
  username: string
  createdAt: string
  changeDesc?: string
}

interface ActivityFeedProps {
  className?: string
}

const actionConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  create: { color: '#52c41a', icon: <PlusOutlined />, label: '创建' },
  update: { color: '#1677ff', icon: <EditOutlined />, label: '更新' },
  delete: { color: '#ff4d4f', icon: <DeleteOutlined />, label: '删除' },
  approve: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '批准' },
  reject: { color: '#ff4d4f', icon: <CloseCircleOutlined />, label: '拒绝' },
  rollback: { color: '#fa8c16', icon: <SyncOutlined />, label: '回滚' },
  batch_delete: { color: '#ff4d4f', icon: <DeleteOutlined />, label: '批量删除' },
  batch_update: { color: '#1677ff', icon: <EditOutlined />, label: '批量更新' },
}

export default function ActivityFeed({ className }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const response = await api.get('/audit', { params: { pageSize: 10 } })
      const items = response.data.data?.items || []
      if (items.length === 0) {
        setActivities(generateMockActivities())
      } else {
        setActivities(items.slice(0, 10))
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
      setActivities(generateMockActivities())
    } finally {
      setLoading(false)
    }
  }

  const generateMockActivities = (): Activity[] => {
    const actions = ['create', 'update', 'delete', 'approve', 'reject']
    const resources = [
      { type: 'ci', name: 'DB-主库-01' },
      { type: 'ci', name: 'APP-订单服务' },
      { type: 'change', name: '更新服务器配置' },
      { type: 'ci', name: 'K8S-集群-01' },
      { type: 'change', name: '扩缩容变更' },
    ]
    const users = ['admin', 'operator', 'reviewer']
    const now = new Date()

    return Array.from({ length: 8 }, (_, i) => {
      const action = actions[Math.floor(Math.random() * actions.length)]
      const resource = resources[Math.floor(Math.random() * resources.length)]
      const time = new Date(now.getTime() - i * 3600000)

      return {
        id: `activity-${i}`,
        action,
        resourceType: resource.type,
        resourceName: resource.name,
        username: users[Math.floor(Math.random() * users.length)],
        createdAt: time.toISOString(),
        changeDesc: actionConfig[action]?.label + ' ' + resource.type,
      }
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)

    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const getResourceTag = (type: string) => {
    const colorMap: Record<string, string> = {
      ci: 'blue',
      change: 'purple',
      user: 'cyan',
      role: 'orange',
    }
    return <Tag color={colorMap[type] || 'default'}>{type === 'ci' ? '配置项' : '变更'}</Tag>
  }

  return (
    <Card
      className={className}
      loading={loading}
      title="最近活动"
      extra={<a onClick={() => window.location.href = '/system/audit'}>查看全部</a>}
    >
      {activities.length === 0 ? (
        <Empty description="暂无活动记录" />
      ) : (
        <Timeline
          items={activities.map((activity, index) => {
            const config = actionConfig[activity.action] || {
              color: '#8c8c8c',
              icon: <EditOutlined />,
              label: activity.action,
            }

            return {
              key: activity.id,
              color: config.color,
              dot: config.icon,
              children: (
                <div
                  style={{
                    padding: '8px 12px',
                    background: index === 0 ? '#f0f5ff' : '#fafafa',
                    borderRadius: 8,
                    marginBottom: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{activity.username}</span>
                    <span style={{ color: config.color, fontWeight: 500 }}>{config.label}</span>
                    {getResourceTag(activity.resourceType)}
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>{formatTime(activity.createdAt)}</span>
                  </div>
                  <div style={{ color: '#262626', fontSize: 13 }}>
                    {activity.resourceName}
                  </div>
                  {activity.changeDesc && (
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                      {activity.changeDesc}
                    </div>
                  )}
                </div>
              ),
            }
          })}
        />
      )}
    </Card>
  )
}
