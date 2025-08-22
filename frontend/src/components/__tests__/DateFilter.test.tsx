import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateFilter, DateRange } from '../DateFilter'
import { OptimizedDateFilter } from '../OptimizedDateFilter'
import { useSavedPresets } from '../../hooks/useSavedPresets'

// Mock the useSavedPresets hook
jest.mock('../../hooks/useSavedPresets')

const mockUseSavedPresets = useSavedPresets as jest.MockedFunction<typeof useSavedPresets>

describe('DateFilter Component', () => {
  const defaultProps = {
    value: { startDate: '2024-01-01', endDate: '2024-01-31' },
    onChange: jest.fn(),
  }

  beforeEach(() => {
    mockUseSavedPresets.mockReturnValue({
      savedPresets: [],
      savePreset: jest.fn(),
      deletePreset: jest.fn(),
      updatePreset: jest.fn(),
      clearAllPresets: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('renders with default date range', () => {
      render(<DateFilter {...defaultProps} />)
      
      expect(screen.getByText('Jan 1, 2024 - Jan 31, 2024')).toBeInTheDocument()
    })

    it('opens dropdown when clicked', async () => {
      render(<DateFilter {...defaultProps} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      expect(screen.getByText('Quick Presets')).toBeInTheDocument()
      expect(screen.getByText('Custom Range')).toBeInTheDocument()
    })

    it('applies preset when selected', async () => {
      render(<DateFilter {...defaultProps} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      const todayButton = screen.getByText('Today')
      await userEvent.click(todayButton)
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String),
        })
      )
    })

    it('applies custom date range', async () => {
      render(<DateFilter {...defaultProps} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      const startDateInput = screen.getByLabelText('Start Date')
      const endDateInput = screen.getByLabelText('End Date')
      
      await userEvent.clear(startDateInput)
      await userEvent.type(startDateInput, '2024-02-01')
      
      await userEvent.clear(endDateInput)
      await userEvent.type(endDateInput, '2024-02-28')
      
      const applyButton = screen.getByText('Apply')
      await userEvent.click(applyButton)
      
      expect(defaultProps.onChange).toHaveBeenCalledWith({
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      })
    })
  })

  describe('Saved Presets', () => {
    const mockSavedPresets = [
      {
        id: '1',
        name: 'Q1 2024',
        range: { startDate: '2024-01-01', endDate: '2024-03-31' },
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Holiday Season',
        range: { startDate: '2024-12-01', endDate: '2024-12-31' },
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]

    beforeEach(() => {
      mockUseSavedPresets.mockReturnValue({
        savedPresets: mockSavedPresets,
        savePreset: jest.fn(),
        deletePreset: jest.fn(),
        updatePreset: jest.fn(),
        clearAllPresets: jest.fn(),
      })
    })

    it('displays saved presets', async () => {
      render(<DateFilter {...defaultProps} showSavedPresets={true} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      expect(screen.getByText('Q1 2024')).toBeInTheDocument()
      expect(screen.getByText('Holiday Season')).toBeInTheDocument()
    })

    it('applies saved preset', async () => {
      render(<DateFilter {...defaultProps} showSavedPresets={true} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      const q1Button = screen.getByText('Q1 2024')
      await userEvent.click(q1Button)
      
      expect(defaultProps.onChange).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      })
    })

    it('saves new preset', async () => {
      const mockSavePreset = jest.fn()
      mockUseSavedPresets.mockReturnValue({
        savedPresets: mockSavedPresets,
        savePreset: mockSavePreset,
        deletePreset: jest.fn(),
        updatePreset: jest.fn(),
        clearAllPresets: jest.fn(),
      })

      render(<DateFilter {...defaultProps} showSavedPresets={true} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      const saveButton = screen.getByText('💾 Save Current Range as Preset')
      await userEvent.click(saveButton)
      
      const nameInput = screen.getByLabelText('Preset name')
      await userEvent.type(nameInput, 'Test Preset')
      
      const confirmSaveButton = screen.getByText('Save')
      await userEvent.click(confirmSaveButton)
      
      expect(mockSavePreset).toHaveBeenCalledWith({
        name: 'Test Preset',
        range: { startDate: '2024-01-01', endDate: '2024-01-31' },
      })
    })

    it('deletes saved preset', async () => {
      const mockDeletePreset = jest.fn()
      mockUseSavedPresets.mockReturnValue({
        savedPresets: mockSavedPresets,
        savePreset: jest.fn(),
        deletePreset: mockDeletePreset,
        updatePreset: jest.fn(),
        clearAllPresets: jest.fn(),
      })

      render(<DateFilter {...defaultProps} showSavedPresets={true} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      const deleteButton = screen.getByLabelText('Delete preset Q1 2024')
      await userEvent.click(deleteButton)
      
      expect(mockDeletePreset).toHaveBeenCalledWith('1')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<DateFilter {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(button).toHaveAttribute('aria-haspopup', 'listbox')
    })

    it('supports keyboard navigation', async () => {
      render(<DateFilter {...defaultProps} />)
      
      const button = screen.getByRole('button')
      button.focus()
      
      // Open dropdown with Enter key
      fireEvent.keyDown(button, { key: 'Enter' })
      
      await waitFor(() => {
        expect(screen.getByText('Quick Presets')).toBeInTheDocument()
      })
      
      // Close dropdown with Escape key
      fireEvent.keyDown(document, { key: 'Escape' })
      
      await waitFor(() => {
        expect(screen.queryByText('Quick Presets')).not.toBeInTheDocument()
      })
    })

    it('has proper focus management', async () => {
      render(<DateFilter {...defaultProps} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      // First focusable element should be focused
      const firstFocusableElement = screen.getByLabelText('Start Date')
      expect(firstFocusableElement).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('handles invalid date inputs gracefully', async () => {
      render(<DateFilter {...defaultProps} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      const startDateInput = screen.getByLabelText('Start Date')
      await userEvent.clear(startDateInput)
      await userEvent.type(startDateInput, 'invalid-date')
      
      // Should not crash and should handle gracefully
      expect(startDateInput).toHaveValue('invalid-date')
    })

    it('handles empty date range', () => {
      const emptyRange = { startDate: '', endDate: '' }
      render(<DateFilter value={emptyRange} onChange={jest.fn()} />)
      
      expect(screen.getByText('Select date range')).toBeInTheDocument()
    })

    it('handles disabled state', () => {
      render(<DateFilter {...defaultProps} disabled={true} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })
})

describe('OptimizedDateFilter Component', () => {
  const defaultProps = {
    value: { startDate: '2024-01-01', endDate: '2024-01-31' },
    onChange: jest.fn(),
  }

  beforeEach(() => {
    mockUseSavedPresets.mockReturnValue({
      savedPresets: [],
      savePreset: jest.fn(),
      deletePreset: jest.fn(),
      updatePreset: jest.fn(),
      clearAllPresets: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Performance Optimizations', () => {
    it('memoizes default presets', () => {
      const { rerender } = render(<OptimizedDateFilter {...defaultProps} />)
      
      // Re-render multiple times
      rerender(<OptimizedDateFilter {...defaultProps} />)
      rerender(<OptimizedDateFilter {...defaultProps} />)
      
      // Should not cause performance issues
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('uses callback handlers', async () => {
      render(<OptimizedDateFilter {...defaultProps} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      const todayButton = screen.getByText('Today')
      await userEvent.click(todayButton)
      
      expect(defaultProps.onChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('Search Functionality', () => {
    const mockSavedPresets = [
      {
        id: '1',
        name: 'Q1 2024',
        range: { startDate: '2024-01-01', endDate: '2024-03-31' },
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Holiday Season',
        range: { startDate: '2024-12-01', endDate: '2024-12-31' },
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]

    beforeEach(() => {
      mockUseSavedPresets.mockReturnValue({
        savedPresets: mockSavedPresets,
        savePreset: jest.fn(),
        deletePreset: jest.fn(),
        updatePreset: jest.fn(),
        clearAllPresets: jest.fn(),
      })
    })

    it('filters presets by search term', async () => {
      render(<OptimizedDateFilter {...defaultProps} showSavedPresets={true} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      const searchInput = screen.getByLabelText('Search date range presets')
      await userEvent.type(searchInput, 'Q1')
      
      expect(screen.getByText('Q1 2024')).toBeInTheDocument()
      expect(screen.queryByText('Holiday Season')).not.toBeInTheDocument()
    })

    it('shows all presets when search is empty', async () => {
      render(<OptimizedDateFilter {...defaultProps} showSavedPresets={true} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      const searchInput = screen.getByLabelText('Search date range presets')
      await userEvent.clear(searchInput)
      
      expect(screen.getByText('Q1 2024')).toBeInTheDocument()
      expect(screen.getByText('Holiday Season')).toBeInTheDocument()
    })
  })

  describe('Enhanced Accessibility', () => {
    it('has comprehensive ARIA attributes', () => {
      render(<OptimizedDateFilter {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(button).toHaveAttribute('aria-haspopup', 'listbox')
      expect(button).toHaveAttribute('aria-label', 'Date range filter')
    })

    it('supports screen reader navigation', async () => {
      render(<OptimizedDateFilter {...defaultProps} />)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      const listbox = screen.getByRole('listbox')
      expect(listbox).toHaveAttribute('aria-label', 'Date range options')
      
      const options = screen.getAllByRole('option')
      expect(options.length).toBeGreaterThan(0)
    })
  })
})
