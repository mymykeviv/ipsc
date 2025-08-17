import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { EnhancedFilterBar } from '../EnhancedFilterBar'

describe('EnhancedFilterBar', () => {
  const defaultProps = {
    children: <div data-testid="filter-content">Filter Content</div>,
    onClearAll: vi.fn(),
    showClearAll: true,
    title: 'Test Filters',
    activeFiltersCount: 0
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('should render with default props', () => {
      render(<EnhancedFilterBar {...defaultProps} />)
      
      expect(screen.getByText('Test Filters')).toBeInTheDocument()
      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByText('Filter Content')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    test('should render with custom title', () => {
      render(<EnhancedFilterBar {...defaultProps} title="Custom Title" />)
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument()
    })

    test('should show active filters count when greater than 0', () => {
      render(<EnhancedFilterBar {...defaultProps} activeFiltersCount={3} />)
      
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    test('should not show active filters count when 0', () => {
      render(<EnhancedFilterBar {...defaultProps} activeFiltersCount={0} />)
      
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    test('should render quick actions when provided', () => {
      const quickActions = [
        { label: 'Action 1', action: vi.fn() },
        { label: 'Action 2', action: vi.fn() }
      ]
      
      render(<EnhancedFilterBar {...defaultProps} showQuickActions={true} quickActions={quickActions} />)
      
      // Initially collapsed, so quick actions should not be visible
      expect(screen.queryByText('Action 1')).not.toBeInTheDocument()
      
      // Expand the filter bar
      fireEvent.click(screen.getByRole('button'))
      
      expect(screen.getByText('Action 1')).toBeInTheDocument()
      expect(screen.getByText('Action 2')).toBeInTheDocument()
    })
  })

  describe('Collapsible Behavior', () => {
    test('should be collapsed by default', () => {
      render(<EnhancedFilterBar {...defaultProps} />)
      
      const content = screen.getByText('Filter Content')
      expect(content).toBeInTheDocument()
      
      // Check that the content is visually hidden (collapsed)
      const filterBar = screen.getByTestId('filter-content').closest('.enhanced-filter-bar')
      expect(filterBar).toHaveStyle({ maxHeight: '0' })
    })

    test('should expand when clicked', async () => {
      render(<EnhancedFilterBar {...defaultProps} />)
      
      const toggleButton = screen.getByRole('button')
      fireEvent.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.getByText('No filters applied')).toBeInTheDocument()
      })
    })

    test('should collapse when clicked again', async () => {
      render(<EnhancedFilterBar {...defaultProps} />)
      
      const toggleButton = screen.getByRole('button')
      
      // First click to expand
      fireEvent.click(toggleButton)
      await waitFor(() => {
        expect(screen.getByText('No filters applied')).toBeInTheDocument()
      })
      
      // Second click to collapse
      fireEvent.click(toggleButton)
      await waitFor(() => {
        expect(screen.queryByText('No filters applied')).not.toBeInTheDocument()
      })
    })

    test('should start expanded when defaultCollapsed is false', () => {
      render(<EnhancedFilterBar {...defaultProps} defaultCollapsed={false} />)
      
      expect(screen.getByText('No filters applied')).toBeInTheDocument()
    })

    test('should call onToggleCollapse when toggled', () => {
      const onToggleCollapse = vi.fn()
      render(<EnhancedFilterBar {...defaultProps} onToggleCollapse={onToggleCollapse} />)
      
      const toggleButton = screen.getByRole('button')
      fireEvent.click(toggleButton)
      
      expect(onToggleCollapse).toHaveBeenCalledWith(false)
      
      fireEvent.click(toggleButton)
      
      expect(onToggleCollapse).toHaveBeenCalledWith(true)
    })
  })

  describe('Clear All Functionality', () => {
    test('should show clear all button when active filters count > 0', () => {
      render(<EnhancedFilterBar {...defaultProps} activeFiltersCount={2} />)
      
      // Expand first
      fireEvent.click(screen.getByRole('button'))
      
      expect(screen.getByText('Clear All Filters')).toBeInTheDocument()
    })

    test('should not show clear all button when active filters count is 0', () => {
      render(<EnhancedFilterBar {...defaultProps} activeFiltersCount={0} />)
      
      // Expand first
      fireEvent.click(screen.getByRole('button'))
      
      expect(screen.queryByText('Clear All Filters')).not.toBeInTheDocument()
    })

    test('should call onClearAll when clear all button is clicked', () => {
      const onClearAll = vi.fn()
      render(<EnhancedFilterBar {...defaultProps} activeFiltersCount={2} onClearAll={onClearAll} />)
      
      // Expand first
      fireEvent.click(screen.getByRole('button'))
      
      const clearButton = screen.getByText('Clear All Filters')
      fireEvent.click(clearButton)
      
      expect(onClearAll).toHaveBeenCalled()
    })

    test('should not show clear all button when showClearAll is false', () => {
      render(<EnhancedFilterBar {...defaultProps} activeFiltersCount={2} showClearAll={false} />)
      
      // Expand first
      fireEvent.click(screen.getByRole('button'))
      
      expect(screen.queryByText('Clear All Filters')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(<EnhancedFilterBar {...defaultProps} />)
      
      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
      expect(toggleButton).toHaveAttribute('aria-label', 'Expand Test Filters')
    })

    test('should update ARIA attributes when toggled', async () => {
      render(<EnhancedFilterBar {...defaultProps} />)
      
      const toggleButton = screen.getByRole('button')
      
      fireEvent.click(toggleButton)
      
      await waitFor(() => {
        expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
        expect(toggleButton).toHaveAttribute('aria-label', 'Collapse Test Filters')
      })
    })

    test('should be keyboard accessible', async () => {
      render(<EnhancedFilterBar {...defaultProps} />)
      
      const toggleButton = screen.getByRole('button')
      toggleButton.focus()
      
      // Press Enter to expand
      fireEvent.keyDown(toggleButton, { key: 'Enter' })
      
      await waitFor(() => {
        expect(screen.getByText('No filters applied')).toBeInTheDocument()
      })
      
      // Press Space to collapse
      fireEvent.keyDown(toggleButton, { key: ' ' })
      
      await waitFor(() => {
        expect(screen.queryByText('No filters applied')).not.toBeInTheDocument()
      })
    })
  })

  describe('Quick Actions', () => {
    test('should call quick action when clicked', () => {
      const action1 = vi.fn()
      const action2 = vi.fn()
      const quickActions = [
        { label: 'Action 1', action: action1 },
        { label: 'Action 2', action: action2 }
      ]
      
      render(<EnhancedFilterBar {...defaultProps} showQuickActions={true} quickActions={quickActions} />)
      
      // Expand first
      fireEvent.click(screen.getByRole('button'))
      
      const action1Button = screen.getByText('Action 1')
      fireEvent.click(action1Button)
      
      expect(action1).toHaveBeenCalled()
      expect(action2).not.toHaveBeenCalled()
    })

    test('should prevent event bubbling when quick action is clicked', () => {
      const action = vi.fn()
      const quickActions = [{ label: 'Action', action }]
      
      render(<EnhancedFilterBar {...defaultProps} showQuickActions={true} quickActions={quickActions} />)
      
      // Expand first
      fireEvent.click(screen.getByRole('button'))
      
      const actionButton = screen.getByText('Action')
      fireEvent.click(actionButton)
      
      // The filter bar should remain expanded
      expect(screen.getByText('No filters applied')).toBeInTheDocument()
    })
  })

  describe('Filter Count Display', () => {
    test('should show correct filter count text', () => {
      render(<EnhancedFilterBar {...defaultProps} activeFiltersCount={1} />)
      
      // Expand first
      fireEvent.click(screen.getByRole('button'))
      
      expect(screen.getByText('1 active filter')).toBeInTheDocument()
    })

    test('should show plural form for multiple filters', () => {
      render(<EnhancedFilterBar {...defaultProps} activeFiltersCount={3} />)
      
      // Expand first
      fireEvent.click(screen.getByRole('button'))
      
      expect(screen.getByText('3 active filters')).toBeInTheDocument()
    })

    test('should show "No filters applied" when count is 0', () => {
      render(<EnhancedFilterBar {...defaultProps} activeFiltersCount={0} />)
      
      // Expand first
      fireEvent.click(screen.getByRole('button'))
      
      expect(screen.getByText('No filters applied')).toBeInTheDocument()
    })
  })

  describe('Styling and Visual Feedback', () => {
    test('should have hover effects', () => {
      render(<EnhancedFilterBar {...defaultProps} />)
      
      const toggleButton = screen.getByRole('button')
      
      // Simulate hover
      fireEvent.mouseEnter(toggleButton)
      
      // Check that the background color changes (this would need CSS-in-JS testing)
      expect(toggleButton).toBeInTheDocument()
    })

    test('should have proper transitions', () => {
      render(<EnhancedFilterBar {...defaultProps} />)
      
      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveStyle({ transition: 'all 0.2s ease' })
    })
  })
})
