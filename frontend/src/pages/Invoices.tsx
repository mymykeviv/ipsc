import { useEffect, useMemo, useState } from 'react'
import { apiCreateInvoice, apiListParties, apiGetProducts, Party, Product } from '../lib/api'
import { useAuth } from '../modules/AuthContext'
import { Card } from '../components/Card'

export function Invoices() {
  const { token } = useAuth()
  const [customers, setCustomers] = useState<Party[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [lineProductId, setLineProductId] = useState<number | null>(null)
  const [qty, setQty] = useState<number>(1)
  const [rate, setRate] = useState<number>(0)
  const [created, setCreated] = useState<{ id: number; invoice_no: string } | null>(null)

  useEffect(() => {
    if (!token) return
    apiListParties().then(ps => setCustomers(ps.filter(p => p.type === 'customer')))
    apiGetProducts().then(setProducts)
  }, [token])

  useEffect(() => {
    if (!lineProductId) return
    const p = products.find(p => p.id === lineProductId)
    if (p) setRate(Number(p.price))
  }, [lineProductId, products])

  async function submit() {
    if (!token || !customerId || !lineProductId) return
    const inv = await apiCreateInvoice({ customer_id: customerId, items: [{ product_id: lineProductId, qty, rate }] })
    setCreated(inv)
  }

  const pdfUrl = useMemo(() => created ? `/api/invoices/${created.id}/pdf` : null, [created])

  return (
    <Card>
      <h1>Create Invoice</h1>
      <div style={{ display: 'grid', gap: 12, maxWidth: 600 }}>
        <label>
          <div>Customer</div>
          <select data-testid="invoice-customer" value={customerId ?? ''} onChange={e => setCustomerId(Number(e.target.value))}>
            <option value="">Select...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>
          <div>Product</div>
          <select data-testid="invoice-product" value={lineProductId ?? ''} onChange={e => setLineProductId(Number(e.target.value))}>
            <option value="">Select...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
          </select>
        </label>
        <label>
          <div>Qty</div>
          <input data-testid="invoice-qty" type="number" value={qty} min={1} onChange={e => setQty(Number(e.target.value))} />
        </label>
        <label>
          <div>Rate</div>
          <input type="number" value={rate} step="0.01" onChange={e => setRate(Number(e.target.value))} />
        </label>
        <button onClick={submit} className="btn btn-primary">Create</button>
        {created && (
          <div>
            <div>Invoice created: {created.invoice_no}</div>
            {pdfUrl && <a href={pdfUrl} target="_blank" rel="noreferrer">Open PDF</a>}
          </div>
        )}
      </div>
    </Card>
  )
}

