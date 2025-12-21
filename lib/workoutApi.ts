/**
 * Client-side API wrapper for workout operations
 * All MongoDB operations go through API routes
 */

import type { Routine, WorkoutLog } from '@/types/workout'

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
      const response = await fetch(`${API_BASE}/routines?userId=${userId}`)
      if (!response.ok) {
        console.error('Failed to fetch routines:', response.statusText)
        callback([])
        return
      }

      const routines: Routine[] = await response.json()
      
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

  // Initial fetch
  fetchRoutines()

  // Poll every 5 seconds
  const intervalId = setInterval(() => {
    if (isActive) {
      fetchRoutines()
    }
  }, 5000)

  return () => {
    isActive = false
    clearInterval(intervalId)
  }
}

export const saveRoutine = async (routine: Routine): Promise<void> => {
  const response = await fetch(`${API_BASE}/routines`, {
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
  const response = await fetch(`${API_BASE}/routines/${routineId}`, {
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
  const response = await fetch(`${API_BASE}/routines/${routineId}?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete routine')
  }
}

// Workout Logs
export const subscribeToWorkoutLogs = (
  userId: string,
  callback: (logs: WorkoutLog[]) => void
): (() => void) => {
  let isActive = true
  let lastDataHash: string | null = null

  const hashData = (logs: WorkoutLog[]): string => {
    if (logs.length === 0) return 'empty'
    return JSON.stringify(logs.map((l) => ({ id: l.id, date: l.date })))
  }

  const fetchLogs = async () => {
    if (!isActive || !userId) return

    try {
      const response = await fetch(`${API_BASE}/logs?userId=${userId}`)
      if (!response.ok) {
        console.error('Failed to fetch workout logs:', response.statusText)
        callback([])
        return
      }

      const logs: WorkoutLog[] = await response.json()
      
      // Convert date strings to Date objects
      const convertedLogs = logs.map((l) => ({
        ...l,
        date: l.date instanceof Date ? l.date : new Date(l.date),
        startTime: l.startTime instanceof Date ? l.startTime : new Date(l.startTime),
        endTime: l.endTime ? (l.endTime instanceof Date ? l.endTime : new Date(l.endTime)) : undefined,
      }))

      const currentHash = hashData(convertedLogs)
      if (currentHash !== lastDataHash) {
        lastDataHash = currentHash
        callback(convertedLogs)
      }
    } catch (error) {
      console.error('Error fetching workout logs:', error)
      callback([])
    }
  }

  // Initial fetch
  fetchLogs()

  // Poll every 5 seconds
  const intervalId = setInterval(() => {
    if (isActive) {
      fetchLogs()
    }
  }, 5000)

  return () => {
    isActive = false
    clearInterval(intervalId)
  }
}

export const saveWorkoutLog = async (log: WorkoutLog): Promise<void> => {
  const response = await fetch(`${API_BASE}/logs`, {
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
  const response = await fetch(`${API_BASE}/logs/${logId}`, {
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
  const response = await fetch(`${API_BASE}/logs/${logId}?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete workout log')
  }
}

