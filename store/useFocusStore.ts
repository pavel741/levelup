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

export const useFocusStore = create<FocusState>((set) => ({
  sessions: [],
  isLoadingSessions: false,
  stats: null,
  isLoadingStats: false,

  setSessions: (sessions) => {
    set({ sessions, isLoadingSessions: false })
  },

  subscribeSessions: (userId: string) => {
    set({ isLoadingSessions: true })
    
    unsubscribeSessions = subscribeToFocusSessions(
      userId,
      (sessions) => {
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
    try {
      await deleteFocusSessionApi(userId, sessionId)
      // Subscription will update the state
    } catch (error) {
      console.error('Failed to delete focus session:', error)
      showError('Failed to delete focus session', { component: 'FocusStore', action: 'deleteSession' })
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

