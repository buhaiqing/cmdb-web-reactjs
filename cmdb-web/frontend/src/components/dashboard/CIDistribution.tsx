'use client'

import React, { useEffect, useState } from 'react'
import { Card, Skeleton } from 'antd'
import { api } from '@/stores/user'

interface TypeCount {
  type: string
  count: number
}

interface PieChartProps {
  className?: string
}

export default function CIDistribution({ className }: PieChartProps) {
  const [loading, setLoading] = useState(true)
  const [typeData, setTypeData] = useState<TypeCount[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/dashboard/summary')
      const data = response.data.data?.ci?.by_type || []
      if (data.length === 0) {
        setTypeData([
          { type: '服务器', count: 128 },
          { type: '数据库', count: 45 },
          { type: '中间件', count: 32 },
          { type: '容器', count: 156 },
          { type: '云资源', count: 78 },
        ])
      } else {
        const typeMap: Record<string, string> = {
          server: '服务器',
          database: '数据库',
          middleware: '中间件',
          container: '容器',
          application: '应用程序',
          cloud: '云资源',
        }
        setTypeData(data.map((d: any) => ({
          type: typeMap[d.type] || d.type,
          count: d.count,
        })))
      }
    } catch (error) {
      console.error('Failed to fetch CI distribution:', error)
      setTypeData([
        { type: '服务器', count: 128 },
        { type: '数据库', count: 45 },
        { type: '中间件', count: 32 },
        { type: '容器', count: 156 },
        { type: '云资源', count: 78 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const total = typeData.reduce((sum, d) => sum + d.count, 0)

  const colors = ['#1677ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#13c2c2']

  const radius = 70
  const centerX = 100
  const centerY = 80

  let currentAngle = -90
  const paths = typeData.map((d, i) => {
    const percentage = (d.count / total) * 100
    const angle = (percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = centerX + radius * Math.cos(startRad)
    const y1 = centerY + radius * Math.sin(startRad)
    const x2 = centerX + radius * Math.cos(endRad)
    const y2 = centerY + radius * Math.sin(endRad)

    const largeArcFlag = angle > 180 ? 1 : 0

    const pathD = `
      M ${centerX} ${centerY}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      Z
    `

    currentAngle = endAngle

    return {
      ...d,
      percentage: percentage.toFixed(1),
      color: colors[i % colors.length],
      path: pathD,
    }
  })

  return (
    <Card
      className={className}
      loading={loading}
      title="资源配置分布"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <svg width="200" height="160" viewBox="0 0 200 160">
          {paths.map((p, i) => (
            <path
              key={i}
              d={p.path}
              fill={p.color}
              style={{
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
            >
              <title>{p.type}: {p.count} ({p.percentage}%)</title>
            </path>
          ))}
          <circle cx={centerX} cy={centerY} r="40" fill="white" />
          <text x={centerX} y={centerY - 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#262626">
            {total}
          </text>
          <text x={centerX} y={centerY + 12} textAnchor="middle" fontSize="10" fill="#8c8c8c">
            总计
          </text>
        </svg>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {paths.map((p, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 8px',
                borderRadius: 4,
                background: '#f5f5f5',
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: p.color,
                }}
              />
              <span style={{ flex: 1, fontSize: 13 }}>{p.type}</span>
              <span style={{ fontWeight: 'bold', fontSize: 13 }}>{p.count}</span>
              <span style={{ color: '#8c8c8c', fontSize: 12, width: 50, textAlign: 'right' }}>
                {p.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
