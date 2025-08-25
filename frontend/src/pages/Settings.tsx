import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'
import { ErrorMessage } from '../components/ErrorMessage'
import { GSTTemplateManager } from '../components/GSTTemplateManager'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'

interface SettingsProps {
  section?: string
}

interface CompanySettings {
  // Backend-mapped fields only
  company_name: string
  gst_number: string
  state?: string
  state_code?: string
  invoice_series?: string
  gst_enabled_by_default?: boolean
  require_gstin_validation?: boolean
}

interface TaxSettings {
  gst_rate: string
  cgst_rate: string
  sgst_rate: string
  igst_rate: string
  utgst_rate: string
  cess_rate: string
  tax_registration_number: string
}

interface UserSettings {
  username: string
  email: string
  role: string
  is_active: boolean
}

interface EmailSettings {
  smtp_server: string
  smtp_port: string
  smtp_username: string
  smtp_password: string
  from_email: string
  from_name: string
  email_provider: 'gmail' | 'outlook' | 'custom'
}

interface InvoiceSettings {
  invoice_prefix: string
  invoice_number_format: string
  default_currency: string
  payment_terms: string
  invoice_template: 'simple' | 'detailed'
  auto_numbering: boolean
}

export function Settings({ section = 'company' }: SettingsProps) {
  const navigate = useNavigate()
  const { token, forceLogout } = useAuth()
  const handleApiError = createApiErrorHandler(() => forceLogout())
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false)

  // Company Settings (backend fields only)
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    company_name: '',
    gst_number: '',
    state: 'Maharashtra',
    state_code: '27',
    invoice_series: 'INV',
    gst_enabled_by_default: true,
    require_gstin_validation: true
  })

  // Tax Settings
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    gst_rate: '18',
    cgst_rate: '9',
    sgst_rate: '9',
    igst_rate: '18',
    utgst_rate: '18',
    cess_rate: '0',
    tax_registration_number: ''
  })

  // User Settings
  const [userSettings, setUserSettings] = useState<UserSettings>({
    username: '',
    email: '',
    role: 'user',
    is_active: true
  })

  // Email Settings
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtp_server: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    email_provider: 'gmail'
  })

  // Invoice Settings
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    invoice_prefix: 'INV',
    invoice_number_format: 'INV-{YEAR}-{NUMBER}',
    default_currency: 'INR',
    payment_terms: 'Net 30',
    invoice_template: 'detailed',
    auto_numbering: true
  })

  useEffect(() => {
    loadSettings()
  }, [section])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      // Load company settings (ignore 404 if not set yet)
      const res = await fetch('/api/company/settings', {
        headers: {
          Authorization: `Bearer ${token ?? ''}`
        }
      })
      if (res.status === 401) {
        throw new Error('Unauthorized')
      }
      if (res.ok) {
        const data = await res.json()
        setCompanySettings(prev => ({
          ...prev,
          company_name: data?.name ?? '',
          gst_number: data?.gstin ?? '',
          state: data?.state ?? 'Maharashtra',
          state_code: data?.state_code ?? '27',
          invoice_series: data?.invoice_series ?? 'INV',
          gst_enabled_by_default: data?.gst_enabled_by_default ?? true,
          require_gstin_validation: data?.require_gstin_validation ?? true,
        }))
        // If invoice series exists, mirror it into invoice settings prefix
        if (data?.invoice_series) {
          setInvoiceSettings(prev => ({ ...prev, invoice_prefix: data.invoice_series }))
        }
      } else if (res.status !== 404) {
        // 404 means not configured yet; other errors should surface
        const text = await res.text()
        throw new Error(text || `Failed to load settings (${res.status})`)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      // Persist company settings (backend supports upsert on PUT)
      const payload = {
        name: companySettings.company_name,
        gstin: companySettings.gst_number,
        // Use explicit invoice_series if present, else from invoice settings
        invoice_series: companySettings.invoice_series || invoiceSettings.invoice_prefix || 'INV',
        state: companySettings.state || 'Maharashtra',
        state_code: companySettings.state_code || '27',
        gst_enabled_by_default: companySettings.gst_enabled_by_default ?? true,
        require_gstin_validation: companySettings.require_gstin_validation ?? true,
      }
      const res = await fetch('/api/company/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to save company settings (${res.status})`)
      }
      const saved = await res.json()
      // Reflect saved values back into UI
      setCompanySettings(prev => ({
        ...prev,
        company_name: saved?.name ?? prev.company_name,
        gst_number: saved?.gstin ?? prev.gst_number,
        state: saved?.state ?? prev.state,
        state_code: saved?.state_code ?? prev.state_code,
        invoice_series: saved?.invoice_series ?? prev.invoice_series,
        gst_enabled_by_default: saved?.gst_enabled_by_default ?? prev.gst_enabled_by_default,
        require_gstin_validation: saved?.require_gstin_validation ?? prev.require_gstin_validation,
      }))
      if (saved?.invoice_series) {
        setInvoiceSettings(prev => ({ ...prev, invoice_prefix: saved.invoice_series }))
      }
      setSuccess('Company settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save company settings:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleTaxSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      // TODO: Implement API call to save tax settings
      setSuccess('Tax settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save tax settings:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      // TODO: Implement API call to save user settings
      setSuccess('User settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save user settings:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      // TODO: Implement API call to save email settings
      setSuccess('Email settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save email settings:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      // TODO: Implement API call to save invoice settings
      setSuccess('Invoice settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save invoice settings:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any, settingsType: string) => {
    switch (settingsType) {
      case 'company':
        setCompanySettings(prev => ({ ...prev, [field]: value }))
        break
      case 'tax':
        setTaxSettings(prev => ({ ...prev, [field]: value }))
        break
      case 'user':
        setUserSettings(prev => ({ ...prev, [field]: value }))
        break
      case 'email':
        setEmailSettings(prev => ({ ...prev, [field]: value }))
        break
      case 'invoice':
        setInvoiceSettings(prev => ({ ...prev, [field]: value }))
        break
    }
  }

  const getSectionTitle = () => {
    switch (section) {
      case 'company': return 'Company Details'
      case 'tax': return 'Tax Settings'
      case 'users': return 'User Management'
      case 'email': return 'Email Configuration'
      case 'invoice': return 'Invoice Settings'
      default: return 'Settings'
    }
  }

  const renderCompanySettings = () => (
    <form onSubmit={handleCompanySubmit} style={{ maxWidth: '800px' }}>
      <div style={formStyles.section}>
        <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('company') }}>
          Company Information
        </h3>
        <div style={formStyles.formGroup}>
          <label style={formStyles.label}>Company Name *</label>
          <input
            type="text"
            value={companySettings.company_name}
            onChange={(e) => handleInputChange('company_name', e.target.value, 'company')}
            style={formStyles.input}
            required
          />
        </div>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>State *</label>
            <input
              type="text"
              value={companySettings.state || ''}
              onChange={(e) => handleInputChange('state', e.target.value, 'company')}
              style={formStyles.input}
              required
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>State Code *</label>
            <input
              type="text"
              value={companySettings.state_code || ''}
              onChange={(e) => handleInputChange('state_code', e.target.value, 'company')}
              style={formStyles.input}
              required
            />
          </div>
        </div>
      </div>

      <div style={formStyles.section}>
        <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('tax') }}>
          Tax Information
        </h3>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>GST Number</label>
            <input
              type="text"
              value={companySettings.gst_number}
              onChange={(e) => handleInputChange('gst_number', e.target.value, 'company')}
              style={formStyles.input}
              placeholder="22AAAAA0000A1Z5"
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Invoice Series/Prefix</label>
            <input
              type="text"
              value={companySettings.invoice_series || ''}
              onChange={(e) => handleInputChange('invoice_series', e.target.value, 'company')}
              style={formStyles.input}
              placeholder="INV"
            />
          </div>
        </div>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>GST Enabled by Default</label>
            <input
              type="checkbox"
              checked={!!companySettings.gst_enabled_by_default}
              onChange={(e) => handleInputChange('gst_enabled_by_default', e.target.checked, 'company')}
              style={{ marginLeft: '8px' }}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Require GSTIN Validation</label>
            <input
              type="checkbox"
              checked={!!companySettings.require_gstin_validation}
              onChange={(e) => handleInputChange('require_gstin_validation', e.target.checked, 'company')}
              style={{ marginLeft: '8px' }}
            />
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Company Settings'}
        </Button>
      </div>
    </form>
  )

  const renderTaxSettings = () => (
    <form onSubmit={handleTaxSubmit} style={{ maxWidth: '800px' }}>
      <div style={formStyles.section}>
        <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('gst') }}>
          GST Rates
        </h3>
        <div style={formStyles.grid3Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>GST Rate (%)</label>
            <input
              type="number"
              value={taxSettings.gst_rate}
              onChange={(e) => handleInputChange('gst_rate', e.target.value, 'tax')}
              style={formStyles.input}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>CGST Rate (%)</label>
            <input
              type="number"
              value={taxSettings.cgst_rate}
              onChange={(e) => handleInputChange('cgst_rate', e.target.value, 'tax')}
              style={formStyles.input}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>SGST Rate (%)</label>
            <input
              type="number"
              value={taxSettings.sgst_rate}
              onChange={(e) => handleInputChange('sgst_rate', e.target.value, 'tax')}
              style={formStyles.input}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </div>
        <div style={formStyles.grid3Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>IGST Rate (%)</label>
            <input
              type="number"
              value={taxSettings.igst_rate}
              onChange={(e) => handleInputChange('igst_rate', e.target.value, 'tax')}
              style={formStyles.input}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>UTGST Rate (%)</label>
            <input
              type="number"
              value={taxSettings.utgst_rate}
              onChange={(e) => handleInputChange('utgst_rate', e.target.value, 'tax')}
              style={formStyles.input}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>CESS Rate (%)</label>
            <input
              type="number"
              value={taxSettings.cess_rate}
              onChange={(e) => handleInputChange('cess_rate', e.target.value, 'tax')}
              style={formStyles.input}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </div>
      </div>

      <div style={formStyles.section}>
        <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('registration') }}>
          Tax Registration
        </h3>
        <div style={formStyles.formGroup}>
          <label style={formStyles.label}>Tax Registration Number</label>
          <input
            type="text"
            value={taxSettings.tax_registration_number}
            onChange={(e) => handleInputChange('tax_registration_number', e.target.value, 'tax')}
            style={formStyles.input}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Tax Settings'}
        </Button>
      </div>
    </form>
  )

  const renderUserSettings = () => (
    <form onSubmit={handleUserSubmit} style={{ maxWidth: '800px' }}>
      <div style={formStyles.section}>
        <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('user') }}>
          User Information
        </h3>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Username *</label>
            <input
              type="text"
              value={userSettings.username}
              onChange={(e) => handleInputChange('username', e.target.value, 'user')}
              style={formStyles.input}
              required
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Email *</label>
            <input
              type="email"
              value={userSettings.email}
              onChange={(e) => handleInputChange('email', e.target.value, 'user')}
              style={formStyles.input}
              required
            />
          </div>
        </div>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Role</label>
            <select
              value={userSettings.role}
              onChange={(e) => handleInputChange('role', e.target.value, 'user')}
              style={formStyles.select}
            >
              <option value="admin">Administrator</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Status</label>
            <select
              value={userSettings.is_active ? 'active' : 'inactive'}
              onChange={(e) => handleInputChange('is_active', e.target.value === 'active' ? 'true' : 'false', 'user')}
              style={formStyles.select}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save User Settings'}
        </Button>
      </div>
    </form>
  )

  const renderEmailSettings = () => (
    <form onSubmit={handleEmailSubmit} style={{ maxWidth: '800px' }}>
      <div style={formStyles.section}>
        <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('email') }}>
          Email Provider
        </h3>
        <div style={formStyles.formGroup}>
          <label style={formStyles.label}>Email Provider</label>
          <select
            value={emailSettings.email_provider}
            onChange={(e) => handleInputChange('email_provider', e.target.value, 'email')}
            style={formStyles.select}
          >
            <option value="gmail">Gmail</option>
            <option value="outlook">Outlook.com</option>
            <option value="custom">Custom SMTP</option>
          </select>
        </div>
      </div>

      <div style={formStyles.section}>
        <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('smtp') }}>
          SMTP Configuration
        </h3>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>SMTP Server</label>
            <input
              type="text"
              value={emailSettings.smtp_server}
              onChange={(e) => handleInputChange('smtp_server', e.target.value, 'email')}
              style={formStyles.input}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>SMTP Port</label>
            <input
              type="number"
              value={emailSettings.smtp_port}
              onChange={(e) => handleInputChange('smtp_port', e.target.value, 'email')}
              style={formStyles.input}
              placeholder="587"
            />
          </div>
        </div>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>SMTP Username</label>
            <input
              type="email"
              value={emailSettings.smtp_username}
              onChange={(e) => handleInputChange('smtp_username', e.target.value, 'email')}
              style={formStyles.input}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>SMTP Password</label>
            <input
              type="password"
              value={emailSettings.smtp_password}
              onChange={(e) => handleInputChange('smtp_password', e.target.value, 'email')}
              style={formStyles.input}
            />
          </div>
        </div>
      </div>

      <div style={formStyles.section}>
        <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('sender') }}>
          Sender Information
        </h3>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>From Email</label>
            <input
              type="email"
              value={emailSettings.from_email}
              onChange={(e) => handleInputChange('from_email', e.target.value, 'email')}
              style={formStyles.input}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>From Name</label>
            <input
              type="text"
              value={emailSettings.from_name}
              onChange={(e) => handleInputChange('from_name', e.target.value, 'email')}
              style={formStyles.input}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Email Settings'}
        </Button>
      </div>
    </form>
  )

  const renderInvoiceSettings = () => (
    <form onSubmit={handleInvoiceSubmit} style={{ maxWidth: '800px' }}>
      <div style={formStyles.section}>
        <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('invoice') }}>
          Invoice Configuration
        </h3>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Invoice Prefix</label>
            <input
              type="text"
              value={invoiceSettings.invoice_prefix}
              onChange={(e) => handleInputChange('invoice_prefix', e.target.value, 'invoice')}
              style={formStyles.input}
            />
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Default Currency</label>
            <select
              value={invoiceSettings.default_currency}
              onChange={(e) => handleInputChange('default_currency', e.target.value, 'invoice')}
              style={formStyles.select}
            >
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
        </div>
        <div style={formStyles.formGroup}>
          <label style={formStyles.label}>Invoice Number Format</label>
          <input
            type="text"
            value={invoiceSettings.invoice_number_format}
            onChange={(e) => handleInputChange('invoice_number_format', e.target.value, 'invoice')}
            style={formStyles.input}
            placeholder="INV-{YEAR}-{NUMBER}"
          />
        </div>
        <div style={formStyles.formGroup}>
          <label style={formStyles.label}>Payment Terms</label>
          <input
            type="text"
            value={invoiceSettings.payment_terms}
            onChange={(e) => handleInputChange('payment_terms', e.target.value, 'invoice')}
            style={formStyles.input}
            placeholder="Net 30"
          />
        </div>
      </div>

      <div style={formStyles.section}>
        <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('template') }}>
          Invoice Template
        </h3>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Invoice Template</label>
            <select
              value={invoiceSettings.invoice_template}
              onChange={(e) => handleInputChange('invoice_template', e.target.value, 'invoice')}
              style={formStyles.select}
            >
              <option value="simple">Simple Format</option>
              <option value="detailed">Detailed Format</option>
            </select>
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Auto Numbering</label>
            <select
              value={invoiceSettings.auto_numbering ? 'true' : 'false'}
              onChange={(e) => handleInputChange('auto_numbering', e.target.value, 'invoice')}
              style={formStyles.select}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <Button 
            onClick={() => setTemplateManagerOpen(true)} 
            variant="secondary"
            style={{ marginRight: '12px' }}
          >
            Manage Templates
          </Button>
          <span style={{ fontSize: '14px', color: '#6c757d' }}>
            Create and customize invoice templates with different designs and layouts
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Invoice Settings'}
        </Button>
      </div>
    </form>
  )

  const renderContent = () => {
    switch (section) {
      case 'company':
        return renderCompanySettings()
      case 'tax':
        return renderTaxSettings()
      case 'users':
        return renderUserSettings()
      case 'email':
        return renderEmailSettings()
      case 'invoice':
        return renderInvoiceSettings()
      default:
        return (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Welcome to Settings</h2>
            <p>Please select a settings section from the sidebar.</p>
          </div>
        )
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ 
          margin: '0',
          fontSize: '28px',
          fontWeight: '600',
          color: '#2c3e50'
        }}>
          {getSectionTitle()}
        </h1>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && (
        <div style={{ 
          padding: '12px 16px', 
          marginBottom: '20px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '6px', 
          color: '#155724',
          fontSize: '14px'
        }}>
          {success}
        </div>
      )}

      {loading && !error ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Loading settings...</div>
        </div>
      ) : (
        renderContent()
      )}

      <GSTTemplateManager 
        isOpen={templateManagerOpen}
        onClose={() => setTemplateManagerOpen(false)}
      />
    </div>
  )
}

