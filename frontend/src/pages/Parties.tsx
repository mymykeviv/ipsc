import React, { useState, useEffect } from 'react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Party, apiListCustomers, apiListVendors, apiCreateParty, apiUpdateParty, apiToggleParty } from '../lib/api'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'

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

export function Parties() {
  const { forceLogout } = useAuth()
  const handleApiError = createApiErrorHandler(forceLogout)
  
  const [activeTab, setActiveTab] = useState<'customers' | 'vendors'>('customers')
  const [customers, setCustomers] = useState<Party[]>([])
  const [vendors, setVendors] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingParty, setEditingParty] = useState<Party | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showInactive, setShowInactive] = useState(false)
  const [formData, setFormData] = useState<PartyFormData>({
    type: 'customer',
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
    loadParties()
    setCurrentPage(1) // Reset to first page when search changes
  }, [searchTerm, showInactive])

  const resetForm = () => {
    setFormData({
      type: activeTab === 'customers' ? 'customer' : 'vendor',
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
  }

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // Name validation
    if (!formData.name.trim()) {
      errors.push('Name is required')
    } else if (formData.name.length > 100) {
      errors.push('Name must be 100 characters or less')
    } else if (!/^[a-zA-Z0-9\s]+$/.test(formData.name)) {
      errors.push('Name must be alphanumeric with spaces only')
    }
    
    // Contact Person validation
    if (formData.contact_person && formData.contact_person.length > 100) {
      errors.push('Contact Person must be 100 characters or less')
    }
    
    // Contact Number validation
    if (formData.contact_number && formData.contact_number.length > 50) {
      errors.push('Contact Number must be 50 characters or less')
    }
    
    // Email validation
    if (formData.email) {
      if (formData.email.length > 100) {
        errors.push('Email must be 100 characters or less')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push('Email must be a valid email address')
      }
    }
    
    // GSTIN validation
    if (formData.gstin) {
      if (formData.gstin.length !== 16) {
        errors.push('GST Registration Number must be exactly 16 characters')
      } else if (!/^[A-Z0-9]+$/.test(formData.gstin)) {
        errors.push('GST Registration Number must be alphanumeric without spaces')
      }
    }
    
    // Billing Address validation
    if (!formData.billing_address_line1.trim()) {
      errors.push('Billing Address is required')
    } else if (formData.billing_address_line1.length > 200) {
      errors.push('Billing Address must be 200 characters or less')
    }
    
    if (!formData.billing_city.trim()) {
      errors.push('Billing City is required')
    } else if (formData.billing_city.length > 100) {
      errors.push('Billing City must be 100 characters or less')
    }
    
    if (!formData.billing_state.trim()) {
      errors.push('Billing State is required')
    } else if (formData.billing_state.length > 100) {
      errors.push('Billing State must be 100 characters or less')
    }
    
    if (!formData.billing_country.trim()) {
      errors.push('Billing Country is required')
    } else if (formData.billing_country.length > 100) {
      errors.push('Billing Country must be 100 characters or less')
    }
    
    // Shipping Address validation
    if (formData.shipping_address_line1 && formData.shipping_address_line1.length > 200) {
      errors.push('Shipping Address must be 200 characters or less')
    }
    
    return { isValid: errors.length === 0, errors }
  }

  const handleAddParty = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    const validation = validateForm()
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return
    }
    
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        type: activeTab === 'customers' ? 'customer' : 'vendor' as const,
        contact_person: formData.contact_person || undefined,
        contact_number: formData.contact_number || undefined,
        email: formData.email || undefined,
        gstin: formData.gstin || undefined,
        gst_registration_status: formData.gst_registration_status,
        billing_address_line1: formData.billing_address_line1,
        billing_address_line2: formData.billing_address_line2 || undefined,
        billing_city: formData.billing_city,
        billing_state: formData.billing_state,
        billing_country: formData.billing_country,
        billing_pincode: formData.billing_pincode || undefined,
        shipping_address_line1: formData.shipping_address_line1 || undefined,
        shipping_address_line2: formData.shipping_address_line2 || undefined,
        shipping_city: formData.shipping_city || undefined,
        shipping_state: formData.shipping_state || undefined,
        shipping_country: formData.shipping_country || undefined,
        shipping_pincode: formData.shipping_pincode || undefined,
        notes: formData.notes || undefined
      }

      await apiCreateParty(payload)
      setShowAddModal(false)
      resetForm()
      loadParties()
    } catch (err: any) {
      console.error('Failed to create party:', err)
      handleApiError(err)
      setError(err.message || 'Failed to create party')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateParty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingParty) return

    setError(null)
    
    const validation = validateForm()
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return
    }
    
    setLoading(true)

    try {
      const payload = {
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

      await apiUpdateParty(editingParty.id, payload)
      setShowEditModal(false)
      setEditingParty(null)
      resetForm()
      loadParties()
    } catch (err: any) {
      console.error('Failed to update party:', err)
      handleApiError(err)
      setError(err.message || 'Failed to update party')
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

  const openEditModal = (party: Party) => {
    setEditingParty(party)
    setFormData({
      type: party.type,
      name: party.name,
      contact_person: party.contact_person || '',
      contact_number: party.contact_number || '',
      email: party.email || '',
      gstin: party.gstin || '',
      gst_registration_status: party.gst_registration_status,
      billing_address_line1: party.billing_address_line1,
      billing_address_line2: party.billing_address_line2 || '',
      billing_city: party.billing_city,
      billing_state: party.billing_state,
      billing_country: party.billing_country,
      billing_pincode: party.billing_pincode || '',
      shipping_address_line1: party.shipping_address_line1 || '',
      shipping_address_line2: party.shipping_address_line2 || '',
      shipping_city: party.shipping_city || '',
      shipping_state: party.shipping_state || '',
      shipping_country: party.shipping_country || '',
      shipping_pincode: party.shipping_pincode || '',
      notes: party.notes || ''
    })
    setShowEditModal(true)
  }

  const copyBillingToShipping = () => {
    setFormData(prev => ({
      ...prev,
      shipping_address_line1: prev.billing_address_line1,
      shipping_address_line2: prev.billing_address_line2,
      shipping_city: prev.billing_city,
      shipping_state: prev.billing_state,
      shipping_country: prev.billing_country,
      shipping_pincode: prev.billing_pincode
    }))
  }

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
    <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1>Customer & Vendor Profiles</h1>
        <Button onClick={() => { resetForm(); setShowAddModal(true) }}>
          Add {activeTab === 'customers' ? 'Customer' : 'Vendor'}
        </Button>
      </div>

      <Card>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <Button
            variant={activeTab === 'customers' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('customers')}
          >
            Customers ({customers.length})
          </Button>
          <Button
            variant={activeTab === 'vendors' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('vendors')}
          >
            Vendors ({vendors.length})
          </Button>
        </div>

        {/* Search and Filters */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '16px'
            }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            Show Inactive
          </label>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : currentParties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            No {activeTab} found
          </div>
        ) : (
          <div style={{ 
            width: '100%',
            maxWidth: '100%',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              tableLayout: 'auto'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th 
                    style={{ padding: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => handleSort('name')}
                  >
                    Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{ padding: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => handleSort('contact_person')}
                  >
                    Contact {sortField === 'contact_person' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{ padding: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => handleSort('contact_number')}
                  >
                    Phone {sortField === 'contact_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{ padding: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => handleSort('email')}
                  >
                    Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{ padding: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => handleSort('gstin')}
                  >
                    GSTIN {sortField === 'gstin' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{ padding: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => handleSort('gst_registration_status')}
                  >
                    GST {sortField === 'gst_registration_status' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{ padding: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => handleSort('billing_city')}
                  >
                    Address {sortField === 'billing_city' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{ padding: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => handleSort('is_active')}
                  >
                    Status {sortField === 'is_active' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '14px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedParties.map((party) => (
                  <tr key={party.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{party.name}</td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{party.contact_person || '-'}</td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{party.contact_number || '-'}</td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{party.email || '-'}</td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{party.gstin || '-'}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: party.gst_registration_status === 'GST registered' ? '#dcfce7' : '#fef3c7',
                        color: party.gst_registration_status === 'GST registered' ? '#166534' : '#92400e'
                      }}>
                        {party.gst_registration_status}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontSize: '14px' }}>
                        <div>{party.billing_city}, {party.billing_state}</div>
                        <div>{party.billing_pincode}</div>
                      </div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: party.is_active ? '#dcfce7' : '#fecaca',
                        color: party.is_active ? '#166534' : '#dc2626'
                      }}>
                        {party.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="secondary"
                          onClick={() => openEditModal(party)}
                          style={{ fontSize: '14px', padding: '4px 8px' }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleToggleParty(party)}
                          style={{ fontSize: '14px', padding: '4px 8px' }}
                        >
                          {party.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: '20px',
                padding: '16px 0',
                borderTop: '1px solid var(--border)'
              }}>
                <div style={{ color: 'var(--muted)' }}>
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedParties.length)} of {sortedParties.length} {activeTab}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{ fontSize: '14px', padding: '4px 8px' }}
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'primary' : 'secondary'}
                      onClick={() => handlePageChange(page)}
                      style={{ fontSize: '14px', padding: '4px 8px', minWidth: '32px' }}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{ fontSize: '14px', padding: '4px 8px' }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Add Party Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius)',
            padding: '32px',
            width: '80%',
            maxWidth: '1200px',
            height: '80%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>Add {activeTab === 'customers' ? 'Customer' : 'Vendor'}</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddParty}>
              {/* Basic Information Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }}>
                  Basic Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="Enter party name"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Contact Person</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                      placeholder="Enter contact person name"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Contact Number</label>
                    <input
                      type="text"
                      value={formData.contact_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
                      placeholder="Enter contact number"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                </div>
              </div>

              {/* GST Information Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '8px' }}>
                  GST Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>GSTIN</label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value }))}
                      placeholder="Enter GSTIN number"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>GST Registration Status *</label>
                    <select
                      value={formData.gst_registration_status}
                      onChange={(e) => setFormData(prev => ({ ...prev, gst_registration_status: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    >
                      <option value="">Select GST Registration Status</option>
                      <option value="GST not registered">GST not registered</option>
                      <option value="GST registered">GST registered</option>
                      <option value="Composite Scheme">Composite Scheme</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Billing Address Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #ffc107', paddingBottom: '8px' }}>
                  Billing Address
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label>Address Line 1 *</label>
                    <input
                      type="text"
                      placeholder="Enter address line 1"
                      value={formData.billing_address_line1}
                      onChange={(e) => setFormData(prev => ({ ...prev, billing_address_line1: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      placeholder="Enter address line 2 (optional)"
                      value={formData.billing_address_line2}
                      onChange={(e) => setFormData(prev => ({ ...prev, billing_address_line2: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label>City *</label>
                      <input
                        type="text"
                        placeholder="Enter city"
                        value={formData.billing_city}
                        onChange={(e) => setFormData(prev => ({ ...prev, billing_city: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    <div>
                      <label>State *</label>
                      <input
                        type="text"
                        placeholder="Enter state"
                        value={formData.billing_state}
                        onChange={(e) => setFormData(prev => ({ ...prev, billing_state: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    <div>
                      <label>Country *</label>
                      <input
                        type="text"
                        placeholder="Enter country"
                        value={formData.billing_country}
                        onChange={(e) => setFormData(prev => ({ ...prev, billing_country: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    <div>
                      <label>Pincode</label>
                      <input
                        type="text"
                        placeholder="Enter pincode"
                        value={formData.billing_pincode}
                        onChange={(e) => setFormData(prev => ({ ...prev, billing_pincode: e.target.value }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '8px', margin: 0 }}>
                    Shipping Address
                  </h3>
                  <Button type="button" variant="secondary" onClick={copyBillingToShipping}>
                    Copy Billing Address
                  </Button>
                </div>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label>Address Line 1</label>
                    <input
                      type="text"
                      placeholder="Enter shipping address line 1"
                      value={formData.shipping_address_line1}
                      onChange={(e) => setFormData(prev => ({ ...prev, shipping_address_line1: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      placeholder="Enter shipping address line 2 (optional)"
                      value={formData.shipping_address_line2}
                      onChange={(e) => setFormData(prev => ({ ...prev, shipping_address_line2: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label>City</label>
                      <input
                        type="text"
                        placeholder="Enter shipping city"
                        value={formData.shipping_city}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipping_city: e.target.value }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    <div>
                      <label>State</label>
                      <input
                        type="text"
                        placeholder="Enter shipping state"
                        value={formData.shipping_state}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipping_state: e.target.value }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    <div>
                      <label>Country</label>
                      <input
                        type="text"
                        placeholder="Enter shipping country"
                        value={formData.shipping_country}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipping_country: e.target.value }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    <div>
                      <label>Pincode</label>
                      <input
                        type="text"
                        placeholder="Enter shipping pincode"
                        value={formData.shipping_pincode}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipping_pincode: e.target.value }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                />
              </div>

              {/* Error Display within Modal */}
              {error && (
                <div style={{
                  color: '#dc2626',
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  marginBottom: '16px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Party Modal */}
      {showEditModal && editingParty && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius)',
            padding: '32px',
            width: '80%',
            maxWidth: '1200px',
            height: '80%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>Edit {editingParty.type === 'customer' ? 'Customer' : 'Vendor'}</h2>
              <button
                onClick={() => { setShowEditModal(false); setEditingParty(null) }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateParty}>
              {/* Basic Information Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }}>
                  Basic Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="Enter party name"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Contact Person</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                      placeholder="Enter contact person name"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Contact Number</label>
                    <input
                      type="text"
                      value={formData.contact_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
                      placeholder="Enter contact number"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                </div>
              </div>

              {/* GST Information Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '8px' }}>
                  GST Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>GSTIN</label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value }))}
                      placeholder="Enter GSTIN number"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>GST Registration Status *</label>
                    <select
                      value={formData.gst_registration_status}
                      onChange={(e) => setFormData(prev => ({ ...prev, gst_registration_status: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    >
                      <option value="">Select GST Registration Status</option>
                      <option value="GST not registered">GST not registered</option>
                      <option value="GST registered">GST registered</option>
                      <option value="Composite Scheme">Composite Scheme</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Billing Address Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #ffc107', paddingBottom: '8px' }}>
                  Billing Address
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label>Address Line 1 *</label>
                    <input
                      type="text"
                      placeholder="Enter address line 1"
                      value={formData.billing_address_line1}
                      onChange={(e) => setFormData(prev => ({ ...prev, billing_address_line1: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      placeholder="Enter address line 2 (optional)"
                      value={formData.billing_address_line2}
                      onChange={(e) => setFormData(prev => ({ ...prev, billing_address_line2: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label>City *</label>
                      <input
                        type="text"
                        placeholder="Enter city"
                        value={formData.billing_city}
                        onChange={(e) => setFormData(prev => ({ ...prev, billing_city: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    <div>
                      <label>State *</label>
                      <input
                        type="text"
                        placeholder="Enter state"
                        value={formData.billing_state}
                        onChange={(e) => setFormData(prev => ({ ...prev, billing_state: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    <div>
                      <label>Pincode</label>
                      <input
                        type="text"
                        placeholder="Enter pincode"
                        value={formData.billing_pincode}
                        onChange={(e) => setFormData(prev => ({ ...prev, billing_pincode: e.target.value }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '8px', margin: 0 }}>
                    Shipping Address
                  </h3>
                  <Button type="button" variant="secondary" onClick={copyBillingToShipping}>
                    Copy Billing Address
                  </Button>
                </div>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label>Address Line 1</label>
                    <input
                      type="text"
                      placeholder="Enter shipping address line 1"
                      value={formData.shipping_address_line1}
                      onChange={(e) => setFormData(prev => ({ ...prev, shipping_address_line1: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      placeholder="Enter shipping address line 2 (optional)"
                      value={formData.shipping_address_line2}
                      onChange={(e) => setFormData(prev => ({ ...prev, shipping_address_line2: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label>City</label>
                      <input
                        type="text"
                        placeholder="Enter shipping city"
                        value={formData.shipping_city}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipping_city: e.target.value }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    <div>
                      <label>State</label>
                      <input
                        type="text"
                        placeholder="Enter shipping state"
                        value={formData.shipping_state}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipping_state: e.target.value }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    <div>
                      <label>Pincode</label>
                      <input
                        type="text"
                        placeholder="Enter shipping pincode"
                        value={formData.shipping_pincode}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipping_pincode: e.target.value }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display within Modal */}
              {error && (
                <div style={{
                  color: '#dc2626',
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  marginBottom: '16px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setEditingParty(null) }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

