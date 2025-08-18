import React, { useState } from 'react'
import { InventorySummaryReportComponent } from '../../components/InventorySummaryReport'
import { StockLedgerReportComponent } from '../../components/StockLedgerReport'
import { InventoryValuationReportComponent } from '../../components/InventoryValuationReport'
import { InventoryDashboardComponent } from '../../components/InventoryDashboard'

export function InventoryReports() {
  const [activeReport, setActiveReport] = useState<'summary' | 'ledger' | 'valuation' | 'dashboard'>('summary')

  const renderReport = () => {
    switch (activeReport) {
      case 'summary':
        return <InventorySummaryReportComponent />
      case 'ledger':
        return <StockLedgerReportComponent />
      case 'valuation':
        return <InventoryValuationReportComponent />
      case 'dashboard':
        return <InventoryDashboardComponent />
      default:
        return <InventorySummaryReportComponent />
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
          onClick={() => setActiveReport('summary')}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            backgroundColor: activeReport === 'summary' ? '#007bff' : '#f8f9fa',
            color: activeReport === 'summary' ? 'white' : '#495057',
            border: activeReport === 'summary' ? 'none' : '1px solid #e9ecef',
            transition: 'all 0.2s ease'
          }}
        >
          📊 Inventory Summary
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
          onClick={() => setActiveReport('dashboard')}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            backgroundColor: activeReport === 'dashboard' ? '#007bff' : '#f8f9fa',
            color: activeReport === 'dashboard' ? 'white' : '#495057',
            border: activeReport === 'dashboard' ? 'none' : '1px solid #e9ecef',
            transition: 'all 0.2s ease'
          }}
        >
          🎯 Dashboard
        </button>
      </div>

      {/* Report Content */}
      {renderReport()}
    </div>
  )
}
