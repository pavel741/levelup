/**
 * Focus Feature Store
 * Manages focus/pomodoro timer-related state
 */

import { create } from 'zustand'
import type { FocusSession } from '@/types'
import {
  subscribeToFocusSessions,
  addFocusSession as addFocusSessionApi,
  updateFocusSession as updateFocusSessionApi,
  deleteFocusSession as deleteFocusSessionApi,
  getFocusStats,
} from '@/lib/focusApi'
import { showError } from '@/lib/utils'

interface FocusState {
  // Focus sessions
  sessions: FocusSession[]
  isLoadingSessions: boolean
  
  // Statistics
  stats: {
    totalSessions: number
    totalFocusTime: number
    totalDistractions: number
    averageSessionDuration: number
  } | null
  isLoadingStats: boolean
  
  // Actions
  setSessions: (sessions: FocusSession[]) => void
  subscribeSessions: (userId: string) => () => void
  addSession: (userId: string, session: Omit<FocusSession, 'id' | 'userId' | 'createdAt'>) => Promise<string>
  updateSession: (userId: string, sessionId: string, updates: Partial<FocusSession>) => Promise<void>
  deleteSession: (userId: string, sessionId: string) => Promise<void>
  loadStats: (userId: string, startDate?: Date, endDate?: Date) => Promise<void>
  
  // Cleanup
  unsubscribe: () => void
}

let unsubscribeSessions: (() => void) | null = null
let lastManualUpdate = 0 // Track manual updates to prevent polling from overwriting

export const useFocusStore = create<FocusState>((set, get) => ({
  sessions: [],
  isLoadingSessions: false,
  stats: null,
  isLoadingStats: false,

  setSessions: (sessions) => {
    set({ sessions, isLoadingSessions: false })
  },

  subscribeSessions: (userId: string) => {
    set({ isLoadingSessions: true })
    
    // Fetch immediately to show data right away (don't await, let it happen in background)
    import('@/lib/focusApi').then(({ getFocusSessions }) => {
      getFocusSessions(userId).then((initialSessions) => {
        set({ sessions: initialSessions, isLoadingSessions: false })
      }).catch((error) => {
        console.error('Failed to load initial sessions:', error)
        set({ isLoadingSessions: false })
      })
    })
    
    // Then start polling for updates
    unsubscribeSessions = subscribeToFocusSessions(
      userId,
      (sessions) => {
        // Don't overwrite if we just did a manual update (within last 2 seconds)
        const now = Date.now()
        if (now - lastManualUpdate < 2000) {
          return
        }
        set({ sessions, isLoadingSessions: false })
      }
    )

    return () => {
      if (unsubscribeSessions) {
        unsubscribeSessions()
        unsubscribeSessions = null
      }
    }
  },

  addSession: async (userId: string, session: Omit<FocusSession, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    try {
      const sessionId = await addFocusSessionApi(userId, session)
      // Subscription will update the state
      return sessionId
    } catch (error) {
      console.error('Failed to add focus session:', error)
      showError('Failed to add focus session', { component: 'FocusStore', action: 'addSession' })
      throw error
    }
  },

  updateSession: async (userId: string, sessionId: string, updates: Partial<FocusSession>) => {
    try {
      await updateFocusSessionApi(userId, sessionId, updates)
      // Subscription will update the state
    } catch (error) {
      console.error('Failed to update focus session:', error)
      showError('Failed to update focus session', { component: 'FocusStore', action: 'updateSession' })
      throw error
    }
  },

  deleteSession: async (userId: string, sessionId: string) => {
    // Optimistically remove from local state for immediate UI update
    const previousSessions = get().sessions
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
    }))
    
    try {
      await deleteFocusSessionApi(userId, sessionId)
      
      // Force immediate fresh fetch bypassing cache
      const { authenticatedFetch } = await import('@/lib/utils')
      const { cache } = await import('@/lib/utils/cache')
      
      // Invalidate cache first
      cache.invalidatePattern(new RegExp(`^focus_sessions:.*:${userId}`))
      
      // Fetch fresh data directly from API, bypassing cache
      const response = await authenticatedFetch('/api/focus/sessions')
      if (!response.ok) throw new Error('Failed to fetch sessions')
      
      const data = await response.json()
      const updatedSessions = (data.data?.sessions || data.sessions || []).map((s: any) => ({
        ...s,
        startedAt: s.startedAt ? new Date(s.startedAt) : new Date(),
        completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
      }))
      
      // Update state with fresh data and mark as manual update
      lastManualUpdate = Date.now()
      set({ sessions: updatedSessions })
    } catch (error) {
      // On error, restore previous state
      console.error('Failed to delete focus session:', error)
      showError('Failed to delete focus session', { component: 'FocusStore', action: 'deleteSession' })
      // Restore previous sessions
      set({ sessions: previousSessions })
      throw error
    }
  },

  loadStats: async (userId: string, startDate?: Date, endDate?: Date) => {
    try {
      set({ isLoadingStats: true })
      const stats = await getFocusStats(userId, startDate, endDate)
      set({ stats, isLoadingStats: false })
    } catch (error) {
      console.error('Failed to load focus stats:', error)
      set({ isLoadingStats: false })
    }
  },

  unsubscribe: () => {
    if (unsubscribeSessions) {
      unsubscribeSessions()
      unsubscribeSessions = null
    }
  },
}))

