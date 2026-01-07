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
let lastManualUpdate = 0 // Track manual updates to prevent polling from overwriting

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

    // Fetch immediately to show data right away (don't await, let it happen in background)
    import('@/lib/journalApi').then(({ getJournalEntries }) => {
      getJournalEntries(userId, filters).then((initialEntries) => {
        set({ entries: initialEntries, isLoadingEntries: false })
      }).catch((error) => {
        console.error('Failed to load initial journal entries:', error)
        set({ isLoadingEntries: false })
      })
    })

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
        // Don't overwrite if we just did a manual update (within last 3 seconds)
        const now = Date.now()
        if (now - lastManualUpdate < 3000) {
          console.log('Skipping polling update - manual update was recent')
          return
        }
        console.log('Polling update - setting entries:', entries.length)
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
    console.log('addEntry called with:', { userId, entry })
    const previousEntries = get().entries
    
    try {
      console.log('Calling addJournalEntryApi...')
      const entryId = await addJournalEntryApi(userId, entry)
      console.log('Entry added successfully, entryId:', entryId)
      
      // Optimistically add the entry to local state for immediate UI update
      const newEntry: JournalEntry = {
        ...entry,
        id: entryId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      console.log('Adding optimistic entry:', newEntry)
      // Set lastManualUpdate BEFORE updating state to prevent polling from overwriting
      lastManualUpdate = Date.now()
      set((state) => {
        console.log('Current entries before add:', state.entries.length, 'filters:', state.filters)
        const updated = [newEntry, ...state.entries]
        console.log('Updated entries after add:', updated.length)
        console.log('New entry date:', newEntry.date, 'type:', newEntry.type)
        return { entries: updated }
      })
      
      // Verify the entry was added
      setTimeout(() => {
        const currentEntries = get().entries
        console.log('Entries after setTimeout:', currentEntries.length)
        const found = currentEntries.find(e => e.id === entryId)
        console.log('New entry found in state:', !!found)
      }, 100)
      
      // Invalidate cache so next fetch will be fresh
      const { cache } = await import('@/lib/utils/cache')
      cache.invalidatePattern(new RegExp(`^journal:${userId}`))
      
      // Try to fetch fresh data, but don't fail if it doesn't work
      // The optimistic update is already shown, and polling will correct it
      const currentFilters = get().filters
      fetchJournalEntries(userId, currentFilters)
        .then((updatedEntries) => {
          console.log('Fetched fresh entries:', updatedEntries.length)
          // Only update if we haven't had another manual update (wait 3 seconds)
          const now = Date.now()
          if (now - lastManualUpdate >= 3000) {
            lastManualUpdate = Date.now()
            set({ entries: updatedEntries, isLoadingEntries: false })
          } else {
            console.log('Skipping fresh fetch update - manual update was recent')
          }
        })
        .catch((fetchError) => {
          // Silently fail - optimistic update is already shown, polling will correct
          console.warn('Failed to fetch fresh entries after add:', fetchError)
        })
    } catch (error) {
      // On error, restore previous state
      console.error('Error adding journal entry:', error)
      showError('Failed to add journal entry')
      // Restore previous entries
      set({ entries: previousEntries })
      throw error
    }
  },

  updateEntry: async (userId: string, entryId: string, updates: Partial<JournalEntry>) => {
    const previousEntries = get().entries
    const previousCurrentEntry = get().currentEntry
    
    // Optimistically update the entry in local state for immediate UI update
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId ? { ...e, ...updates } : e
      ),
    }))
    
    // Update current entry if it's the one being edited
    if (get().currentEntry?.id === entryId) {
      set({ currentEntry: { ...get().currentEntry, ...updates } as JournalEntry })
    }
    
    try {
      await updateJournalEntryApi(userId, entryId, updates)
      
      // Force immediate fresh fetch bypassing cache
      const { cache } = await import('@/lib/utils/cache')
      
      // Invalidate cache first
      cache.invalidatePattern(new RegExp(`^journal:${userId}`))
      
      // Fetch fresh data directly from API, bypassing cache
      const currentFilters = get().filters
      const { authenticatedFetch } = await import('@/lib/utils')
      const params = new URLSearchParams({ userId })
      if (currentFilters?.type) params.append('type', currentFilters.type)
      if (currentFilters?.dateFrom) params.append('dateFrom', currentFilters.dateFrom)
      if (currentFilters?.dateTo) params.append('dateTo', currentFilters.dateTo)
      if (currentFilters?.search) params.append('search', currentFilters.search)
      
      try {
        const response = await authenticatedFetch(`/api/journal?${params}`)
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to fetch entries' }))
          throw new Error(error.error || 'Failed to fetch entries')
        }
        
        const data = await response.json()
        // Handle both wrapped response format { data: { entries: ... } } and direct { entries: ... }
        const updatedEntries = data.data?.entries || data.entries || []
        
        // Update state with fresh data and mark as manual update
        lastManualUpdate = Date.now()
        set({ entries: updatedEntries, isLoadingEntries: false })
        
        // Update current entry with fresh data if it's the one being edited
        if (get().currentEntry?.id === entryId) {
          const updatedEntry = updatedEntries.find((e: JournalEntry) => e.id === entryId)
          if (updatedEntry) {
            set({ currentEntry: updatedEntry })
          }
        }
      } catch (fetchError) {
        // If fetch fails, keep the optimistic update - polling will correct it
        console.warn('Failed to fetch fresh entries after update, but entry was updated:', fetchError)
        lastManualUpdate = Date.now()
      }
    } catch (error) {
      // On error, restore previous state
      console.error('Error updating journal entry:', error)
      showError('Failed to update journal entry')
      // Restore previous entries and current entry
      set({ entries: previousEntries, currentEntry: previousCurrentEntry })
      throw error
    }
  },

  deleteEntry: async (userId: string, entryId: string) => {
    const previousEntries = get().entries
    
    // Optimistically remove from local state for immediate UI update
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== entryId),
    }))
    
    // Clear current entry if it's the one being deleted
    if (get().currentEntry?.id === entryId) {
      set({ currentEntry: null })
    }
    
    try {
      await deleteJournalEntryApi(userId, entryId)
      
      // Force immediate fresh fetch bypassing cache
      const { cache } = await import('@/lib/utils/cache')
      
      // Invalidate cache first
      cache.invalidatePattern(new RegExp(`^journal:${userId}`))
      
      // Fetch fresh data directly from API, bypassing cache
      const currentFilters = get().filters
      const { authenticatedFetch } = await import('@/lib/utils')
      const params = new URLSearchParams({ userId })
      if (currentFilters?.type) params.append('type', currentFilters.type)
      if (currentFilters?.dateFrom) params.append('dateFrom', currentFilters.dateFrom)
      if (currentFilters?.dateTo) params.append('dateTo', currentFilters.dateTo)
      if (currentFilters?.search) params.append('search', currentFilters.search)
      
      try {
        const response = await authenticatedFetch(`/api/journal?${params}`)
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to fetch entries' }))
          throw new Error(error.error || 'Failed to fetch entries')
        }
        
        const data = await response.json()
        // Handle both wrapped response format { data: { entries: ... } } and direct { entries: ... }
        const updatedEntries = data.data?.entries || data.entries || []
        
        // Update state with fresh data and mark as manual update
        lastManualUpdate = Date.now()
        set({ entries: updatedEntries, isLoadingEntries: false })
      } catch (fetchError) {
        // If fetch fails, keep the optimistic update - polling will correct it
        console.warn('Failed to fetch fresh entries after delete, but entry was deleted:', fetchError)
        lastManualUpdate = Date.now()
      }
    } catch (error) {
      // On error, restore previous state
      console.error('Error deleting journal entry:', error)
      showError('Failed to delete journal entry')
      // Restore previous entries
      set({ entries: previousEntries })
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

