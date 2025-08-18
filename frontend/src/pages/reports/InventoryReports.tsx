import { InventorySummaryReportComponent } from '../../components/InventorySummaryReport'

export function InventoryReports() {
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

      <InventorySummaryReportComponent />
    </div>
  )
}
