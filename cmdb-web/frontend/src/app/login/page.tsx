'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useUserStore } from '@/stores/user'

interface LoginForm {
  username: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const { login, isLoading } = useUserStore()
  const [form] = Form.useForm()

  const handleSubmit = async (values: LoginForm) => {
    const success = await login(values.username, values.password)
    if (success) {
      message.success('登录成功')
      router.push(redirect)
    } else {
      message.error('用户名或密码错误')
    }
  }

  return (
    <div className="login-container" data-testid="page-login">
      <Card className="login-card" data-testid="card-login">
        <div className="login-header">
          <h1>CMDB 配置管理系统</h1>
          <p>运维部统一资源配置平台</p>
        </div>

        <Form
          form={form}
          name="login"
          className="login-form"
          onFinish={handleSubmit}
          autoComplete="off"
          data-testid="form-login"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
              data-testid="input-login-username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少 6 位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
              data-testid="input-login-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isLoading}
              className="login-button"
              block
              data-testid="button-login-submit"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
