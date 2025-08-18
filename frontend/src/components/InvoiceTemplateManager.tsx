import React, { useState, useEffect } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { ErrorMessage } from './ErrorMessage'
import { SuccessMessage } from './SuccessMessage'
import { LoadingSpinner } from './LoadingSpinner'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'
import { 
  apiGetInvoiceTemplates, 
  apiCreateInvoiceTemplate, 
  apiUpdateInvoiceTemplate, 
  apiDeleteInvoiceTemplate, 
  apiSetDefaultInvoiceTemplate,
  InvoiceTemplate, 
  InvoiceTemplateCreate, 
  InvoiceTemplateUpdate 
} from '../lib/api'
import { createApiErrorHandler } from '../lib/apiUtils'
import { useAuth } from '../modules/AuthContext'

interface InvoiceTemplateManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function InvoiceTemplateManager({ isOpen, onClose }: InvoiceTemplateManagerProps) {
  const { forceLogout } = useAuth()
  const handleApiError = createApiErrorHandler(forceLogout)
  
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [formData, setFormData] = useState<InvoiceTemplateCreate>({
    name: '',
    description: '',
    template_type: 'professional',
    primary_color: '#2c3e50',
    secondary_color: '#3498db',
    accent_color: '#e74c3c',
    header_font: 'Helvetica-Bold',
    body_font: 'Helvetica',
    header_font_size: 18,
    body_font_size: 10,
    show_logo: true,
    logo_position: 'top-left',
    show_company_details: true,
    show_customer_details: true,
    show_supplier_details: true,
    show_terms: true,
    show_notes: true,
    show_footer: true,
    header_text: 'TAX INVOICE',
    footer_text: 'Thank you for your business!',
    terms_text: 'Payment is due within the terms specified above.'
  })

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await apiGetInvoiceTemplates()
      setTemplates(data)
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof InvoiceTemplateCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateNew = () => {
    setSelectedTemplate(null)
    setIsEditMode(false)
    setFormData({
      name: '',
      description: '',
      template_type: 'professional',
      primary_color: '#2c3e50',
      secondary_color: '#3498db',
      accent_color: '#e74c3c',
      header_font: 'Helvetica-Bold',
      body_font: 'Helvetica',
      header_font_size: 18,
      body_font_size: 10,
      show_logo: true,
      logo_position: 'top-left',
      show_company_details: true,
      show_customer_details: true,
      show_supplier_details: true,
      show_terms: true,
      show_notes: true,
      show_footer: true,
      header_text: 'TAX INVOICE',
      footer_text: 'Thank you for your business!',
      terms_text: 'Payment is due within the terms specified above.'
    })
  }

