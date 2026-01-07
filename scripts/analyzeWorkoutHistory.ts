/**
 * Workout History Analysis - IMPROVED VERSION
 * Analyzes workout logs with more accurate calculations and better insights
 */

import type { WorkoutLog } from '@/types/workout'
import { getExerciseById } from '@/lib/exerciseDatabase'
import { format, subDays, startOfWeek, differenceInDays } from 'date-fns'

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
 * Estimate 1RM from weight and reps using Epley formula
 * 1RM = weight × (1 + reps/30)
 */
function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

/**
 * Calculate normalized volume load accounting for rep ranges
 * Uses relative intensity (percentage of estimated 1RM)
 */
function calculateNormalizedVolume(sets: Array<{ weight?: number; reps?: number }>): number {
  let totalVolume = 0
  let totalSets = 0
  
  sets.forEach(set => {
    const weight = set.weight || 0
    const reps = set.reps || 0
    
    if (weight > 0 && reps > 0) {
      const estimated1RM = estimate1RM(weight, reps)
      const relativeIntensity = weight / estimated1RM // Percentage of 1RM
      
      // Normalize volume: higher rep sets contribute less per rep
      // This accounts for the fact that 10 reps at 70% 1RM is different stimulus than 1 rep at 100%
      const normalizedReps = reps * relativeIntensity
      totalVolume += weight * normalizedReps
      totalSets++
    }
  })
  
  return totalVolume
}

/**
 * Calculate linear regression trend for volume progression
 * Returns slope (positive = increasing, negative = decreasing, near zero = stable)
 */
function calculateTrend(values: number[]): { slope: number; trend: 'increasing' | 'stable' | 'decreasing' } {
  if (values.length < 3) {
    return { slope: 0, trend: 'stable' }
  }
  
  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i)
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const avgY = sumY / n
  
  // Normalize slope by average to get percentage change per period
  const normalizedSlope = slope / avgY
  
  let trend: 'increasing' | 'stable' | 'decreasing'
  if (normalizedSlope > 0.05) {
    trend = 'increasing'
  } else if (normalizedSlope < -0.05) {
    trend = 'decreasing'
  } else {
    trend = 'stable'
  }
  
  return { slope: normalizedSlope, trend }
}

/**
 * Calculate workouts per week using actual week boundaries
 */
