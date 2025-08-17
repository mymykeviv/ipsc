import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGetProducts, apiListParties } from '../lib/api'

interface SearchResult {
  id: number
  type: 'product' | 'customer' | 'vendor' | 'invoice'
  name: string
  description?: string
  url: string
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (query.length >= 2) {
      setLoading(true)
      searchAll(query)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query])

  const searchAll = async (searchQuery: string) => {
    try {
      const [products, parties] = await Promise.all([
        apiGetProducts({ search: searchQuery }),
        apiListParties()
      ])

      const searchResults: SearchResult[] = []

      // Add products
      products.forEach(product => {
        searchResults.push({
          id: product.id,
          type: 'product',
          name: product.name,
          description: product.description || `SKU: ${product.sku || 'N/A'}`,
          url: `/products/edit/${product.id}`
        })
      })

      // Add customers and vendors
      parties.forEach(party => {
        if (party.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          searchResults.push({
            id: party.id,
            type: party.type === 'customer' ? 'customer' : 'vendor',
            name: party.name,
            description: party.type === 'customer' ? 'Customer' : 'Vendor',
            url: `/customers/${party.id}`
          })
        }
      })

      setResults(searchResults.slice(0, 10)) // Limit to 10 results
      setIsOpen(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url)
    setQuery('')
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
    }
  }

  return (
    <div style={{ position: 'relative', width: '300px' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search products, customers, vendors..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ced4da',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: '#6c757d'
          }}>
            Searching...
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ced4da',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {results.map((result, index) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderBottom: index < results.length - 1 ? '1px solid #f8f9fa' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: 'white',
                backgroundColor: result.type === 'product' ? '#28a745' : 
                               result.type === 'customer' ? '#17a2b8' : '#ffc107'
              }}>
                {result.type === 'product' ? '🏷️' : 
                 result.type === 'customer' ? '👤' : '🏢'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', color: '#495057' }}>
                  {result.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {result.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ced4da',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          padding: '16px',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          No results found for "{query}"
        </div>
      )}
    </div>
  )
}
