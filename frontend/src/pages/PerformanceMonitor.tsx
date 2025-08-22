import React, { useState, useEffect, useCallback } from 'react'
import { Card, Row, Col, Progress, Statistic, Alert, Button, Table, Tag, Space, Modal, message } from 'antd'
import { 
  DashboardOutlined, 
  DatabaseOutlined, 
  MemoryOutlined, 
  CpuOutlined,
  HddOutlined,
  NetworkOutlined,
  ReloadOutlined,
  ClearOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { apiGetPerformanceMetrics, apiGetSystemHealth, apiGetQueryStats, apiClearCache } from '../lib/api'

interface PerformanceMetrics {
  performance_score: number
  query_statistics: {
    statistics: {
      total_queries: number
      slow_queries: number
      optimized_queries: number
      cache_hits: number
      cache_misses: number
    }
    performance_metrics: {
      average_query_time: number
      slow_query_percentage: number
      optimization_effectiveness: number
    }
  }
  cache_statistics: {
    size: number
    max_size: number
    ttl: number
  }
  system_health: {
    system: {
      cpu: {
        percent: number
        count: number
      }
      memory: {
        total: number
        used: number
        free: number
        percent: number
      }
      disk: {
        total: number
        used: number
        free: number
        percent: number
      }
      network: {
        bytes_sent: number
        bytes_recv: number
      }
    }
    process: {
      cpu_percent: number
      memory_percent: number
      num_threads: number
    }
  }
  timestamp: string
}

interface OptimizationSuggestion {
  type: 'warning' | 'info' | 'error'
  category: string
  title: string
  description: string
  recommendations: string[]
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const loadPerformanceData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [metricsData, suggestionsData] = await Promise.all([
        apiGetPerformanceMetrics(),
        fetch('/api/performance/optimization-suggestions').then(r => r.json())
      ])
      
      setMetrics(metricsData)
      setSuggestions(suggestionsData.suggestions || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load performance data')
      message.error('Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleClearCache = async () => {
    try {
      await apiClearCache()
      message.success('Cache cleared successfully')
      loadPerformanceData()
    } catch (err: any) {
      message.error('Failed to clear cache')
    }
  }

  const startAutoRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    const interval = setInterval(loadPerformanceData, 30000) // Refresh every 30 seconds
    setRefreshInterval(interval)
  }, [loadPerformanceData])

  const stopAutoRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [refreshInterval])

  useEffect(() => {
    loadPerformanceData()
    startAutoRefresh()
    
    return () => {
      stopAutoRefresh()
    }
  }, [loadPerformanceData, startAutoRefresh, stopAutoRefresh])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return '#52c41a'
    if (score >= 60) return '#faad14'
    return '#ff4d4f'
  }

  const getStatusColor = (percent: number) => {
    if (percent < 60) return '#52c41a'
    if (percent < 80) return '#faad14'
    return '#ff4d4f'
  }

  const suggestionColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors = {
          warning: 'orange',
          info: 'blue',
          error: 'red'
        }
        const icons = {
          warning: <WarningOutlined />,
          info: <InfoCircleOutlined />,
          error: <WarningOutlined />
        }
        return <Tag color={colors[type as keyof typeof colors]} icon={icons[type as keyof typeof icons]}>{type.toUpperCase()}</Tag>
      }
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag>{category.replace('_', ' ').toUpperCase()}</Tag>
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Recommendations',
      dataIndex: 'recommendations',
      key: 'recommendations',
      render: (recommendations: string[]) => (
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {recommendations.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      )
    }
  ]

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={loadPerformanceData}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>
          <DashboardOutlined /> Performance Monitor
        </h1>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadPerformanceData}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            icon={<ClearOutlined />} 
            onClick={handleClearCache}
            danger
          >
            Clear Cache
          </Button>
          {refreshInterval ? (
            <Button onClick={stopAutoRefresh}>Stop Auto Refresh</Button>
          ) : (
            <Button onClick={startAutoRefresh}>Start Auto Refresh</Button>
          )}
        </Space>
      </div>

      {metrics && (
        <>
          {/* Performance Score */}
          <Card style={{ marginBottom: '24px' }}>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Statistic
                  title="Overall Performance Score"
                  value={metrics.performance_score}
                  suffix="/ 100"
                  valueStyle={{ color: getPerformanceColor(metrics.performance_score) }}
                />
              </Col>
              <Col span={16}>
                <Progress
                  percent={metrics.performance_score}
                  strokeColor={getPerformanceColor(metrics.performance_score)}
                  showInfo={false}
                />
              </Col>
            </Row>
          </Card>

          {/* System Health */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="CPU Usage"
                  value={metrics.system_health.system.cpu.percent}
                  suffix="%"
                  prefix={<CpuOutlined />}
                  valueStyle={{ color: getStatusColor(metrics.system_health.system.cpu.percent) }}
                />
                <Progress
                  percent={metrics.system_health.system.cpu.percent}
                  strokeColor={getStatusColor(metrics.system_health.system.cpu.percent)}
                  showInfo={false}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Memory Usage"
                  value={metrics.system_health.system.memory.percent}
                  suffix="%"
                  prefix={<MemoryOutlined />}
                  valueStyle={{ color: getStatusColor(metrics.system_health.system.memory.percent) }}
                />
                <Progress
                  percent={metrics.system_health.system.memory.percent}
                  strokeColor={getStatusColor(metrics.system_health.system.memory.percent)}
                  showInfo={false}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Disk Usage"
                  value={metrics.system_health.system.disk.percent}
                  suffix="%"
                  prefix={<HddOutlined />}
                  valueStyle={{ color: getStatusColor(metrics.system_health.system.disk.percent) }}
                />
                <Progress
                  percent={metrics.system_health.system.disk.percent}
                  strokeColor={getStatusColor(metrics.system_health.system.disk.percent)}
                  showInfo={false}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Network I/O"
                  value={formatBytes(metrics.system_health.system.network.bytes_recv)}
                  prefix={<NetworkOutlined />}
                />
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Sent: {formatBytes(metrics.system_health.system.network.bytes_sent)}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Query Statistics */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={12}>
              <Card title={<><DatabaseOutlined /> Query Statistics</>}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Total Queries"
                      value={metrics.query_statistics.statistics.total_queries}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Slow Queries"
                      value={metrics.query_statistics.statistics.slow_queries}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: '16px' }}>
                  <Col span={12}>
                    <Statistic
                      title="Avg Query Time"
                      value={metrics.query_statistics.performance_metrics.average_query_time}
                      suffix="ms"
                      precision={2}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Optimization Effectiveness"
                      value={metrics.query_statistics.performance_metrics.optimization_effectiveness}
                      suffix="%"
                      precision={1}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Cache Statistics">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Cache Size"
                      value={metrics.cache_statistics.size}
                      suffix={`/ ${metrics.cache_statistics.max_size}`}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Cache TTL"
                      value={metrics.cache_statistics.ttl}
                      suffix="s"
                    />
                  </Col>
                </Row>
                <Progress
                  percent={(metrics.cache_statistics.size / metrics.cache_statistics.max_size) * 100}
                  strokeColor={getStatusColor((metrics.cache_statistics.size / metrics.cache_statistics.max_size) * 100)}
                  showInfo={false}
                  style={{ marginTop: '16px' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Optimization Suggestions */}
          {suggestions.length > 0 && (
            <Card 
              title={<><WarningOutlined /> Optimization Suggestions ({suggestions.length})</>}
              style={{ marginBottom: '24px' }}
            >
              <Table
                dataSource={suggestions}
                columns={suggestionColumns}
                rowKey={(record, index) => index?.toString() || '0'}
                pagination={false}
                size="small"
              />
            </Card>
          )}

          {/* Last Updated */}
          <Card size="small">
            <div style={{ textAlign: 'center', color: '#666' }}>
              Last updated: {new Date(metrics.timestamp).toLocaleString()}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

export default PerformanceMonitor
