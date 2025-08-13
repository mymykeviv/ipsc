import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './modules/AuthContext'
import { App } from './modules/App'

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    )
    
    // Basic test to ensure the app renders
    expect(document.body).toBeDefined()
  })
})
