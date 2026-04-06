'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Table, Button, Input, Space, Tag, Card, Row, Col, Select } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import Link from 'next/link'
import { useCIStore, CI } from '@/stores/ci'

// 静态模拟数据
const mockData: CI[] = [
  { id: '1', name: 'DB-主库-01', type: 'database', status: 'running', ip: '10.0.1.101', project: '订单系统', environment: 'production', createdAt: '2024-01-10 10:00', updatedAt: '2024-01-15 10:00' },
  { id: '2', name: 'APP-订单服务', type: 'application', status: 'running', ip: '10.0.1.102', project: '订单系统', environment: 'production', createdAt: '2024-01-09 09:00', updatedAt: '2024-01-14 16:00' },
  { id: '3', name: 'K8S-Node-01', type: 'container', status: 'running', ip: '10.0.2.1', project: '基础设施', environment: 'production', createdAt: '2024-01-08 08:00', updatedAt: '2024-01-13 12:00' },
  { id: '4', name: 'Web-前端服务', type: 'application', status: 'stopped', ip: '10.0.1.103', project: '官网系统', environment: 'staging', createdAt: '2024-01-07 14:00', updatedAt: '2024-01-12 18:00' },
]

export default function CIListPage() {
  const { ciList, pagination, isLoading, fetchCIList } = useCIStore()
  const [searchText, setSearchText] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')

  // 静态配置使用 useMemo 缓存
  const ciTypeOptions = useMemo(() => [
    { value: 'server', label: '服务器' },
    { value: 'database', label: '数据库' },
    { value: 'middleware', label: '中间件' },
    { value: 'container', label: '容器' },
    { value: 'application', label: '应用程序' },
    { value: 'cloud', label: '云资源' },
  ], [])

  const ciStatusOptions = useMemo(() => [
    { value: 'running', label: '运行中', color: 'green' },
    { value: 'stopped', label: '已停止', color: 'red' },
    { value: 'maintenance', label: '维护中', color: 'orange' },
  ], [])

  // 表格列配置使用 useMemo 缓存
  const columns = useMemo<ColumnsType<CI>>(() => [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left' as const,
      width: 200,
      render: (name: string, record: CI) => (
        <Link href={`/ci/${record.id}`} data-testid={`link-ci-name-${record.id}`}>
          {name}
        </Link>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          server: '服务器',
          database: '数据库',
          middleware: '中间件',
          container: '容器',
          application: '应用程序',
          cloud: '云资源',
        }
        return <Tag>{typeMap[type] || type}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const option = ciStatusOptions.find((opt) => opt.value === status)
        return <Tag color={option?.color}>{option?.label || status}</Tag>
      },
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 150,
    },
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 120,
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      width: 100,
      render: (env: string) => {
        const colorMap: Record<string, string> = {
          production: 'red',
          staging: 'blue',
          development: 'green',
        }
        return <Tag color={colorMap[env] || 'default'}>{env || '-'}</Tag>
      },
    },
    {
      title: '操作系统',
      dataIndex: 'os',
      key: 'os',
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
      fixed: 'right' as const,
      width: 150,
      render: (_: unknown, record: CI) => (
        <Space>
          <Link href={`/ci/${record.id}`}>
            <Button type="link" size="small" data-testid={`button-ci-detail-${record.id}`}>
              详情
            </Button>
          </Link>
          <Link href={`/ci/${record.id}/edit`}>
            <Button type="link" size="small" data-testid={`button-ci-edit-${record.id}`}>
              编辑
            </Button>
          </Link>
        </Space>
      ),
    },
  ], [ciStatusOptions])

  // 处理函数使用 useCallback 缓存
  const handleSearch = useCallback(() => {
    fetchCIList({
      filters: {
        search: searchText,
        type: selectedType,
      },
    })
  }, [searchText, selectedType, fetchCIList])

  const handleReset = useCallback(() => {
    setSearchText('')
    setSelectedType('')
    fetchCIList()
  }, [fetchCIList])

  const handleTableChange = useCallback((paginationConfig: { current?: number; pageSize?: number }) => {
    fetchCIList({
      page: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    })
  }, [fetchCIList])

  useEffect(() => {
    fetchCIList()
  }, [fetchCIList])

  return (
    <div className="page-ci-list" data-testid="page-ci-list">
      <div className="page-header">
        <h1 className="page-title">配置项列表</h1>
        <Link href="/ci/create">
          <Button type="primary" icon={<PlusOutlined />} data-testid="button-ci-create">
            创建配置项
          </Button>
        </Link>
      </div>

      <Card style={{ marginBottom: 16 }} data-testid="card-ci-filters">
        <Row gutter={16}>
          <Col span={6}>
            <Input
              placeholder="搜索名称/IP"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              data-testid="input-ci-search"
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择类型"
              value={selectedType}
              onChange={setSelectedType}
              allowClear
              style={{ width: '100%' }}
              options={ciTypeOptions}
              data-testid="select-ci-type"
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} data-testid="button-ci-search">
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset} data-testid="button-ci-reset">
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card data-testid="card-ci-table">
        <Table
          columns={columns}
          dataSource={ciList.length > 0 ? ciList : mockData}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total || mockData.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
          data-testid="table-ci-list"
        />
      </Card>
    </div>
  )
}
