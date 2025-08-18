import React, { useState, useEffect, useMemo } from 'react'
import { apiGetInvoicePDF, apiGetInvoiceTemplates, InvoiceTemplate, apiGetStockMovementHistoryPDFPreview } from '../lib/api'
import { Modal } from './Modal'
import { Button } from './Button'

interface PDFViewerProps {
  isOpen: boolean
  onClose: () => void
  type: 'invoice' | 'stock-history'
  title: string
  // Invoice specific props
  invoiceId?: number
  invoiceNo?: string
  // Stock history specific props
  financialYear?: string
  productId?: number
  filters?: {
    productFilter?: string
    entryTypeFilter?: string
    referenceTypeFilter?: string
    referenceSearch?: string
    stockLevelFilter?: string
  }
}

export function PDFViewer({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  invoiceId, 
  invoiceNo, 
  financialYear, 
  productId, 
  filters 
}: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined)
  const [iframeKey, setIframeKey] = useState(0)

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)])

  useEffect(() => {
    if (isOpen) {
      if (type === 'invoice' && invoiceId) {
        loadTemplates()
        loadInvoicePDF()
      } else if (type === 'stock-history') {
        loadStockHistoryPDF()
      }
    }
  }, [isOpen, type, invoiceId, selectedTemplateId, financialYear, productId])

  // Separate effect for filters to prevent unnecessary re-renders
  useEffect(() => {
    if (isOpen && type === 'stock-history' && memoizedFilters) {
      loadStockHistoryPDF()
    }
  }, [memoizedFilters])

  const loadTemplates = async () => {
    try {
      const data = await apiGetInvoiceTemplates()
      setTemplates(data)
      // Set default template if available
      const defaultTemplate = data.find(t => t.is_default)
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id)
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }

  const loadInvoicePDF = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const pdfBlob = await apiGetInvoicePDF(invoiceId!, selectedTemplateId)
      const url = URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
    } catch (err: any) {
      setError(err.message || 'Failed to load PDF')
    } finally {
      setLoading(false)
    }
  }

  const loadStockHistoryPDF = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = await apiGetStockMovementHistoryPDFPreview(financialYear, productId, memoizedFilters)
      setPdfUrl(url)
      setIframeKey(prev => prev + 1) // Force iframe refresh only when URL changes
    } catch (err: any) {
      setError(err.message || 'Failed to load PDF')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a')
      link.href = pdfUrl
      if (type === 'invoice') {
        link.download = `Invoice_${invoiceNo}.pdf`
      } else {
        link.download = `Stock_Movement_History_${financialYear || 'current'}.pdf`
      }
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
    setError(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="extra-large"
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '80vh',
        width: '100%'
      }}>
        {loading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            fontSize: '18px',
            color: '#6b7280'
          }}>
            Loading PDF...
          </div>
        )}

        {error && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            gap: '16px'
          }}>
            <div style={{ color: '#dc2626', fontSize: '16px' }}>{error}</div>
            <Button onClick={type === 'invoice' ? loadInvoicePDF : loadStockHistoryPDF} variant="primary">
              Retry
            </Button>
          </div>
        )}

        {pdfUrl && !loading && (
          <>
            {/* PDF Toolbar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              flexShrink: 0
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#374151'
              }}>
                <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span>{type === 'invoice' ? 'PDF Preview' : 'Stock History PDF'}</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {type === 'invoice' && templates.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                      Template:
                    </label>
                    <select
                      value={selectedTemplateId || ''}
                      onChange={(e) => {
                        const templateId = e.target.value ? parseInt(e.target.value) : undefined
                        setSelectedTemplateId(templateId)
                        // Reload PDF with new template
                        if (pdfUrl) {
                          URL.revokeObjectURL(pdfUrl)
                          setPdfUrl(null)
                        }
                        setTimeout(() => loadInvoicePDF(), 100)
                      }}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="">Default</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name} {template.is_default ? '(Default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <Button 
                  onClick={handleDownload} 
                  variant="primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    padding: '6px 12px'
                  }}
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </Button>
              </div>
            </div>
            
            {/* PDF Viewer */}
            <div style={{ 
              flex: 1,
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: '#f9fafb',
              minHeight: 0
            }}>
              <iframe
                key={iframeKey}
                src={pdfUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title={title}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
