/**
 * Client-side API wrapper for workout operations
 * All MongoDB operations go through API routes
 */

'use client'

import type { Routine, WorkoutLog } from '@/types/workout'
import { authenticatedFetch } from '@/lib/utils/api/api-client'

const API_BASE = '/api/workouts'

// Routines
export const subscribeToRoutines = (
  userId: string,
  callback: (routines: Routine[]) => void
): (() => void) => {
  let isActive = true
  let lastDataHash: string | null = null

  const hashData = (routines: Routine[]): string => {
    if (routines.length === 0) return 'empty'
    return JSON.stringify(routines.map((r) => ({ id: r.id, updatedAt: r.updatedAt })))
  }

  const fetchRoutines = async () => {
    if (!isActive || !userId) return

    try {
      const response = await authenticatedFetch(`${API_BASE}/routines`)
      if (!response.ok) {
        console.error('Failed to fetch routines:', response.statusText)
        callback([])
        return
      }

      const responseData = await response.json()
      const routines: Routine[] = responseData.data || responseData || []
      
      // Convert date strings to Date objects
      const convertedRoutines = routines.map((r) => ({
        ...r,
        createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
        updatedAt: r.updatedAt instanceof Date ? r.updatedAt : new Date(r.updatedAt),
      }))

      const currentHash = hashData(convertedRoutines)
      if (currentHash !== lastDataHash) {
        lastDataHash = currentHash
        callback(convertedRoutines)
      }
    } catch (error) {
      console.error('Error fetching routines:', error)
      callback([])
    }
  }

  // Use smart polling - adjusts frequency based on user activity
  // Active: 30s, Hidden: 5min
  let timeoutId: NodeJS.Timeout | null = null
  
  const getInterval = (): number => {
    if (typeof document === 'undefined' || !document) return 30000
    if (document.hidden) return 300000 // 5 min when tab hidden
    return 30000 // 30s when active
  }
  
  const poll = () => {
    if (!isActive) return
    fetchRoutines()
    const interval = getInterval()
    timeoutId = setTimeout(poll, interval)
  }
  
  // Track visibility changes to adjust polling
  let visibilityHandler: (() => void) | null = null
  if (typeof document !== 'undefined') {
    visibilityHandler = () => {
      // Restart polling with new interval when visibility changes
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (isActive) {
        timeoutId = setTimeout(poll, getInterval())
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  }
  
  // Initial fetch
  fetchRoutines()
  timeoutId = setTimeout(poll, getInterval())

  return () => {
    isActive = false
    if (timeoutId) clearTimeout(timeoutId)
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
  }
}

export const saveRoutine = async (routine: Routine): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE}/routines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(routine),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save routine')
  }
}

export const updateRoutine = async (routineId: string, userId: string, updates: Partial<Routine>): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE}/routines/${routineId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, updates }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update routine')
  }
}

export const deleteRoutine = async (routineId: string, userId: string): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE}/routines/${routineId}?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete routine')
  }
}

export interface ImproveRoutineResult {
  routine: Routine
  changes: Array<{
    type: 'exercise_added' | 'rest_adjusted' | 'sets_adjusted' | 'exercise_removed'
    description: string
    details?: unknown
  }>
  summary: string
}