  const handleEdit = (template: InvoiceTemplate) => {
    setSelectedTemplate(template)
    setIsEditMode(true)
    setFormData({
      name: template.name,
      description: template.description || '',
      template_type: template.template_type,
      primary_color: template.primary_color,
      secondary_color: template.secondary_color,
      accent_color: template.accent_color,
      header_font: template.header_font,
      body_font: template.body_font,
      header_font_size: template.header_font_size,
      body_font_size: template.body_font_size,
      show_logo: template.show_logo,
      logo_position: template.logo_position,
      show_company_details: template.show_company_details,
      show_customer_details: template.show_customer_details,
      show_supplier_details: template.show_supplier_details,
      show_terms: template.show_terms,
      show_notes: template.show_notes,
      show_footer: template.show_footer,
      header_text: template.header_text,
      footer_text: template.footer_text,
      terms_text: template.terms_text
    })
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (isEditMode && selectedTemplate) {
        await apiUpdateInvoiceTemplate(selectedTemplate.id, formData)
        setSuccess('Template updated successfully!')
      } else {
        await apiCreateInvoiceTemplate(formData)
        setSuccess('Template created successfully!')
      }
      
      loadTemplates()
      handleCreateNew()
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (template: InvoiceTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return
    }
    
    try {
      setLoading(true)
      await apiDeleteInvoiceTemplate(template.id)
      setSuccess('Template deleted successfully!')
      loadTemplates()
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (template: InvoiceTemplate) => {
    try {
      setLoading(true)
      await apiSetDefaultInvoiceTemplate(template.id)
      setSuccess('Default template updated successfully!')
      loadTemplates()
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const renderTemplateList = () => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: getSectionHeaderColor('template') }}>Invoice Templates</h3>
        <Button onClick={handleCreateNew} variant="primary">
          Create New Template
        </Button>
      </div>
      
      {templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <p>No templates found. Create your first template to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {templates.map(template => (
            <div key={template.id} style={{
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: template.is_default ? '#f8f9fa' : 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>{template.name}</h4>
                    {template.is_default && (
                      <span style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Default
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p style={{ margin: '0 0 8px 0', color: '#6c757d', fontSize: '14px' }}>
                      {template.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6c757d' }}>
                    <span>Type: {template.template_type}</span>
                    <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button onClick={() => handleEdit(template)} variant="secondary">
                    Edit
                  </Button>
                  {!template.is_default && (
                    <>
                      <Button onClick={() => handleSetDefault(template)} variant="primary">
                        Set Default
                      </Button>
                      <Button onClick={() => handleDelete(template)} variant="secondary">
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderTemplateForm = () => (
    <div style={{ border: '1px solid #e9ecef', borderRadius: '8px', padding: '20px', backgroundColor: '#f8f9fa' }}>
      <h3 style={{ margin: '0 0 20px 0', color: getSectionHeaderColor('template') }}>
        {isEditMode ? 'Edit Template' : 'Create New Template'}
      </h3>
      
      <div style={formStyles.grid2Col}>
        <div style={formStyles.formGroup}>
          <label style={formStyles.label}>Template Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            style={formStyles.input}
            placeholder="Enter template name"
          />
        </div>
        
        <div style={formStyles.formGroup}>
          <label style={formStyles.label}>Template Type</label>
          <select
            value={formData.template_type}
            onChange={(e) => handleInputChange('template_type', e.target.value)}
            style={formStyles.select}
          >
            <option value="professional">Professional</option>
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
      </div>

      <div style={formStyles.formGroup}>
        <label style={formStyles.label}>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          style={formStyles.textarea}
          placeholder="Enter template description"
          rows={3}
        />
      </div>

      <div style={{ ...formStyles.section, marginTop: '24px' }}>
        <h4 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('colors') }}>
          Color Scheme
        </h4>
        <div style={formStyles.grid3Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Primary Color</label>
            <input
              type="color"
              value={formData.primary_color}
              onChange={(e) => handleInputChange('primary_color', e.target.value)}
              style={{ ...formStyles.input, height: '40px', padding: '4px' }}
            />
          </div>
          
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Secondary Color</label>
            <input
              type="color"
              value={formData.secondary_color}
              onChange={(e) => handleInputChange('secondary_color', e.target.value)}
              style={{ ...formStyles.input, height: '40px', padding: '4px' }}
            />
          </div>
          
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Accent Color</label>
            <input
              type="color"
              value={formData.accent_color}
              onChange={(e) => handleInputChange('accent_color', e.target.value)}
              style={{ ...formStyles.input, height: '40px', padding: '4px' }}
            />
          </div>
        </div>
      </div>

      <div style={{ ...formStyles.section, marginTop: '24px' }}>
        <h4 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('typography') }}>
          Typography
        </h4>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Header Font</label>
            <select
              value={formData.header_font}
              onChange={(e) => handleInputChange('header_font', e.target.value)}
              style={formStyles.select}
            >
              <option value="Helvetica-Bold">Helvetica Bold</option>
              <option value="Times-Bold">Times Bold</option>
              <option value="Courier-Bold">Courier Bold</option>
            </select>
          </div>
          
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Body Font</label>
            <select
              value={formData.body_font}
              onChange={(e) => handleInputChange('body_font', e.target.value)}
              style={formStyles.select}
            >
              <option value="Helvetica">Helvetica</option>
              <option value="Times-Roman">Times Roman</option>
              <option value="Courier">Courier</option>
            </select>
          </div>
          
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Header Font Size</label>
            <input
              type="number"
              value={formData.header_font_size}
              onChange={(e) => handleInputChange('header_font_size', parseInt(e.target.value))}
              style={formStyles.input}
              min="12"
              max="24"
            />
          </div>
          
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Body Font Size</label>
            <input
              type="number"
              value={formData.body_font_size}
              onChange={(e) => handleInputChange('body_font_size', parseInt(e.target.value))}
              style={formStyles.input}
              min="8"
              max="16"
            />
          </div>
        </div>
      </div>

      <div style={{ ...formStyles.section, marginTop: '24px' }}>
        <h4 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('layout') }}>
          Layout Options
        </h4>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Logo Position</label>
            <select
              value={formData.logo_position}
              onChange={(e) => handleInputChange('logo_position', e.target.value)}
              style={formStyles.select}
            >
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="center">Center</option>
            </select>
          </div>
        </div>
        
        <div style={formStyles.grid3Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.show_logo}
                onChange={(e) => handleInputChange('show_logo', e.target.checked)}
                style={formStyles.checkbox}
              />
              Show Logo
            </label>
          </div>
          
          <div style={formStyles.formGroup}>
            <label style={formStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.show_company_details}
                onChange={(e) => handleInputChange('show_company_details', e.target.checked)}
                style={formStyles.checkbox}
              />
              Show Company Details
            </label>
          </div>
          
          <div style={formStyles.formGroup}>
            <label style={formStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.show_customer_details}
                onChange={(e) => handleInputChange('show_customer_details', e.target.checked)}
                style={formStyles.checkbox}
              />
              Show Customer Details
            </label>
          </div>
          
          <div style={formStyles.formGroup}>
            <label style={formStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.show_supplier_details}
                onChange={(e) => handleInputChange('show_supplier_details', e.target.checked)}
                style={formStyles.checkbox}
              />
              Show Supplier Details
            </label>
          </div>
          
          <div style={formStyles.formGroup}>
            <label style={formStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.show_terms}
                onChange={(e) => handleInputChange('show_terms', e.target.checked)}
                style={formStyles.checkbox}
              />
              Show Terms
            </label>
          </div>
          
          <div style={formStyles.formGroup}>
            <label style={formStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.show_notes}
                onChange={(e) => handleInputChange('show_notes', e.target.checked)}
                style={formStyles.checkbox}
              />
              Show Notes
            </label>
          </div>
          
          <div style={formStyles.formGroup}>
            <label style={formStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.show_footer}
                onChange={(e) => handleInputChange('show_footer', e.target.checked)}
                style={formStyles.checkbox}
              />
              Show Footer
            </label>
          </div>
        </div>
      </div>

      <div style={{ ...formStyles.section, marginTop: '24px' }}>
        <h4 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('content') }}>
          Content
        </h4>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Header Text</label>
            <input
              type="text"
              value={formData.header_text}
              onChange={(e) => handleInputChange('header_text', e.target.value)}
              style={formStyles.input}
              placeholder="e.g., TAX INVOICE"
            />
          </div>
          
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Footer Text</label>
            <input
              type="text"
              value={formData.footer_text}
              onChange={(e) => handleInputChange('footer_text', e.target.value)}
              style={formStyles.input}
              placeholder="e.g., Thank you for your business!"
            />
          </div>
        </div>
        
        <div style={formStyles.formGroup}>
          <label style={formStyles.label}>Terms Text</label>
          <textarea
            value={formData.terms_text}
            onChange={(e) => handleInputChange('terms_text', e.target.value)}
            style={formStyles.textarea}
            placeholder="Enter terms text"
            rows={2}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Button onClick={handleCreateNew} variant="secondary" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="primary" disabled={loading || !formData.name}>
          {loading ? <LoadingSpinner size="small" /> : (isEditMode ? 'Update Template' : 'Create Template')}
        </Button>
      </div>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Template Manager">
      <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {error && <ErrorMessage message={error} />}
        {success && <SuccessMessage message={success} />}
        
        {renderTemplateList()}
        {renderTemplateForm()}
      </div>
    </Modal>
  )
}
