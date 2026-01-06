// Client-side API wrapper for MongoDB focus operations

import type { FocusSession } from '@/types'
import { createSmartPoll } from '@/lib/utils/smart-polling'
import { cache, createCacheKey } from '@/lib/utils/cache'

// Get focus sessions
export const getFocusSessions = async (
  userId: string,
  options: { limit?: number } = {}
): Promise<FocusSession[]> => {
  const limit = options.limit || 0
  const key = createCacheKey('focus_sessions', userId, limit)
  
  return cache.get(
    key,
    async () => {
      const params = new URLSearchParams()
      if (limit > 0) {
        params.append('limit', limit.toString())
      }
      
      const { authenticatedFetch } = await import('@/lib/utils')
      const queryString = params.toString()
      const response = await authenticatedFetch(`/api/focus/sessions${queryString ? `?${queryString}` : ''}`)
      if (!response.ok) throw new Error('Failed to fetch focus sessions')
      
      const data = await response.json()
      const sessions = data.data?.sessions || data.sessions || []
      return sessions.map((s: any) => ({
        ...s,
        startedAt: s.startedAt ? new Date(s.startedAt) : new Date(),
        completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
      }))
    },
    {
      staleTime: 30 * 1000,
      cacheTime: 5 * 60 * 1000,
    }
  )
}

// Subscribe to focus sessions
export const subscribeToFocusSessions = (
  userId: string,
  callback: (sessions: FocusSession[]) => void,
  options: { limit?: number } = {}
): (() => void) => {
  const limit = options.limit || 0
  
  const fetchSessions = async (): Promise<FocusSession[]> => {
    return getFocusSessions(userId, { limit })
  }

  // Fetch immediately before starting polling to avoid initial loading delay
  fetchSessions().then(callback).catch((error) => {
    console.error('Initial focus sessions fetch error:', error)
    // Still start polling even if initial fetch fails
  })

  return createSmartPoll(
    fetchSessions,
    callback,
    {
      activeInterval: limit === 0 ? 30000 : 10000,
      hashFn: (sessions) => {
        if (sessions.length === 0) return 'empty'
        return `${sessions.length}-${sessions[0]?.id || ''}-${sessions[sessions.length - 1]?.id || ''}`
      },
    }
  )
}

// Add a focus session
export const addFocusSession = async (
  userId: string,
  session: Omit<FocusSession, 'id' | 'userId' | 'createdAt'>
): Promise<string> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const response = await authenticatedFetch('/api/focus/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add focus session')
  }
  
  const data = await response.json()
  const sessionId = data.data?.id || data.id
  
  // Invalidate cache
  cache.invalidatePattern(new RegExp(`^focus_sessions:.*:${userId}`))
  
  return sessionId
}

// Update a focus session
export const updateFocusSession = async (
  userId: string,
  sessionId: string,
  updates: Partial<FocusSession>
): Promise<void> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const response = await authenticatedFetch('/api/focus/sessions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: sessionId, ...updates }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update focus session')
  }
  
  // Invalidate cache
  cache.invalidatePattern(new RegExp(`^focus_sessions:.*:${userId}`))
}

// Delete a focus session
export const deleteFocusSession = async (userId: string, sessionId: string): Promise<void> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const response = await authenticatedFetch(`/api/focus/sessions?id=${sessionId}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete focus session')
  }
  
  // Invalidate cache
  cache.invalidatePattern(new RegExp(`^focus_sessions:.*:${userId}`))
}

// Get focus statistics
export const getFocusStats = async (
  _userId: string, // Kept for API consistency, but not used (userId comes from auth token)
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalSessions: number
  totalFocusTime: number
  totalDistractions: number
  averageSessionDuration: number
}> => {
  const params = new URLSearchParams()
  if (startDate) {
    params.append('startDate', startDate.toISOString())
  }
  if (endDate) {
    params.append('endDate', endDate.toISOString())
  }
  
  const { authenticatedFetch } = await import('@/lib/utils')
  const queryString = params.toString()
  const response = await authenticatedFetch(`/api/focus/stats${queryString ? `?${queryString}` : ''}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get focus stats')
  }
  
  const data = await response.json()
  return data.data || data
}

