'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Card, Segmented, Skeleton } from 'antd'
import { RiseOutlined, DesktopOutlined, DatabaseOutlined, CloudServerOutlined, ContainerOutlined } from '@ant-design/icons'
import { api } from '@/stores/user'

interface TrendPoint {
  date: string
  server: number
  database: number
  middleware: number
  container: number
  total: number
}

interface ResourceTrendProps {
  className?: string
}

export default function ResourceTrend({ className }: ResourceTrendProps) {
  const [loading, setLoading] = useState(true)
  const [trendData, setTrendData] = useState<TrendPoint[]>([])
  const [period, setPeriod] = useState<string>('7')
  const [selectedType, setSelectedType] = useState<string>('total')

  useEffect(() => {
    fetchTrendData()
  }, [period])

  const fetchTrendData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/dashboard/trend', { params: { period } })
      const data = response.data.data?.trend || generateMockData()
      setTrendData(data)
    } catch (error) {
      console.error('Failed to fetch trend data:', error)
      setTrendData(generateMockData())
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (): TrendPoint[] => {
    const days = parseInt(period)
    const data: TrendPoint[] = []
    const baseServer = 120
    const baseDatabase = 45
    const baseMiddleware = 30
    const baseContainer = 150

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const growth = Math.floor(Math.random() * 5)
      data.push({
        date: date.toISOString().split('T')[0],
        server: baseServer + growth + Math.floor(i / 3),
        database: baseDatabase + growth + Math.floor(i / 4),
        middleware: baseMiddleware + growth,
        container: baseContainer + growth + Math.floor(i / 2),
        total: baseServer + baseDatabase + baseMiddleware + baseContainer + growth * 4,
      })
    }
    return data
  }

  const maxValue = Math.max(...trendData.map((d) => d[selectedType as keyof TrendPoint] as number), 1)
  const chartHeight = 200
  const chartWidth = 100

  const typeConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    total: { color: '#1677ff', label: '总资源', icon: <RiseOutlined /> },
    server: { color: '#52c41a', label: '服务器', icon: <DesktopOutlined /> },
    database: { color: '#722ed1', label: '数据库', icon: <DatabaseOutlined /> },
    middleware: { color: '#fa8c16', label: '中间件', icon: <CloudServerOutlined /> },
    container: { color: '#eb2f96', label: '容器', icon: <ContainerOutlined /> },
  }

  const currentValue = trendData.length > 0 ? (trendData[trendData.length - 1][selectedType as keyof TrendPoint] as number) : 0
  const previousValue = trendData.length > 1 ? (trendData[trendData.length - 2][selectedType as keyof TrendPoint] as number) : 0
  const growthRate = previousValue > 0 ? ((currentValue - previousValue) / previousValue * 100).toFixed(1) : '0'

  return (
    <Card
      className={className}
      loading={loading}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>资源趋势</span>
          <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 'normal' }}>
            {growthRate}% ↑
          </span>
        </div>
      }
      extra={
        <Segmented
          size="small"
          value={period}
          onChange={(v) => setPeriod(v as string)}
          options={[
            { label: '7天', value: '7' },
            { label: '30天', value: '30' },
            { label: '90天', value: '90' },
          ]}
        />
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 'bold', color: typeConfig[selectedType].color }}>
            {currentValue}
          </span>
          <span style={{ color: '#8c8c8c', fontSize: 14 }}>
            {typeConfig[selectedType].label}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {Object.entries(typeConfig).map(([key, config]) => (
          <div
            key={key}
            onClick={() => setSelectedType(key)}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              background: selectedType === key ? `${config.color}15` : '#f5f5f5',
              color: selectedType === key ? config.color : '#8c8c8c',
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s',
            }}
          >
            {config.icon}
            <span>{config.label}</span>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', height: chartHeight }}>
        <svg width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`gradient-${selectedType}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={typeConfig[selectedType].color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={typeConfig[selectedType].color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <path
            d={`
              M ${trendData.map((d, i) => {
                const x = (i / (trendData.length - 1)) * 100
                const y = chartHeight - ((d[selectedType as keyof TrendPoint] as number) / maxValue) * (chartHeight - 20)
                return `${i === 0 ? 'M' : 'L'} ${x}% ${y}`
              }).join(' ')}
            `}
            fill="none"
            stroke={typeConfig[selectedType].color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={`
              ${trendData.map((d, i) => {
                const x = (i / (trendData.length - 1)) * 100
                const y = chartHeight - ((d[selectedType as keyof TrendPoint] as number) / maxValue) * (chartHeight - 20)
                return `${i === 0 ? 'M' : 'L'} ${x}% ${y}`
              }).join(' ')}
              L 100% ${chartHeight}
              L 0% ${chartHeight}
              Z
            `}
            fill={`url(#gradient-${selectedType})`}
          />

          {trendData.map((d, i) => {
            const x = (i / (trendData.length - 1)) * 100
            const y = chartHeight - ((d[selectedType as keyof TrendPoint] as number) / maxValue) * (chartHeight - 20)
            if (i === 0 || i === trendData.length - 1 || i === Math.floor(trendData.length / 2)) {
              return (
                <g key={i}>
                  <circle cx={`${x}%`} cy={y} r="4" fill={typeConfig[selectedType].color} />
                  <text
                    x={`${x}%`}
                    y={chartHeight + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#8c8c8c"
                  >
                    {d.date.slice(5)}
                  </text>
                </g>
              )
            }
            return null
          })}
        </svg>
      </div>
    </Card>
  )
}
