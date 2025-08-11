import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi, beforeAll } from 'vitest'
import { Products } from './Products'
import { AuthProvider } from '../modules/AuthContext'

beforeAll(() => {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(() => 'fake-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
    writable: true,
  })
  
  // Mock fetch to return empty array for simplicity
  vi.stubGlobal('fetch', vi.fn(() => 
    Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
  ))
})

test('Products page renders with enhanced UI components', async () => {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Products />
      </AuthProvider>
    </MemoryRouter>
  )

  // Check for enhanced UI elements
  expect(screen.getByText('Products')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument()
  expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument()
  
  // Check for table headers with sorting
  expect(screen.getByText('Name')).toBeInTheDocument()
  expect(screen.getByText('SKU')).toBeInTheDocument()
  expect(screen.getByText('Category')).toBeInTheDocument()
  expect(screen.getByText('Unit')).toBeInTheDocument()
  expect(screen.getByText('Stock')).toBeInTheDocument()
  expect(screen.getByText('Sales Price')).toBeInTheDocument()
  expect(screen.getByText('GST Rate')).toBeInTheDocument()
  expect(screen.getByText('Status')).toBeInTheDocument()
  expect(screen.getByText('Actions')).toBeInTheDocument()
  
  // Wait for loading to complete and show empty state
  await waitFor(() => {
    expect(screen.getByText('No products available.')).toBeInTheDocument()
  })
})

test('Products page uses themed components', async () => {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Products />
      </AuthProvider>
    </MemoryRouter>
  )

  // Check that the page uses the Card component
  expect(document.querySelector('.card')).toBeTruthy()
  
  // Check that the Add Product button uses the Button component
  const addButton = screen.getByRole('button', { name: /add product/i })
  expect(addButton.classList.contains('btn')).toBe(true)
  expect(addButton.classList.contains('btn-primary')).toBe(true)
})


