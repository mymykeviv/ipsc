import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { ErrorMessage } from '../components/ErrorMessage'
import { EnhancedFilterBar } from '../components/EnhancedFilterBar'
import { FilterDropdown } from '../components/FilterDropdown'
import { DateFilter } from '../components/DateFilter'
import { SearchBar } from '../components/SearchBar'
import { ActionButtons, ActionButtonSets } from '../components/ActionButtons'
import { EnhancedHeader, HeaderPatterns } from '../components/EnhancedHeader'
import { Party, apiListCustomers, apiListVendors, apiCreateParty, apiUpdateParty, apiToggleParty } from '../lib/api'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'

interface PartyFormData {
  type: 'customer' | 'vendor'
  name: string
  contact_person: string
  contact_number: string
  email: string
  gstin: string
  gst_registration_status: string
  gst_status: 'GST' | 'Non-GST' | 'Exempted'
  billing_address_line1: string
  billing_address_line2: string
  billing_city: string
  billing_state: string
  billing_country: string
  billing_pincode: string
  shipping_address_line1: string
  shipping_address_line2: string
  shipping_city: string
  shipping_state: string
  shipping_country: string
  shipping_pincode: string
  notes: string
}

interface PartiesProps {
  type?: 'customer' | 'vendor'
  mode?: 'manage' | 'add' | 'edit'
}

// Filter state interface
interface PartiesFilterState {
  // Quick filters
  quickFilter: 'all' | 'active' | 'gst' | 'non_gst' | 'recent' | 'outstanding'
  
  // Advanced filters
  search: string
  contactPerson: string
  email: string
  phone: string
  city: string
  state: string
  country: string
  gstStatus: string
  gstRegistration: string
  gstStateCode: string
  partyType: 'customer' | 'vendor' | 'both'
  status: 'active' | 'inactive' | 'all'
  dateRange: { start: string; end: string }
  hasNotes: boolean
  
  // Sort options
  sortBy: string
  sortOrder: 'asc' | 'desc'
  
  // Pagination
  page: number
  limit: number
}

