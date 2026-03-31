'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Form, Input, Select, Button, Space, Row, Col, message } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useCIStore } from '@/stores/ci'

const { TextArea } = Input

interface CIFormData {
  name: string
  type: string
  ip?: string
  cpu?: string
  memory?: string
  disk?: string
  os?: string
  project?: string
  environment?: string
  description?: string
}

export default function CICreatePage() {
  const router = useRouter()
  const { createCI, isLoading } = useCIStore()
  const [form] = Form.useForm()

  const handleSubmit = async (values: CIFormData) => {
    const success = await createCI(values)
    if (success) {
      message.success('创建成功')
      router.push('/ci/list')
    } else {
      message.error('创建失败')
    }
  }

  const ciTypeOptions = [
    { value: 'server', label: '服务器' },
    { value: 'database', label: '数据库' },
    { value: 'middleware', label: '中间件' },
    { value: 'container', label: '容器' },
    { value: 'application', label: '应用程序' },
    { value: 'cloud', label: '云资源' },
  ]

  const environmentOptions = [
    { value: 'production', label: '生产环境' },
    { value: 'staging', label: '预发布环境' },
    { value: 'development', label: '开发环境' },
  ]

  return (
    <div className="page-ci-create" data-testid="page-ci-create">
      <div className="page-header">
        <Space>
          <Link href="/ci/list">
            <Button icon={<ArrowLeftOutlined />} data-testid="button-ci-back">
              返回
            </Button>
          </Link>
          <h1 className="page-title">创建配置项</h1>
        </Space>
      </div>

      <Card data-testid="card-ci-form">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          data-testid="form-ci-create"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="名称"
                name="name"
                rules={[{ required: true, message: '请输入配置项名称' }]}
              >
                <Input placeholder="请输入配置项名称" data-testid="input-ci-name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="类型"
                name="type"
                rules={[{ required: true, message: '请选择配置项类型' }]}
              >
                <Select placeholder="请选择类型" options={ciTypeOptions} data-testid="select-ci-type" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="IP地址" name="ip">
                <Input placeholder="如: 10.0.1.101" data-testid="input-ci-ip" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="操作系统" name="os">
                <Input placeholder="如: CentOS 7.9" data-testid="input-ci-os" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="CPU" name="cpu">
                <Input placeholder="如: 16核" data-testid="input-ci-cpu" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="内存" name="memory">
                <Input placeholder="如: 64GB" data-testid="input-ci-memory" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="磁盘" name="disk">
                <Input placeholder="如: 500GB SSD" data-testid="input-ci-disk" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="项目" name="project">
                <Input placeholder="所属项目" data-testid="input-ci-project" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="环境" name="environment">
                <Select placeholder="请选择环境" options={environmentOptions} data-testid="select-ci-environment" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="描述" name="description">
                <TextArea rows={4} placeholder="请输入描述信息" data-testid="textarea-ci-description" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isLoading} data-testid="button-ci-submit">
                保存
              </Button>
              <Link href="/ci/list">
                <Button data-testid="button-ci-cancel">取消</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
