'use client'

import React, { useEffect, useState } from 'react'
import { Table, Button, Input, Space, Tag, Card, Row, Col, Modal, Form, message, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTagStore, Tag as TagType } from '@/stores'

const colorOptions = [
  { value: 'red', label: '红色' },
  { value: 'orange', label: '橙色' },
  { value: 'gold', label: '金色' },
  { value: 'green', label: '绿色' },
  { value: 'cyan', label: '青色' },
  { value: 'blue', label: '蓝色' },
  { value: 'purple', label: '紫色' },
  { value: 'magenta', label: '品红' },
  { value: 'volcano', label: '火山红' },
  { value: 'lime', label: '酸橙绿' },
  { value: 'geekblue', label: '极客蓝' },
  { value: 'default', label: '默认' },
]

export default function TagManagementPage() {
  const { tagList, isLoading, fetchTags, createTag, updateTag, deleteTag } = useTagStore()
  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const filteredTags = tagList.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (tag.description && tag.description.toLowerCase().includes(searchText.toLowerCase()))
  )

  const columns: ColumnsType<TagType> = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string, record: TagType) => (
        <Tag color={record.color} data-testid={`tag-${record.id}`}>
          {name}
        </Tag>
      ),
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color: string) => <Tag color={color}>{color}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 120,
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
      render: (_: unknown, record: TagType) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            data-testid={`button-edit-tag-${record.id}`}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该标签?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              data-testid={`button-delete-tag-${record.id}`}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleCreate = () => {
    setEditingTag(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag)
    form.setFieldsValue({
      name: tag.name,
      color: tag.color,
      description: tag.description,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const success = await deleteTag(id)
    if (success) {
      message.success('标签删除成功')
    } else {
      message.error('标签删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      let success: boolean
      if (editingTag) {
        success = await updateTag(editingTag.id, values)
      } else {
        success = await createTag(values)
      }
      if (success) {
        message.success(editingTag ? '标签更新成功' : '标签创建成功')
        setIsModalOpen(false)
        form.resetFields()
      } else {
        message.error(editingTag ? '标签更新失败' : '标签创建失败')
      }
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
  }

  return (
    <div className="page-tag-management" data-testid="page-tag-management">
      <div className="page-header">
        <h1 className="page-title">标签管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} data-testid="button-create-tag">
          创建标签
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }} data-testid="card-tag-filters">
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="搜索标签名称/描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              data-testid="input-tag-search"
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchTags()} data-testid="button-refresh-tags">
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card data-testid="card-tag-table">
        <Table
          columns={columns}
          dataSource={filteredTags}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          data-testid="table-tag-list"
        />
      </Card>

      <Modal
        title={editingTag ? '编辑标签' : '创建标签'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={editingTag ? '更新' : '创建'}
        cancelText="取消"
      >
        <div data-testid="modal-tag-form">
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="name"
              label="标签名称"
              rules={[{ required: true, message: '请输入标签名称' }]}
            >
              <Input placeholder="请输入标签名称" data-testid="input-tag-name" />
            </Form.Item>
            <Form.Item name="color" label="颜色" initialValue="blue">
              <div style={{ marginTop: 8 }}>
                {colorOptions.map((color) => (
                  <Tag
                    key={color.value}
                    color={color.value}
                    style={{ cursor: 'pointer', margin: '4px 4px 4px 0' }}
                    onClick={() => form.setFieldValue('color', color.value)}
                    data-testid={`color-option-${color.value}`}
                  >
                    {color.label}
                  </Tag>
                ))}
              </div>
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={3} placeholder="请输入描述" data-testid="input-tag-description" />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  )
}
