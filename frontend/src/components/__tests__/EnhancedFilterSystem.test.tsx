import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnhancedFilterBar } from '../EnhancedFilterBar'
import { EnhancedFilterDropdown } from '../EnhancedFilterDropdown'
import { DateFilter } from '../DateFilter'

// Mock data for testing
const mockQuickActions = [
  {
    id: 'currentFY',
    label: 'Current FY',
    action: vi.fn(),
    icon: '📅'
  },
  {
    id: 'cashPayment',
    label: 'Cash Payment',
    action: vi.fn(),
    icon: '💰'
  }
]

const mockFilterOptions = [
  { value: 'all', label: 'All Items' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]

describe('Enhanced Filter System - Comprehensive UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('EnhancedFilterBar Component', () => {
    test('renders with default props', () => {
      render(
        <EnhancedFilterBar onClearAll={vi.fn()}>
          <div>Filter content</div>
        </EnhancedFilterBar>
      )
      
      expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
      expect(screen.getByText('Filter content')).toBeInTheDocument()
    })

    test('renders with custom title', () => {
      render(
        <EnhancedFilterBar title="Custom Filter Title" onClearAll={vi.fn()}>
          <div>Filter content</div>
        </EnhancedFilterBar>
      )
      
      expect(screen.getByText('Custom Filter Title')).toBeInTheDocument()
    })

    test('shows active filter count', () => {
      render(
        <EnhancedFilterBar 
          title="Test Filters"
          activeFiltersCount={3}
          onClearAll={vi.fn()}
        >
          <div>Filter content</div>
        </EnhancedFilterBar>
      )
      
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    test('shows zero active filters', () => {
      render(
        <EnhancedFilterBar 
          title="Test Filters"
          activeFiltersCount={0}
          onClearAll={vi.fn()}
        >
          <div>Filter content</div>
        </EnhancedFilterBar>
      )
      
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    test('calls onClearAll when clear button is clicked', async () => {
      const onClearAll = vi.fn()
      render(
        <EnhancedFilterBar 
          title="Test Filters"
          activeFiltersCount={2}
          onClearAll={onClearAll}
        >
          <div>Filter content</div>
        </EnhancedFilterBar>
      )
      
      const clearButton = screen.getByText('Clear All Filters')
      fireEvent.click(clearButton)
      
      expect(onClearAll).toHaveBeenCalledTimes(1)
    })

    test('renders quick actions when enabled', () => {
      render(
        <EnhancedFilterBar 
          title="Test Filters"
          showQuickActions={true}
          quickActions={mockQuickActions}
          onClearAll={vi.fn()}
        >
          <div>Filter content</div>
        </EnhancedFilterBar>
      )
      
      expect(screen.getByText('Current FY')).toBeInTheDocument()
      expect(screen.getByText('Cash Payment')).toBeInTheDocument()
    })

    test('calls quick action when clicked', async () => {
      render(
        <EnhancedFilterBar 
          title="Test Filters"
          showQuickActions={true}
          quickActions={mockQuickActions}
          onClearAll={vi.fn()}
        >
          <div>Filter content</div>
        </EnhancedFilterBar>
      )
      
      const quickActionButton = screen.getByText('Current FY')
      fireEvent.click(quickActionButton)
      
      expect(mockQuickActions[0].action).toHaveBeenCalledTimes(1)
    })

    test('starts expanded by default', () => {
      render(
        <EnhancedFilterBar 
          title="Test Filters"
          defaultCollapsed={false}
          onClearAll={vi.fn()}
        >
          <div>Filter content</div>
        </EnhancedFilterBar>
      )
      
      expect(screen.getByText('Filter content')).toBeInTheDocument()
    })

    test('can be collapsed and expanded', async () => {
      render(
        <EnhancedFilterBar 
          title="Test Filters"
          onClearAll={vi.fn()}
        >
          <div>Filter content</div>
        </EnhancedFilterBar>
      )
      
      const toggleButton = screen.getByRole('button', { name: /toggle filters/i })
      fireEvent.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Filter content')).not.toBeInTheDocument()
      })
      
      fireEvent.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.getByText('Filter content')).toBeInTheDocument()
      })
    })

    test('has proper accessibility attributes', () => {
      render(
        <EnhancedFilterBar 
          title="Test Filters"
          onClearAll={vi.fn()}
        >
          <div>Filter content</div>
        </EnhancedFilterBar>
      )
      
      const toggleButton = screen.getByRole('button', { name: /toggle filters/i })
      expect(toggleButton).toHaveAttribute('aria-expanded')
      expect(toggleButton).toHaveAttribute('aria-controls')
    })

    test('renders 4-column grid layout', () => {
      render(
        <EnhancedFilterBar 
          title="Test Filters"
          onClearAll={vi.fn()}
        >
          <div data-testid="filter-1">Filter 1</div>
          <div data-testid="filter-2">Filter 2</div>
          <div data-testid="filter-3">Filter 3</div>
          <div data-testid="filter-4">Filter 4</div>
        </EnhancedFilterBar>
      )
      
      const filterContainer = screen.getByText('Filter 1').parentElement
      expect(filterContainer).toHaveStyle({ display: 'grid' })
      expect(filterContainer).toHaveStyle({ gridTemplateColumns: 'repeat(4, 1fr)' })
    })
  })

  describe('EnhancedFilterDropdown Component', () => {
    test('renders with default props', () => {
      render(
        <EnhancedFilterDropdown
          value="all"
          onChange={vi.fn()}
          options={mockFilterOptions}
          placeholder="Select option"
        />
      )
      
      expect(screen.getByText('All Items')).toBeInTheDocument()
    })

    test('opens dropdown on click', async () => {
      render(
        <EnhancedFilterDropdown
          value="all"
          onChange={vi.fn()}
          options={mockFilterOptions}
          placeholder="Select option"
        />
      )
      
      const dropdown = screen.getByText('All Items')
      fireEvent.click(dropdown)
      
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument()
        expect(screen.getByText('Inactive')).toBeInTheDocument()
      })
    })

    test('calls onChange when option is selected', async () => {
      const onChange = vi.fn()
      render(
        <EnhancedFilterDropdown
          value="all"
          onChange={onChange}
          options={mockFilterOptions}
          placeholder="Select option"
        />
      )
      
      const dropdown = screen.getByText('All Items')
      fireEvent.click(dropdown)
      
      await waitFor(() => {
        const activeOption = screen.getByText('Active')
        fireEvent.click(activeOption)
      })
      
      expect(onChange).toHaveBeenCalledWith('active')
    })

    test('supports search functionality', async () => {
      render(
        <EnhancedFilterDropdown
          value="all"
          onChange={vi.fn()}
          options={mockFilterOptions}
          placeholder="Select option"
          searchable={true}
        />
      )
      
      const dropdown = screen.getByText('All Items')
      fireEvent.click(dropdown)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search options...')
        fireEvent.change(searchInput, { target: { value: 'active' } })
      })
      
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.queryByText('Inactive')).not.toBeInTheDocument()
    })

    test('supports multiple selection', async () => {
      const onChange = vi.fn()
      render(
        <EnhancedFilterDropdown
          value={[]}
          onChange={onChange}
          options={mockFilterOptions}
          placeholder="Select options"
          multiple={true}
        />
      )
      
      const dropdown = screen.getByText('Select options')
      fireEvent.click(dropdown)
      
      await waitFor(() => {
        const activeOption = screen.getByText('Active')
        const inactiveOption = screen.getByText('Inactive')
        
        fireEvent.click(activeOption)
        fireEvent.click(inactiveOption)
      })
      
      expect(onChange).toHaveBeenCalledWith(['active'])
      expect(onChange).toHaveBeenCalledWith(['active', 'inactive'])
    })

    test('shows option counts when enabled', async () => {
      render(
        <EnhancedFilterDropdown
          value="all"
          onChange={vi.fn()}
          options={mockFilterOptions}
          placeholder="Select option"
          showCounts={true}
        />
      )
      
      const dropdown = screen.getByText('All Items')
      fireEvent.click(dropdown)
      
      await waitFor(() => {
        expect(screen.getByText('Active (1)')).toBeInTheDocument()
      })
    })

    test('handles disabled state', () => {
      render(
        <EnhancedFilterDropdown
          value="all"
          onChange={vi.fn()}
          options={mockFilterOptions}
          placeholder="Select option"
          disabled={true}
        />
      )
      
      const dropdown = screen.getByText('All Items')
      expect(dropdown.parentElement).toHaveStyle({ opacity: '0.6' })
      expect(dropdown.parentElement).toHaveStyle({ cursor: 'not-allowed' })
    })

    test('supports keyboard navigation', async () => {
      render(
        <EnhancedFilterDropdown
          value="all"
          onChange={vi.fn()}
          options={mockFilterOptions}
          placeholder="Select option"
        />
      )
      
      const dropdown = screen.getByText('All Items')
      fireEvent.click(dropdown)
      
      await waitFor(() => {
        fireEvent.keyDown(dropdown, { key: 'ArrowDown' })
        fireEvent.keyDown(dropdown, { key: 'Enter' })
      })
      
      // Should select the first option
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    test('closes on outside click', async () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <EnhancedFilterDropdown
            value="all"
            onChange={vi.fn()}
            options={mockFilterOptions}
            placeholder="Select option"
          />
        </div>
      )
      
      const dropdown = screen.getByText('All Items')
      fireEvent.click(dropdown)
      
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument()
      })
      
      const outside = screen.getByTestId('outside')
      fireEvent.click(outside)
      
      await waitFor(() => {
        expect(screen.queryByText('Active')).not.toBeInTheDocument()
      })
    })
  })

  describe('DateFilter Component', () => {
    const defaultDateRange = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    }

    test('renders with default props', () => {
      render(
        <DateFilter
          value={defaultDateRange}
          onChange={vi.fn()}
        />
      )
      
      expect(screen.getByText('📅')).toBeInTheDocument()
    })

    test('opens date picker on click', async () => {
      render(
        <DateFilter
          value={defaultDateRange}
          onChange={vi.fn()}
        />
      )
      
      const dateFilter = screen.getByText('📅')
      fireEvent.click(dateFilter)
      
      await waitFor(() => {
        expect(screen.getByText('Quick Presets')).toBeInTheDocument()
        expect(screen.getByText('Today')).toBeInTheDocument()
        expect(screen.getByText('Last 7 Days')).toBeInTheDocument()
      })
    })

    test('calls onChange when preset is selected', async () => {
      const onChange = vi.fn()
      render(
        <DateFilter
          value={defaultDateRange}
          onChange={onChange}
        />
      )
      
      const dateFilter = screen.getByText('📅')
      fireEvent.click(dateFilter)
      
      await waitFor(() => {
        const todayOption = screen.getByText('Today')
        fireEvent.click(todayOption)
      })
      
      expect(onChange).toHaveBeenCalled()
    })

    test('supports custom date range', async () => {
      const onChange = vi.fn()
      render(
        <DateFilter
          value={defaultDateRange}
          onChange={onChange}
        />
      )
      
      const dateFilter = screen.getByText('📅')
      fireEvent.click(dateFilter)
      
      await waitFor(() => {
        expect(screen.getByText('Custom Range')).toBeInTheDocument()
      })
    })
  })

  describe('Filter System Integration Tests', () => {
    test('complete filter workflow', async () => {
      const onClearAll = vi.fn()
      const onFilterChange = vi.fn()
      const defaultDateRange = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10)
      }
      
      render(
        <EnhancedFilterBar 
          title="Integration Test"
          activeFiltersCount={2}
          onClearAll={onClearAll}
          showQuickActions={true}
          quickActions={mockQuickActions}
        >
          <EnhancedFilterDropdown
            value="all"
            onChange={onFilterChange}
            options={mockFilterOptions}
            placeholder="Select status"
          />
          <DateFilter
            value={defaultDateRange}
            onChange={onFilterChange}
          />
        </EnhancedFilterBar>
      )
      
      // Test quick action
      const quickAction = screen.getByText('Current FY')
      fireEvent.click(quickAction)
      expect(mockQuickActions[0].action).toHaveBeenCalled()
      
      // Test filter dropdown
      const dropdown = screen.getByText('All Items')
      fireEvent.click(dropdown)
      
      await waitFor(() => {
        const activeOption = screen.getByText('Active')
        fireEvent.click(activeOption)
      })
      
      expect(onFilterChange).toHaveBeenCalledWith('active')
      
      // Test clear all
      const clearButton = screen.getByText('Clear All Filters')
      fireEvent.click(clearButton)
      expect(onClearAll).toHaveBeenCalled()
    })

    test('filter state persistence', async () => {
      const onFilterChange = vi.fn()
      
      const { rerender } = render(
        <EnhancedFilterBar 
          title="State Test"
          activeFiltersCount={1}
          onClearAll={vi.fn()}
        >
          <EnhancedFilterDropdown
            value="active"
            onChange={onFilterChange}
            options={mockFilterOptions}
            placeholder="Select status"
          />
        </EnhancedFilterBar>
      )
      
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      
      // Re-render with different state
      rerender(
        <EnhancedFilterBar 
          title="State Test"
          activeFiltersCount={0}
          onClearAll={vi.fn()}
        >
          <EnhancedFilterDropdown
            value="all"
            onChange={onFilterChange}
            options={mockFilterOptions}
            placeholder="Select status"
          />
        </EnhancedFilterBar>
      )
      
      expect(screen.getByText('All Items')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Accessibility Tests', () => {
    test('EnhancedFilterBar has proper ARIA labels', () => {
      render(
        <EnhancedFilterBar 
          title="Accessibility Test"
          onClearAll={vi.fn()}
        >
          <div>Content</div>
        </EnhancedFilterBar>
      )
      
      const toggleButton = screen.getByRole('button', { name: /toggle filters/i })
      expect(toggleButton).toHaveAttribute('aria-expanded')
      expect(toggleButton).toHaveAttribute('aria-controls')
      
      const clearButton = screen.getByRole('button', { name: /clear all filters/i })
      expect(clearButton).toBeInTheDocument()
    })

    test('EnhancedFilterDropdown has proper ARIA labels', () => {
      render(
        <EnhancedFilterDropdown
          value="all"
          onChange={vi.fn()}
          options={mockFilterOptions}
          placeholder="Select option"
        />
      )
      
      const dropdown = screen.getByRole('button')
      expect(dropdown).toHaveAttribute('aria-haspopup', 'listbox')
      expect(dropdown).toHaveAttribute('aria-expanded', 'false')
    })

    test('supports keyboard navigation', async () => {
      render(
        <EnhancedFilterDropdown
          value="all"
          onChange={vi.fn()}
          options={mockFilterOptions}
          placeholder="Select option"
        />
      )
      
      const dropdown = screen.getByRole('button')
      
      // Open dropdown with Enter key
      fireEvent.keyDown(dropdown, { key: 'Enter' })
      
      await waitFor(() => {
        expect(dropdown).toHaveAttribute('aria-expanded', 'true')
      })
      
      // Navigate with arrow keys
      fireEvent.keyDown(dropdown, { key: 'ArrowDown' })
      fireEvent.keyDown(dropdown, { key: 'Enter' })
      
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  describe('Performance Tests', () => {
    test('handles large option lists efficiently', async () => {
      const largeOptions = Array.from({ length: 100 }, (_, i) => ({
        value: `option-${i}`,
        label: `Option ${i}`
      }))
      
      render(
        <EnhancedFilterDropdown
          value="all"
          onChange={vi.fn()}
          options={largeOptions}
          placeholder="Select option"
        />
      )
      
      const dropdown = screen.getByText('All Items')
      const startTime = performance.now()
      
      fireEvent.click(dropdown)
      
      await waitFor(() => {
        expect(screen.getByText('Option 0')).toBeInTheDocument()
        expect(screen.getByText('Option 99')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100) // Should render within 100ms
    })

    test('filter bar renders quickly with many filters', () => {
      const manyFilters = Array.from({ length: 8 }, (_, i) => (
        <div key={i} data-testid={`filter-${i}`}>Filter {i}</div>
      ))
      
      const startTime = performance.now()
      
      render(
        <EnhancedFilterBar 
          title="Performance Test"
          onClearAll={vi.fn()}
        >
          {manyFilters}
        </EnhancedFilterBar>
      )
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(50) // Should render within 50ms
      
      // Verify all filters are rendered
      for (let i = 0; i < 8; i++) {
        expect(screen.getByTestId(`filter-${i}`)).toBeInTheDocument()
      }
    })
  })
})
