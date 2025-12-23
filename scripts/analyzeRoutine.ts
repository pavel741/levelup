/**
 * Routine Analysis Script
 * Analyzes workout routines and suggests exercise additions
 */

import { EXERCISE_DATABASE } from '../lib/exerciseDatabase'
import type { Routine, RoutineSession, RoutineExercise } from '../types/workout'
import type { Exercise } from '../types/workout'

interface MuscleGroupCoverage {
  muscleGroup: string
  exercises: string[]
  directWork: number // Number of exercises targeting this as primary
  indirectWork: number // Number of exercises targeting this as secondary
  totalSets: number
}

interface RoutineAnalysis {
  routineId: string
  routineName: string
  muscleGroups: MuscleGroupCoverage[]
  bicepsAnalysis: {
    hasDirectBicepsWork: boolean
    hasIndirectBicepsWork: boolean
    bicepsExercises: string[]
    indirectBicepsExercises: string[]
    totalBicepsSets: number
    recommendation: 'add' | 'sufficient' | 'excessive'
    suggestedExercises: Exercise[]
  }
  overallRecommendations: string[]
}

/**
 * Get exercise by ID from database
 */
function getExerciseById(exerciseId: string): Exercise | undefined {
  return EXERCISE_DATABASE.find(ex => ex.id === exerciseId)
}

/**
 * Get all exercises that target a specific muscle group
 */
function getExercisesByMuscleGroup(muscleGroup: string, equipment?: string[]): Exercise[] {
  return EXERCISE_DATABASE.filter(ex => {
    const targetsMuscle = 
      ex.muscleGroups.primary.includes(muscleGroup) ||
      ex.muscleGroups.secondary.includes(muscleGroup)
    
    if (!targetsMuscle) return false
    
    if (equipment && equipment.length > 0) {
      return equipment.some(eq => ex.equipment.includes(eq))
    }
    
    return true
  })
}

/**
 * Analyze a single routine
 */
export function analyzeRoutine(routine: Routine): RoutineAnalysis {
  const muscleGroupMap = new Map<string, MuscleGroupCoverage>()
  const bicepsExercises: string[] = []
  const indirectBicepsExercises: string[] = []
  let totalBicepsSets = 0

  // Process all sessions in the routine (handle both old and new format)
  const sessions = routine.sessions || []
  const exercises = routine.exercises || [] // Fallback to old format if needed
  
  // Process sessions
  sessions.forEach((session: RoutineSession) => {
    session.exercises.forEach((routineExercise: RoutineExercise) => {
      const exercise = getExerciseById(routineExercise.exerciseId)
      if (!exercise) return

      const workingSets = routineExercise.sets.filter(
        set => set.setType === 'working'
      ).length

      // Analyze muscle groups
      const allMuscleGroups = [
        ...exercise.muscleGroups.primary,
        ...exercise.muscleGroups.secondary
      ]

      allMuscleGroups.forEach(muscleGroup => {
        if (!muscleGroupMap.has(muscleGroup)) {
          muscleGroupMap.set(muscleGroup, {
            muscleGroup,
            exercises: [],
            directWork: 0,
            indirectWork: 0,
            totalSets: 0
          })
        }

        const coverage = muscleGroupMap.get(muscleGroup)!
        coverage.exercises.push(exercise.name)
        coverage.totalSets += workingSets

        if (exercise.muscleGroups.primary.includes(muscleGroup)) {
          coverage.directWork++
        } else if (exercise.muscleGroups.secondary.includes(muscleGroup)) {
          coverage.indirectWork++
        }
      })

      // Special analysis for biceps
      if (exercise.muscleGroups.primary.includes('biceps')) {
        bicepsExercises.push(exercise.name)
        totalBicepsSets += workingSets
      } else if (exercise.muscleGroups.secondary.includes('biceps')) {
        indirectBicepsExercises.push(exercise.name)
      }
    })
  })

  // Process old format exercises if no sessions exist
  if (sessions.length === 0 && exercises.length > 0) {
    exercises.forEach((routineExercise: RoutineExercise) => {
      const exercise = getExerciseById(routineExercise.exerciseId)
      if (!exercise) return

      const workingSets = routineExercise.sets.filter(
        set => set.setType === 'working'
      ).length

      // Analyze muscle groups
      const allMuscleGroups = [
        ...exercise.muscleGroups.primary,
        ...exercise.muscleGroups.secondary
      ]

      allMuscleGroups.forEach(muscleGroup => {
        if (!muscleGroupMap.has(muscleGroup)) {
          muscleGroupMap.set(muscleGroup, {
            muscleGroup,
            exercises: [],
            directWork: 0,
            indirectWork: 0,
            totalSets: 0
          })
        }

        const coverage = muscleGroupMap.get(muscleGroup)!
        coverage.exercises.push(exercise.name)
        coverage.totalSets += workingSets

        if (exercise.muscleGroups.primary.includes(muscleGroup)) {
          coverage.directWork++
        } else if (exercise.muscleGroups.secondary.includes(muscleGroup)) {
          coverage.indirectWork++
        }
      })

      // Special analysis for biceps
      if (exercise.muscleGroups.primary.includes('biceps')) {
        bicepsExercises.push(exercise.name)
        totalBicepsSets += workingSets
      } else if (exercise.muscleGroups.secondary.includes('biceps')) {
        indirectBicepsExercises.push(exercise.name)
      }
    })
  }

  // Biceps-specific analysis
  const hasDirectBicepsWork = bicepsExercises.length > 0
  const hasIndirectBicepsWork = indirectBicepsExercises.length > 0

  // Get dumbbell biceps exercises for suggestions
  const dumbbellBicepsExercises = getExercisesByMuscleGroup('biceps', ['dumbbells'])
    .filter(ex => ex.muscleGroups.primary.includes('biceps'))

  // Determine recommendation
  let recommendation: 'add' | 'sufficient' | 'excessive'
  if (totalBicepsSets === 0 && !hasDirectBicepsWork) {
    recommendation = 'add'
  } else if (totalBicepsSets >= 6) {
    recommendation = 'excessive'
  } else if (totalBicepsSets >= 3 || (hasDirectBicepsWork && totalBicepsSets >= 2)) {
    recommendation = 'sufficient'
  } else {
    recommendation = 'add'
  }

  // Generate overall recommendations
  const overallRecommendations: string[] = []
  
  if (recommendation === 'add') {
    overallRecommendations.push(
      `💪 Add 2-3 sets of direct biceps work. Current: ${totalBicepsSets} working sets`
    )
  } else if (recommendation === 'excessive') {
    overallRecommendations.push(
      `⚠️ You have ${totalBicepsSets} biceps sets - consider reducing to 4-6 sets per week`
    )
  }

  if (hasIndirectBicepsWork && !hasDirectBicepsWork) {
    overallRecommendations.push(
      '💡 You have indirect biceps work from pulling exercises. Consider adding 1-2 direct biceps exercises for optimal growth.'
    )
  }

  return {
    routineId: routine.id,
    routineName: routine.name,
    muscleGroups: Array.from(muscleGroupMap.values()).sort((a, b) => 
      b.totalSets - a.totalSets
    ),
    bicepsAnalysis: {
      hasDirectBicepsWork,
      hasIndirectBicepsWork,
      bicepsExercises,
      indirectBicepsExercises,
      totalBicepsSets,
      recommendation,
      suggestedExercises: dumbbellBicepsExercises
    },
    overallRecommendations
  }
}

