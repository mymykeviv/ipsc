import { useState, useEffect } from 'react'
import { SavedPreset } from '../components/DateFilter'

const STORAGE_KEY = 'dateFilterPresets'

export function useSavedPresets() {
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([])

  // Load presets from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const presets = JSON.parse(stored)
        setSavedPresets(presets)
      } catch (error) {
        console.error('Failed to parse saved presets:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Save presets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPresets))
  }, [savedPresets])

  const savePreset = (preset: Omit<SavedPreset, 'id' | 'createdAt'>) => {
    const newPreset: SavedPreset = {
      ...preset,
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    }
    
    setSavedPresets(prev => [...prev, newPreset])
    return newPreset
  }

  const deletePreset = (presetId: string) => {
    setSavedPresets(prev => prev.filter(preset => preset.id !== presetId))
  }

  const updatePreset = (presetId: string, updates: Partial<Omit<SavedPreset, 'id' | 'createdAt'>>) => {
    setSavedPresets(prev => 
      prev.map(preset => 
        preset.id === presetId 
          ? { ...preset, ...updates }
          : preset
      )
    )
  }

  const clearAllPresets = () => {
    setSavedPresets([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    savedPresets,
    savePreset,
    deletePreset,
    updatePreset,
    clearAllPresets
  }
}
