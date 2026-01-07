/**
 * Store Index
 * Central export point for all Zustand stores
 * 
 * State Management Strategy:
 * - Feature-specific stores for domain logic (finance, workouts, etc.)
 * - Core store for user/auth/global state (useFirestoreStore)
 * - React Context only for theme/auth providers
 * - Local state (useState) for UI-only state
 */

// Core store (user, auth, habits, challenges, achievements)
export { useFirestoreStore } from './useFirestoreStore'

// Feature stores
export { useWorkoutStore } from './useWorkoutStore'
export { useTodosStore } from './useTodosStore'
export { useFocusStore } from './useFocusStore'
export { useGoalsStore } from './useGoalsStore'

// Re-export types for convenience
export type { User, Habit, Challenge, Achievement, DailyStats, Todo, Goal } from '@/types'

