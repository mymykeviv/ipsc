import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { EnhancedFilterDropdown } from '../EnhancedFilterDropdown'

describe('EnhancedFilterDropdown', () => {
  const defaultOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ]

  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    options: defaultOptions,
    placeholder: 'Select option'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('should render with default props', () => {
      render(<EnhancedFilterDropdown {...defaultProps} />)
      
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('Select option')).toBeInTheDocument()
    })

    test('should render with label', () => {
      render(<EnhancedFilterDropdown {...defaultProps} label="Test Label" />)
      
      expect(screen.getByText('Test Label')).toBeInTheDocument()
    })

    test('should show required indicator when required is true', () => {
      render(<EnhancedFilterDropdown {...defaultProps} label="Test Label" required={true} />)
      
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    test('should display selected value', () => {
      render(<EnhancedFilterDropdown {...defaultProps} value="option1" />)
      
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    test('should display placeholder when no value selected', () => {
      render(<EnhancedFilterDropdown {...defaultProps} value="" />)
      
      expect(screen.getByText('Select option')).toBeInTheDocument()
    })

    test('should show error message when error is provided', () => {
      render(<EnhancedFilterDropdown {...defaultProps} error="This field is required" />)
      
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })
  })

  describe('Single Selection', () => {
    test('should open dropdown when clicked', () => {
      render(<EnhancedFilterDropdown {...defaultProps} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Option 3')).toBeInTheDocument()
    })

    test('should call onChange when option is selected', () => {
      const onChange = vi.fn()
      render(<EnhancedFilterDropdown {...defaultProps} onChange={onChange} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      const option1 = screen.getByText('Option 1')
      fireEvent.click(option1)
      
      expect(onChange).toHaveBeenCalledWith('option1')
    })

    test('should close dropdown after selection', () => {
      render(<EnhancedFilterDropdown {...defaultProps} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      const option1 = screen.getByText('Option 1')
      fireEvent.click(option1)
      
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
    })

    test('should highlight selected option', () => {
      render(<EnhancedFilterDropdown {...defaultProps} value="option1" />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      const option1 = screen.getByText('Option 1')
      expect(option1.closest('div')).toHaveStyle({ backgroundColor: '#f8f9fa' })
    })
  })

  describe('Multiple Selection', () => {
    test('should show checkboxes when multiple is true', () => {
      render(<EnhancedFilterDropdown {...defaultProps} multiple={true} value={[]} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(3)
    })

    test('should call onChange with array when multiple options selected', () => {
      const onChange = vi.fn()
      render(<EnhancedFilterDropdown {...defaultProps} multiple={true} value={[]} onChange={onChange} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      const option1 = screen.getByText('Option 1')
      fireEvent.click(option1)
      
      expect(onChange).toHaveBeenCalledWith(['option1'])
    })

    test('should show selected count in display', () => {
      render(<EnhancedFilterDropdown {...defaultProps} multiple={true} value={['option1', 'option2']} />)
      
      expect(screen.getByText('2 selected')).toBeInTheDocument()
    })

    test('should show clear button when multiple options selected', () => {
      render(<EnhancedFilterDropdown {...defaultProps} multiple={true} value={['option1']} />)
      
      const clearButton = screen.getByTitle('Clear selection')
      expect(clearButton).toBeInTheDocument()
    })

    test('should clear selection when clear button is clicked', () => {
      const onChange = vi.fn()
      render(<EnhancedFilterDropdown {...defaultProps} multiple={true} value={['option1']} onChange={onChange} />)
      
      const clearButton = screen.getByTitle('Clear selection')
      fireEvent.click(clearButton)
      
      expect(onChange).toHaveBeenCalledWith([])
    })

    test('should show "Done" button in multiple mode', () => {
      render(<EnhancedFilterDropdown {...defaultProps} multiple={true} value={[]} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      expect(screen.getByText('Done')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    test('should show search input when searchable is true', () => {
      render(<EnhancedFilterDropdown {...defaultProps} searchable={true} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      expect(screen.getByPlaceholderText('Search options...')).toBeInTheDocument()
    })

    test('should filter options based on search term', () => {
      render(<EnhancedFilterDropdown {...defaultProps} searchable={true} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      const searchInput = screen.getByPlaceholderText('Search options...')
      fireEvent.change(searchInput, { target: { value: 'Option 1' } })
      
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
    })

    test('should show "No options found" when search has no results', () => {
      render(<EnhancedFilterDropdown {...defaultProps} searchable={true} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      const searchInput = screen.getByPlaceholderText('Search options...')
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } })
      
      expect(screen.getByText('No options found')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    test('should open dropdown on Enter key', () => {
      render(<EnhancedFilterDropdown {...defaultProps} />)
      
      const dropdown = screen.getByRole('combobox')
      dropdown.focus()
      fireEvent.keyDown(dropdown, { key: 'Enter' })
      
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    test('should open dropdown on Space key', () => {
      render(<EnhancedFilterDropdown {...defaultProps} />)
      
      const dropdown = screen.getByRole('combobox')
      dropdown.focus()
      fireEvent.keyDown(dropdown, { key: ' ' })
      
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    test('should navigate options with arrow keys', () => {
      render(<EnhancedFilterDropdown {...defaultProps} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      // Press Arrow Down
      fireEvent.keyDown(dropdown, { key: 'ArrowDown' })
      
      // The first option should be highlighted
      const option1 = screen.getByText('Option 1')
      expect(option1.closest('div')).toHaveStyle({ backgroundColor: '#e3f2fd' })
    })

    test('should select highlighted option on Enter', () => {
      const onChange = vi.fn()
      render(<EnhancedFilterDropdown {...defaultProps} onChange={onChange} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      // Press Arrow Down to highlight first option
      fireEvent.keyDown(dropdown, { key: 'ArrowDown' })
      
      // Press Enter to select
      fireEvent.keyDown(dropdown, { key: 'Enter' })
      
      expect(onChange).toHaveBeenCalledWith('option1')
    })

    test('should close dropdown on Escape key', () => {
      render(<EnhancedFilterDropdown {...defaultProps} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      fireEvent.keyDown(dropdown, { key: 'Escape' })
      
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(<EnhancedFilterDropdown {...defaultProps} />)
      
      const dropdown = screen.getByRole('combobox')
      expect(dropdown).toHaveAttribute('aria-expanded', 'false')
      expect(dropdown).toHaveAttribute('aria-haspopup', 'listbox')
    })

    test('should update ARIA attributes when opened', () => {
      render(<EnhancedFilterDropdown {...defaultProps} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      expect(dropdown).toHaveAttribute('aria-expanded', 'true')
    })

    test('should be disabled when disabled prop is true', () => {
      render(<EnhancedFilterDropdown {...defaultProps} disabled={true} />)
      
      const dropdown = screen.getByRole('combobox')
      expect(dropdown).toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('Categorized Options', () => {
    const categorizedOptions = [
      { value: 'cat1_opt1', label: 'Category 1 Option 1', category: 'Category 1' },
      { value: 'cat1_opt2', label: 'Category 1 Option 2', category: 'Category 1' },
      { value: 'cat2_opt1', label: 'Category 2 Option 1', category: 'Category 2' }
    ]

    test('should group options by category', () => {
      render(<EnhancedFilterDropdown {...defaultProps} options={categorizedOptions} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      expect(screen.getByText('Category 1')).toBeInTheDocument()
      expect(screen.getByText('Category 2')).toBeInTheDocument()
    })

    test('should not show category headers when only one category', () => {
      const singleCategoryOptions = [
        { value: 'opt1', label: 'Option 1', category: 'Category 1' },
        { value: 'opt2', label: 'Option 2', category: 'Category 1' }
      ]
      
      render(<EnhancedFilterDropdown {...defaultProps} options={singleCategoryOptions} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      expect(screen.queryByText('Category 1')).not.toBeInTheDocument()
    })
  })

  describe('Option Counts', () => {
    const optionsWithCounts = [
      { value: 'opt1', label: 'Option 1', count: 5 },
      { value: 'opt2', label: 'Option 2', count: 10 }
    ]

    test('should show option counts when showCounts is true', () => {
      render(<EnhancedFilterDropdown {...defaultProps} options={optionsWithCounts} showCounts={true} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    test('should not show option counts when showCounts is false', () => {
      render(<EnhancedFilterDropdown {...defaultProps} options={optionsWithCounts} showCounts={false} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      expect(screen.queryByText('5')).not.toBeInTheDocument()
      expect(screen.queryByText('10')).not.toBeInTheDocument()
    })
  })

  describe('Disabled Options', () => {
    const optionsWithDisabled = [
      { value: 'opt1', label: 'Option 1' },
      { value: 'opt2', label: 'Option 2', disabled: true },
      { value: 'opt3', label: 'Option 3' }
    ]

    test('should not allow selection of disabled options', () => {
      const onChange = vi.fn()
      render(<EnhancedFilterDropdown {...defaultProps} options={optionsWithDisabled} onChange={onChange} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      const disabledOption = screen.getByText('Option 2')
      fireEvent.click(disabledOption)
      
      expect(onChange).not.toHaveBeenCalled()
    })

    test('should show disabled options with reduced opacity', () => {
      render(<EnhancedFilterDropdown {...defaultProps} options={optionsWithDisabled} />)
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      const disabledOption = screen.getByText('Option 2')
      expect(disabledOption.closest('div')).toHaveStyle({ opacity: '0.5' })
    })
  })

  describe('Click Outside Behavior', () => {
    test('should close dropdown when clicking outside', () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <EnhancedFilterDropdown {...defaultProps} />
        </div>
      )
      
      const dropdown = screen.getByRole('combobox')
      fireEvent.click(dropdown)
      
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      
      const outside = screen.getByTestId('outside')
      fireEvent.mouseDown(outside)
      
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument()
    })
  })
})
