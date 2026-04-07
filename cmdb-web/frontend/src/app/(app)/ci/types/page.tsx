'use client'

import React, { useEffect, useState } from 'react'
import { Table, Button, Input, Space, Tag, Card, Row, Col, Modal, Form, message, Popconfirm, Switch } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, DesktopOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { api } from '@/stores/user'

interface CIType {
  id: string
  name: string
  code: string
  icon?: string
  description?: string
  attributes?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export default function CITypeManagementPage() {
  const [ciTypeList, setCiTypeList] = useState<CIType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<CIType | null>(null)
  const [form] = Form.useForm()

  const fetchCITypes = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/ci-types')
      const data = response.data.data || []
      setCiTypeList(data)
    } catch (error) {
      console.error('Failed to fetch CI types:', error)
      message.error('获取类型列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCITypes()
  }, [])

  const filteredTypes = ciTypeList.filter(
    (type) =>
      type.name.toLowerCase().includes(searchText.toLowerCase()) ||
      type.code.toLowerCase().includes(searchText.toLowerCase())
  )

  const handleCreate = () => {
    setEditingType(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (type: CIType) => {
    setEditingType(type)
    form.setFieldsValue({
      name: type.name,
      code: type.code,
      icon: type.icon,
      description: type.description,
      isActive: type.isActive,
      sortOrder: type.sortOrder,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/ci-types/${id}`)
      message.success('类型删除成功')
      fetchCITypes()
    } catch (error) {
      console.error('Failed to delete CI type:', error)
      message.error('类型删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (editingType) {
        await api.put(`/ci-types/${editingType.id}`, values)
        message.success('类型更新成功')
      } else {
        await api.post('/ci-types', values)
        message.success('类型创建成功')
      }
      setIsModalOpen(false)
      form.resetFields()
      fetchCITypes()
    } catch (error: any) {
      console.error('Failed to save CI type:', error)
      message.error(error?.response?.data?.message || (editingType ? '类型更新失败' : '类型创建失败'))
    }
  }

  const handleModalCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
  }

  const columns: ColumnsType<CIType> = [
    {
      title: '类型名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string, record: CIType) => (
        <Space>
          {record.icon && <DesktopOutlined />}
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '类型代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <Tag>{code}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
    },
    {
      title: '启用状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: CIType) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            data-testid={`button-edit-type-${record.id}`}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该类型?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              data-testid={`button-delete-type-${record.id}`}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-ci-type-management" data-testid="page-ci-type-management">
      <div className="page-header">
        <h1 className="page-title">配置项类型管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} data-testid="button-create-type">
          创建类型
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }} data-testid="card-type-filters">
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="搜索类型名称/代码"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              data-testid="input-type-search"
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchCITypes} data-testid="button-refresh-types">
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card data-testid="card-type-table">
        <Table
          columns={columns}
          dataSource={filteredTypes}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          data-testid="table-type-list"
        />
      </Card>

      <Modal
        title={editingType ? '编辑类型' : '创建类型'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={editingType ? '更新' : '创建'}
        cancelText="取消"
        data-testid="modal-type-form"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="类型名称"
            rules={[{ required: true, message: '请输入类型名称' }]}
          >
            <Input placeholder="请输入类型名称" data-testid="input-type-name" />
          </Form.Item>
          <Form.Item
            name="code"
            label="类型代码"
            rules={[{ required: true, message: '请输入类型代码' }]}
          >
            <Input placeholder="请输入类型代码" disabled={!!editingType} data-testid="input-type-code" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="请输入图标标识" data-testid="input-type-icon" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" data-testid="input-type-description" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序" initialValue={0}>
            <Input type="number" placeholder="请输入排序数字" data-testid="input-type-sort-order" />
          </Form.Item>
          <Form.Item name="isActive" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
