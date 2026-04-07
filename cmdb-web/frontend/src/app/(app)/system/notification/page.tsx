'use client'

import React, { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, Card, Row, Col, Modal, message, Popconfirm, Badge, Tabs, Empty } from 'antd'
import { BellOutlined, CheckCircleOutlined, DeleteOutlined, ReloadOutlined, MailOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { api } from '@/stores/user'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  content: string
  relatedId?: string
  relatedType?: string
  isRead: boolean
  readAt?: string
  createdAt: string
}

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const params: Record<string, string> = {}
      if (activeTab === 'unread') {
        params.is_read = 'false'
      }
      const response = await api.get('/notifications', { params })
      const data = response.data.data?.items || []
      setNotifications(data)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      message.error('获取通知列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count')
      setUnreadCount(response.data.data?.unread_count || 0)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [activeTab])

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`)
      message.success('标记已读成功')
      fetchNotifications()
      fetchUnreadCount()
    } catch (error) {
      console.error('Failed to mark as read:', error)
      message.error('标记已读失败')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all')
      message.success('全部已标记为已读')
      fetchNotifications()
      fetchUnreadCount()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      message.error('标记全部已读失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`)
      message.success('通知删除成功')
      fetchNotifications()
      fetchUnreadCount()
    } catch (error) {
      console.error('Failed to delete notification:', error)
      message.error('通知删除失败')
    }
  }

  const showDetail = (notification: Notification) => {
    setSelectedNotification(notification)
    setIsDetailModalOpen(true)
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }
  }

  const getNotificationTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; label: string }> = {
      change_approved: { color: 'green', label: '变更已批准' },
      change_rejected: { color: 'red', label: '变更已拒绝' },
      change_pending: { color: 'orange', label: '待审批变更' },
      ci_updated: { color: 'blue', label: '配置项更新' },
      ci_created: { color: 'cyan', label: '配置项创建' },
      ci_deleted: { color: 'red', label: '配置项删除' },
      system: { color: 'purple', label: '系统通知' },
    }
    const config = typeMap[type] || { color: 'default', label: type }
    return <Tag color={config.color}>{config.label}</Tag>
  }

  const columns: ColumnsType<Notification> = [
    {
      title: '状态',
      key: 'isRead',
      width: 80,
      render: (_: unknown, record: Notification) => (
        <Badge status={record.isRead ? 'default' : 'error'} dot={!record.isRead}>
          {record.isRead ? '已读' : '未读'}
        </Badge>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => getNotificationTypeTag(type),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Notification) => (
        <a onClick={() => showDetail(record)} style={{ fontWeight: record.isRead ? 'normal' : 'bold' }}>
          {title}
        </a>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Notification) => (
        <Space>
          {!record.isRead && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleMarkAsRead(record.id)}>
              标记已读
            </Button>
          )}
          <Popconfirm title="确定删除该通知?" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-notification" data-testid="page-notification">
      <div className="page-header">
        <h1 className="page-title">
          <BellOutlined /> 通知中心
          {unreadCount > 0 && <Badge count={unreadCount} style={{ marginLeft: 8 }} />}
        </h1>
        <Space>
          <Button icon={<CheckCircleOutlined />} onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            全部已读
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchNotifications}>
            刷新
          </Button>
        </Space>
      </div>

      <Card data-testid="card-notification-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: (
                <span>
                  <MailOutlined /> 全部通知
                </span>
              ),
            },
            {
              key: 'unread',
              label: (
                <span>
                  <Badge count={unreadCount} offset={[10, 0]}>未读通知</Badge>
                </span>
              ),
            },
          ]}
        />

        {notifications.length === 0 && !isLoading ? (
          <Empty description="暂无通知" style={{ margin: '40px 0' }} />
        ) : (
          <Table
            columns={columns}
            dataSource={notifications}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            data-testid="table-notification-list"
          />
        )}
      </Card>

      <Modal
        title={selectedNotification?.title}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
        data-testid="modal-notification-detail"
      >
        {selectedNotification && (
          <div style={{ marginTop: 16 }}>
            <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <strong>类型：</strong>
                {getNotificationTypeTag(selectedNotification.type)}
              </Col>
              <Col span={12}>
                <strong>时间：</strong>
                {selectedNotification.createdAt}
              </Col>
            </Row>
            <div style={{ marginBottom: 16 }}>
              <strong>内容：</strong>
              <p style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                {selectedNotification.content}
              </p>
            </div>
            {selectedNotification.relatedId && (
              <div>
                <strong>关联ID：</strong>
                <span>{selectedNotification.relatedId}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