function calculateWorkoutsPerWeek(logs: WorkoutLog[]): number {
  if (logs.length === 0) return 0
  
  // Group workouts by week
  const weekMap = new Map<string, number>()
  
  logs.forEach(log => {
    const logDate = log.endTime ? new Date(log.endTime) : new Date(log.date)
    const weekStart = startOfWeek(logDate, { weekStartsOn: 1 }) // Monday
    const weekKey = format(weekStart, 'yyyy-MM-dd')
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1)
  })
  
  if (weekMap.size === 0) return 0
  
  // Calculate average workouts per week
  const totalWorkouts = Array.from(weekMap.values()).reduce((a, b) => a + b, 0)
  const totalWeeks = weekMap.size
  
  return totalWorkouts / totalWeeks
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

  // Sort logs by date (oldest first)
  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = a.endTime ? new Date(a.endTime) : new Date(a.date)
    const dateB = b.endTime ? new Date(b.endTime) : new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  // Basic stats with improved volume calculation
  const totalWorkouts = logs.length
  const totalVolume = sortedLogs.reduce((sum, log) => {
    // Use normalized volume if available, otherwise fall back to totalVolume
    if (log.totalVolume) {
      return sum + log.totalVolume
    }
    // Calculate volume from exercises
    const workoutVolume = log.exercises.reduce((exSum, ex) => {
      return exSum + calculateNormalizedVolume(ex.sets)
    }, 0)
    return sum + workoutVolume
  }, 0)
  
  const totalDuration = sortedLogs.reduce((sum, log) => sum + log.duration, 0)
  const averageWorkoutDuration = Math.round(totalDuration / totalWorkouts / 60) // Convert to minutes
  const averageVolumePerWorkout = Math.round(totalVolume / totalWorkouts)

  // Exercise frequency with improved volume calculation
  const exerciseCounts = new Map<string, { count: number; totalVolume: number }>()
  const muscleGroupCounts = new Map<string, number>()
  const uniqueExerciseIds = new Set<string>()

  sortedLogs.forEach(log => {
    log.exercises.forEach(ex => {
      uniqueExerciseIds.add(ex.exerciseId)
      
      const current = exerciseCounts.get(ex.exerciseId) || { count: 0, totalVolume: 0 }
      const exerciseVolume = calculateNormalizedVolume(ex.sets)
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

  // Improved training frequency calculation using actual weeks
  const last30Days = subDays(new Date(), 30)
  const recentLogs = sortedLogs.filter(log => {
    const logDate = log.endTime ? new Date(log.endTime) : new Date(log.date)
    return logDate >= last30Days
  })

  // Calculate workouts per week using week boundaries
  const workoutsPerWeek = calculateWorkoutsPerWeek(recentLogs)
  
  // Also calculate consistency based on recent weeks
  const recentWeeks = new Set<string>()
  recentLogs.forEach(log => {
    const logDate = log.endTime ? new Date(log.endTime) : new Date(log.date)
    const weekStart = startOfWeek(logDate, { weekStartsOn: 1 })
    recentWeeks.add(format(weekStart, 'yyyy-MM-dd'))
  })
  
  const weeksWithWorkouts = recentWeeks.size
  const expectedWeeks = Math.ceil(differenceInDays(new Date(), last30Days) / 7)
  const consistencyRatio = expectedWeeks > 0 ? weeksWithWorkouts / expectedWeeks : 0
  
  let consistency: 'excellent' | 'good' | 'moderate' | 'low'
  let frequencyRecommendation: string

  if (workoutsPerWeek >= 4 && consistencyRatio >= 0.8) {
    consistency = 'excellent'
    frequencyRecommendation = 'Excellent training frequency! You\'re working out 4+ times per week consistently.'
  } else if (workoutsPerWeek >= 3 && consistencyRatio >= 0.7) {
    consistency = 'good'
    frequencyRecommendation = 'Good training frequency. Consider adding 1 more day per week for optimal results.'
  } else if (workoutsPerWeek >= 2) {
    consistency = 'moderate'
    frequencyRecommendation = 'Moderate training frequency. Aim for 3-4 workouts per week for better progress.'
  } else {
    consistency = 'low'
    frequencyRecommendation = 'Low training frequency. Try to work out at least 3 times per week for consistent progress.'
  }

  // Volume progression (last 12 workouts for better trend analysis)
  const volumeProgression = sortedLogs.slice(-12).map(log => {
    const logDate = log.endTime ? new Date(log.endTime) : new Date(log.date)
    return {
      date: format(logDate, 'MMM d'),
      volume: log.totalVolume || log.exercises.reduce((sum, ex) => sum + calculateNormalizedVolume(ex.sets), 0)
    }
  })

  // Improved volume trend using linear regression
  const recentVolumes = sortedLogs.slice(-8).map(log => 
    log.totalVolume || log.exercises.reduce((sum, ex) => sum + calculateNormalizedVolume(ex.sets), 0)
  )
  const { trend: volumeTrend } = calculateTrend(recentVolumes)

  // Improved frequency trend using week-based comparison
  const now = new Date()
  const fourWeeksAgo = subDays(now, 28)
  const eightWeeksAgo = subDays(now, 56)
  
  const recent4Weeks = sortedLogs.filter(log => {
    const logDate = log.endTime ? new Date(log.endTime) : new Date(log.date)
    return logDate >= fourWeeksAgo
  }).length
  
  const previous4Weeks = sortedLogs.filter(log => {
    const logDate = log.endTime ? new Date(log.endTime) : new Date(log.date)
    return logDate >= eightWeeksAgo && logDate < fourWeeksAgo
  }).length
  
  const frequencyTrend = recent4Weeks > previous4Weeks * 1.1 ? 'increasing' :
                        recent4Weeks < previous4Weeks * 0.9 ? 'decreasing' : 'stable'

  // Improved muscle group balance with normalized calculations
  const muscleGroupSets = new Map<string, number>()
  const muscleGroupVolume = new Map<string, number>()
  
  // Normalize by muscle group size (larger groups need more volume)
  const muscleGroupSizeMultipliers: Record<string, number> = {
    legs: 1.5,
    glutes: 1.3,
    quadriceps: 1.2,
    hamstrings: 1.2,
    back: 1.4,
    lats: 1.3,
    chest: 1.2,
    shoulders: 1.0,
    triceps: 0.8,
    biceps: 0.7,
    calves: 0.6,
    core: 0.9,
  }
  
  sortedLogs.forEach(log => {
    log.exercises.forEach(ex => {
      const exercise = getExerciseById(ex.exerciseId)
      if (exercise) {
        const exerciseVolume = calculateNormalizedVolume(ex.sets)
        exercise.muscleGroups.primary.forEach(mg => {
          const multiplier = muscleGroupSizeMultipliers[mg.toLowerCase()] || 1.0
          muscleGroupSets.set(mg, (muscleGroupSets.get(mg) || 0) + ex.sets.length)
          muscleGroupVolume.set(mg, (muscleGroupVolume.get(mg) || 0) + exerciseVolume / multiplier)
        })
      }
    })
  })

  // Calculate normalized averages
  const normalizedVolumes = Array.from(muscleGroupVolume.values())
  const averageNormalizedVolume = normalizedVolumes.length > 0
    ? normalizedVolumes.reduce((sum, val) => sum + val, 0) / normalizedVolumes.length
    : 0

  const imbalances: Array<{ muscleGroup: string; sets: number; recommendation: string }> = []

  muscleGroupVolume.forEach((normalizedVol, mg) => {
    const sets = muscleGroupSets.get(mg) || 0
    if (averageNormalizedVolume > 0) {
      const deviation = Math.abs(normalizedVol - averageNormalizedVolume) / averageNormalizedVolume
      if (deviation > 0.4) { // More than 40% deviation from normalized average
        const recommendation = normalizedVol < averageNormalizedVolume * 0.6
          ? `Add more ${mg} exercises. Currently ${sets} sets vs normalized average.`
          : `You're training ${mg} extensively (${sets} sets). Consider balancing with other muscle groups.`
        imbalances.push({ muscleGroup: mg, sets, recommendation })
      }
    }
  })

  // Improved exercise variety - consider movement patterns
  const movementPatterns = new Set<string>()
  sortedLogs.forEach(log => {
    log.exercises.forEach(ex => {
      const exercise = getExerciseById(ex.exerciseId)
      if (exercise) {
        // Categorize by movement pattern
        const name = exercise.name.toLowerCase()
        if (name.includes('squat') || name.includes('leg press')) movementPatterns.add('squat')
        if (name.includes('deadlift') || name.includes('hip hinge')) movementPatterns.add('hip hinge')
        if (name.includes('press') || name.includes('push')) movementPatterns.add('push')
        if (name.includes('pull') || name.includes('row')) movementPatterns.add('pull')
        if (name.includes('curl')) movementPatterns.add('curl')
        if (name.includes('extension') || name.includes('tricep')) movementPatterns.add('extension')
      }
    })
  })
  
  // Variety score based on both unique exercises and movement patterns
  const exerciseVarietyScore = Math.min(50, (uniqueExerciseIds.size / 15) * 50)
  const movementVarietyScore = Math.min(50, (movementPatterns.size / 6) * 50)
  const varietyScore = exerciseVarietyScore + movementVarietyScore
  
  const varietyRecommendation = varietyScore >= 70
    ? 'Great exercise variety! You\'re using many different exercises and movement patterns.'
    : varietyScore >= 40
    ? 'Good variety. Consider adding more exercise variations to target muscles from different angles.'
    : 'Low exercise variety. Try incorporating more different exercises and movement patterns to prevent plateaus.'

  // Improved strength progression with 1RM estimation and longer window
  const strengthProgression: Array<{ exerciseId: string; name: string; progression: string }> = []
  const exerciseData = new Map<string, Array<{ date: Date; estimated1RM: number; reps: number; weight: number }>>()

  // Collect data from last 10 workouts (longer window)
  sortedLogs.slice(-10).forEach(log => {
    const logDate = log.endTime ? new Date(log.endTime) : new Date(log.date)
    log.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.weight && set.weight > 0 && set.reps && set.reps > 0) {
          const estimated1RM = estimate1RM(set.weight, set.reps)
          const current = exerciseData.get(ex.exerciseId) || []
          exerciseData.set(ex.exerciseId, [
            ...current,
            { date: logDate, estimated1RM, reps: set.reps, weight: set.weight }
          ])
        }
      })
    })
  })

  exerciseData.forEach((dataPoints, exerciseId) => {
    if (dataPoints.length >= 4) {
      // Group by similar rep ranges to compare apples to apples
      const repRangeGroups = new Map<string, typeof dataPoints>()
      
      dataPoints.forEach(point => {
        let range: string
        if (point.reps <= 3) range = '1-3'
        else if (point.reps <= 6) range = '4-6'
        else if (point.reps <= 10) range = '7-10'
        else range = '11+'
        
        const group = repRangeGroups.get(range) || []
        group.push(point)
        repRangeGroups.set(range, group)
      })
      
      // Analyze each rep range separately
      repRangeGroups.forEach((group, range) => {
        if (group.length >= 3) {
          // Sort by date
          group.sort((a, b) => a.date.getTime() - b.date.getTime())
          
          const first = group[0]
          const last = group[group.length - 1]
          
          // Compare estimated 1RM (more accurate than raw weight)
          const change = ((last.estimated1RM - first.estimated1RM) / first.estimated1RM) * 100
          
          if (Math.abs(change) > 3) { // 3% threshold for meaningful change
            const exercise = getExerciseById(exerciseId)
            const progression = change > 0
              ? `+${change.toFixed(1)}% 1RM increase (${first.estimated1RM.toFixed(1)}kg → ${last.estimated1RM.toFixed(1)}kg) @ ${range} reps`
              : `${change.toFixed(1)}% 1RM decrease (${first.estimated1RM.toFixed(1)}kg → ${last.estimated1RM.toFixed(1)}kg) @ ${range} reps`
            
            strengthProgression.push({
              exerciseId,
              name: exercise?.name || 'Unknown',
              progression
            })
          }
        }
      })
    }
  })

  // Remove duplicates and sort by absolute change
  const uniqueProgression = Array.from(
    new Map(strengthProgression.map(item => [item.exerciseId, item])).values()
  )
    .sort((a, b) => {
      const changeA = parseFloat(a.progression.match(/[+-]?[\d.]+/)?.[0] || '0')
      const changeB = parseFloat(b.progression.match(/[+-]?[\d.]+/)?.[0] || '0')
      return Math.abs(changeB) - Math.abs(changeA)
    })
    .slice(0, 5)

  return {
    totalWorkouts,
    totalVolume,
    averageWorkoutDuration,
    averageVolumePerWorkout,
    workoutsPerWeek: Math.round(workoutsPerWeek * 10) / 10,
    mostFrequentExercises,
    muscleGroupFrequency: Object.fromEntries(muscleGroupCounts),
    volumeProgression,
    trainingFrequency: {
      daysPerWeek: Math.round(workoutsPerWeek * 10) / 10,
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
      strengthProgression: uniqueProgression
    }
  }
}
