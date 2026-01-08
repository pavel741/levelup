/**
 * Comprehensive Routine Analysis Script
 * Analyzes workout routines and provides detailed improvement suggestions
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
  totalVolume: number // Estimated volume (sets × reps)
  frequency: number // How many sessions target this muscle group
}

interface ExerciseAnalysis {
  exerciseId: string
  exerciseName: string
  sets: number
  averageReps: number
  restTime: number
  isCompound: boolean
  isIsolation: boolean
  muscleGroups: string[]
}

interface RoutineAnalysis {
  routineId: string
  routineName: string
  muscleGroups: MuscleGroupCoverage[]
  exerciseAnalysis: ExerciseAnalysis[]
  improvements: {
    category: string
    priority: 'high' | 'medium' | 'low'
    issue: string
    recommendation: string
    suggestedExercises?: Array<{
      id: string
      name: string
      description: string
      difficulty: string
      equipment: string[]
      reason: string
    }>
  }[]
  overallScore: number // 0-100
  strengths: string[]
  weaknesses: string[]
  overallRecommendations: string[]
}

// Major muscle groups that should be trained
const MAJOR_MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'legs', 'glutes', 'hamstrings', 
  'quadriceps', 'calves', 'biceps', 'triceps', 'core'
]

// Minimum recommended sets per muscle group per week
const MIN_SETS_PER_WEEK: Record<string, number> = {
  chest: 10,
  back: 12,
  shoulders: 10,
  legs: 12,
  glutes: 8,
  hamstrings: 8,
  quadriceps: 10,
  calves: 6,
  biceps: 6,
  triceps: 6,
  core: 8
}

// Maximum recommended sets per muscle group per week (to avoid overtraining)
const MAX_SETS_PER_WEEK: Record<string, number> = {
  chest: 20,
  back: 24,
  shoulders: 18,
  legs: 24,
  glutes: 16,
  hamstrings: 16,
  quadriceps: 20,
  calves: 12,
  biceps: 14,
  triceps: 14,
  core: 16
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
function getExercisesByMuscleGroup(
  muscleGroup: string, 
  equipment?: string[],
  excludeIds?: string[]
): Exercise[] {
  return EXERCISE_DATABASE.filter(ex => {
    if (excludeIds && excludeIds.includes(ex.id)) return false
    
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
 * Check if exercise is compound (targets multiple muscle groups)
 */
function isCompoundExercise(exercise: Exercise): boolean {
  return exercise.muscleGroups.primary.length > 1 || 
         (exercise.muscleGroups.primary.length === 1 && exercise.muscleGroups.secondary.length >= 2)
}

/**
 * Get available equipment from routine
 */
function getAvailableEquipment(routine: Routine): string[] {
  const equipmentSet = new Set<string>()
  const sessions = routine.sessions || []
  
  sessions.forEach(session => {
    session.exercises.forEach(routineExercise => {
      const exercise = getExerciseById(routineExercise.exerciseId)
      if (exercise) {
        exercise.equipment.forEach(eq => equipmentSet.add(eq))
      }
    })
  })
  
  return Array.from(equipmentSet)
}

/**
 * Analyze a single routine comprehensively
 */
