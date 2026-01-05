/**
 * Journal Feature Store
 * Manages journal/reflection-related state
 */

import { create } from 'zustand'
import type { JournalEntry } from '@/types'
import {
  getJournalEntries as fetchJournalEntries,
  getJournalEntryByDate as fetchJournalEntryByDate,
  getMoodStatistics as fetchMoodStatistics,
  addJournalEntry as addJournalEntryApi,
  updateJournalEntry as updateJournalEntryApi,
  deleteJournalEntry as deleteJournalEntryApi,
} from '@/lib/journalApi'
import { showError } from '@/lib/utils'
import { createSmartPoll } from '@/lib/utils/smart-polling'

interface JournalState {
  // Journal entries
  entries: JournalEntry[]
  isLoadingEntries: boolean
  
  // Current entry (for editing/viewing)
  currentEntry: JournalEntry | null
  
  // Mood statistics
  moodStats: {
    moodCounts: Record<string, number>
    averageMoodRating: number
    moodTrend: Array<{ date: string; moodRating: number }>
  } | null
  
  // Filters
  filters: {
    type?: JournalEntry['type']
    dateFrom?: string
    dateTo?: string
    search?: string
  }
  
  // Actions
  setEntries: (entries: JournalEntry[]) => void
  setCurrentEntry: (entry: JournalEntry | null) => void
  setFilters: (filters: Partial<JournalState['filters']>) => void
  loadEntries: (userId: string, filters?: JournalState['filters']) => Promise<void>
  subscribeEntries: (userId: string, filters?: JournalState['filters']) => () => void
  loadEntryByDate: (userId: string, date: string, type?: JournalEntry['type']) => Promise<JournalEntry | null>
  loadMoodStatistics: (userId: string, dateFrom?: string, dateTo?: string) => Promise<void>
  addEntry: (userId: string, entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateEntry: (userId: string, entryId: string, updates: Partial<JournalEntry>) => Promise<void>
  deleteEntry: (userId: string, entryId: string) => Promise<void>
  
  // Cleanup
  unsubscribe: () => void
}

let unsubscribeEntries: (() => void) | null = null

export const useJournalStore = create<JournalState>((set, get) => ({
  // Initial state
  entries: [],
  isLoadingEntries: true,
  currentEntry: null,
  moodStats: null,
  filters: {},

  setEntries: (entries) => {
    set({ entries, isLoadingEntries: false })
  },

  setCurrentEntry: (entry) => {
    set({ currentEntry: entry })
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }))
  },

  loadEntries: async (userId: string, filters?: JournalState['filters']) => {
    try {
      set({ isLoadingEntries: true })
      const entries = await fetchJournalEntries(userId, filters)
      set({ entries, isLoadingEntries: false })
    } catch (error) {
      console.error('Error loading journal entries:', error)
      showError('Failed to load journal entries')
      set({ isLoadingEntries: false })
    }
  },

  subscribeEntries: (userId: string, filters?: JournalState['filters']) => {
    // Clean up existing subscription
    if (unsubscribeEntries) {
      unsubscribeEntries()
    }

    set({ isLoadingEntries: true })

    const hashData = (entries: JournalEntry[]): string => {
      if (entries.length === 0) return 'empty'
      return `${entries.length}-${entries[0]?.id || ''}-${entries[entries.length - 1]?.id || ''}`
    }

    const fetchEntriesFn = async (): Promise<JournalEntry[]> => {
      return fetchJournalEntries(userId, filters)
    }

    // Subscribe with smart polling
    unsubscribeEntries = createSmartPoll(
      fetchEntriesFn,
      (entries) => {
        get().setEntries(entries)
      },
      {
        activeInterval: 30000, // 30 seconds when active
        idleInterval: 120000, // 2 minutes when idle
        hiddenInterval: 300000, // 5 minutes when tab hidden
        idleThreshold: 60000, // 1 minute idle threshold
        hashFn: hashData,
        initialData: [],
      }
    )

    return () => {
      if (unsubscribeEntries) {
        unsubscribeEntries()
        unsubscribeEntries = null
      }
    }
  },

  loadEntryByDate: async (userId: string, date: string, type?: JournalEntry['type']) => {
    try {
      const entry = await fetchJournalEntryByDate(userId, date, type)
      set({ currentEntry: entry })
      return entry
    } catch (error) {
      console.error('Error loading journal entry by date:', error)
      showError('Failed to load journal entry')
      return null
    }
  },

  loadMoodStatistics: async (userId: string, dateFrom?: string, dateTo?: string) => {
    try {
      const stats = await fetchMoodStatistics(userId, dateFrom, dateTo)
      set({ moodStats: stats })
    } catch (error) {
      console.error('Error loading mood statistics:', error)
      showError('Failed to load mood statistics')
    }
  },

  addEntry: async (userId: string, entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addJournalEntryApi(userId, entry)
      // Immediately fetch and update entries to show the new one
      // This bypasses cache and ensures the new entry appears right away
      const currentFilters = get().filters
      const entries = await fetchJournalEntries(userId, currentFilters)
      set({ entries, isLoadingEntries: false })
    } catch (error) {
      console.error('Error adding journal entry:', error)
      showError('Failed to add journal entry')
      throw error
    }
  },

  updateEntry: async (userId: string, entryId: string, updates: Partial<JournalEntry>) => {
    try {
      await updateJournalEntryApi(userId, entryId, updates)
      // Immediately fetch and update entries to show the updated one
      const currentFilters = get().filters
      const entries = await fetchJournalEntries(userId, currentFilters)
      set({ entries, isLoadingEntries: false })
      // Update current entry if it's the one being edited
      if (get().currentEntry?.id === entryId) {
        set({ currentEntry: { ...get().currentEntry, ...updates } as JournalEntry })
      }
    } catch (error) {
      console.error('Error updating journal entry:', error)
      showError('Failed to update journal entry')
      throw error
    }
  },

  deleteEntry: async (userId: string, entryId: string) => {
    try {
      await deleteJournalEntryApi(userId, entryId)
      // Immediately fetch and update entries to reflect deletion
      const currentFilters = get().filters
      const entries = await fetchJournalEntries(userId, currentFilters)
      set({ entries, isLoadingEntries: false })
      // Clear current entry if it's the one being deleted
      if (get().currentEntry?.id === entryId) {
        set({ currentEntry: null })
      }
    } catch (error) {
      console.error('Error deleting journal entry:', error)
      showError('Failed to delete journal entry')
      throw error
    }
  },

  unsubscribe: () => {
    if (unsubscribeEntries) {
      unsubscribeEntries()
      unsubscribeEntries = null
    }
  },
}))

