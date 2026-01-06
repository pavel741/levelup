/**
 * Helper functions for workout operations
 */

import type { WorkoutLog, CompletedExercise } from '@/types/workout'

/**
 * Get the last weight used for a specific exercise from workout logs
 */
export function getLastWeightForExercise(
  logs: WorkoutLog[],
  exerciseId: string
): number | null {
  // Sort logs by date (most recent first)
  const sortedLogs = [...logs].sort((a, b) => b.date.getTime() - a.date.getTime())

  for (const log of sortedLogs) {
    const exercise = log.exercises.find((ex: CompletedExercise) => ex.exerciseId === exerciseId)
    if (exercise && exercise.sets.length > 0) {
      // Find the last set with weight
      for (let i = exercise.sets.length - 1; i >= 0; i--) {
        const set = exercise.sets[i]
        if (set.weight && set.weight > 0) {
          return set.weight
        }
      }
    }
  }

  return null
}

/**
 * Calculate recovery time based on muscle groups trained
 */
export function calculateRecoveryTime(muscleGroups: string[]): {
  hours: number
  days: number
  message: string
} {
  // Muscle groups that need longer recovery
  const largeMuscleGroups = ['legs', 'quads', 'hamstrings', 'glutes', 'back', 'lats', 'chest']
  const hasLargeMuscleGroups = muscleGroups.some(mg => largeMuscleGroups.includes(mg.toLowerCase()))

  if (hasLargeMuscleGroups) {
    return {
      hours: 48,
      days: 2,
      message: 'Large muscle groups trained. Rest 48-72 hours before training these muscles again.'
    }
  }

  return {
    hours: 24,
    days: 1,
    message: 'Smaller muscle groups trained. Rest 24-48 hours before training these muscles again.'
  }
}

/**
 * Determine if weight should be increased based on performance
 */
export function shouldIncreaseWeight(
  _currentWeight: number,
  targetReps: number,
  completedReps: number,
  setsCompleted: number,
  totalSets: number,
  averageRPE?: number // Optional RPE (Rate of Perceived Exertion) 1-10
): {
  shouldIncrease: boolean
  recommendation: string
  suggestedIncrease: number
} {
  const repCompletion = (completedReps / targetReps) * 100
  const setsCompletion = (setsCompleted / totalSets) * 100

  // RPE-based analysis (if available)
  // RPE 1-3 = Very easy, 4-6 = Easy, 7-8 = Moderate, 9-10 = Very hard
  if (averageRPE !== undefined && averageRPE > 0) {
    // If RPE is low (easy) and completed all reps, definitely increase
    if (averageRPE <= 6 && repCompletion >= 100 && setsCompletion >= 100) {
      return {
        shouldIncrease: true,
        recommendation: `Excellent! You completed all sets and reps with ease (RPE ${averageRPE}). Consider increasing weight by 5-7.5kg next session.`,
        suggestedIncrease: 5
      }
    }
    
    // If RPE is moderate (7-8) and completed all reps, moderate increase
    if (averageRPE <= 8 && repCompletion >= 100 && setsCompletion >= 100) {
      return {
        shouldIncrease: true,
        recommendation: `Great work! You completed all sets and reps with moderate effort (RPE ${averageRPE}). Consider increasing weight by 2.5-5kg next session.`,
        suggestedIncrease: 2.5
      }
    }
    
    // If RPE is high (9-10), maintain or decrease
    if (averageRPE >= 9) {
      return {
        shouldIncrease: false,
        recommendation: `This was very challenging (RPE ${averageRPE}). Maintain current weight or reduce by 2.5kg to focus on form and control.`,
        suggestedIncrease: -2.5
      }
    }
  }

  // Fallback to completion-based analysis if no RPE
  // If completed all reps on all sets, suggest increase
  if (repCompletion >= 100 && setsCompletion >= 100) {
    return {
      shouldIncrease: true,
      recommendation: `Great work! You completed all sets and reps. Consider increasing weight by 2.5-5kg next session.`,
      suggestedIncrease: 2.5
    }
  }

  // If completed 90%+ of reps on all sets, suggest small increase
  if (repCompletion >= 90 && setsCompletion >= 100) {
    return {
      shouldIncrease: true,
      recommendation: `Strong performance! You completed most reps. Consider a small increase of 1-2.5kg next session.`,
      suggestedIncrease: 1
    }
  }

  // If struggled (completed < 80% of reps), suggest maintain or decrease
  if (repCompletion < 80) {
    return {
      shouldIncrease: false,
      recommendation: `You struggled with this weight. Maintain current weight or reduce by 2.5kg to focus on form and complete all reps.`,
      suggestedIncrease: -2.5
    }
  }

  // Default: maintain weight
  return {
    shouldIncrease: false,
    recommendation: `Good work! Maintain current weight and focus on completing all reps with good form.`,
    suggestedIncrease: 0
  }
}

