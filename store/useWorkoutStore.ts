/**
 * Workout Feature Store
 * Manages workout-related state (routines, workout logs)
 */

import { create } from 'zustand'
import type { Routine, WorkoutLog } from '@/types/workout'
import { subscribeToRoutines, getWorkoutLogs } from '@/lib/workoutApi'
import { showError } from '@/lib/utils'

interface WorkoutState {
  // Routines
  routines: Routine[]
  isLoadingRoutines: boolean
  
  // Workout Logs
  workoutLogs: WorkoutLog[]
  isLoadingLogs: boolean
  
  // Active workout
  activeRoutine: Routine | null
  editingRoutine: Routine | null
  
  // Actions
  setRoutines: (routines: Routine[]) => void
  addRoutine: (routine: Routine) => void
  updateRoutineInStore: (routineId: string, updates: Partial<Routine>) => void
  removeRoutine: (routineId: string) => void
  refreshRoutines: () => Promise<void>
  setWorkoutLogs: (logs: WorkoutLog[]) => void
  setActiveRoutine: (routine: Routine | null) => void
  setEditingRoutine: (routine: Routine | null) => void
  subscribeRoutines: (userId: string) => () => void
  loadWorkoutLogs: (userId: string) => Promise<void>
  
  // Cleanup
  unsubscribe: () => void
}

let unsubscribeRoutines: (() => void) | null = null

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  // Initial state
  routines: [],
  isLoadingRoutines: true,
  workoutLogs: [],
  isLoadingLogs: false,
  activeRoutine: null,
  editingRoutine: null,

  setRoutines: (routines) => {
    set({ routines, isLoadingRoutines: false })
  },

  addRoutine: (routine) => {
    const currentRoutines = get().routines
    // Check if routine already exists (by id)
    const exists = currentRoutines.some(r => r.id === routine.id)
    if (!exists) {
      set({ routines: [...currentRoutines, routine] })
    }
  },

  updateRoutineInStore: (routineId, updates) => {
    const currentRoutines = get().routines
    set({
      routines: currentRoutines.map(r =>
        r.id === routineId ? { ...r, ...updates, updatedAt: new Date() } : r
      )
    })
  },

  removeRoutine: (routineId) => {
    const currentRoutines = get().routines
    set({ routines: currentRoutines.filter(r => r.id !== routineId) })
  },

  refreshRoutines: async () => {
    // Get userId from routines or we'll fetch without it (API will get it from auth)
    try {
      const { authenticatedFetch } = await import('@/lib/utils')
      const response = await authenticatedFetch('/api/workouts/routines')
      if (response.ok) {
        const responseData = await response.json()
        const routines: Routine[] = responseData.data || responseData || []
        const convertedRoutines = routines.map((r) => ({
          ...r,
          createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
          updatedAt: r.updatedAt instanceof Date ? r.updatedAt : new Date(r.updatedAt),
        }))
        get().setRoutines(convertedRoutines)
      }
    } catch (error) {
      console.error('Error refreshing routines:', error)
    }
  },

  setWorkoutLogs: (logs) => {
    set({ workoutLogs: logs, isLoadingLogs: false })
  },

  setActiveRoutine: (activeRoutine) => {
    set({ activeRoutine })
  },

  setEditingRoutine: (editingRoutine) => {
    set({ editingRoutine })
  },

  subscribeRoutines: (userId: string) => {
    // Clean up existing subscription
    if (unsubscribeRoutines) {
      unsubscribeRoutines()
    }

    set({ isLoadingRoutines: true })

    unsubscribeRoutines = subscribeToRoutines(userId, (routines) => {
      get().setRoutines(routines)
    })

    return () => {
      if (unsubscribeRoutines) {
        unsubscribeRoutines()
        unsubscribeRoutines = null
      }
    }
  },

  loadWorkoutLogs: async (userId: string) => {
    set({ isLoadingLogs: true })
    try {
      const logs = await getWorkoutLogs(userId)
      get().setWorkoutLogs(logs)
    } catch (error) {
      showError(error, { component: 'useWorkoutStore', action: 'loadWorkoutLogs' })
      set({ isLoadingLogs: false })
    }
  },

  unsubscribe: () => {
    if (unsubscribeRoutines) {
      unsubscribeRoutines()
      unsubscribeRoutines = null
    }
  },
}))

