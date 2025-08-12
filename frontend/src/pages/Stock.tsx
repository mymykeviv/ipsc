import { useEffect, useState } from 'react'
import { useAuth } from '../modules/AuthContext'
import { apiAdjustStock, apiGetStockSummary, StockRow } from '../lib/api'
import { Card } from '../components/Card'
import { Button } from '../components/Button'

interface StockAdjustmentForm {
  productId: number | ''
  quantity: string
  adjustmentType: 'add' | 'reduce'
  dateOfAdjustment: string
  referenceBillNumber: string
  supplier: string
  category: string
  notes: string
}

export function Stock() {
  const { token } = useAuth()
  const [rows, setRows] = useState<StockRow[]>([])
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adjustmentForm, setAdjustmentForm] = useState<StockAdjustmentForm>({
    productId: '',
    quantity: '',
    adjustmentType: 'add',
    dateOfAdjustment: new Date().toISOString().split('T')[0],
    referenceBillNumber: '',
    supplier: '',
    category: '',
    notes: ''
  })

  useEffect(() => {
    if (!token) return
    apiGetStockSummary().then(setRows)
  }, [token])

  const resetAdjustmentForm = () => {
    setAdjustmentForm({
      productId: '',
      quantity: '',
      adjustmentType: 'add',
      dateOfAdjustment: new Date().toISOString().split('T')[0],
      referenceBillNumber: '',
      supplier: '',
      category: '',
      notes: ''
    })
    setError(null)
  }

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustmentForm.productId || !adjustmentForm.quantity) return

    setLoading(true)
    setError(null)

    try {
      // Validation
      const quantity = parseInt(adjustmentForm.quantity)
      if (quantity < 0 || quantity > 999999) {
        setError('Quantity must be between 0 and 999999')
        return
      }

      if (adjustmentForm.referenceBillNumber && adjustmentForm.referenceBillNumber.length > 10) {
        setError('Reference bill number must be 10 characters or less')
        return
      }

      if (adjustmentForm.supplier && adjustmentForm.supplier.length > 50) {
        setError('Supplier must be 50 characters or less')
        return
      }

      if (adjustmentForm.category && adjustmentForm.category.length > 50) {
        setError('Category must be 50 characters or less')
        return
      }

      if (adjustmentForm.notes && adjustmentForm.notes.length > 200) {
        setError('Notes must be 200 characters or less')
        return
      }

      await apiAdjustStock(
        Number(adjustmentForm.productId),
        quantity,
        adjustmentForm.adjustmentType,
        adjustmentForm.dateOfAdjustment,
        adjustmentForm.referenceBillNumber || undefined,
        adjustmentForm.supplier || undefined,
        adjustmentForm.category || undefined,
        adjustmentForm.notes || undefined
      )

      setShowAdjustmentModal(false)
      resetAdjustmentForm()
      apiGetStockSummary().then(setRows)
    } catch (error: any) {
      setError(error.message || 'Failed to adjust stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Stock Management</h1>
          <Button variant="primary" onClick={() => setShowAdjustmentModal(true)}>
            Stock Adjustment
          </Button>
        </div>

        <table data-testid="stock-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>SKU</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Item Type</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>On Hand</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Unit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.product_id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px' }}>{r.sku}</td>
                <td style={{ padding: '12px' }}>{r.name}</td>
                <td style={{ padding: '12px' }}>{r.item_type || 'N/A'}</td>
                <td style={{ padding: '12px' }}>{r.onhand}</td>
                <td style={{ padding: '12px' }}>{r.unit || 'Pcs'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
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
          <Card style={{ width: '80%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>Stock Adjustment</h2>
              <button
                onClick={() => setShowAdjustmentModal(false)}
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

            {error && (
              <div style={{ 
                color: 'crimson', 
                padding: '8px', 
                backgroundColor: '#ffe6e6', 
                borderRadius: '4px', 
                border: '1px solid #ff9999',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleStockAdjustment}>
              {/* Stock Adjustment Details Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }}>
                  Stock Adjustment Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label>Product *</label>
                  <select
                    value={adjustmentForm.productId}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, productId: e.target.value ? Number(e.target.value) : ''})}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  >
                    <option value="">Select Product</option>
                    {rows.map(r => <option key={r.product_id} value={r.product_id}>{r.sku} - {r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label>Adjustment Type *</label>
                  <select
                    value={adjustmentForm.adjustmentType}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, adjustmentType: e.target.value as 'add' | 'reduce'})}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  >
                    <option value="add">Add Stock</option>
                    <option value="reduce">Reduce Stock</option>
                  </select>
                </div>
                <div>
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, quantity: e.target.value})}
                    required
                    min="0"
                    max="999999"
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  />
                </div>
                <div>
                  <label>Date of Adjustment *</label>
                  <input
                    type="date"
                    value={adjustmentForm.dateOfAdjustment}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, dateOfAdjustment: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  />
                </div>
                <div>
                  <label>Reference Bill Number</label>
                  <input
                    type="text"
                    value={adjustmentForm.referenceBillNumber}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, referenceBillNumber: e.target.value})}
                    maxLength={10}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  />
                </div>
                <div>
                  <label>Supplier</label>
                  <input
                    type="text"
                    value={adjustmentForm.supplier}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, supplier: e.target.value})}
                    maxLength={50}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  />
                </div>
                <div>
                  <label>Category</label>
                  <input
                    type="text"
                    value={adjustmentForm.category}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, category: e.target.value})}
                    maxLength={50}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  />
                </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '8px' }}>
                  Additional Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <label>Notes</label>
                    <textarea
                      value={adjustmentForm.notes}
                      onChange={(e) => setAdjustmentForm({...adjustmentForm, notes: e.target.value})}
                      rows={3}
                      maxLength={200}
                      placeholder="Enter adjustment notes (optional)"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setShowAdjustmentModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Adjusting...' : 'Apply Adjustment'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

