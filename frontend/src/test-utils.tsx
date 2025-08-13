import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from './modules/AuthContext'
import { vi } from 'vitest'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
  initialEntries?: string[]
}

// Mock AuthProvider for testing
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

// Custom render function with Router and AuthProvider
const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { route = '/', initialEntries = [route], ...renderOptions } = options

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    </MemoryRouter>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
