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
import { Cashflow } from '../pages/Cashflow'

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
    // For exact matches (like /invoices/add), use exact path matching
    if (path.includes('/add') || path.includes('/edit') || path.includes('/payments') || path.includes('/email') || path.includes('/print')) {
      return location.pathname === path
    }
    // For base paths (like /invoices), check if it's the exact path or a sub-path that doesn't match specific patterns
    if (path === '/invoices' && location.pathname.startsWith('/invoices')) {
      // Only highlight /invoices if we're not on a specific sub-path
      return !location.pathname.includes('/add') && 
             !location.pathname.includes('/edit') && 
             !location.pathname.includes('/payments') && 
             !location.pathname.includes('/email') && 
             !location.pathname.includes('/print')
    }
    if (path === '/purchases' && location.pathname.startsWith('/purchases')) {
      // Only highlight /purchases if we're not on a specific sub-path
      return !location.pathname.includes('/add') && 
             !location.pathname.includes('/edit') && 
             !location.pathname.includes('/payments')
    }
    if (path === '/products' && location.pathname.startsWith('/products')) {
      // Only highlight /products if we're not on a specific sub-path
      return !location.pathname.includes('/add') && 
             !location.pathname.includes('/edit')
    }
    if (path === '/customers' && location.pathname.startsWith('/customers')) {
      // Only highlight /customers if we're not on a specific sub-path
      return !location.pathname.includes('/add') && 
             !location.pathname.includes('/edit')
    }
    if (path === '/vendors' && location.pathname.startsWith('/vendors')) {
      // Only highlight /vendors if we're not on a specific sub-path
      return !location.pathname.includes('/add') && 
             !location.pathname.includes('/edit')
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
          {/* Dashboard */}
          <Link className={`nav-link ${isActive('/') ? 'active' : ''}`} to="/">
            📊 Dashboard
          </Link>
          
          {/* Products Section */}
          <div className="nav-section">
            <div className="nav-section-header">🏷️ Products</div>
            <Link className={`nav-link sub-link ${isActive('/products') ? 'active' : ''}`} to="/products">
              Manage Products
            </Link>
            <Link className={`nav-link sub-link ${isActive('/products/add') ? 'active' : ''}`} to="/products/add">
              Add/Edit Product
            </Link>
          </div>
          
          {/* Invoices Section */}
          <div className="nav-section">
            <div className="nav-section-header">📄 Invoices</div>
            <Link className={`nav-link sub-link ${isActive('/invoices') ? 'active' : ''}`} to="/invoices">
              Manage Invoices
            </Link>
            <Link className={`nav-link sub-link ${isActive('/invoices/add') ? 'active' : ''}`} to="/invoices/add">
              Add/Edit Invoice
            </Link>
            <Link className={`nav-link sub-link ${isActive('/invoices/payments') ? 'active' : ''}`} to="/invoices/payments">
              Invoice Payments
            </Link>
            <Link className={`nav-link sub-link ${isActive('/invoices/payments/add') ? 'active' : ''}`} to="/invoices/payments/add">
              Add/Edit Invoice Payment
            </Link>
          </div>
          
          {/* Purchases Section */}
          <div className="nav-section">
            <div className="nav-section-header">📦 Purchases</div>
            <Link className={`nav-link sub-link ${isActive('/purchases') ? 'active' : ''}`} to="/purchases">
              Manage Purchases
            </Link>
            <Link className={`nav-link sub-link ${isActive('/purchases/add') ? 'active' : ''}`} to="/purchases/add">
              Add/Edit Purchase
            </Link>
            <Link className={`nav-link sub-link ${isActive('/purchases/payments') ? 'active' : ''}`} to="/purchases/payments">
              Purchase Payments
            </Link>
            <Link className={`nav-link sub-link ${isActive('/purchases/payments/add') ? 'active' : ''}`} to="/purchases/payments/add">
              Add/Edit Purchase Payment
            </Link>
          </div>
          
          {/* Customers Section */}
          <div className="nav-section">
            <div className="nav-section-header">👥 Customers</div>
            <Link className={`nav-link sub-link ${isActive('/customers') ? 'active' : ''}`} to="/customers">
              Manage Customers
            </Link>
            <Link className={`nav-link sub-link ${isActive('/customers/add') ? 'active' : ''}`} to="/customers/add">
              Add/Edit Customer
            </Link>
          </div>
          
          {/* Vendors/Suppliers Section */}
          <div className="nav-section">
            <div className="nav-section-header">🏢 Vendors/Suppliers</div>
            <Link className={`nav-link sub-link ${isActive('/vendors') ? 'active' : ''}`} to="/vendors">
              Manage Vendors/Suppliers
            </Link>
            <Link className={`nav-link sub-link ${isActive('/vendors/add') ? 'active' : ''}`} to="/vendors/add">
              Add/Edit Vendor/Supplier
            </Link>
          </div>
          
          {/* Cashflow Section */}
          <div className="nav-section">
            <div className="nav-section-header">💰 Cashflow</div>
            <Link className={`nav-link sub-link ${isActive('/cashflow') ? 'active' : ''}`} to="/cashflow">
              View Cashflow Transactions
            </Link>
          </div>
          
          {/* Settings Section */}
          <div className="nav-section">
            <div className="nav-section-header">⚙️ Settings</div>
            <Link className={`nav-link sub-link ${isActive('/settings/company') ? 'active' : ''}`} to="/settings/company">
              Company Details
            </Link>
            <Link className={`nav-link sub-link ${isActive('/settings/tax') ? 'active' : ''}`} to="/settings/tax">
              Tax Settings
            </Link>
            <Link className={`nav-link sub-link ${isActive('/settings/users') ? 'active' : ''}`} to="/settings/users">
              Users
            </Link>
            <Link className={`nav-link sub-link ${isActive('/settings/email') ? 'active' : ''}`} to="/settings/email">
              Email Settings
            </Link>
            <Link className={`nav-link sub-link ${isActive('/settings/invoice') ? 'active' : ''}`} to="/settings/invoice">
              Invoice Settings
            </Link>
          </div>
          
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
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Products Routes */}
          <Route path="/products" element={<Products />} />
          <Route path="/products/add" element={<Products mode="add" />} />
          <Route path="/products/edit/:id" element={<Products mode="edit" />} />
          
          {/* Invoices Routes */}
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/add" element={<Invoices mode="add" />} />
          <Route path="/invoices/edit/:id" element={<Invoices mode="edit" />} />
          <Route path="/invoices/payments" element={<Invoices mode="payments" />} />
          <Route path="/invoices/add-payment/:id" element={<Invoices mode="add-payment" />} />
          <Route path="/invoices/email/:id" element={<Invoices mode="email" />} />
          <Route path="/invoices/print/:id" element={<Invoices mode="print" />} />
          
          {/* Purchases Routes */}
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/add" element={<Purchases mode="add" />} />
          <Route path="/purchases/edit/:id" element={<Purchases mode="edit" />} />
          <Route path="/purchases/payments" element={<Purchases mode="payments" />} />
          <Route path="/purchases/add-payment/:id" element={<Purchases mode="add-payment" />} />
          
          {/* Customers Routes */}
          <Route path="/customers" element={<Parties type="customer" />} />
          <Route path="/customers/add" element={<Parties type="customer" mode="add" />} />
          <Route path="/customers/edit/:id" element={<Parties type="customer" mode="edit" />} />
          
          {/* Vendors Routes */}
          <Route path="/vendors" element={<Parties type="vendor" />} />
          <Route path="/vendors/add" element={<Parties type="vendor" mode="add" />} />
          <Route path="/vendors/edit/:id" element={<Parties type="vendor" mode="edit" />} />
          
          {/* Cashflow Routes */}
          <Route path="/cashflow" element={<Cashflow />} />
          
          {/* Settings Routes */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/company" element={<Settings section="company" />} />
          <Route path="/settings/tax" element={<Settings section="tax" />} />
          <Route path="/settings/users" element={<Settings section="users" />} />
          <Route path="/settings/email" element={<Settings section="email" />} />
          <Route path="/settings/invoice" element={<Settings section="invoice" />} />
          
          {/* Expenses Routes */}
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/add" element={<Expenses mode="add" />} />
          <Route path="/expenses/edit/:id" element={<Expenses mode="edit" />} />
          
          {/* Legacy Routes for backward compatibility */}
          <Route path="/parties" element={<Parties />} />
          <Route path="/reports" element={<Reports />} />
          
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

