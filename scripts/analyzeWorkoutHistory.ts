/**
 * Workout History Analysis
 * Analyzes workout logs to provide deeper insights
 */

import type { WorkoutLog } from '@/types/workout'
import { getExerciseById } from '@/lib/exerciseDatabase'
import { format, subDays } from 'date-fns'

export interface WorkoutHistoryInsights {
  totalWorkouts: number
  totalVolume: number
  averageWorkoutDuration: number
  averageVolumePerWorkout: number
  workoutsPerWeek: number
  mostFrequentExercises: Array<{ exerciseId: string; name: string; count: number; totalVolume: number }>
  muscleGroupFrequency: Record<string, number>
  volumeProgression: Array<{ date: string; volume: number }>
  trainingFrequency: {
    daysPerWeek: number
    consistency: 'excellent' | 'good' | 'moderate' | 'low'
    recommendation: string
  }
  muscleGroupBalance: {
    imbalances: Array<{ muscleGroup: string; sets: number; recommendation: string }>
    wellBalanced: boolean
  }
  exerciseVariety: {
    uniqueExercises: number
    varietyScore: number // 0-100
    recommendation: string
  }
  progressIndicators: {
    volumeTrend: 'increasing' | 'stable' | 'decreasing'
    frequencyTrend: 'increasing' | 'stable' | 'decreasing'
    strengthProgression: Array<{ exerciseId: string; name: string; progression: string }>
  }
}

/**
 * Analyze workout history for deeper insights
 */
