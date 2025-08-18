import React, { useState } from 'react'
import { StockLedgerReportComponent } from '../../components/StockLedgerReport'
import { InventoryValuationReportComponent } from '../../components/InventoryValuationReport'

export function InventoryReports() {
  const [activeReport, setActiveReport] = useState<'valuation' | 'ledger'>('valuation')

  const renderReport = () => {
    switch (activeReport) {
      case 'ledger':
        return <StockLedgerReportComponent />
      case 'valuation':
      default:
        return <InventoryValuationReportComponent />
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div style={{ 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Inventory Reports</h1>
        <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
          Comprehensive inventory management reports for stock tracking, valuation, and analysis
        </p>
      </div>

      {/* Report Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveReport('valuation')}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            backgroundColor: activeReport === 'valuation' ? '#007bff' : '#f8f9fa',
            color: activeReport === 'valuation' ? 'white' : '#495057',
            border: activeReport === 'valuation' ? 'none' : '1px solid #e9ecef',
            transition: 'all 0.2s ease'
          }}
        >
          💰 Inventory Valuation
        </button>
        
        <button
          onClick={() => setActiveReport('ledger')}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            backgroundColor: activeReport === 'ledger' ? '#007bff' : '#f8f9fa',
            color: activeReport === 'ledger' ? 'white' : '#495057',
            border: activeReport === 'ledger' ? 'none' : '1px solid #e9ecef',
            transition: 'all 0.2s ease'
          }}
        >
          📋 Stock Ledger
        </button>
      </div>

      {/* Report Content */}
      {renderReport()}
    </div>
  )
}
