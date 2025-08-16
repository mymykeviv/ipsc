import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { apiLogin } from '../lib/api'

type AuthContextType = {
  token: string | null
  login: (u: string, p: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  expiresAt: number | null
  forceLogout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (typeof payload.exp === 'number') return payload.exp * 1000
    return null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const logoutTimer = useRef<number | null>(null)

  // Reset session timer on user activity
  const resetSessionTimer = useCallback(() => {
    if (token && expiresAt) {
      const newExpiry = Date.now() + 30 * 60 * 1000 // 30 minutes
      setExpiresAt(newExpiry)
      localStorage.setItem('auth_exp', String(newExpiry))
    }
  }, [token, expiresAt])

  // Add event listeners for user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleUserActivity = () => {
      resetSessionTimer()
    }

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true)
      })
    }
  }, [resetSessionTimer])

  // initialize from localStorage
  useEffect(() => {
    const t = localStorage.getItem('auth_token')
    const expStr = localStorage.getItem('auth_exp')
    const exp = expStr ? parseInt(expStr, 10) : null
    if (t && exp && Date.now() < exp) {
      setToken(t)
      setExpiresAt(exp)
    } else {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_exp')
      // Only redirect to login if session expired and not already on login page
      if (window.location.pathname !== '/login') {
        // Use React Router navigation instead of window.location
        // This will be handled by the Routes component
      }
    }
  }, [])

  // schedule auto logout
  useEffect(() => {
    if (logoutTimer.current) {
      window.clearTimeout(logoutTimer.current)
      logoutTimer.current = null
    }
    if (token && expiresAt) {
      const delay = Math.max(0, expiresAt - Date.now())
      logoutTimer.current = window.setTimeout(() => {
        setToken(null)
        setExpiresAt(null)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_exp')
        // Redirect to login when session expires
        // Use React Router navigation instead of window.location
        // This will be handled by the Routes component
      }, delay)
    }
  }, [token, expiresAt])

  const value = useMemo<AuthContextType>(() => ({
    token,
    async login(u, p) {
      const res = await apiLogin(u, p)
      const t = res.access_token
      const exp = parseJwtExp(t) ?? (Date.now() + 30 * 60 * 1000) // 30 minutes
      setToken(t)
      setExpiresAt(exp)
      localStorage.setItem('auth_token', t)
      localStorage.setItem('auth_exp', String(exp))
    },
    logout() {
      setToken(null)
      setExpiresAt(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_exp')
      window.location.href = '/login'
    },
    forceLogout() {
      setToken(null)
      setExpiresAt(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_exp')
      // Force redirect to login without using window.location.href
      window.location.replace('/login')
    },
    isAuthenticated: !!token,
    expiresAt
  }), [token, expiresAt])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

