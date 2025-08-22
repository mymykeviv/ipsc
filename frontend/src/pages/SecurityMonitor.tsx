import React, { useState, useEffect, useCallback } from 'react'
import { Card, Row, Col, Progress, Statistic, Alert, Button, Table, Tag, Space, Modal, message, Timeline, Badge } from 'antd'
import { 
  SecurityScanOutlined, 
  LockOutlined, 
  UserOutlined, 
  WarningOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { apiGetSecurityReport, apiGetAuditLogs, apiGetFailedLogins, apiGetSuspiciousActivity, apiGetActiveSessions, apiRevokeSession, apiRevokeAllSessions } from '../lib/api'

interface SecurityReport {
  recent_security_events: number
  event_counts: Record<string, number>
  failed_logins_7_days: number
  active_sessions: number
  rate_limit_violations: number
  security_score: number
  generated_at: string
}

interface AuditLog {
  id: number
  user_id: number | null
  action: string
  resource_type: string
  resource_id: number | null
  details: string
  ip_address: string | null
  user_agent: string | null
  timestamp: string
  tenant_id: number | null
}

interface FailedLogin {
  total_attempts: number
  unique_users: number
  period_days: number
  most_frequent_attempts: Array<{
    user_identifier: string
    attempt_count: number
    last_attempt: string | null
  }>
  attempts_by_user: Record<string, Array<{
    timestamp: string
    ip_address: string | null
    user_agent: string | null
    details: string
  }>>
}

interface SuspiciousActivity {
  total_suspicious_events: number
  period_days: number
  patterns: {
    rate_limit_violations: any[]
    permission_denials: any[]
    unusual_access_patterns: any[]
    potential_attacks: any[]
  }
  summary: {
    rate_limit_violations: number
    permission_denials: number
    unusual_patterns: number
    potential_attacks: number
  }
}

interface ActiveSession {
  session_id: string
  user_id: number | null
  tenant_id: number | null
  created_at: string | null
  last_activity: string | null
  duration_minutes: number
}

const SecurityMonitor: React.FC = () => {
  const [securityReport, setSecurityReport] = useState<SecurityReport | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [failedLogins, setFailedLogins] = useState<FailedLogin | null>(null)
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity | null>(null)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const loadSecurityData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [report, logs, logins, activity, sessions] = await Promise.all([
        apiGetSecurityReport(),
        apiGetAuditLogs(),
        apiGetFailedLogins(),
        apiGetSuspiciousActivity(),
        apiGetActiveSessions()
      ])
      
      setSecurityReport(report)
      setAuditLogs(logs.audit_logs || [])
      setFailedLogins(logins)
      setSuspiciousActivity(activity)
      setActiveSessions(sessions.active_sessions || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load security data')
      message.error('Failed to load security data')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiRevokeSession(sessionId)
      message.success('Session revoked successfully')
      loadSecurityData()
    } catch (err: any) {
      message.error('Failed to revoke session')
    }
  }

  const handleRevokeAllSessions = async () => {
    Modal.confirm({
      title: 'Revoke All Sessions',
      content: 'Are you sure you want to revoke all active sessions? This will log out all users.',
      okText: 'Yes, Revoke All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await apiRevokeAllSessions()
          message.success('All sessions revoked successfully')
          loadSecurityData()
        } catch (err: any) {
          message.error('Failed to revoke sessions')
        }
      }
    })
  }

  const startAutoRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    const interval = setInterval(loadSecurityData, 60000) // Refresh every minute
    setRefreshInterval(interval)
  }, [loadSecurityData])

  const stopAutoRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [refreshInterval])

  useEffect(() => {
    loadSecurityData()
    startAutoRefresh()
    
    return () => {
      stopAutoRefresh()
    }
  }, [loadSecurityData, startAutoRefresh, stopAutoRefresh])

  const getSecurityColor = (score: number) => {
    if (score >= 80) return '#52c41a'
    if (score >= 60) return '#faad14'
    return '#ff4d4f'
  }

  const getStatusColor = (count: number) => {
    if (count === 0) return '#52c41a'
    if (count < 5) return '#faad14'
    return '#ff4d4f'
  }

  const auditLogColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => new Date(timestamp).toLocaleString()
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const colors = {
          'failed_login': 'red',
          'suspicious_activity': 'orange',
          'permission_denied': 'volcano',
          'session_revoked': 'purple',
          'audit_log_access': 'blue'
        }
        return <Tag color={colors[action as keyof typeof colors] || 'default'}>{action.replace('_', ' ').toUpperCase()}</Tag>
      }
    },
    {
      title: 'User ID',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (userId: number | null) => userId || 'Anonymous'
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip: string | null) => ip || 'Unknown'
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true
    }
  ]

  const sessionColumns = [
    {
      title: 'Session ID',
      dataIndex: 'session_id',
      key: 'session_id',
      render: (sessionId: string) => sessionId.substring(0, 8) + '...'
    },
    {
      title: 'User ID',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (userId: number | null) => userId || 'Unknown'
    },
    {
      title: 'Duration',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    },
    {
      title: 'Last Activity',
      dataIndex: 'last_activity',
      key: 'last_activity',
      render: (timestamp: string | null) => timestamp ? new Date(timestamp).toLocaleString() : 'Unknown'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: ActiveSession) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRevokeSession(record.session_id)}
        >
          Revoke
        </Button>
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
            <Button size="small" danger onClick={loadSecurityData}>
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
          <SecurityScanOutlined /> Security Monitor
        </h1>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadSecurityData}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
            onClick={handleRevokeAllSessions}
            danger
          >
            Revoke All Sessions
          </Button>
          {refreshInterval ? (
            <Button onClick={stopAutoRefresh}>Stop Auto Refresh</Button>
          ) : (
            <Button onClick={startAutoRefresh}>Start Auto Refresh</Button>
          )}
        </Space>
      </div>

      {securityReport && (
        <>
          {/* Security Score */}
          <Card style={{ marginBottom: '24px' }}>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Statistic
                  title="Overall Security Score"
                  value={securityReport.security_score}
                  suffix="/ 100"
                  valueStyle={{ color: getSecurityColor(securityReport.security_score) }}
                  prefix={<SafetyOutlined />}
                />
              </Col>
              <Col span={16}>
                <Progress
                  percent={securityReport.security_score}
                  strokeColor={getSecurityColor(securityReport.security_score)}
                  showInfo={false}
                />
              </Col>
            </Row>
          </Card>

          {/* Security Metrics */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Recent Security Events"
                  value={securityReport.recent_security_events}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: getStatusColor(securityReport.recent_security_events) }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Failed Logins (7 days)"
                  value={securityReport.failed_logins_7_days}
                  prefix={<LockOutlined />}
                  valueStyle={{ color: getStatusColor(securityReport.failed_logins_7_days) }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Active Sessions"
                  value={securityReport.active_sessions}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Rate Limit Violations"
                  value={securityReport.rate_limit_violations}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: getStatusColor(securityReport.rate_limit_violations) }}
                />
              </Card>
            </Col>
          </Row>

          {/* Event Counts */}
          {Object.keys(securityReport.event_counts).length > 0 && (
            <Card title="Security Events by Type" style={{ marginBottom: '24px' }}>
              <Row gutter={16}>
                {Object.entries(securityReport.event_counts).map(([eventType, count]) => (
                  <Col span={6} key={eventType}>
                    <Statistic
                      title={eventType.replace('_', ' ').toUpperCase()}
                      value={count}
                      valueStyle={{ color: getStatusColor(count) }}
                    />
                  </Col>
                ))}
              </Row>
            </Card>
          )}
        </>
      )}

      {/* Failed Logins */}
      {failedLogins && (
        <Card title="Failed Login Attempts" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Total Attempts"
                value={failedLogins.total_attempts}
                valueStyle={{ color: getStatusColor(failedLogins.total_attempts) }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Unique Users"
                value={failedLogins.unique_users}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Period (Days)"
                value={failedLogins.period_days}
              />
            </Col>
          </Row>
          
          {failedLogins.most_frequent_attempts.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4>Most Frequent Attempts</h4>
              <Table
                dataSource={failedLogins.most_frequent_attempts}
                columns={[
                  {
                    title: 'User',
                    dataIndex: 'user_identifier',
                    key: 'user_identifier'
                  },
                  {
                    title: 'Attempts',
                    dataIndex: 'attempt_count',
                    key: 'attempt_count',
                    render: (count: number) => <Badge count={count} style={{ backgroundColor: getStatusColor(count) }} />
                  },
                  {
                    title: 'Last Attempt',
                    dataIndex: 'last_attempt',
                    key: 'last_attempt',
                    render: (timestamp: string | null) => timestamp ? new Date(timestamp).toLocaleString() : 'Unknown'
                  }
                ]}
                pagination={false}
                size="small"
              />
            </div>
          )}
        </Card>
      )}

      {/* Suspicious Activity */}
      {suspiciousActivity && (
        <Card title="Suspicious Activity" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Rate Limit Violations"
                value={suspiciousActivity.summary.rate_limit_violations}
                valueStyle={{ color: getStatusColor(suspiciousActivity.summary.rate_limit_violations) }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Permission Denials"
                value={suspiciousActivity.summary.permission_denials}
                valueStyle={{ color: getStatusColor(suspiciousActivity.summary.permission_denials) }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Unusual Patterns"
                value={suspiciousActivity.summary.unusual_patterns}
                valueStyle={{ color: getStatusColor(suspiciousActivity.summary.unusual_patterns) }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Potential Attacks"
                value={suspiciousActivity.summary.potential_attacks}
                valueStyle={{ color: getStatusColor(suspiciousActivity.summary.potential_attacks) }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Active Sessions */}
      <Card title="Active Sessions" style={{ marginBottom: '24px' }}>
        <Table
          dataSource={activeSessions}
          columns={sessionColumns}
          rowKey="session_id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* Audit Logs */}
      <Card title="Recent Audit Logs">
        <Table
          dataSource={auditLogs}
          columns={auditLogColumns}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          size="small"
        />
      </Card>

      {/* Last Updated */}
      {securityReport && (
        <Card size="small" style={{ marginTop: '24px' }}>
          <div style={{ textAlign: 'center', color: '#666' }}>
            Last updated: {new Date(securityReport.generated_at).toLocaleString()}
          </div>
        </Card>
      )}
    </div>
  )
}

export default SecurityMonitor
