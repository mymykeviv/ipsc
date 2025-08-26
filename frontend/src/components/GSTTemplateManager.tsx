import React, { useState, useEffect } from 'react'
import { 
  apiGetGSTInvoiceTemplates, 
  apiSetDefaultGSTInvoiceTemplate,
  GSTInvoiceTemplate 
} from '../lib/api'
import { Modal } from './Modal'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'

interface GSTTemplateManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function GSTTemplateManager({ isOpen, onClose }: GSTTemplateManagerProps) {
  const [templates, setTemplates] = useState<GSTInvoiceTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updatingDefault, setUpdatingDefault] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiGetGSTInvoiceTemplates()
      setTemplates(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load GST templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (templateId: number) => {
    try {
      setUpdatingDefault(templateId)
      await apiSetDefaultGSTInvoiceTemplate(templateId)
      await loadTemplates() // Reload to get updated default status
    } catch (err: any) {
      setError(err.message || 'Failed to set default template')
    } finally {
      setUpdatingDefault(null)
    }
  }

  const getTemplateIcon = (templateId: string) => {
    if (templateId.includes('GST_TABULAR')) return '📊'
    if (templateId.includes('GST_SIMPLE')) return '📝'
    if (templateId.includes('GST_DETAILED')) return '📋'
    if (templateId.includes('NONGST_SIMPLE')) return '📄'
    if (templateId.includes('NONGST_TABULAR')) return '📋'
    return '📄'
  }

  const getTemplateBadge = (template: GSTInvoiceTemplate) => {
    if (template.is_default) {
      return (
        <span style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          Default
        </span>
      )
    }
    return null
  }

  const getGSTBadge = (template: GSTInvoiceTemplate) => {
    return (
      <span style={{
        backgroundColor: template.requires_gst ? '#3b82f6' : '#6b7280',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {template.requires_gst ? 'GST' : 'Non-GST'}
      </span>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="GST Invoice Templates"
      size="large"
    >
      <div style={{ padding: '20px' }}>
        {error && <ErrorMessage message={error} />}
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Loading GST templates...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {templates.map(template => (
              <div
                key={template.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: template.is_default ? '#f0f9ff' : 'white',
                  borderColor: template.is_default ? '#3b82f6' : '#e5e7eb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{getTemplateIcon(template.template_id)}</span>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                        {template.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {getGSTBadge(template)}
                        {getTemplateBadge(template)}
                      </div>
                    </div>
                  </div>
                  
                  {!template.is_default && (
                    <Button
                      onClick={() => handleSetDefault(template.id)}
                      disabled={updatingDefault === template.id}
                      variant="primary"
                    >
                      {updatingDefault === template.id ? 'Setting...' : 'Set as Default'}
                    </Button>
                  )}
                </div>
                
                <p style={{ 
                  margin: '0 0 12px 0', 
                  color: '#6b7280', 
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {template.description}
                </p>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  fontSize: '12px', 
                  color: '#6b7280',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <strong>Paper Sizes:</strong> {template.paper_sizes}
                  </div>
                  <div>
                    <strong>Title:</strong> {template.title}
                  </div>
                  <div>
                    <strong>HSN Required:</strong> {template.requires_hsn ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          backgroundColor: '#f9fafb', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
            About GST Invoice Templates
          </h4>
          <p style={{ margin: '0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
            These are pre-defined templates designed to comply with Indian GST regulations. 
            GST templates include tax calculations and HSN/SAC codes, while Non-GST templates 
            are suitable for businesses not registered under GST. Choose the template that 
            best fits your business requirements.
          </p>
        </div>
      </div>
    </Modal>
  )
}
