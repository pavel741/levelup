/**
 * Client-side API wrapper for workout operations
 * All MongoDB operations go through API routes
 * 
 * This module handles client-side encryption/decryption of sensitive data
 * before it reaches the server, ensuring privacy even from database owners.
 */

'use client'

import type { Routine, WorkoutLog } from '@/types/workout'
import { authenticatedFetch } from '@/lib/utils/api/api-client'
import { getEncryptionModules, isEncryptionEnabledSync } from '@/lib/utils/encryption/loader'

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
      let routines: Routine[] = responseData.data || responseData || []
      
      // Decrypt sensitive fields if encryption is enabled
      if (isEncryptionEnabledSync() && routines.length > 0) {
        try {
          const encryption = await getEncryptionModules()
          const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
          routines = await Promise.all(
            routines.map(async (r) => {
              return await encryption.decryptRoutine(r, encryptionKey)
            })
          )
        } catch (error) {
          console.warn('Failed to decrypt routines, data may be unencrypted (backward compatibility):', error)
        }
      }
      
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

  // Poll every 30 seconds (reduced frequency to avoid excessive requests)
  const intervalId = setInterval(() => {
    if (isActive) {
      fetchRoutines()
    }
  }, 30000)

  return () => {
    isActive = false
    clearInterval(intervalId)
  }
}

export const saveRoutine = async (routine: Routine): Promise<void> => {
  // Encrypt sensitive fields before sending to server
  let routineToSave = routine
  if (isEncryptionEnabledSync()) {
    try {
      const encryption = await getEncryptionModules()
      const encryptionKey = await encryption.ensureUserHasEncryptionKey(routine.userId)
      routineToSave = await encryption.encryptRoutine(routine, encryptionKey)
    } catch (error) {
      console.error('Failed to encrypt routine:', error)
      throw new Error('Failed to encrypt routine data. Please try again.')
    }
  }

  const response = await authenticatedFetch(`${API_BASE}/routines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(routineToSave),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save routine')
  }
}

export const updateRoutine = async (routineId: string, userId: string, updates: Partial<Routine>): Promise<void> => {
  // Encrypt sensitive fields in updates before sending
  let updatesToSend = updates
  if (isEncryptionEnabledSync()) {
    try {
      const encryption = await getEncryptionModules()
      const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
      // For updates, encrypt the entire update object as a routine
      const tempRoutine = { ...updates } as Routine
      const encrypted = await encryption.encryptRoutine(tempRoutine, encryptionKey)
      // Only include fields that were in the original updates
      updatesToSend = {}
      for (const key in updates) {
        if (key in encrypted) {
          (updatesToSend as any)[key] = (encrypted as any)[key]
        }
      }
    } catch (error) {
      console.error('Failed to encrypt routine updates:', error)
      throw new Error('Failed to encrypt routine updates. Please try again.')
    }
  }

  const response = await authenticatedFetch(`${API_BASE}/routines/${routineId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, updates: updatesToSend }),
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
export const getWorkoutLogs = async (userId: string): Promise<WorkoutLog[]> => {
  try {
    const response = await fetch(`${API_BASE}/logs?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch workout logs')
    }
    const responseData = await response.json()
    let logs: WorkoutLog[] = responseData.data || responseData || []
    
    // Decrypt sensitive fields if encryption is enabled
    if (isEncryptionEnabledSync() && logs.length > 0) {
      try {
        const encryption = await getEncryptionModules()
        const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
        logs = await Promise.all(
          logs.map(async (log) => {
            const decrypted = await encryption.decryptObject(
              log,
              ['notes'], // Only decrypt notes field for workout logs
              encryptionKey
            )
            return decrypted as WorkoutLog
          })
        )
      } catch (error) {
        console.warn('Failed to decrypt workout logs, data may be unencrypted (backward compatibility):', error)
      }
    }
    
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
      let logs: WorkoutLog[] = responseData.data || responseData || []
      
      // Decrypt sensitive fields if encryption is enabled
      if (isEncryptionEnabledSync() && logs.length > 0) {
        try {
          const encryption = await getEncryptionModules()
          const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
          logs = await Promise.all(
            logs.map(async (l) => {
              const decrypted = await encryption.decryptObject(
                l,
                ['notes'], // Only decrypt notes field for workout logs
                encryptionKey
              )
              return decrypted as WorkoutLog
            })
          )
        } catch (error) {
          console.warn('Failed to decrypt workout logs, data may be unencrypted (backward compatibility):', error)
        }
      }
      
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

  // Initial fetch
  fetchLogs()

  // Poll every 30 seconds (reduced frequency to avoid excessive requests)
  const intervalId = setInterval(() => {
    if (isActive) {
      fetchLogs()
    }
  }, 30000)

  return () => {
    isActive = false
    clearInterval(intervalId)
  }
}

export const saveWorkoutLog = async (log: WorkoutLog): Promise<void> => {
  // Encrypt sensitive fields before sending to server
  let logToSave = log
  if (isEncryptionEnabledSync()) {
    try {
      const encryption = await getEncryptionModules()
      const encryptionKey = await encryption.ensureUserHasEncryptionKey(log.userId)
      logToSave = await encryption.encryptObject(
        log,
        ['notes'], // Only encrypt notes field for workout logs
        encryptionKey
      )
    } catch (error) {
      console.error('Failed to encrypt workout log:', error)
      throw new Error('Failed to encrypt workout log data. Please try again.')
    }
  }

  const response = await authenticatedFetch(`${API_BASE}/logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(logToSave),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save workout log')
  }
}

export const updateWorkoutLog = async (logId: string, userId: string, updates: Partial<WorkoutLog>): Promise<void> => {
  // Encrypt sensitive fields in updates before sending
  let updatesToSend = updates
  if (isEncryptionEnabledSync()) {
    try {
      const encryption = await getEncryptionModules()
      const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
      // Only encrypt notes field if it's in the updates
      if ('notes' in updates && updates.notes) {
        const tempLog = { ...updates } as WorkoutLog
        const encrypted = await encryption.encryptObject(
          tempLog,
          ['notes'],
          encryptionKey
        )
        updatesToSend = { ...updatesToSend, notes: encrypted.notes }
      }
    } catch (error) {
      console.error('Failed to encrypt workout log updates:', error)
      throw new Error('Failed to encrypt workout log updates. Please try again.')
    }
  }

  const response = await authenticatedFetch(`${API_BASE}/logs/${logId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, updates: updatesToSend }),
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