export function analyzeWorkoutHistory(logs: WorkoutLog[]): WorkoutHistoryInsights {
  if (logs.length === 0) {
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      averageWorkoutDuration: 0,
      averageVolumePerWorkout: 0,
      workoutsPerWeek: 0,
      mostFrequentExercises: [],
      muscleGroupFrequency: {},
      volumeProgression: [],
      trainingFrequency: {
        daysPerWeek: 0,
        consistency: 'low',
        recommendation: 'Start tracking workouts to see your training frequency.'
      },
      muscleGroupBalance: {
        imbalances: [],
        wellBalanced: true
      },
      exerciseVariety: {
        uniqueExercises: 0,
        varietyScore: 0,
        recommendation: 'No workout data available.'
      },
      progressIndicators: {
        volumeTrend: 'stable',
        frequencyTrend: 'stable',
        strengthProgression: []
      }
    }
  }

  // Basic stats
  const totalWorkouts = logs.length
  const totalVolume = logs.reduce((sum, log) => sum + (log.totalVolume || 0), 0)
  const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0)
  const averageWorkoutDuration = Math.round(totalDuration / totalWorkouts / 60) // Convert to minutes
  const averageVolumePerWorkout = Math.round(totalVolume / totalWorkouts)

  // Exercise frequency
  const exerciseCounts = new Map<string, { count: number; totalVolume: number }>()
  const muscleGroupCounts = new Map<string, number>()
  const uniqueExerciseIds = new Set<string>()

  logs.forEach(log => {
    log.exercises.forEach(ex => {
      uniqueExerciseIds.add(ex.exerciseId)
      
      const current = exerciseCounts.get(ex.exerciseId) || { count: 0, totalVolume: 0 }
      const exerciseVolume = ex.sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0)
      exerciseCounts.set(ex.exerciseId, {
        count: current.count + 1,
        totalVolume: current.totalVolume + exerciseVolume
      })

      const exercise = getExerciseById(ex.exerciseId)
      if (exercise) {
        exercise.muscleGroups.primary.forEach(mg => {
          muscleGroupCounts.set(mg, (muscleGroupCounts.get(mg) || 0) + 1)
        })
      }
    })
  })

  const mostFrequentExercises = Array.from(exerciseCounts.entries())
    .map(([exerciseId, data]) => {
      const exercise = getExerciseById(exerciseId)
      return {
        exerciseId,
        name: exercise?.name || 'Unknown',
        count: data.count,
        totalVolume: data.totalVolume
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Training frequency
  const last30Days = subDays(new Date(), 30)
  const recentLogs = logs.filter(log => {
    const logDate = log.endTime ? new Date(log.endTime) : new Date(log.date)
    return logDate >= last30Days
  })

  const workoutDates = new Set(
    recentLogs.map(log => {
      const logDate = log.endTime ? new Date(log.endTime) : new Date(log.date)
      return format(logDate, 'yyyy-MM-dd')
    })
  )

  const daysPerWeek = (workoutDates.size / 30) * 7
  let consistency: 'excellent' | 'good' | 'moderate' | 'low'
  let frequencyRecommendation: string

  if (daysPerWeek >= 4) {
    consistency = 'excellent'
    frequencyRecommendation = 'Excellent training frequency! You\'re working out 4+ times per week.'
  } else if (daysPerWeek >= 3) {
    consistency = 'good'
    frequencyRecommendation = 'Good training frequency. Consider adding 1 more day per week for optimal results.'
  } else if (daysPerWeek >= 2) {
    consistency = 'moderate'
    frequencyRecommendation = 'Moderate training frequency. Aim for 3-4 workouts per week for better progress.'
  } else {
    consistency = 'low'
    frequencyRecommendation = 'Low training frequency. Try to work out at least 3 times per week for consistent progress.'
  }

  // Volume progression (last 10 workouts)
  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = a.endTime ? new Date(a.endTime) : new Date(a.date)
    const dateB = b.endTime ? new Date(b.endTime) : new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  const volumeProgression = sortedLogs.slice(-10).map(log => ({
    date: format(log.endTime ? new Date(log.endTime) : new Date(log.date), 'MMM d'),
    volume: log.totalVolume || 0
  }))

  // Volume trend
  const recentVolume = sortedLogs.slice(-5).reduce((sum, log) => sum + (log.totalVolume || 0), 0) / 5
  const olderVolume = sortedLogs.slice(-10, -5).reduce((sum, log) => sum + (log.totalVolume || 0), 0) / 5
  const volumeTrend = recentVolume > olderVolume * 1.1 ? 'increasing' : 
                     recentVolume < olderVolume * 0.9 ? 'decreasing' : 'stable'

  // Frequency trend
  const recentWeeks = sortedLogs.slice(-14).length
  const olderWeeks = sortedLogs.slice(-28, -14).length
  const frequencyTrend = recentWeeks > olderWeeks ? 'increasing' :
                        recentWeeks < olderWeeks ? 'decreasing' : 'stable'

  // Muscle group balance
  const muscleGroupSets = new Map<string, number>()
  logs.forEach(log => {
    log.exercises.forEach(ex => {
      const exercise = getExerciseById(ex.exerciseId)
      if (exercise) {
        exercise.muscleGroups.primary.forEach(mg => {
          muscleGroupSets.set(mg, (muscleGroupSets.get(mg) || 0) + ex.sets.length)
        })
      }
    })
  })

  const allSets = Array.from(muscleGroupSets.values())
  const averageSets = allSets.reduce((sum, val) => sum + val, 0) / allSets.length
  const imbalances: Array<{ muscleGroup: string; sets: number; recommendation: string }> = []

  muscleGroupSets.forEach((sets, mg) => {
    const deviation = Math.abs(sets - averageSets) / averageSets
    if (deviation > 0.5) { // More than 50% deviation
      const recommendation = sets < averageSets * 0.5
        ? `Add more ${mg} exercises. Currently ${sets} sets vs average ${Math.round(averageSets)} sets.`
        : `You're training ${mg} a lot (${sets} sets). Consider balancing with other muscle groups.`
      imbalances.push({ muscleGroup: mg, sets, recommendation })
    }
  })

  // Exercise variety
  const varietyScore = Math.min(100, (uniqueExerciseIds.size / 20) * 100)
  const varietyRecommendation = varietyScore >= 70
    ? 'Great exercise variety! You\'re using many different exercises.'
    : varietyScore >= 40
    ? 'Good variety. Consider adding more exercise variations to target muscles from different angles.'
    : 'Low exercise variety. Try incorporating more different exercises to prevent plateaus and overuse injuries.'

  // Strength progression
  const strengthProgression: Array<{ exerciseId: string; name: string; progression: string }> = []
  const exerciseWeights = new Map<string, number[]>()

  sortedLogs.slice(-5).forEach(log => {
    log.exercises.forEach(ex => {
      const weights = ex.sets
        .filter(set => set.weight && set.weight > 0)
        .map(set => set.weight!)
      
      if (weights.length > 0) {
        const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length
        const current = exerciseWeights.get(ex.exerciseId) || []
        exerciseWeights.set(ex.exerciseId, [...current, avgWeight])
      }
    })
  })

  exerciseWeights.forEach((weights, exerciseId) => {
    if (weights.length >= 3) {
      const first = weights[0]
      const last = weights[weights.length - 1]
      const change = ((last - first) / first) * 100
      
      if (Math.abs(change) > 5) {
        const exercise = getExerciseById(exerciseId)
        strengthProgression.push({
          exerciseId,
          name: exercise?.name || 'Unknown',
          progression: change > 0 
            ? `+${change.toFixed(1)}% increase (${first.toFixed(1)}kg → ${last.toFixed(1)}kg)`
            : `${change.toFixed(1)}% decrease (${first.toFixed(1)}kg → ${last.toFixed(1)}kg)`
        })
      }
    }
  })

  return {
    totalWorkouts,
    totalVolume,
    averageWorkoutDuration,
    averageVolumePerWorkout,
    workoutsPerWeek: Math.round(daysPerWeek * 10) / 10,
    mostFrequentExercises,
    muscleGroupFrequency: Object.fromEntries(muscleGroupCounts),
    volumeProgression,
    trainingFrequency: {
      daysPerWeek: Math.round(daysPerWeek * 10) / 10,
      consistency,
      recommendation: frequencyRecommendation
    },
    muscleGroupBalance: {
      imbalances,
      wellBalanced: imbalances.length === 0
    },
    exerciseVariety: {
      uniqueExercises: uniqueExerciseIds.size,
      varietyScore: Math.round(varietyScore),
      recommendation: varietyRecommendation
    },
    progressIndicators: {
      volumeTrend,
      frequencyTrend,
      strengthProgression: strengthProgression.slice(0, 5)
    }
  }
}

