import React from 'react'
import { Button } from './Button'

interface DownloadButtonsProps {
  onDownloadPDF: () => void
  onDownloadCSV: () => void
  pdfLoading?: boolean
  csvLoading?: boolean
  disabled?: boolean
}

export function DownloadButtons({ 
  onDownloadPDF, 
  onDownloadCSV, 
  pdfLoading = false, 
  csvLoading = false, 
  disabled = false 
}: DownloadButtonsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    }}>
      <Button
        onClick={onDownloadPDF}
        variant="outline"
        disabled={disabled || pdfLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          padding: '8px 16px'
        }}
      >
        {pdfLoading ? (
          <>
            <span style={{ fontSize: '16px' }}>⏳</span>
            Generating PDF...
          </>
        ) : (
          <>
            <span style={{ fontSize: '16px' }}>📄</span>
            Download PDF
          </>
        )}
      </Button>
      
      <Button
        onClick={onDownloadCSV}
        variant="outline"
        disabled={disabled || csvLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          padding: '8px 16px'
        }}
      >
        {csvLoading ? (
          <>
            <span style={{ fontSize: '16px' }}>⏳</span>
            Generating CSV...
          </>
        ) : (
          <>
            <span style={{ fontSize: '16px' }}>📊</span>
            Download CSV
          </>
        )}
      </Button>
    </div>
  )
}
