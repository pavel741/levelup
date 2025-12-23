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

