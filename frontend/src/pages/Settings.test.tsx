import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { Settings } from './Settings'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../modules/AuthContext'

const renderWithProviders = (component: React.ReactElement, route = '/settings') => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Settings Page', () => {
  beforeEach(() => {
    localStorage.setItem('auth_token', 'mock-token')
    localStorage.setItem('auth_exp', String(Date.now() + 30 * 60 * 1000))
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Company Settings', () => {
    it('should render company settings form', async () => {
      renderWithProviders(<Settings section="company" />, '/settings/company')

      await waitFor(() => {
        expect(screen.getByText('Company Details')).toBeInTheDocument()
        expect(screen.getByText('Company Information')).toBeInTheDocument()
        expect(screen.getByText('Tax Information')).toBeInTheDocument()
        expect(screen.getByText('Company Logo')).toBeInTheDocument()
      })
    })
  })

  describe('Tax Settings', () => {
    it('should render tax settings form', async () => {
      renderWithProviders(<Settings section="tax" />, '/settings/tax')

      await waitFor(() => {
        expect(screen.getByText('Tax Settings')).toBeInTheDocument()
        expect(screen.getByText('GST Rates')).toBeInTheDocument()
        expect(screen.getByText('Tax Registration')).toBeInTheDocument()
      })
    })
  })

  describe('User Settings', () => {
    it('should render user settings form', async () => {
      renderWithProviders(<Settings section="users" />, '/settings/users')

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
        expect(screen.getByText('User Information')).toBeInTheDocument()
      })
    })
  })

  describe('Email Settings', () => {
    it('should render email settings form', async () => {
      renderWithProviders(<Settings section="email" />, '/settings/email')

      await waitFor(() => {
        expect(screen.getByText('Email Configuration')).toBeInTheDocument()
        expect(screen.getByText('Email Provider')).toBeInTheDocument()
        expect(screen.getByText('SMTP Configuration')).toBeInTheDocument()
        expect(screen.getByText('Sender Information')).toBeInTheDocument()
      })
    })
  })

  describe('Invoice Settings', () => {
    it('should render invoice settings form', async () => {
      renderWithProviders(<Settings section="invoice" />, '/settings/invoice')

      await waitFor(() => {
        expect(screen.getByText('Invoice Settings')).toBeInTheDocument()
        expect(screen.getByText('Invoice Configuration')).toBeInTheDocument()
        expect(screen.getByText('Invoice Template')).toBeInTheDocument()
      })
    })
  })

  describe('Default Settings', () => {
    it('should render welcome message when no section specified', async () => {
      renderWithProviders(<Settings />, '/settings')

      await waitFor(() => {
        expect(screen.getByText('Welcome to Settings')).toBeInTheDocument()
        expect(screen.getByText('Please select a settings section from the sidebar.')).toBeInTheDocument()
      })
    })
  })
})
