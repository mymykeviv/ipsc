import { FormEvent, useState } from 'react'
import { useAuth } from '../modules/AuthContext'
import { ErrorMessage } from '../components/ErrorMessage'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { Logo } from '../components/Logo'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    if (!username || !password) {
      setError('Username and password are required')
      setLoading(false)
      return
    }
    
    try {
      await login(username, password)
      // Navigate to dashboard after successful login
      navigate('/')
    } catch (err) {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      width: '100%',
      height: '100vh',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <Card style={{ 
        width: '100%',
        maxWidth: 400, 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Logo size="large" centered={true} />
          <h1 style={{ 
            marginTop: '16px', 
            fontSize: '24px', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Welcome Back
          </h1>
          <p style={{ 
            marginTop: '8px', 
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Sign in to your account to continue
          </p>
        </div>
        <form onSubmit={onSubmit}>
          {/* Login Information Section */}
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, borderBottomColor: getSectionHeaderColor('basic') }}>
              Login Information
            </h3>
            <div style={formStyles.grid}>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Username *</label>
                <input 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                  style={formStyles.input}
                />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Password *</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  style={formStyles.input}
                />
              </div>
            </div>
          </div>
          <ErrorMessage message={error} />
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 16px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              marginTop: '8px'
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </Card>
    </div>
  )
}

