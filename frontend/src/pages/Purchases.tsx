import { useEffect, useState } from 'react'
import { useAuth } from '../modules/AuthContext'
import { apiCreatePurchase, apiListParties, apiGetProducts, Party, Product } from '../lib/api'
import { Card } from '../components/Card'

export function Purchases() {
  const { token } = useAuth()
  const [vendors, setVendors] = useState<Party[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [vendorId, setVendorId] = useState<number | null>(null)
  const [productId, setProductId] = useState<number | null>(null)
  const [qty, setQty] = useState<number>(1)
  const [rate, setRate] = useState<number>(0)
  const [createdId, setCreatedId] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    apiListParties().then(ps => setVendors(ps.filter(p => p.type === 'vendor')))
    apiGetProducts().then(setProducts)
  }, [token])

  useEffect(() => {
    if (!productId) return
    const p = products.find(p => p.id === productId)
    if (p) setRate(Number(p.price))
  }, [productId, products])

  async function submit() {
    if (!token || !vendorId || !productId) return
    const res = await apiCreatePurchase({ vendor_id: vendorId, items: [{ product_id: productId, qty, rate }] })
    setCreatedId(res.id)
  }

  return (
    <Card>
      <h1>Purchases</h1>
      <div style={{ display: 'grid', gap: 12, maxWidth: 600 }}>
        <label>
          <div>Vendor</div>
          <select data-testid="purchase-vendor" value={vendorId ?? ''} onChange={e => setVendorId(Number(e.target.value))}>
            <option value="">Select...</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </label>
        <label>
          <div>Product</div>
          <select data-testid="purchase-product" value={productId ?? ''} onChange={e => setProductId(Number(e.target.value))}>
            <option value="">Select...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
          </select>
        </label>
        <label>
          <div>Qty</div>
          <input data-testid="purchase-qty" type="number" value={qty} min={1} onChange={e => setQty(Number(e.target.value))} />
        </label>
        <label>
          <div>Rate</div>
          <input type="number" value={rate} step="0.01" onChange={e => setRate(Number(e.target.value))} />
        </label>
        <button onClick={submit} className="btn btn-primary">Create</button>
        {createdId && <div>Purchase created: #{createdId}</div>}
      </div>
    </Card>
  )
}

