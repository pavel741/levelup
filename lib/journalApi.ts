'use client'

import type { JournalEntry } from '@/types'
import { cache, createCacheKey } from '@/lib/utils/cache'

// GET - Get journal entries
export const getJournalEntries = async (
  userId: string,
  filters?: {
    type?: JournalEntry['type']
    dateFrom?: string
    dateTo?: string
    search?: string
  }
): Promise<JournalEntry[]> => {
  const cacheKey = createCacheKey('journal', userId, JSON.stringify(filters))
  return cache.get(cacheKey, () => _getJournalEntries(userId, filters), { staleTime: 30 * 1000, cacheTime: 5 * 60 * 1000 })
}

const _getJournalEntries = async (
  userId: string,
  filters?: {
    type?: JournalEntry['type']
    dateFrom?: string
    dateTo?: string
    search?: string
  }
): Promise<JournalEntry[]> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const params = new URLSearchParams({ userId })
  if (filters?.type) params.append('type', filters.type)
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.append('dateTo', filters.dateTo)
  if (filters?.search) params.append('search', filters.search)
  
  const response = await authenticatedFetch(`/api/journal?${params}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get journal entries')
  }
  const data = await response.json()
  // Handle both wrapped response format { data: { entries: ... } } and direct { entries: ... }
  return data.data?.entries || data.entries || []
}

// GET - Get journal entry by date
export const getJournalEntryByDate = async (
  userId: string,
  date: string,
  type?: JournalEntry['type']
): Promise<JournalEntry | null> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const params = new URLSearchParams({ userId, date })
  if (type) params.append('type', type)
  
  const response = await authenticatedFetch(`/api/journal?${params}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get journal entry')
  }
  const data = await response.json()
  // Handle both wrapped response format { data: { entry: ... } } and direct { entry: ... }
  return data.data?.entry || data.entry || null
}

// GET - Get journal entry by ID
export const getJournalEntryById = async (userId: string, entryId: string): Promise<JournalEntry | null> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const params = new URLSearchParams({ userId, id: entryId })
  const response = await authenticatedFetch(`/api/journal?${params}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get journal entry')
  }
  const data = await response.json()
  // Handle both wrapped response format { data: { entry: ... } } and direct { entry: ... }
  return data.data?.entry || data.entry || null
}

// GET - Get mood statistics
export const getMoodStatistics = async (
  userId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{
  moodCounts: Record<string, number>
  averageMoodRating: number
  moodTrend: Array<{ date: string; moodRating: number }>
}> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const params = new URLSearchParams({ userId, stats: 'mood' })
  if (dateFrom) params.append('dateFrom', dateFrom)
  if (dateTo) params.append('dateTo', dateTo)
  
  const response = await authenticatedFetch(`/api/journal?${params}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get mood statistics')
  }
  const data = await response.json()
  // Handle both wrapped response format { data: { stats: ... } } and direct { stats: ... }
  return data.data?.stats || data.stats || { moodCounts: {}, averageMoodRating: 0, moodTrend: [] }
}

// POST - Add a journal entry
export const addJournalEntry = async (
  userId: string,
  entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const response = await authenticatedFetch('/api/journal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...entry }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add journal entry')
  }
  const data = await response.json()
  cache.invalidatePattern(new RegExp(`^journal:${userId}`))
  // Handle both wrapped response format { data: { id: ... } } and direct { id: ... }
  const entryId = data.data?.id || data.id
  if (!entryId) {
    console.error('No entry ID returned from API:', data)
    throw new Error('Failed to get entry ID from response')
  }
  return entryId
}

// PUT - Update a journal entry
export const updateJournalEntry = async (
  userId: string,
  entryId: string,
  updates: Partial<JournalEntry>
): Promise<void> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const response = await authenticatedFetch('/api/journal', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, id: entryId, ...updates }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update journal entry')
  }
  cache.invalidatePattern(new RegExp(`^journal:${userId}`))
}

// DELETE - Delete a journal entry
export const deleteJournalEntry = async (
  userId: string,
  entryId: string
): Promise<void> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const params = new URLSearchParams({ id: entryId })
  const response = await authenticatedFetch(`/api/journal?${params}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete journal entry')
  }
  cache.invalidatePattern(new RegExp(`^journal:${userId}`))
}

// Export journal entries
export const exportJournalEntries = async (
  userId: string,
  format: 'json' | 'csv' = 'json'
): Promise<string> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const params = new URLSearchParams({ userId, export: format })
  const response = await authenticatedFetch(`/api/journal?${params}`)
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to export journal entries')
  }
  return response.text()
}

