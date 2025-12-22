/**
 * Utility functions for calculating workout challenge progress
 */

import type { Challenge } from '@/types'
import type { WorkoutLog } from '@/types/workout'
import { format, isWithinInterval, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns'

/**
 * Calculate workout challenge progress based on workout logs
 */
export function calculateWorkoutChallengeProgress(
  challenge: Challenge,
  workoutLogs: WorkoutLog[],
  userId: string
): number {
  if (!challenge.workoutGoalType) return 0

  const now = new Date()
  const startDate = challenge.startDate instanceof Date ? challenge.startDate : new Date(challenge.startDate)
  const endDate = challenge.endDate instanceof Date ? challenge.endDate : new Date(challenge.endDate)

  // Filter logs within challenge period and for this user
  const relevantLogs = workoutLogs.filter((log) => {
    // Use endTime if available (when workout was completed), otherwise use date
    const logDate = log.endTime 
      ? (log.endTime instanceof Date ? log.endTime : new Date(log.endTime))
      : (log.date instanceof Date ? log.date : new Date(log.date))
    return (
      log.userId === userId &&
      log.completed &&
      isWithinInterval(logDate, { start: startDate, end: endDate })
    )
  })

  switch (challenge.workoutGoalType) {
    case 'workouts_completed':
      // Target: Complete X workouts
      if (!challenge.workoutTarget) return 0
      const completed = relevantLogs.length
      return Math.min(100, (completed / challenge.workoutTarget) * 100)

    case 'workouts_per_week':
      // Target: Complete X workouts per week
      if (!challenge.workoutTargetPerWeek) return 0
      
      // Get all weeks in the challenge period
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate })
      
      // Count workouts per week and calculate average
      let totalWeeklyProgress = 0
      let weeksCounted = 0
      
      for (const weekStart of weeks) {
        const weekEnd = endOfWeek(weekStart)
        const weekLogs = relevantLogs.filter((log) => {
          const logDate = log.endTime 
            ? (log.endTime instanceof Date ? log.endTime : new Date(log.endTime))
            : (log.date instanceof Date ? log.date : new Date(log.date))
          return isWithinInterval(logDate, { start: weekStart, end: weekEnd })
        })
        
        const weeklyProgress = Math.min(100, (weekLogs.length / challenge.workoutTargetPerWeek) * 100)
        totalWeeklyProgress += weeklyProgress
        weeksCounted++
      }
      
      return weeksCounted > 0 ? totalWeeklyProgress / weeksCounted : 0

    case 'routine_completed':
      // Target: Complete a specific routine X times
      if (!challenge.workoutTarget || !challenge.workoutRoutineId) return 0
      
      const routineCompletions = relevantLogs.filter(
        (log) => log.routineId === challenge.workoutRoutineId
      ).length
      
      return Math.min(100, (routineCompletions / challenge.workoutTarget) * 100)

    case 'total_volume':
      // Target: Lift X total kg across all workouts
      if (!challenge.workoutTarget) return 0
      
      const totalVolume = relevantLogs.reduce((sum, log) => {
        const exerciseVolume = log.exercises.reduce((exSum, ex) => {
          const setVolume = ex.sets.reduce((setSum, set) => {
            const weight = set.weight || 0
            const reps = set.reps || 0
            return setSum + (weight * reps)
          }, 0)
          return exSum + setVolume
        }, 0)
        return sum + exerciseVolume
      }, 0)
      
      return Math.min(100, (totalVolume / challenge.workoutTarget) * 100)

    case 'streak':
      // Target: Maintain a workout streak of X days
      if (!challenge.workoutTarget) return 0
      
      // Get unique dates with workouts
      const workoutDates = new Set(
        relevantLogs.map((log) => {
          const logDate = log.endTime 
            ? (log.endTime instanceof Date ? log.endTime : new Date(log.endTime))
            : (log.date instanceof Date ? log.date : new Date(log.date))
          return format(logDate, 'yyyy-MM-dd')
        })
      )
      
      // Calculate current streak
      let currentStreak = 0
      let checkDate = new Date(now)
      checkDate.setHours(0, 0, 0, 0)
      
      while (workoutDates.has(format(checkDate, 'yyyy-MM-dd'))) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      }
      
      return Math.min(100, (currentStreak / challenge.workoutTarget) * 100)

    default:
      return 0
  }
}

/**
 * Get formatted progress text for workout challenges
 */
export function getWorkoutChallengeProgressText(
  challenge: Challenge,
  workoutLogs: WorkoutLog[],
  userId: string
): string {
  if (!challenge.workoutGoalType) return '0%'

  const now = new Date()
  const startDate = challenge.startDate instanceof Date ? challenge.startDate : new Date(challenge.startDate)
  const endDate = challenge.endDate instanceof Date ? challenge.endDate : new Date(challenge.endDate)

  const relevantLogs = workoutLogs.filter((log) => {
    const logDate = log.endTime 
      ? (log.endTime instanceof Date ? log.endTime : new Date(log.endTime))
      : (log.date instanceof Date ? log.date : new Date(log.date))
    return (
      log.userId === userId &&
      log.completed &&
      isWithinInterval(logDate, { start: startDate, end: endDate })
    )
  })

  switch (challenge.workoutGoalType) {
    case 'workouts_completed':
      if (!challenge.workoutTarget) return '0%'
      return `${relevantLogs.length} / ${challenge.workoutTarget} workouts`

    case 'workouts_per_week':
      if (!challenge.workoutTargetPerWeek) return '0%'
      const thisWeekStart = startOfWeek(now)
      const thisWeekEnd = endOfWeek(now)
      const thisWeekLogs = relevantLogs.filter((log) => {
        const logDate = log.endTime 
          ? (log.endTime instanceof Date ? log.endTime : new Date(log.endTime))
          : (log.date instanceof Date ? log.date : new Date(log.date))
        return isWithinInterval(logDate, { start: thisWeekStart, end: thisWeekEnd })
      })
      return `${thisWeekLogs.length} / ${challenge.workoutTargetPerWeek} workouts this week`

    case 'routine_completed':
      if (!challenge.workoutTarget || !challenge.workoutRoutineId) return '0%'
      const routineCompletions = relevantLogs.filter(
        (log) => log.routineId === challenge.workoutRoutineId
      ).length
      return `${routineCompletions} / ${challenge.workoutTarget} times`

    case 'total_volume':
      if (!challenge.workoutTarget) return '0%'
      const totalVolume = relevantLogs.reduce((sum, log) => {
        const exerciseVolume = log.exercises.reduce((exSum, ex) => {
          const setVolume = ex.sets.reduce((setSum, set) => {
            const weight = set.weight || 0
            const reps = set.reps || 0
            return setSum + (weight * reps)
          }, 0)
          return exSum + setVolume
        }, 0)
        return sum + exerciseVolume
      }, 0)
      return `${Math.round(totalVolume)} / ${challenge.workoutTarget} kg`

    case 'streak':
      if (!challenge.workoutTarget) return '0%'
      const workoutDates = new Set(
        relevantLogs.map((log) => {
          const logDate = log.endTime 
            ? (log.endTime instanceof Date ? log.endTime : new Date(log.endTime))
            : (log.date instanceof Date ? log.date : new Date(log.date))
          return format(logDate, 'yyyy-MM-dd')
        })
      )
      let currentStreak = 0
      let checkDate = new Date(now)
      checkDate.setHours(0, 0, 0, 0)
      while (workoutDates.has(format(checkDate, 'yyyy-MM-dd'))) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      }
      return `${currentStreak} / ${challenge.workoutTarget} day streak`

    default:
      return '0%'
  }
}

