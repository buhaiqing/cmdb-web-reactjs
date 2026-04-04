'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, Form, Input, Select, Button, Space, Row, Col, message } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useChangeStore } from '@/stores/change'

const { TextArea } = Input

interface ChangeFormData {
  title: string
  ciId: string
  changeType: string
  description: string
}

export default function ChangeCreatePage() {
  const router = useRouter()
  const { createChange, isLoading } = useChangeStore()
  const [form] = Form.useForm()

  const handleSubmit = async (values: ChangeFormData) => {
    const success = await createChange(values)
    if (success) {
      message.success('创建成功')
      router.push('/change/list')
    } else {
      message.error('创建失败')
    }
  }

  const changeTypeOptions = [
    { value: 'create', label: '创建' },
    { value: 'update', label: '更新配置' },
    { value: 'delete', label: '删除' },
    { value: 'restart', label: '重启' },
  ]

  return (
    <div className="page-change-create" data-testid="page-change-create">
      <div className="page-header">
        <Space>
          <Link href="/change/list">
            <Button icon={<ArrowLeftOutlined />} data-testid="button-change-back">
              返回
            </Button>
          </Link>
          <h1 className="page-title">创建变更请求</h1>
        </Space>
      </div>

      <Card data-testid="card-change-form">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          data-testid="form-change-create"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="标题"
                name="title"
                rules={[{ required: true, message: '请输入变更标题' }]}
              >
                <Input placeholder="请输入变更标题" data-testid="input-change-title" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="配置项"
                name="ciId"
                rules={[{ required: true, message: '请输入配置项ID' }]}
              >
                <Input placeholder="请输入配置项ID" data-testid="input-change-ci" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="变更类型"
                name="changeType"
                rules={[{ required: true, message: '请选择变更类型' }]}
              >
                <Select placeholder="请选择变更类型" options={changeTypeOptions} data-testid="select-change-type" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="描述"
                name="description"
                rules={[{ required: true, message: '请输入变更描述' }]}
              >
                <TextArea rows={4} placeholder="请输入变更描述信息" data-testid="textarea-change-description" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isLoading} data-testid="button-change-submit">
                提交
              </Button>
              <Link href="/change/list">
                <Button data-testid="button-change-cancel">取消</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