/**
 * Analyze multiple routines
 */
export function analyzeRoutines(routines: Routine[]): RoutineAnalysis[] {
  return routines.map(routine => analyzeRoutine(routine))
}

/**
 * Generate a formatted report
 */
export function generateReport(analysis: RoutineAnalysis): string {
  const { routineName, muscleGroups, bicepsAnalysis, overallRecommendations } = analysis

  let report = `\n📊 ROUTINE ANALYSIS: ${routineName}\n`
  report += '='.repeat(50) + '\n\n'

  // Muscle group summary
  report += '🎯 MUSCLE GROUP COVERAGE:\n'
  report += '-'.repeat(50) + '\n'
  muscleGroups.slice(0, 10).forEach(mg => {
    const workType = mg.directWork > 0 ? 'Direct' : 'Indirect'
    report += `  ${mg.muscleGroup}: ${mg.totalSets} sets (${workType})\n`
  })
  report += '\n'

  // Biceps analysis
  report += '💪 BICEPS ANALYSIS:\n'
  report += '-'.repeat(50) + '\n'
  report += `  Direct Biceps Work: ${bicepsAnalysis.hasDirectBicepsWork ? '✅ Yes' : '❌ No'}\n`
  report += `  Indirect Biceps Work: ${bicepsAnalysis.hasIndirectBicepsWork ? '✅ Yes' : '❌ No'}\n`
  report += `  Total Biceps Sets: ${bicepsAnalysis.totalBicepsSets}\n`
  
  if (bicepsAnalysis.bicepsExercises.length > 0) {
    report += `  Direct Exercises: ${bicepsAnalysis.bicepsExercises.join(', ')}\n`
  }
  
  if (bicepsAnalysis.indirectBicepsExercises.length > 0) {
    report += `  Indirect Exercises: ${bicepsAnalysis.indirectBicepsExercises.join(', ')}\n`
  }
  
  report += `  Recommendation: ${bicepsAnalysis.recommendation.toUpperCase()}\n`
  report += '\n'

  // Suggestions
  if (bicepsAnalysis.recommendation === 'add' && bicepsAnalysis.suggestedExercises.length > 0) {
    report += '💡 SUGGESTED DUMBBELL BICEPS EXERCISES:\n'
    report += '-'.repeat(50) + '\n'
    bicepsAnalysis.suggestedExercises.forEach((ex, index) => {
      report += `  ${index + 1}. ${ex.name}\n`
      report += `     Difficulty: ${ex.difficulty}\n`
      report += `     Equipment: ${ex.equipment.join(', ')}\n`
      report += `     ${ex.description}\n\n`
    })
  }

  // Overall recommendations
  if (overallRecommendations.length > 0) {
    report += '📝 RECOMMENDATIONS:\n'
    report += '-'.repeat(50) + '\n'
    overallRecommendations.forEach(rec => {
      report += `  ${rec}\n`
    })
    report += '\n'
  }

  return report
}

/**
 * Get suggested exercise configuration for adding to routine
 */
export function getSuggestedExerciseConfig(
  exerciseId: string,
  sets: number = 3,
  reps: number = 10
): RoutineExercise {
  return {
    exerciseId,
    order: 0, // Will be set when adding to routine
    sets: Array.from({ length: sets }, () => ({
      setType: 'working' as const,
      targetReps: reps,
      targetWeight: undefined,
      restAfter: 60
    })),
    restTime: 60
  }
}

