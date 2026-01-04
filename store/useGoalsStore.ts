/**
 * Goals Feature Store
 * Manages goal-related state
 */

import { create } from 'zustand'
import type { Goal } from '@/types'
import {
  getGoals as fetchGoals,
  addGoal as addGoalApi,
  updateGoal as updateGoalApi,
  deleteGoal as deleteGoalApi,
  updateGoalProgress as updateGoalProgressApi,
} from '@/lib/goalsApi'
import { showError } from '@/lib/utils'
import { createSmartPoll } from '@/lib/utils/smart-polling'

interface GoalsState {
  // Goals
  goals: Goal[]
  isLoadingGoals: boolean
  newlyCompletedGoals: Goal[] // Track goals that just completed for celebration
  
  // Actions
  setGoals: (goals: Goal[]) => void
  loadGoals: (userId: string, filters?: { status?: Goal['status'] }) => Promise<void>
  subscribeGoals: (userId: string, filters?: { status?: Goal['status'] }) => () => void
  addGoal: (userId: string, goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'progressPercentage'>) => Promise<void>
  updateGoal: (userId: string, goalId: string, updates: Partial<Goal>) => Promise<void>
  deleteGoal: (userId: string, goalId: string) => Promise<void>
  updateProgress: (userId: string, goalId: string, currentValue: number, note?: string) => Promise<void>
  clearCompletedGoals: () => void
  
  // Cleanup
  unsubscribe: () => void
}

let unsubscribeGoals: (() => void) | null = null

export const useGoalsStore = create<GoalsState>((set, get) => ({
  // Initial state
  goals: [],
  isLoadingGoals: true,
  newlyCompletedGoals: [],

  setGoals: (goals) => {
    set({ goals, isLoadingGoals: false })
  },

  loadGoals: async (userId: string, filters?: { status?: Goal['status'] }) => {
    try {
      set({ isLoadingGoals: true })
      const goals = await fetchGoals(userId, filters)
      set({ goals, isLoadingGoals: false })
    } catch (error) {
      console.error('Error loading goals:', error)
      showError('Failed to load goals')
      set({ isLoadingGoals: false })
    }
  },

  subscribeGoals: (userId: string, filters?: { status?: Goal['status'] }) => {
    // Clean up existing subscription
    if (unsubscribeGoals) {
      unsubscribeGoals()
    }

    set({ isLoadingGoals: true })

    const hashData = (goals: Goal[]): string => {
      if (goals.length === 0) return 'empty'
      return `${goals.length}-${goals[0]?.id || ''}-${goals[goals.length - 1]?.id || ''}`
    }

    const fetchGoalsFn = async (): Promise<Goal[]> => {
      return fetchGoals(userId, filters)
    }

    // Subscribe with smart polling
    unsubscribeGoals = createSmartPoll(
      fetchGoalsFn,
      (goals) => {
        get().setGoals(goals)
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
      if (unsubscribeGoals) {
        unsubscribeGoals()
        unsubscribeGoals = null
      }
    }
  },

  addGoal: async (userId: string, goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'progressPercentage'>) => {
    try {
      const newGoal = await addGoalApi(userId, goal)
      set((state) => ({
        goals: [newGoal, ...state.goals],
      }))
    } catch (error) {
      console.error('Error adding goal:', error)
      showError('Failed to add goal')
      throw error
    }
  },

  updateGoal: async (userId: string, goalId: string, updates: Partial<Goal>) => {
    try {
      const updatedGoal = await updateGoalApi(userId, goalId, updates)
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? updatedGoal : g)),
      }))
    } catch (error) {
      console.error('Error updating goal:', error)
      showError('Failed to update goal')
      throw error
    }
  },

  deleteGoal: async (userId: string, goalId: string) => {
    try {
      await deleteGoalApi(userId, goalId)
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== goalId),
      }))
    } catch (error) {
      console.error('Error deleting goal:', error)
      showError('Failed to delete goal')
      throw error
    }
  },

  updateProgress: async (userId: string, goalId: string, currentValue: number, note?: string) => {
    try {
      const previousGoal = get().goals.find(g => g.id === goalId)
      const updatedGoal = await updateGoalProgressApi(userId, goalId, currentValue, note)
      
      // Check if goal just completed
      const wasCompleted = previousGoal?.status === 'completed'
      const isNowCompleted = updatedGoal.status === 'completed'
      
      set((state) => {
        const updatedGoals = state.goals.map((g) => (g.id === goalId ? updatedGoal : g))
        const newlyCompleted = !wasCompleted && isNowCompleted ? [...state.newlyCompletedGoals, updatedGoal] : state.newlyCompletedGoals
        
        return {
          goals: updatedGoals,
          newlyCompletedGoals: newlyCompleted,
        }
      })
    } catch (error) {
      console.error('Error updating goal progress:', error)
      showError('Failed to update goal progress')
      throw error
    }
  },

  clearCompletedGoals: () => {
    set({ newlyCompletedGoals: [] })
  },

  unsubscribe: () => {
    if (unsubscribeGoals) {
      unsubscribeGoals()
      unsubscribeGoals = null
    }
  },
}))

