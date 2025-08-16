import React, { useState, useEffect } from 'react'
import { apiEmailInvoice } from '../lib/api'
import { Modal } from './Modal'
import { Button } from './Button'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'

interface EmailFormModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceId: number
  invoiceNo: string
  customerName: string
  grandTotal: number
  dueDate: string
}

interface EmailForm {
  email_address: string
  subject: string
  message: string
}

export function EmailFormModal({ 
  isOpen, 
  onClose, 
  invoiceId, 
  invoiceNo, 
  customerName, 
  grandTotal, 
  dueDate 
}: EmailFormModalProps) {
  const [emailForm, setEmailForm] = useState<EmailForm>({
    email_address: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setEmailForm({
        email_address: '',
        subject: `Invoice ${invoiceNo}`,
        message: `Please find attached invoice ${invoiceNo} for ₹${grandTotal.toFixed(2)}.`
      })
      setError(null)
      setSuccess(false)
    }
  }, [isOpen, invoiceNo, grandTotal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!emailForm.email_address.trim()) {
      setError('Email address is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      await apiEmailInvoice(invoiceId, emailForm.email_address)
      setSuccess(true)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Send Invoice ${invoiceNo} via Email`}
      size="medium"
    >
      {success ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ 
            color: '#059669', 
            fontSize: '1.125rem', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Email sent successfully!
          </div>
          <div style={{ color: '#065f46' }}>
            The invoice has been sent to the recipient.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {error && (
            <div style={{ 
              padding: '12px 16px', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '6px', 
              color: '#dc2626',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Invoice Details Section */}
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('basic') }}>
              📄 Invoice Details
            </h3>
            <div style={formStyles.grid}>
              <div style={formStyles.grid2Col}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    disabled
                    style={{ 
                      ...formStyles.input, 
                      backgroundColor: '#f8f9fa',
                      color: '#6b7280',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Customer</label>
                  <input
                    type="text"
                    value={customerName}
                    disabled
                    style={{ 
                      ...formStyles.input, 
                      backgroundColor: '#f8f9fa',
                      color: '#6b7280',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>
              </div>
              <div style={formStyles.grid2Col}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Invoice Amount</label>
                  <input
                    type="text"
                    value={`₹${grandTotal.toFixed(2)}`}
                    disabled
                    style={{ 
                      ...formStyles.input, 
                      backgroundColor: '#f8f9fa',
                      color: '#6b7280',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Due Date</label>
                  <input
                    type="text"
                    value={new Date(dueDate).toLocaleDateString()}
                    disabled
                    style={{ 
                      ...formStyles.input, 
                      backgroundColor: '#f8f9fa',
                      color: '#6b7280',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Email Details Section */}
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('other') }}>
              📧 Email Details
            </h3>
            <div style={formStyles.grid}>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>
                  Email Address <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="email"
                  value={emailForm.email_address}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, email_address: e.target.value }))}
                  style={formStyles.input}
                  placeholder="Enter customer email address"
                  required
                />
              </div>

              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Subject</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  style={formStyles.input}
                  placeholder="Enter email subject"
                />
              </div>

              <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
                <label style={formStyles.label}>Message</label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  style={formStyles.textarea}
                  rows={4}
                  placeholder="Enter email message"
                />
              </div>
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
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {loading ? (
                <>
                  <svg style={{ width: '16px', height: '16px' }} className="animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