export function Parties({ type = 'customer', mode = 'manage' }: PartiesProps) {
  const { forceLogout } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const handleApiError = createApiErrorHandler(forceLogout)
  
  const [activeTab, setActiveTab] = useState<'customers' | 'vendors'>(type === 'vendor' ? 'vendors' : 'customers')
  const [customers, setCustomers] = useState<Party[]>([])
  const [vendors, setVendors] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [editingParty, setEditingParty] = useState<Party | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showInactive, setShowInactive] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState<PartiesFilterState>({
    quickFilter: 'all',
    search: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    gstStatus: '',
    gstRegistration: '',
    gstStateCode: '',
    partyType: 'both',
    status: 'all',
    dateRange: { start: '', end: '' },
    hasNotes: false,
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    limit: 10
  })
  
  const [formData, setFormData] = useState<PartyFormData>({
    type: type,
    name: '',
    contact_person: '',
    contact_number: '',
    email: '',
    gstin: '',
    gst_registration_status: 'GST not registered',
    gst_status: 'GST',
    billing_address_line1: '',
    billing_address_line2: '',
    billing_city: '',
    billing_state: '',
    billing_country: 'India',
    billing_pincode: '',
    shipping_address_line1: '',
    shipping_address_line2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_country: '',
    shipping_pincode: '',
    notes: ''
  })

  // Load editing party data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && id) {
      loadEditingParty()
    }
  }, [mode, id])

  const loadEditingParty = async () => {
    try {
      setLoading(true)
      const allParties = [...customers, ...vendors]
      const party = allParties.find(p => p.id === parseInt(id!))
      if (party) {
        setEditingParty(party)
        setFormData({
          type: party.type,
          name: party.name,
          contact_person: party.contact_person || '',
          contact_number: party.contact_number || '',
          email: party.email || '',
          gstin: party.gstin || '',
          gst_registration_status: party.gst_registration_status,
          gst_status: party.gst_enabled ? 'GST' : 'Non-GST',
          billing_address_line1: party.billing_address_line1 || '',
          billing_address_line2: party.billing_address_line2 || '',
          billing_city: party.billing_city || '',
          billing_state: party.billing_state || '',
          billing_country: party.billing_country || 'India',
          billing_pincode: party.billing_pincode || '',
          shipping_address_line1: party.shipping_address_line1 || '',
          shipping_address_line2: party.shipping_address_line2 || '',
          shipping_city: party.shipping_city || '',
          shipping_state: party.shipping_state || '',
          shipping_country: party.shipping_country || '',
          shipping_pincode: party.shipping_pincode || '',
          notes: party.notes || ''
        })
      }
    } catch (err) {
      console.error('Failed to load party:', err)
      handleApiError(err)
      setError('Failed to load party')
    } finally {
      setLoading(false)
    }
  }

  const loadParties = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (type === 'customer') {
        const customersData = await apiListCustomers(filters.search, showInactive)
        setCustomers(customersData)
        setVendors([])
      } else if (type === 'vendor') {
        const vendorsData = await apiListVendors(filters.search, showInactive)
        setVendors(vendorsData)
        setCustomers([])
      } else {
        // Load both when no specific type is specified
        const [customersData, vendorsData] = await Promise.all([
          apiListCustomers(filters.search, showInactive),
          apiListVendors(filters.search, showInactive)
        ])
        setCustomers(customersData)
        setVendors(vendorsData)
      }
    } catch (err) {
      console.error('Failed to load parties:', err)
      handleApiError(err)
      setError('Failed to load parties')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mode === 'manage') {
      loadParties()
      setCurrentPage(1) // Reset to first page when filters change
    }
  }, [filters.search, showInactive, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      
      const payload = {
        type: formData.type,
        name: formData.name,
        contact_person: formData.contact_person || null,
        contact_number: formData.contact_number || null,
        email: formData.email || null,
        gstin: formData.gstin || null,
        gst_registration_status: formData.gst_registration_status,
        gst_enabled: formData.gst_status === 'GST',
        billing_address_line1: formData.billing_address_line1,
        billing_address_line2: formData.billing_address_line2 || null,
        billing_city: formData.billing_city,
        billing_state: formData.billing_state,
        billing_country: formData.billing_country,
        billing_pincode: formData.billing_pincode || null,
        shipping_address_line1: formData.shipping_address_line1 || null,
        shipping_address_line2: formData.shipping_address_line2 || null,
        shipping_city: formData.shipping_city || null,
        shipping_state: formData.shipping_state || null,
        shipping_country: formData.shipping_country || null,
        shipping_pincode: formData.shipping_pincode || null,
        notes: formData.notes || null
      }

      if (mode === 'edit' && editingParty) {
        await apiUpdateParty(editingParty.id, payload)
      } else {
        await apiCreateParty(payload)
      }
      
      // Navigate back to manage view
      navigate(`/${formData.type === 'vendor' ? 'vendors' : 'customers'}`)
    } catch (err) {
      console.error('Failed to save party:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleParty = async (party: Party) => {
    try {
             await apiToggleParty(party.id)
      loadParties()
    } catch (err) {
      console.error('Failed to toggle party:', err)
      handleApiError(err)
      setError('Failed to toggle party status')
    }
  }

  const handleInputChange = (field: keyof PartyFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCancel = () => {
    navigate(`/${type === 'vendor' ? 'vendors' : 'customers'}`)
  }

  const copyBillingAddress = () => {
    setFormData(prev => ({
      ...prev,
      shipping_address_line1: prev.billing_address_line1,
      shipping_address_line2: prev.billing_address_line2,
      shipping_city: prev.billing_city,
      shipping_state: prev.billing_state,
      shipping_country: prev.billing_country,
      shipping_pincode: prev.billing_pincode
    }));
  };

  // Filter functions
  const handleQuickFilter = (filter: PartiesFilterState['quickFilter']) => {
    setFilters(prev => ({ ...prev, quickFilter: filter }))
  }

  const handleFilterChange = (field: keyof PartiesFilterState, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const clearAllFilters = () => {
    setFilters({
      quickFilter: 'all',
      search: '',
      contactPerson: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      country: '',
      gstStatus: '',
      gstRegistration: '',
      gstStateCode: '',
      partyType: 'both',
      status: 'all',
      dateRange: { start: '', end: '' },
      hasNotes: false,
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
      limit: 10
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.contactPerson) count++
    if (filters.email) count++
    if (filters.phone) count++
    if (filters.city) count++
    if (filters.state) count++
    if (filters.country) count++
    if (filters.gstStatus) count++
    if (filters.gstRegistration) count++
    if (filters.gstStateCode) count++
    if (filters.partyType !== 'both') count++
    if (filters.status !== 'all') count++
    if (filters.dateRange.start || filters.dateRange.end) count++
    if (filters.hasNotes) count++
    return count
  }

  // Get enhanced quick filter options with consistent labels and icons
  const getQuickFilterOptions = () => {
    const baseOptions = [
      { value: 'all', label: '📊 All Parties', icon: '📊' },
      { value: 'active', label: '✅ Active', icon: '✅' },
      { value: 'gst', label: '🏛️ GST Registered', icon: '🏛️' },
      { value: 'non_gst', label: '❌ Non-GST', icon: '❌' },
      { value: 'recent', label: '📅 Recent (30 Days)', icon: '📅' },
      { value: 'outstanding', label: '💰 Outstanding', icon: '💰' },
      { value: 'low_activity', label: '⚠️ Low Activity', icon: '⚠️' },
      { value: 'new_this_month', label: '🆕 New This Month', icon: '🆕' },
      { value: 'high_value', label: '💎 High Value', icon: '💎' },
      { value: 'inactive', label: '🚫 Inactive', icon: '🚫' }
    ]
    return baseOptions
  }

  // Render form for add/edit modes
  if (mode === 'add' || mode === 'edit') {
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
            {mode === 'add' ? `Add New ${type === 'vendor' ? 'Vendor' : 'Customer'}` : `Edit ${type === 'vendor' ? 'Vendor' : 'Customer'}`}
          </h1>
          <Button 
            onClick={() => navigate(`/${type === 'vendor' ? 'vendors' : 'customers'}`)}
            variant="secondary"
            style={{ 
              padding: '10px 16px', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Back to {type === 'vendor' ? 'Vendors' : 'Customers'}
          </Button>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Row 1: Basic Information | GST Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            
            {/* Basic Information Section */}
            <div style={formStyles.section}>
              <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('basic') }}>
                📋 Basic Information
              </h3>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Party Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as 'customer' | 'vendor')}
                  style={formStyles.select}
                  required
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  style={formStyles.input}
                  required
                />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  style={formStyles.input}
                />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Contact Number</label>
                <input
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) => handleInputChange('contact_number', e.target.value)}
                  style={formStyles.input}
                />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={formStyles.input}
                />
              </div>
            </div>

            {/* GST Information Section */}
            <div style={formStyles.section}>
              <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('gst') }}>
                🏛️ GST Information
              </h3>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>GST Status *</label>
                <select
                  value={formData.gst_status}
                  onChange={(e) => handleInputChange('gst_status', e.target.value as 'GST' | 'Non-GST' | 'Exempted')}
                  style={formStyles.select}
                  required
                >
                  <option value="GST">GST</option>
                  <option value="Non-GST">Non-GST</option>
                  <option value="Exempted">Exempted</option>
                </select>
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  {formData.gst_status === 'GST' ? 'GST will be calculated on invoices' : 
                   formData.gst_status === 'Non-GST' ? 'No GST calculation for this party' :
                   'GST exempted transactions'}
                </div>
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>GSTIN</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value)}
                  style={formStyles.input}
                  placeholder="15-digit GSTIN"
                  maxLength={15}
                />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>GST Registration Status</label>
                <select
                  value={formData.gst_registration_status}
                  onChange={(e) => handleInputChange('gst_registration_status', e.target.value)}
                  style={formStyles.select}
                  disabled={formData.gst_status !== 'GST'}
                >
                  <option value="GST not registered">GST not registered</option>
                  <option value="GST registered">GST registered</option>
                  <option value="Composition scheme">Composition scheme</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Billing Address | Shipping Address */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            
            {/* Billing Address Section */}
            <div style={formStyles.section}>
              <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('billing') }}>
                📮 Billing Address
              </h3>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Address Line 1 *</label>
                <input
                  type="text"
                  value={formData.billing_address_line1}
                  onChange={(e) => handleInputChange('billing_address_line1', e.target.value)}
                  style={formStyles.input}
                  required
                />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Address Line 2</label>
                <input
                  type="text"
                  value={formData.billing_address_line2}
                  onChange={(e) => handleInputChange('billing_address_line2', e.target.value)}
                  style={formStyles.input}
                />
              </div>
              <div style={formStyles.grid2Col}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>City *</label>
                  <input
                    type="text"
                    value={formData.billing_city}
                    onChange={(e) => handleInputChange('billing_city', e.target.value)}
                    style={formStyles.input}
                    required
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>State *</label>
                  <input
                    type="text"
                    value={formData.billing_state}
                    onChange={(e) => handleInputChange('billing_state', e.target.value)}
                    style={formStyles.input}
                    required
                  />
                </div>
              </div>
              <div style={formStyles.grid2Col}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Pincode *</label>
                  <input
                    type="text"
                    value={formData.billing_pincode}
                    onChange={(e) => handleInputChange('billing_pincode', e.target.value)}
                    style={formStyles.input}
                    required
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Country</label>
                  <input
                    type="text"
                    value={formData.billing_country}
                    onChange={(e) => handleInputChange('billing_country', e.target.value)}
                    style={formStyles.input}
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address Section */}
            <div style={formStyles.section}>
              <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('shipping') }}>
                📦 Shipping Address
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                  Same as billing address?
                </div>
                <Button
                  variant="secondary"
                  onClick={copyBillingAddress}
                  style={{ 
                    fontSize: '12px', 
                    padding: '6px 12px',
                    backgroundColor: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy Billing Address
                </Button>
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Address Line 1</label>
                <input
                  type="text"
                  value={formData.shipping_address_line1}
                  onChange={(e) => handleInputChange('shipping_address_line1', e.target.value)}
                  style={formStyles.input}
                />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Address Line 2</label>
                <input
                  type="text"
                  value={formData.shipping_address_line2}
                  onChange={(e) => handleInputChange('shipping_address_line2', e.target.value)}
                  style={formStyles.input}
                />
              </div>
              <div style={formStyles.grid2Col}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>City</label>
                  <input
                    type="text"
                    value={formData.shipping_city}
                    onChange={(e) => handleInputChange('shipping_city', e.target.value)}
                    style={formStyles.input}
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>State</label>
                  <input
                    type="text"
                    value={formData.shipping_state}
                    onChange={(e) => handleInputChange('shipping_state', e.target.value)}
                    style={formStyles.input}
                  />
                </div>
              </div>
              <div style={formStyles.grid2Col}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Pincode</label>
                  <input
                    type="text"
                    value={formData.shipping_pincode}
                    onChange={(e) => handleInputChange('shipping_pincode', e.target.value)}
                    style={formStyles.input}
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Country</label>
                  <input
                    type="text"
                    value={formData.shipping_country}
                    onChange={(e) => handleInputChange('shipping_country', e.target.value)}
                    style={formStyles.input}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Other Details */}
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('other') }}>
              📝 Other Details
            </h3>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                style={{ ...formStyles.input, minHeight: '80px', resize: 'vertical' }}
                placeholder="Additional notes about this party..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end', 
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? `Saving ${type === 'customer' ? 'Customer' : 'Vendor'}...` : (mode === 'add' ? 'Add' : 'Update')} {type === 'customer' ? 'Customer' : 'Vendor'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // Render manage mode (existing list view)
  const currentParties = type === 'customer' ? customers : 
                        type === 'vendor' ? vendors : 
                        activeTab === 'customers' ? customers : vendors

  // Sorting function
  const sortedParties = [...currentParties].sort((a, b) => {
    const aValue = a[sortField as keyof Party]
    const bValue = b[sortField as keyof Party]
    
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1
    
    const comparison = String(aValue).localeCompare(String(bValue))
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Pagination
  const totalPages = Math.ceil(sortedParties.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedParties = sortedParties.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <EnhancedHeader
        {...HeaderPatterns.parties(type === 'customer' ? customers.length : vendors.length)}
        primaryAction={{
          label: type === 'customer' ? 'Add Customer' : 'Add Vendor',
          onClick: () => navigate(`/${type}s/add`),
          icon: type === 'customer' ? '👤' : '🏢'
        }}
        secondaryActions={type === 'customer' ? [
          {
            label: 'View All Parties',
            onClick: () => navigate('/parties'),
            icon: '📋'
          }
        ] : [
          {
            label: 'View All Parties',
            onClick: () => navigate('/parties'),
            icon: '📋'
          }
        ]}
      />

      {error && <ErrorMessage message={error} />}

      {/* Show tabs only when viewing all parties, not when on specific customer/vendor pages */}
      {!type ? (
        <div style={{ 
          display: 'flex', 
          borderBottom: '2px solid #e9ecef',
          marginBottom: '24px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px 8px 0 0',
          padding: '4px 4px 0 4px'
        }}>
          <button
            onClick={() => setActiveTab('customers')}
            style={{
              padding: '16px 32px',
              border: 'none',
              backgroundColor: activeTab === 'customers' ? '#fff' : 'transparent',
              color: activeTab === 'customers' ? '#007bff' : '#6c757d',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'customers' ? '600' : '500',
              borderRadius: '6px 6px 0 0',
              borderBottom: activeTab === 'customers' ? '2px solid #007bff' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'customers' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            👤 Customers
            <span style={{ 
              backgroundColor: activeTab === 'customers' ? '#007bff' : '#6c757d',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {customers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            style={{
              padding: '16px 32px',
              border: 'none',
              backgroundColor: activeTab === 'vendors' ? '#fff' : 'transparent',
              color: activeTab === 'vendors' ? '#007bff' : '#6c757d',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'vendors' ? '600' : '500',
              borderRadius: '6px 6px 0 0',
              borderBottom: activeTab === 'vendors' ? '2px solid #007bff' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'vendors' ? '0 -2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            🏢 Vendors
            <span style={{ 
              backgroundColor: activeTab === 'vendors' ? '#007bff' : '#6c757d',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {vendors.length}
            </span>
          </button>
        </div>
      ) : null}

      {/* Simple Search and Basic Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '20px',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ flex: 1 }}>
          <SearchBar
            placeholder="Search parties by name, contact, email..."
            value={filters.search}
            onChange={(value) => handleFilterChange('search', value)}
          />
        </div>
        <FilterDropdown
          value={filters.status}
          onChange={(value) => handleFilterChange('status', value)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]}
          placeholder="Status"
        />
        <FilterDropdown
          value={filters.gstStatus}
          onChange={(value) => handleFilterChange('gstStatus', value)}
          options={[
            { value: '', label: 'All GST Status' },
            { value: 'GST', label: 'GST' },
            { value: 'Non-GST', label: 'Non-GST' },
            { value: 'Exempted', label: 'Exempted' }
          ]}
          placeholder="GST Status"
        />
        <Button
          variant="secondary"
          onClick={clearAllFilters}
          style={{ 
            fontSize: '12px', 
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '500'
          }}
        >
          🗑️ Clear
        </Button>
      </div>

      {/* Enhanced Advanced Filters */}
      <EnhancedFilterBar
        title="🔍 Advanced Filters"
        activeFiltersCount={getActiveFiltersCount()}
        onClearAll={clearAllFilters}
        showClearAll={true}
        defaultCollapsed={true}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
          
          {/* Search & Contact Section */}
          <div style={{ 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            padding: '16px',
            backgroundColor: '#f8f9fa'
          }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#495057',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔍 Search & Contact
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <SearchBar
                placeholder="Contact person..."
                value={filters.contactPerson}
                onChange={(value) => handleFilterChange('contactPerson', value)}
              />
              <SearchBar
                placeholder="Email..."
                value={filters.email}
                onChange={(value) => handleFilterChange('email', value)}
              />
              <SearchBar
                placeholder="Phone number..."
                value={filters.phone}
                onChange={(value) => handleFilterChange('phone', value)}
              />
            </div>
          </div>

          {/* Location Section */}
          <div style={{ 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            padding: '16px',
            backgroundColor: '#f8f9fa'
          }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#495057',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📍 Location
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <SearchBar
                placeholder="City..."
                value={filters.city}
                onChange={(value) => handleFilterChange('city', value)}
              />
              <SearchBar
                placeholder="State..."
                value={filters.state}
                onChange={(value) => handleFilterChange('state', value)}
              />
              <SearchBar
                placeholder="Country..."
                value={filters.country}
                onChange={(value) => handleFilterChange('country', value)}
              />
            </div>
          </div>

          {/* GST & Compliance Section */}
          <div style={{ 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            padding: '16px',
            backgroundColor: '#f8f9fa'
          }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#495057',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🏛️ GST & Compliance
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>GST Registration</div>
                <FilterDropdown
                  value={filters.gstRegistration}
                  onChange={(value) => handleFilterChange('gstRegistration', value)}
                  options={[
                    { value: '', label: 'All Registration' },
                    { value: 'GST registered', label: 'GST Registered' },
                    { value: 'GST not registered', label: 'GST Not Registered' },
                    { value: 'Composition scheme', label: 'Composition Scheme' }
                  ]}
                  placeholder="Select Registration"
                />
              </div>
              <SearchBar
                placeholder="GST State Code..."
                value={filters.gstStateCode}
                onChange={(value) => handleFilterChange('gstStateCode', value)}
              />
            </div>
          </div>

          {/* Business Details Section */}
          <div style={{ 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            padding: '16px',
            backgroundColor: '#f8f9fa'
          }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#495057',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💼 Business Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Party Type</div>
                <FilterDropdown
                  value={filters.partyType}
                  onChange={(value) => handleFilterChange('partyType', value)}
                  options={[
                    { value: 'both', label: 'All Parties' },
                    { value: 'customer', label: 'Customers Only' },
                    { value: 'vendor', label: 'Vendors Only' }
                  ]}
                  placeholder="Select Party Type"
                />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Created Date Range</div>
                <DateFilter
                  value={filters.dateRange.start && filters.dateRange.end ? `custom:${filters.dateRange.start}:${filters.dateRange.end}` : 'all'}
                  onChange={(value) => {
                    if (value.startsWith('custom:')) {
                      const [, start, end] = value.split(':')
                      handleFilterChange('dateRange', { start, end })
                    } else {
                      handleFilterChange('dateRange', { start: '', end: '' })
                    }
                  }}
                  placeholder="Select Date Range"
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end',
            paddingTop: '8px',
            borderTop: '1px solid #e9ecef'
          }}>
            <Button
              variant="secondary"
              onClick={clearAllFilters}
              style={{ 
                fontSize: '12px', 
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500'
              }}
            >
              🗑️ Clear All Filters
            </Button>
            <Button
              variant="primary"
              onClick={loadParties}
              style={{ 
                fontSize: '12px', 
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500'
              }}
            >
              ✅ Apply Filters
            </Button>
          </div>
        </div>
      </EnhancedFilterBar>

      {/* Parties Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Loading...</div>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#fff',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          overflow: 'visible'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }}>
                  Name
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }}>
                  Contact
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }}>
                  Email
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }}>
                  GSTIN
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }}>
                  Status
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedParties.map((party) => (
                <tr key={party.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <div style={{ fontWeight: '500' }}>{party.name}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {party.type === 'customer' ? 'Customer' : 'Vendor'}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <div>{party.contact_person || '-'}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {party.contact_number || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {party.email || '-'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {party.gstin || '-'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: party.is_active ? '#d4edda' : '#f8d7da',
                      color: party.is_active ? '#155724' : '#721c24'
                    }}>
                      {party.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <ActionButtons
                      {...ActionButtonSets.parties(party, {
                        onEdit: () => navigate(`/${party.type === 'vendor' ? 'vendors' : 'customers'}/edit/${party.id}`),
                        onToggle: () => handleToggleParty(party)
                      })}
                      maxVisible={1}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '8px',
          marginTop: '20px'
        }}>
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            variant="secondary"
            style={{ padding: '8px 12px', fontSize: '14px' }}
          >
            Previous
          </Button>
          <span style={{ fontSize: '14px', color: '#6c757d' }}>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="secondary"
            style={{ padding: '8px 12px', fontSize: '14px' }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

export default Parties

