import { useEffect, useState } from 'react'
import { useAuth } from '../modules/AuthContext'
import { apiAdjustStock, apiGetStockSummary, StockRow } from '../lib/api'
import { Card } from '../components/Card'

export function Stock() {
  const { token } = useAuth()
  const [rows, setRows] = useState<StockRow[]>([])
  const [productId, setProductId] = useState<number | ''>('')
  const [delta, setDelta] = useState<number>(0)

  useEffect(() => {
    if (!token) return
    apiGetStockSummary().then(setRows)
  }, [token])

  async function adjust() {
    if (!token || !productId || !delta) return
    await apiAdjustStock(Number(productId), delta)
    setDelta(0)
    apiGetStockSummary().then(setRows)
  }

  return (
    <Card>
      <h1>Stock</h1>
      <table data-testid="stock-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>On Hand</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.product_id}>
              <td>{r.sku}</td>
              <td>{r.name}</td>
              <td>{r.onhand}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Manual Adjustment</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={productId} onChange={e => setProductId(Number(e.target.value))}>
          <option value="">Product...</option>
          {rows.map(r => <option key={r.product_id} value={r.product_id}>{r.sku} - {r.name}</option>)}
        </select>
        <input type="number" value={delta} onChange={e => setDelta(Number(e.target.value))} placeholder="Delta (+/-)" />
        <button onClick={adjust}>Apply</button>
      </div>
    </Card>
  )
}

