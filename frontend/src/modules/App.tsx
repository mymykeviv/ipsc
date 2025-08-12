import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Dashboard } from '../pages/Dashboard'
import { Products } from '../pages/Products'
import { Purchases } from '../pages/Purchases'
import { Parties } from '../pages/Parties'
import { Reports } from '../pages/Reports'
import { Settings } from '../pages/Settings'
import { Login } from '../pages/Login'
import { AuthProvider, useAuth } from './AuthContext'
import { Invoices } from '../pages/Invoices'
import { Expenses } from '../pages/Expenses'

import { Logo } from '../components/Logo'
import { SessionTimer } from '../components/SessionTimer'

function Shell() {
  const { token, isAuthenticated, logout, expiresAt } = useAuth()
  const location = useLocation()
  
  // Helper function to check if a link is active
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }
  
  // If not authenticated, show only login page
  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <main className="content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    )
  }
  
  // If authenticated, show full app with sidebar
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Logo size="large" />
        </div>
        <nav className="nav">
          <Link className={`nav-link ${isActive('/') ? 'active' : ''}`} to="/">Dashboard</Link>
          <Link className={`nav-link ${isActive('/products') ? 'active' : ''}`} to="/products">Products</Link>
          <Link className={`nav-link ${isActive('/invoices') ? 'active' : ''}`} to="/invoices">Invoices</Link>
          <Link className={`nav-link ${isActive('/purchases') ? 'active' : ''}`} to="/purchases">Purchases</Link>
          <Link className={`nav-link ${isActive('/expenses') ? 'active' : ''}`} to="/expenses">Expenses</Link>
          <Link className={`nav-link ${isActive('/parties') ? 'active' : ''}`} to="/parties">Parties</Link>
          <Link className={`nav-link ${isActive('/reports') ? 'active' : ''}`} to="/reports">Reports</Link>
          <Link className={`nav-link ${isActive('/settings') ? 'active' : ''}`} to="/settings">Settings</Link>
          
          {/* Session Timer */}
          {expiresAt && (
            <div className="session-timer">
              <SessionTimer 
                expiryTime={Math.floor(expiresAt / 1000)} 
                onExpire={logout}
              />
            </div>
          )}
          
          <button 
            onClick={() => logout()} 
            className="nav-link logout-btn" 
            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/parties" element={<Parties />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}