export function analyzeRoutine(routine: Routine): RoutineAnalysis {
  const muscleGroupMap = new Map<string, MuscleGroupCoverage>()
  const exerciseAnalysis: ExerciseAnalysis[] = []
  const sessionMuscleGroups = new Map<string, Set<string>>() // Track which muscles are hit per session
  
  const sessions = routine.sessions || []
  const availableEquipment = getAvailableEquipment(routine)
  
  // Process all sessions
  sessions.forEach((session: RoutineSession, sessionIndex: number) => {
    const sessionMuscles = new Set<string>()
    
    session.exercises.forEach((routineExercise: RoutineExercise) => {
      const exercise = getExerciseById(routineExercise.exerciseId)
      if (!exercise) return

      const workingSets = routineExercise.sets.filter(
        set => set.setType === 'working'
      ).length
      
      const averageReps = routineExercise.sets
        .filter(set => set.setType === 'working')
        .reduce((sum, set) => sum + (set.targetReps || 10), 0) / workingSets || 10
      
      const restTime = routineExercise.restTime || 60

      // Analyze muscle groups
      const allMuscleGroups = [
        ...exercise.muscleGroups.primary,
        ...exercise.muscleGroups.secondary
      ]

      allMuscleGroups.forEach(muscleGroup => {
        sessionMuscles.add(muscleGroup)
        
        if (!muscleGroupMap.has(muscleGroup)) {
          muscleGroupMap.set(muscleGroup, {
            muscleGroup,
            exercises: [],
            directWork: 0,
            indirectWork: 0,
            totalSets: 0,
            totalVolume: 0,
            frequency: 0
          })
        }

        const coverage = muscleGroupMap.get(muscleGroup)!
        if (!coverage.exercises.includes(exercise.name)) {
          coverage.exercises.push(exercise.name)
        }
        coverage.totalSets += workingSets
        coverage.totalVolume += workingSets * averageReps

        if (exercise.muscleGroups.primary.includes(muscleGroup)) {
          coverage.directWork++
        } else if (exercise.muscleGroups.secondary.includes(muscleGroup)) {
          coverage.indirectWork++
        }
      })
      
      // Track frequency
      exercise.muscleGroups.primary.forEach(mg => {
        const coverage = muscleGroupMap.get(mg)
        if (coverage) {
          if (!sessionMuscleGroups.has(`${sessionIndex}-${mg}`)) {
            sessionMuscleGroups.set(`${sessionIndex}-${mg}`, new Set())
            coverage.frequency++
          }
        }
      })

      // Exercise analysis
      exerciseAnalysis.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: workingSets,
        averageReps,
        restTime,
        isCompound: isCompoundExercise(exercise),
        isIsolation: !isCompoundExercise(exercise),
        muscleGroups: [...exercise.muscleGroups.primary, ...exercise.muscleGroups.secondary]
      })
    })
  })

  // Calculate overall score and identify improvements
  const improvements: RoutineAnalysis['improvements'] = []
  const strengths: string[] = []
  const weaknesses: string[] = []
  let score = 100

  // 1. Check muscle group balance
  const underTrained: string[] = []
  const overTrained: string[] = []
  const missingDirectWork: string[] = []

  MAJOR_MUSCLE_GROUPS.forEach(muscleGroup => {
    const coverage = muscleGroupMap.get(muscleGroup)
    const totalSets = coverage?.totalSets || 0
    const minSets = MIN_SETS_PER_WEEK[muscleGroup] || 6
    const maxSets = MAX_SETS_PER_WEEK[muscleGroup] || 20
    const hasDirectWork = (coverage?.directWork ?? 0) > 0

    if (totalSets === 0) {
      underTrained.push(muscleGroup)
      score -= 8
    } else if (totalSets < minSets) {
      underTrained.push(muscleGroup)
      score -= 5
    } else if (totalSets > maxSets) {
      overTrained.push(muscleGroup)
      score -= 3
    } else {
      strengths.push(`${muscleGroup} volume is well-balanced`)
    }

    if (!hasDirectWork && totalSets > 0) {
      missingDirectWork.push(muscleGroup)
      score -= 2
    }
  })

  // Add improvements for muscle group issues
  if (underTrained.length > 0) {
    underTrained.forEach(mg => {
      const coverage = muscleGroupMap.get(mg)
      const minSets = MIN_SETS_PER_WEEK[mg] || 6
      const currentSets = coverage?.totalSets || 0
      const neededSets = minSets - currentSets
      
      const suggestedExercises = getExercisesByMuscleGroup(mg, availableEquipment)
        .filter(ex => ex.muscleGroups.primary.includes(mg))
        .slice(0, 3)
        .map(ex => ({
          id: ex.id,
          name: ex.name,
          description: ex.description,
          difficulty: ex.difficulty,
          equipment: ex.equipment,
          reason: `Targets ${mg} as primary muscle group`
        }))

      improvements.push({
        category: 'Muscle Group Balance',
        priority: neededSets >= 6 ? 'high' : 'medium',
        issue: `${mg.charAt(0).toUpperCase() + mg.slice(1)} is undertrained (${currentSets} sets/week, need ${minSets}+)`,
        recommendation: `Add ${neededSets} more sets targeting ${mg}. Consider adding 1-2 exercises that directly target ${mg}.`,
        suggestedExercises: suggestedExercises.length > 0 ? suggestedExercises : undefined
      })
    })
  }

  if (overTrained.length > 0) {
    overTrained.forEach(mg => {
      const coverage = muscleGroupMap.get(mg)
      const maxSets = MAX_SETS_PER_WEEK[mg] || 20
      const currentSets = coverage?.totalSets || 0
      
      improvements.push({
        category: 'Volume Management',
        priority: 'medium',
        issue: `${mg.charAt(0).toUpperCase() + mg.slice(1)} may be overtrained (${currentSets} sets/week, max recommended ${maxSets})`,
        recommendation: `Consider reducing volume for ${mg} to prevent overtraining and allow proper recovery.`
      })
    })
  }

  if (missingDirectWork.length > 0) {
    missingDirectWork.forEach(mg => {
      improvements.push({
        category: 'Exercise Selection',
        priority: 'low',
        issue: `${mg.charAt(0).toUpperCase() + mg.slice(1)} only receives indirect work`,
        recommendation: `Add at least one exercise that directly targets ${mg} for optimal development.`
      })
    })
  }

  // 2. Check compound vs isolation balance
  const compoundCount = exerciseAnalysis.filter(ex => ex.isCompound).length
  const isolationCount = exerciseAnalysis.filter(ex => ex.isIsolation).length
  const compoundRatio = compoundCount / (compoundCount + isolationCount)

  if (compoundRatio < 0.5) {
    score -= 10
    improvements.push({
      category: 'Exercise Selection',
      priority: 'high',
      issue: `Low compound exercise ratio (${Math.round(compoundRatio * 100)}%)`,
      recommendation: 'Increase compound movements. Compound exercises are more efficient and build functional strength. Aim for at least 50% compound exercises.'
    })
    weaknesses.push('Too many isolation exercises')
  } else {
    strengths.push('Good compound exercise ratio')
  }

  // 3. Check core work
  const coreCoverage = muscleGroupMap.get('core')
  const coreSets = coreCoverage?.totalSets || 0
  
  if (coreSets < 6) {
    score -= 5
    const suggestedCoreExercises = getExercisesByMuscleGroup('core', availableEquipment)
      .filter(ex => ex.muscleGroups.primary.includes('core'))
      .slice(0, 3)
      .map(ex => ({
        id: ex.id,
        name: ex.name,
        description: ex.description,
        difficulty: ex.difficulty,
        equipment: ex.equipment,
        reason: 'Essential for stability and overall strength'
      }))

    improvements.push({
      category: 'Core Training',
      priority: 'medium',
      issue: `Insufficient core work (${coreSets} sets/week, recommend 8+)`,
      recommendation: 'Add dedicated core exercises. A strong core improves performance in all lifts and prevents injury.',
      suggestedExercises: suggestedCoreExercises.length > 0 ? suggestedCoreExercises : undefined
    })
  } else {
    strengths.push('Adequate core training')
  }

  // 4. Check exercise variety
  const uniqueExercises = new Set(exerciseAnalysis.map(ex => ex.exerciseId))
  const varietyScore = Math.min(100, (uniqueExercises.size / sessions.length) * 20)
  
  if (varietyScore < 60) {
    score -= 5
    improvements.push({
      category: 'Exercise Variety',
      priority: 'medium',
      issue: `Low exercise variety (${uniqueExercises.size} unique exercises across ${sessions.length} sessions)`,
      recommendation: 'Add more exercise variety to prevent plateaus and ensure balanced development. Consider rotating exercises every 4-6 weeks.'
    })
    weaknesses.push('Limited exercise variety')
  } else {
    strengths.push('Good exercise variety')
  }

  // 5. Check rest periods
  // const averageRestTime = exerciseAnalysis.reduce((sum, ex) => sum + ex.restTime, 0) / exerciseAnalysis.length // Unused
  const shortRestExercises = exerciseAnalysis.filter(ex => ex.isCompound && ex.restTime < 90)
  
  if (shortRestExercises.length > 0) {
    score -= 3
    improvements.push({
      category: 'Recovery',
      priority: 'low',
      issue: `Some compound exercises have short rest periods (<90s)`,
      recommendation: 'Compound exercises typically need 90-180s rest for optimal strength gains. Consider increasing rest time for heavy compound movements.'
    })
  }

  // 6. Check volume distribution across sessions
  if (sessions.length > 0) {
    const setsPerSession = sessions.map(s => 
      s.exercises.reduce((sum, ex) => 
        sum + ex.sets.filter(set => set.setType === 'working').length, 0
      )
    )
    const avgSetsPerSession = setsPerSession.reduce((a, b) => a + b, 0) / setsPerSession.length
    const maxSets = Math.max(...setsPerSession)
    const minSets = Math.min(...setsPerSession)
    const volumeVariance = maxSets - minSets

    if (volumeVariance > avgSetsPerSession * 0.5) {
      score -= 5
      improvements.push({
        category: 'Volume Distribution',
        priority: 'medium',
        issue: `Uneven volume distribution across sessions (${minSets}-${maxSets} sets per session)`,
        recommendation: 'Balance volume across sessions for consistent training stimulus and better recovery.'
      })
      weaknesses.push('Uneven session volume')
    } else {
      strengths.push('Well-distributed volume')
    }
  }

  // 7. Check for missing essential movements
  // Check for movement patterns (not specific exercises)
  const hasSquat = exerciseAnalysis.some(ex => {
    const exercise = getExerciseById(ex.exerciseId)
    if (!exercise) return false
    return exercise.id.includes('squat') || 
           exercise.name.toLowerCase().includes('squat') ||
           (exercise.muscleGroups.primary.includes('quadriceps') && 
            exercise.muscleGroups.primary.includes('glutes'))
  })

  const hasDeadlift = exerciseAnalysis.some(ex => {
    const exercise = getExerciseById(ex.exerciseId)
    if (!exercise) return false
    return exercise.id.includes('deadlift') || 
           exercise.name.toLowerCase().includes('deadlift') ||
           (exercise.muscleGroups.primary.includes('back') && 
            exercise.muscleGroups.primary.includes('hamstrings'))
  })

  const hasBenchPress = exerciseAnalysis.some(ex => {
    const exercise = getExerciseById(ex.exerciseId)
    if (!exercise) return false
    return exercise.id.includes('bench') || 
           exercise.name.toLowerCase().includes('bench') ||
           exercise.muscleGroups.primary.includes('chest')
  })

  const hasOverheadPress = exerciseAnalysis.some(ex => {
    const exercise = getExerciseById(ex.exerciseId)
    if (!exercise) return false
    return exercise.id.includes('overhead') || 
           exercise.name.toLowerCase().includes('overhead') ||
           exercise.name.toLowerCase().includes('shoulder press') ||
           (exercise.muscleGroups.primary.includes('shoulders') && 
            exercise.id.includes('press'))
  })

  // Check for pull movements (pull-ups OR rows - both fulfill the pull pattern)
  const hasPullMovement = exerciseAnalysis.some(ex => {
    const exercise = getExerciseById(ex.exerciseId)
    if (!exercise) return false
    return exercise.id.includes('pull-up') || 
           exercise.id.includes('chin-up') ||
           exercise.id.includes('row') ||
           exercise.name.toLowerCase().includes('row') ||
           exercise.name.toLowerCase().includes('pull') ||
           (exercise.muscleGroups.primary.includes('back') && 
            (exercise.id.includes('row') || exercise.id.includes('pull')))
  })

  const missingMovements: string[] = []
  if (!hasSquat) missingMovements.push('squat')
  if (!hasDeadlift) missingMovements.push('deadlift')
  if (!hasBenchPress) missingMovements.push('bench press')
  if (!hasOverheadPress) missingMovements.push('overhead press')
  if (!hasPullMovement) missingMovements.push('pull movement (rows or pull-ups)')

  if (missingMovements.length > 0) {
    score -= 8
    improvements.push({
      category: 'Essential Movements',
      priority: 'high',
      issue: `Missing essential movement patterns: ${missingMovements.join(', ')}`,
      recommendation: 'Include fundamental movement patterns (squat, hinge, push, pull) for comprehensive strength development.'
    })
    weaknesses.push('Missing essential movement patterns')
  } else {
    strengths.push('Includes essential movement patterns')
  }

  // Generate overall recommendations
  const overallRecommendations: string[] = []
  
  if (score >= 85) {
    overallRecommendations.push('✅ Your routine is well-structured! Continue progressive overload.')
  } else if (score >= 70) {
    overallRecommendations.push('💪 Good routine with room for improvement. Focus on the high-priority suggestions.')
  } else {
    overallRecommendations.push('⚠️ Routine needs significant improvements. Address high-priority issues first.')
  }

  // Sort improvements by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  improvements.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score))

  return {
    routineId: routine.id,
    routineName: routine.name,
    muscleGroups: Array.from(muscleGroupMap.values()).sort((a, b) => 
      b.totalSets - a.totalSets
    ),
    exerciseAnalysis,
    improvements,
    overallScore: Math.round(score),
    strengths: strengths.length > 0 ? strengths : ['Routine structure is solid'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['No major weaknesses identified'],
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
  const { routineName, muscleGroups, improvements, overallScore, strengths, weaknesses, overallRecommendations } = analysis

  let report = `\n📊 COMPREHENSIVE ROUTINE ANALYSIS: ${routineName}\n`
  report += '='.repeat(60) + '\n\n'

  // Overall Score
  report += `🎯 OVERALL SCORE: ${overallScore}/100\n`
  report += '-'.repeat(60) + '\n\n'

  // Strengths
  report += '✅ STRENGTHS:\n'
  report += '-'.repeat(60) + '\n'
  strengths.forEach(strength => {
    report += `  • ${strength}\n`
  })
  report += '\n'

  // Weaknesses
  if (weaknesses.length > 0) {
    report += '⚠️ WEAKNESSES:\n'
    report += '-'.repeat(60) + '\n'
    weaknesses.forEach(weakness => {
      report += `  • ${weakness}\n`
    })
    report += '\n'
  }

  // Muscle group summary
  report += '🎯 MUSCLE GROUP COVERAGE:\n'
  report += '-'.repeat(60) + '\n'
  muscleGroups.slice(0, 15).forEach(mg => {
    const workType = mg.directWork > 0 ? 'Direct' : 'Indirect'
    const status = mg.totalSets >= (MIN_SETS_PER_WEEK[mg.muscleGroup] || 6) ? '✅' : '⚠️'
    report += `  ${status} ${mg.muscleGroup}: ${mg.totalSets} sets (${workType}, ${mg.frequency}x/week)\n`
  })
  report += '\n'

  // Improvements
  if (improvements.length > 0) {
    report += '💡 IMPROVEMENT SUGGESTIONS:\n'
    report += '='.repeat(60) + '\n\n'
    
    const byCategory = new Map<string, typeof improvements>()
    improvements.forEach(imp => {
      if (!byCategory.has(imp.category)) {
        byCategory.set(imp.category, [])
      }
      byCategory.get(imp.category)!.push(imp)
    })

    byCategory.forEach((categoryImprovements, category) => {
      report += `📋 ${category.toUpperCase()}:\n`
      report += '-'.repeat(60) + '\n'
      
      categoryImprovements.forEach((imp) => {
        const priorityEmoji = imp.priority === 'high' ? '🔴' : imp.priority === 'medium' ? '🟡' : '🟢'
        report += `\n${priorityEmoji} ${imp.priority.toUpperCase()} PRIORITY\n`
        report += `   Issue: ${imp.issue}\n`
        report += `   Recommendation: ${imp.recommendation}\n`
        
        if (imp.suggestedExercises && imp.suggestedExercises.length > 0) {
          report += `   Suggested Exercises:\n`
          imp.suggestedExercises.forEach((ex, exIdx) => {
            report += `     ${exIdx + 1}. ${ex.name} (${ex.difficulty})\n`
            report += `        ${ex.reason}\n`
          })
        }
      })
      report += '\n'
    })
  }

  // Overall recommendations
  if (overallRecommendations.length > 0) {
    report += '📝 OVERALL RECOMMENDATIONS:\n'
    report += '-'.repeat(60) + '\n'
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