export const improveRoutine = async (routineId: string): Promise<ImproveRoutineResult> => {
  const response = await authenticatedFetch(`${API_BASE}/routines/${routineId}/improve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to improve routine')
  }

  const result = await response.json()
  return result.data || result
}

// Workout Logs
export const getWorkoutLogs = async (_userId: string): Promise<WorkoutLog[]> => {
  try {
    const response = await authenticatedFetch(`${API_BASE}/logs`)
    if (!response.ok) {
      throw new Error('Failed to fetch workout logs')
    }
    const responseData = await response.json()
    const logs: WorkoutLog[] = responseData.data || responseData || []
    
    return logs.map((log) => ({
      ...log,
      date: log.date instanceof Date ? log.date : new Date(log.date),
      startTime: log.startTime instanceof Date ? log.startTime : new Date(log.startTime),
      endTime: log.endTime instanceof Date ? log.endTime : (log.endTime ? new Date(log.endTime) : undefined),
    }))
  } catch (error) {
    console.error('Error fetching workout logs:', error)
    return []
  }
}

export const subscribeToWorkoutLogs = (
  userId: string,
  callback: (logs: WorkoutLog[]) => void
): (() => void) => {
  let isActive = true
  let lastDataHash: string | null = null
  let isFirstFetch = true

  const hashData = (logs: WorkoutLog[]): string => {
    if (logs.length === 0) return 'empty'
    // Use ISO string for dates to ensure consistent hashing
    return JSON.stringify(logs.map((l) => ({ 
      id: l.id, 
      date: l.date instanceof Date ? l.date.toISOString() : l.date 
    })))
  }

  const fetchLogs = async () => {
    if (!isActive || !userId) return

    try {
      const response = await authenticatedFetch(`${API_BASE}/logs`)
      if (!response.ok) {
        console.error('Failed to fetch workout logs:', response.statusText)
        callback([])
        return
      }

      const responseData = await response.json()
      const logs: WorkoutLog[] = responseData.data || responseData || []
      
      // Convert date strings to Date objects
      const convertedLogs = logs.map((l) => ({
        ...l,
        date: l.date instanceof Date ? l.date : new Date(l.date),
        startTime: l.startTime instanceof Date ? l.startTime : new Date(l.startTime),
        endTime: l.endTime ? (l.endTime instanceof Date ? l.endTime : new Date(l.endTime)) : undefined,
      }))

      const currentHash = hashData(convertedLogs)
      // Always trigger callback on first fetch, or if data changed
      if (isFirstFetch || currentHash !== lastDataHash) {
        isFirstFetch = false
        lastDataHash = currentHash
        callback(convertedLogs)
      }
    } catch (error) {
      console.error('Error fetching workout logs:', error)
      callback([])
    }
  }

  // Use smart polling - adjusts frequency based on user activity
  // Active: 30s, Hidden: 5min
  let timeoutId: NodeJS.Timeout | null = null
  
  const getInterval = (): number => {
    if (typeof document === 'undefined' || !document) return 30000
    if (document.hidden) return 300000 // 5 min when tab hidden
    return 30000 // 30s when active
  }
  
  const poll = () => {
    if (!isActive) return
    fetchLogs()
    const interval = getInterval()
    timeoutId = setTimeout(poll, interval)
  }
  
  // Track visibility changes to adjust polling
  let visibilityHandler: (() => void) | null = null
  if (typeof document !== 'undefined') {
    visibilityHandler = () => {
      // Restart polling with new interval when visibility changes
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (isActive) {
        timeoutId = setTimeout(poll, getInterval())
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  }
  
  // Initial fetch
  fetchLogs()
  timeoutId = setTimeout(poll, getInterval())

  return () => {
    isActive = false
    if (timeoutId) clearTimeout(timeoutId)
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
  }
}

export const saveWorkoutLog = async (log: WorkoutLog): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE}/logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(log),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save workout log')
  }
}

export const updateWorkoutLog = async (logId: string, userId: string, updates: Partial<WorkoutLog>): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE}/logs/${logId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, updates }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update workout log')
  }
}

export const deleteWorkoutLog = async (logId: string, userId: string): Promise<void> => {
  const response = await authenticatedFetch(`${API_BASE}/logs/${logId}?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete workout log')
  }
}

export const deleteAllWorkoutLogs = async (_userId: string): Promise<number> => {
  const response = await authenticatedFetch(`${API_BASE}/logs/delete-all`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete all workout logs')
  }

  const result = await response.json()
  return result.data?.deletedCount || 0
}

