'use client'

import React, { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, Descriptions, Tag, Button, Space, Spin, message } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useChangeStore } from '@/stores/change'

export default function ChangeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const changeId = params.id as string
  const { currentChange, isLoading, fetchChangeDetail, approveChange, rejectChange } = useChangeStore()

  useEffect(() => {
    if (changeId) {
      fetchChangeDetail(changeId)
    }
  }, [changeId, fetchChangeDetail])

  const handleApprove = async () => {
    const success = await approveChange(changeId)
    if (success) {
      message.success('变更已批准')
    } else {
      message.error('操作失败')
    }
  }

  const handleReject = async () => {
    const success = await rejectChange(changeId)
    if (success) {
      message.success('变更已拒绝')
    } else {
      message.error('操作失败')
    }
  }

  const changeTypeOptions: Record<string, string> = {
    create: '创建',
    update: '更新配置',
    delete: '删除',
    restart: '重启',
  }

  const statusOptions: Record<string, { color: string; label: string }> = {
    pending: { color: 'orange', label: '待审批' },
    approved: { color: 'blue', label: '已批准' },
    rejected: { color: 'red', label: '已拒绝' },
    completed: { color: 'green', label: '已完成' },
  }

  const change = currentChange

  if (!change) {
    return (
      <div className="page-change-detail" data-testid="page-change-detail">
        <div className="page-header">
          <Space>
            <Link href="/change/list">
              <Button icon={<ArrowLeftOutlined />} data-testid="button-change-back">
                返回
              </Button>
            </Link>
            <h1 className="page-title">变更详情</h1>
          </Space>
        </div>
        <Spin spinning={isLoading} tip="加载中...">
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              加载变更信息...
            </div>
          </Card>
        </Spin>
      </div>
    )
  }

  const statusInfo = statusOptions[change.status] || { color: 'default', label: change.status }

  return (
    <div className="page-change-detail" data-testid="page-change-detail">
      <div className="page-header">
        <Space>
          <Link href="/change/list">
            <Button icon={<ArrowLeftOutlined />} data-testid="button-change-back">
              返回
            </Button>
          </Link>
          <h1 className="page-title">变更详情</h1>
        </Space>
        {change.status === 'pending' && (
          <Space>
            <Button type="primary" icon={<CheckOutlined />} onClick={handleApprove} data-testid="button-change-approve">
              批准
            </Button>
            <Button danger icon={<CloseOutlined />} onClick={handleReject} data-testid="button-change-reject">
              拒绝
            </Button>
          </Space>
        )}
      </div>

      <Spin spinning={isLoading}>
        <Card data-testid="card-change-detail">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="标题">
              <span data-testid="change-detail-title">{change.title}</span>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <span data-testid="change-detail-status">
                <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="配置项">
              <span data-testid="change-detail-ci">{change.ciName || change.ciId}</span>
            </Descriptions.Item>
            <Descriptions.Item label="变更类型">
              <span data-testid="change-detail-type">{changeTypeOptions[change.changeType] || change.changeType}</span>
            </Descriptions.Item>
            <Descriptions.Item label="申请人">
              <span data-testid="change-detail-creator">{change.createdBy || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="申请时间">
              <span data-testid="change-detail-created-at">{change.createdAt}</span>
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 16 }}>
            <Card title="变更描述" size="small" data-testid="card-change-description">
              <div data-testid="change-detail-description">
                {change.description || '无描述'}
              </div>
            </Card>
          </div>
        </Card>
      </Spin>
    </div>
  )
}
