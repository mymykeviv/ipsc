import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import { useFilterNavigation } from '../utils/filterNavigation'
import { useFilterReset } from '../hooks/useFilterReset'
import { getDefaultFilterState } from '../config/defaultFilterStates'

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
  const handleApiError = createApiErrorHandler({ onUnauthorized: forceLogout })
  
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

  // Enhanced Filter System - Unified State Management
  const defaultState = getDefaultFilterState('parties') as {
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
  }
  const { getFiltersFromURL, updateURLWithFilters, clearURLFilters } = useFilterNavigation(defaultState)
  const { resetAllFilters, getActiveFilterCount } = useFilterReset({
    pageName: 'parties',
    onReset: (newState) => {
      // Update all filter states
      setFilters(prev => ({
        ...prev,
        search: newState.search,
        contactPerson: newState.contactPerson,
        email: newState.email,
        phone: newState.phone,
        city: newState.city,
        state: newState.state,
        country: newState.country,
        gstStatus: newState.gstStatus,
        gstRegistration: newState.gstRegistration,
        gstStateCode: newState.gstStateCode,
        partyType: newState.partyType,
        status: newState.status,
        dateRange: newState.dateRange,
        hasNotes: newState.hasNotes
      }))
    }
  })
  
  // Filter state with URL integration
  const [filters, setFilters] = useState<PartiesFilterState>({
    quickFilter: 'all',
    search: defaultState.search,
    contactPerson: defaultState.contactPerson,
    email: defaultState.email,
    phone: defaultState.phone,
    city: defaultState.city,
    state: defaultState.state,
    country: defaultState.country,
    gstStatus: defaultState.gstStatus,
    gstRegistration: defaultState.gstRegistration,
    gstStateCode: defaultState.gstStateCode,
    partyType: defaultState.partyType,
    status: defaultState.status,
    dateRange: defaultState.dateRange,
    hasNotes: defaultState.hasNotes,
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    limit: 10
  })
  
  const [formData, setFormData] = useState<PartyFormData>({
    type: type, // This will be set based on the route
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

  // URL Parameter Integration - Apply filters from URL on component mount
  useEffect(() => {
    if (mode === 'manage') {
      const urlFilters = getFiltersFromURL()
      
      // Apply URL filters to state
      setFilters(prev => ({
        ...prev,
        search: urlFilters.search || prev.search,
        contactPerson: urlFilters.contactPerson || prev.contactPerson,
        email: urlFilters.email || prev.email,
        phone: urlFilters.phone || prev.phone,
        city: urlFilters.city || prev.city,
        state: urlFilters.state || prev.state,
        country: urlFilters.country || prev.country,
        gstStatus: urlFilters.gstStatus || prev.gstStatus,
        gstRegistration: urlFilters.gstRegistration || prev.gstRegistration,
        gstStateCode: urlFilters.gstStateCode || prev.gstStateCode,
        partyType: urlFilters.partyType || prev.partyType,
        status: urlFilters.status || prev.status,
        dateRange: urlFilters.dateRange || prev.dateRange,
        hasNotes: urlFilters.hasNotes || prev.hasNotes
      }))
    }
  }, [mode, getFiltersFromURL])

  // Update URL when filters change
  const updateFiltersAndURL = useCallback((newFilters: Partial<typeof defaultState>) => {
    const currentFilters = {
      search: filters.search,
      contactPerson: filters.contactPerson,
      email: filters.email,
      phone: filters.phone,
      city: filters.city,
      state: filters.state,
      country: filters.country,
      gstStatus: filters.gstStatus,
      gstRegistration: filters.gstRegistration,
      gstStateCode: filters.gstStateCode,
      partyType: filters.partyType,
      status: filters.status,
      dateRange: filters.dateRange,
      hasNotes: filters.hasNotes
    }
    
    const updatedFilters = { ...currentFilters, ...newFilters }
    updateURLWithFilters(updatedFilters)
  }, [filters, updateURLWithFilters])

  // Enhanced filter setters with URL integration
  const setSearchWithURL = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
    updateFiltersAndURL({ search: value })
  }, [updateFiltersAndURL])

  const setContactPersonWithURL = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, contactPerson: value }))
    updateFiltersAndURL({ contactPerson: value })
  }, [updateFiltersAndURL])

  const setEmailWithURL = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, email: value }))
    updateFiltersAndURL({ email: value })
  }, [updateFiltersAndURL])

  const setPhoneWithURL = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, phone: value }))
    updateFiltersAndURL({ phone: value })
  }, [updateFiltersAndURL])

  const setCityWithURL = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, city: value }))
    updateFiltersAndURL({ city: value })
  }, [updateFiltersAndURL])

  const setStateWithURL = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, state: value }))
    updateFiltersAndURL({ state: value })
  }, [updateFiltersAndURL])

  const setCountryWithURL = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, country: value }))
    updateFiltersAndURL({ country: value })
  }, [updateFiltersAndURL])

  const setGstStatusWithURL = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, gstStatus: value }))
    updateFiltersAndURL({ gstStatus: value })
  }, [updateFiltersAndURL])

  const setGstRegistrationWithURL = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, gstRegistration: value }))
    updateFiltersAndURL({ gstRegistration: value })
  }, [updateFiltersAndURL])

  const setGstStateCodeWithURL = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, gstStateCode: value }))
    updateFiltersAndURL({ gstStateCode: value })
  }, [updateFiltersAndURL])

  const setPartyTypeWithURL = useCallback((value: 'customer' | 'vendor' | 'both') => {
    setFilters(prev => ({ ...prev, partyType: value }))
    updateFiltersAndURL({ partyType: value })
  }, [updateFiltersAndURL])

  const setStatusWithURL = useCallback((value: 'active' | 'inactive' | 'all') => {
    setFilters(prev => ({ ...prev, status: value }))
    updateFiltersAndURL({ status: value })
  }, [updateFiltersAndURL])

  const setDateRangeWithURL = useCallback((value: { start: string; end: string }) => {
    setFilters(prev => ({ ...prev, dateRange: value }))
    updateFiltersAndURL({ dateRange: value })
  }, [updateFiltersAndURL])

  const setHasNotesWithURL = useCallback((value: boolean) => {
    setFilters(prev => ({ ...prev, hasNotes: value }))
    updateFiltersAndURL({ hasNotes: value })
  }, [updateFiltersAndURL])

  // Clear all filters handler
  const handleClearAllFilters = useCallback(() => {
    const currentState = {
      search: filters.search,
      contactPerson: filters.contactPerson,
      email: filters.email,
      phone: filters.phone,
      city: filters.city,
      state: filters.state,
      country: filters.country,
      gstStatus: filters.gstStatus,
      gstRegistration: filters.gstRegistration,
      gstStateCode: filters.gstStateCode,
      partyType: filters.partyType,
      status: filters.status,
      dateRange: filters.dateRange,
      hasNotes: filters.hasNotes
    }
    
    const newState = resetAllFilters(currentState)
    
    // Update all filter states
    setFilters(prev => ({
      ...prev,
      search: newState.search,
      contactPerson: newState.contactPerson,
      email: newState.email,
      phone: newState.phone,
      city: newState.city,
      state: newState.state,
      country: newState.country,
      gstStatus: newState.gstStatus,
      gstRegistration: newState.gstRegistration,
      gstStateCode: newState.gstStateCode,
      partyType: newState.partyType,
      status: newState.status,
      dateRange: newState.dateRange,
      hasNotes: newState.hasNotes
    }))
  }, [filters, resetAllFilters])

  // Get active filter count
  const activeFilterCount = getActiveFilterCount({
    search: filters.search,
    contactPerson: filters.contactPerson,
    email: filters.email,
    phone: filters.phone,
    city: filters.city,
    state: filters.state,
    country: filters.country,
    gstStatus: filters.gstStatus,
    gstRegistration: filters.gstRegistration,
    gstStateCode: filters.gstStateCode,
    partyType: filters.partyType,
    status: filters.status,
    dateRange: filters.dateRange,
    hasNotes: filters.hasNotes
  })

  // Update form type when type prop changes and reset form in add mode
  useEffect(() => {
    if (mode === 'add') {
      // Reset form data when entering add mode to prevent prefilling
      setFormData({
        type: type, // Set type based on route context
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
    } else {
      setFormData(prev => ({ ...prev, type }))
    }
  }, [type, mode])

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
      
      console.log('Loading parties with type:', type, 'and filters:', filters)
      
      if (type === 'customer') {
        const customersData = await apiListCustomers(filters.search, showInactive)
        console.log('Loaded customers:', customersData.length)
        setCustomers(customersData)
        setVendors([])
      } else if (type === 'vendor') {
        const vendorsData = await apiListVendors(filters.search, showInactive)
        console.log('Loaded vendors:', vendorsData.length)
        setVendors(vendorsData)
        setCustomers([])
      } else {
        // Load both when no specific type is specified
        console.log('Loading both customers and vendors')
        const [customersData, vendorsData] = await Promise.all([
          apiListCustomers(filters.search, showInactive),
          apiListVendors(filters.search, showInactive)
        ])
        console.log('Loaded customers:', customersData.length, 'vendors:', vendorsData.length)
        setCustomers(customersData)
        setVendors(vendorsData)
      }
    } catch (err) {
      console.error('Failed to load parties:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage || 'Failed to load parties')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mode === 'manage') {
      loadParties()
      setCurrentPage(1) // Reset to first page when filters change
    }
  }, [filters.search, showInactive, mode, type]) // Added type dependency

  // Add a manual refresh function
  const handleRefresh = () => {
    console.log('Manual refresh triggered')
    loadParties()
  }

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
              {/* Party Type is determined by the route context (Add Customer vs Add Vendor) */}
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Party Type</label>
                <input
                  type="text"
                  value={type === 'vendor' ? 'Vendor' : 'Customer'}
                  style={{ ...formStyles.input, backgroundColor: '#f8f9fa', color: '#6c757d' }}
                  disabled
                  readOnly
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  {type === 'vendor' ? 'Adding a new vendor' : 'Adding a new customer'}
                </div>
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
              {loading ? `Saving ${formData.type === 'customer' ? 'Customer' : 'Vendor'}...` : (mode === 'add' ? 'Add' : 'Update')} {formData.type === 'customer' ? 'Customer' : 'Vendor'}
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

      {/* Enhanced Filter Options */}
      <EnhancedFilterBar 
        title="Party Filters"
        activeFiltersCount={activeFilterCount}
        onClearAll={handleClearAllFilters}
        showQuickActions={true}
        showQuickFiltersWhenCollapsed={true}
        quickActions={[
          {
            id: 'activeParties',
            label: 'Active Parties',
            action: () => {
              setStatusWithURL('active')
            },
            icon: '✅',
            isActive: filters.status === 'active'
          },
          {
            id: 'gstParties',
            label: 'GST Parties',
            action: () => {
              setGstStatusWithURL('GST')
            },
            icon: '📋',
            isActive: filters.gstStatus === 'GST'
          },
          {
            id: 'customersOnly',
            label: 'Customers Only',
            action: () => {
              setPartyTypeWithURL('customer')
            },
            icon: '👥',
            isActive: filters.partyType === 'customer'
          },
          {
            id: 'vendorsOnly',
            label: 'Vendors Only',
            action: () => {
              setPartyTypeWithURL('vendor')
            },
            icon: '🏢',
            isActive: filters.partyType === 'vendor'
          },
          {
            id: 'withNotes',
            label: 'With Notes',
            action: () => {
              setHasNotesWithURL(true)
            },
            icon: '📝',
            isActive: filters.hasNotes === true
          }
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Search</span>
          <input
            type="text"
            placeholder="Search parties by name, contact, email..."
            value={filters.search}
            onChange={(e) => setSearchWithURL(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '13px',
              minWidth: '160px'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Status</span>
          <FilterDropdown
            value={filters.status}
            onChange={(value) => setStatusWithURL(Array.isArray(value) ? value[0] || 'all' : value) as 'all' | 'active' | 'inactive'}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            placeholder="Status"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>GST Status</span>
          <FilterDropdown
            value={filters.gstStatus}
            onChange={(value) => setGstStatusWithURL(Array.isArray(value) ? value[0] || '' : value)}
            options={[
              { value: '', label: 'All GST Status' },
              { value: 'GST', label: 'GST' },
              { value: 'Non-GST', label: 'Non-GST' },
              { value: 'Exempted', label: 'Exempted' }
            ]}
            placeholder="GST Status"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Party Type</span>
          <FilterDropdown
            value={filters.partyType}
            onChange={(value) => setPartyTypeWithURL(Array.isArray(value) ? value[0] || 'both' : value) as 'customer' | 'vendor' | 'both'}
            options={[
              { value: 'both', label: 'All Parties' },
              { value: 'customer', label: 'Customers' },
              { value: 'vendor', label: 'Vendors' }
            ]}
            placeholder="Party Type"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Contact Person</span>
          <input
            type="text"
            placeholder="Search by contact person..."
            value={filters.contactPerson}
            onChange={(e) => setContactPersonWithURL(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '13px',
              minWidth: '160px'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Email</span>
          <input
            type="text"
            placeholder="Search by email..."
            value={filters.email}
            onChange={(e) => setEmailWithURL(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '13px',
              minWidth: '160px'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>City</span>
          <input
            type="text"
            placeholder="Search by city..."
            value={filters.city}
            onChange={(e) => setCityWithURL(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '13px',
              minWidth: '160px'
            }}
          />
        </div>
      </EnhancedFilterBar>

      {/* Parties Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#6c757d' }}>Loading parties...</div>
        </div>
      ) : error ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#dc3545',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          backgroundColor: '#f8d7da'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
            Failed to load parties
          </div>
          <div style={{ fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </div>
          <Button 
            variant="primary" 
            onClick={handleRefresh}
            style={{ marginRight: '8px' }}
          >
            Try Again
          </Button>
        </div>
      ) : paginatedParties.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#6c757d',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>👥</div>
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
            No parties found
          </div>
          <div style={{ fontSize: '14px', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px auto' }}>
            {filters.search || filters.status !== 'all' || filters.gstStatus !== '' 
              ? 'No parties match your current filters. Try adjusting your search criteria.'
              : `No ${activeTab} have been added yet. Start by adding your first ${activeTab === 'customers' ? 'customer' : 'vendor'}.`
            }
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button 
              variant="primary" 
              onClick={() => navigate(`/${activeTab === 'vendors' ? 'vendors' : 'customers'}/add`)}
            >
              Add {activeTab === 'customers' ? 'Customer' : 'Vendor'}
            </Button>
            {(filters.search || filters.status !== 'all' || filters.gstStatus !== '') && (
              <Button 
                variant="secondary" 
                onClick={clearAllFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
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

