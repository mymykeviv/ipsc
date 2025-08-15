import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { ErrorMessage } from '../components/ErrorMessage'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showInactive, setShowInactive] = useState(false)
  const [formData, setFormData] = useState<PartyFormData>({
    type: type,
    name: '',
    contact_person: '',
    contact_number: '',
    email: '',
    gstin: '',
    gst_registration_status: 'GST not registered',
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
      const [customersData, vendorsData] = await Promise.all([
        apiListCustomers(searchTerm, showInactive),
        apiListVendors(searchTerm, showInactive)
      ])
      setCustomers(customersData)
      setVendors(vendorsData)
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
      setCurrentPage(1) // Reset to first page when search changes
    }
  }, [searchTerm, showInactive, mode])

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

  const handleInputChange = (field: keyof PartyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
          {/* Party Type Section */}
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('basic') }}>
              Party Type
            </h3>
            <div style={formStyles.grid2Col}>
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
            </div>
          </div>

          {/* Basic Information Section */}
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('billing') }}>
              Basic Information
            </h3>
            <div style={formStyles.grid2Col}>
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
            </div>
            <div style={formStyles.grid2Col}>
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
          </div>

          {/* GST Information Section */}
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('shipping') }}>
              GST Information
            </h3>
            <div style={formStyles.grid2Col}>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>GSTIN</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value)}
                  style={formStyles.input}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>GST Registration Status</label>
                <select
                  value={formData.gst_registration_status}
                  onChange={(e) => handleInputChange('gst_registration_status', e.target.value)}
                  style={formStyles.select}
                >
                  <option value="GST not registered">GST not registered</option>
                  <option value="GST registered">GST registered</option>
                  <option value="Composition scheme">Composition scheme</option>
                </select>
              </div>
            </div>
          </div>

          {/* Billing Address Section */}
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor(3) }}>
              Billing Address
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
            <div style={formStyles.grid3Col}>
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

          {/* Shipping Address Section */}
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor(4) }}>
              Shipping Address
            </h3>
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
            <div style={formStyles.grid3Col}>
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
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Pincode</label>
                <input
                  type="text"
                  value={formData.shipping_pincode}
                  onChange={(e) => handleInputChange('shipping_pincode', e.target.value)}
                  style={formStyles.input}
                />
              </div>
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

          {/* Other Details Section */}
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor(5) }}>
              Other Details
            </h3>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                style={formStyles.textarea}
                rows={3}
                placeholder="Additional notes about this party..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div style={formStyles.formActions}>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate(`/${type === 'vendor' ? 'vendors' : 'customers'}`)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (mode === 'add' ? 'Add Party' : 'Update Party')}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // Render manage mode (existing list view)
  const currentParties = activeTab === 'customers' ? customers : vendors

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
      {/* Header */}
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
          Parties
        </h1>
        
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <Button 
            onClick={() => navigate('/customers/add')}
            variant="primary"
            style={{ 
              padding: '10px 16px', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👤 Add Customer
          </Button>
          <Button 
            onClick={() => navigate('/vendors/add')}
            variant="primary"
            style={{ 
              padding: '10px 16px', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🏢 Add Vendor
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #e9ecef',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('customers')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'customers' ? '#007bff' : 'transparent',
            color: activeTab === 'customers' ? '#fff' : '#6c757d',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'customers' ? '600' : '400',
            borderBottom: activeTab === 'customers' ? '2px solid #007bff' : 'none'
          }}
        >
          Customers ({customers.length})
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'vendors' ? '#007bff' : 'transparent',
            color: activeTab === 'vendors' ? '#fff' : '#6c757d',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'vendors' ? '600' : '400',
            borderBottom: activeTab === 'vendors' ? '2px solid #007bff' : 'none'
          }}
        >
          Vendors ({vendors.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '200px'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <label
              htmlFor="show-inactive-dropdown"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: showInactive ? '#e3f2fd' : '#fff',
                userSelect: 'none'
              }}
            >
              Show Inactive:
              <select
                id="show-inactive-dropdown"
                value={showInactive ? 'Yes' : 'No'}
                onChange={(e) => {
                  console.log('Dropdown changed, new value:', e.target.value)
                  setShowInactive(e.target.value === 'Yes')
                }}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                console.log('Test button clicked, current showInactive:', showInactive)
                setShowInactive(!showInactive)
              }}
              style={{
                marginLeft: '10px',
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Test Toggle ({showInactive ? 'ON' : 'OFF'})
            </button>
          </div>
        </div>
      </div>

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
          overflow: 'hidden'
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
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Button
                        onClick={() => navigate(`/${party.type === 'vendor' ? 'vendors' : 'customers'}/edit/${party.id}`)}
                        variant="secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleToggleParty(party)}
                        variant={party.is_active ? "danger" : "success"}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        {party.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
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

