import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from './Button'

export interface DateRange {
  startDate: string
  endDate: string
}

export interface SavedPreset {
  id: string
  name: string
  range: DateRange
  createdAt: string
}

export interface DateFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  presets?: Array<{
    label: string
    value: string
    getRange: () => DateRange
  }>
  showFinancialPeriods?: boolean
  showComparison?: boolean
  comparisonRange?: DateRange | null
  onComparisonChange?: (range: DateRange | null) => void
  disabled?: boolean
  className?: string
  showSavedPresets?: boolean
  onSavePreset?: (preset: Omit<SavedPreset, 'id' | 'createdAt'>) => void
  onDeletePreset?: (presetId: string) => void
  savedPresets?: SavedPreset[]
}

export function DateFilter({
  value,
  onChange,
  presets = [],
  showFinancialPeriods = true,
  showComparison = false,
  comparisonRange,
  onComparisonChange,
  disabled = false,
  className = '',
  showSavedPresets = true,
  onSavePreset,
  onDeletePreset,
  savedPresets = []
}: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState<DateRange>(value)
  const [tempComparisonRange, setTempComparisonRange] = useState<DateRange | null>(comparisonRange || null)
  const [showSavePresetModal, setShowSavePresetModal] = useState(false)
  const [presetName, setPresetName] = useState('')
  const dateFilterRef = useRef<HTMLDivElement>(null)

  // Default presets
  const defaultPresets = useMemo(() => [
    {
      label: 'Today',
      value: 'today',
      getRange: () => {
        const today = new Date()
        return {
          startDate: today.toISOString().slice(0, 10),
          endDate: today.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'Yesterday',
      value: 'yesterday',
      getRange: () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return {
          startDate: yesterday.toISOString().slice(0, 10),
          endDate: yesterday.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'Last 7 Days',
      value: 'last7days',
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 6)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'Last 30 Days',
      value: 'last30days',
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 29)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'Last 90 Days',
      value: 'last90days',
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 89)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'This Month',
      value: 'thisMonth',
      getRange: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'Last Month',
      value: 'lastMonth',
      getRange: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const end = new Date(now.getFullYear(), now.getMonth(), 0)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'This Quarter',
      value: 'thisQuarter',
      getRange: () => {
        const now = new Date()
        const quarter = Math.floor(now.getMonth() / 3)
        const start = new Date(now.getFullYear(), quarter * 3, 1)
        const end = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'Last Quarter',
      value: 'lastQuarter',
      getRange: () => {
        const now = new Date()
        const quarter = Math.floor(now.getMonth() / 3)
        const start = new Date(now.getFullYear(), (quarter - 1) * 3, 1)
        const end = new Date(now.getFullYear(), quarter * 3, 0)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'This Year',
      value: 'thisYear',
      getRange: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), 0, 1)
        const end = new Date(now.getFullYear(), 11, 31)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'Last Year',
      value: 'lastYear',
      getRange: () => {
        const now = new Date()
        const start = new Date(now.getFullYear() - 1, 0, 1)
        const end = new Date(now.getFullYear() - 1, 11, 31)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    }
  ], [])

  // All presets including saved ones
  const allPresets = useMemo(() => {
    const defaultPresetItems = defaultPresets.map(preset => ({
      ...preset,
      type: 'default' as const
    }))
    
    const savedPresetItems = savedPresets.map(preset => ({
      label: preset.name,
      value: preset.id,
      getRange: () => preset.range,
      type: 'saved' as const,
      preset
    }))
    
    return [...defaultPresetItems, ...savedPresetItems]
  }, [defaultPresets, savedPresets])

  // Handle preset selection
  const handlePresetSelect = (preset: typeof allPresets[0]) => {
    const newRange = preset.getRange()
    setTempRange(newRange)
    onChange(newRange)
    setIsOpen(false)
  }

  // Handle save preset
  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset({
        name: presetName.trim(),
        range: tempRange
      })
      setPresetName('')
      setShowSavePresetModal(false)
    }
  }

  // Handle delete preset
  const handleDeletePreset = (presetId: string) => {
    if (onDeletePreset) {
      onDeletePreset(presetId)
    }
  }

  // Handle apply changes
  const handleApply = () => {
    onChange(tempRange)
    if (onComparisonChange && tempComparisonRange) {
      onComparisonChange(tempComparisonRange)
    }
    setIsOpen(false)
  }

  // Handle cancel
  const handleCancel = () => {
    setTempRange(value)
    setTempComparisonRange(comparisonRange || null)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Update temp range when value changes
  useEffect(() => {
    setTempRange(value)
  }, [value])

  // Update temp comparison range when comparison range changes
  useEffect(() => {
    setTempComparisonRange(comparisonRange || null)
  }, [comparisonRange])

  const formatDateRange = (range: DateRange) => {
    const start = new Date(range.startDate).toLocaleDateString()
    const end = new Date(range.endDate).toLocaleDateString()
    return start === end ? start : `${start} - ${end}`
  }

  return (
    <div className={`relative ${className}`} ref={dateFilterRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
      >
        <span>📅</span>
        <span>{formatDateRange(value)}</span>
        <span>▼</span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="p-4">
            {/* Presets Section */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {allPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetSelect(preset)}
                    className="text-left px-3 py-2 text-sm border rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <span>{preset.label}</span>
                      {preset.type === 'saved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePreset(preset.preset.id)
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Custom Range</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={tempRange.startDate}
                    onChange={(e) => setTempRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={tempRange.endDate}
                    onChange={(e) => setTempRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Save Preset Button */}
            {showSavedPresets && onSavePreset && (
              <div className="mb-4">
                <button
                  onClick={() => setShowSavePresetModal(true)}
                  className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                >
                  💾 Save Current Range as Preset
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleApply}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {showSavePresetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Save Date Range Preset</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preset Name
              </label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Enter preset name..."
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="text-sm text-gray-600">
                {formatDateRange(tempRange)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSavePresetModal(false)
                  setPresetName('')
                }}
                className="flex-1 px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
