/**
 * Automatic Routine Improvement Script
 * Applies analysis improvements to routines automatically
 */

import { EXERCISE_DATABASE } from '../lib/exerciseDatabase'
import type { Routine, RoutineSession, RoutineExercise } from '../types/workout'
import type { Exercise } from '../types/workout'
import { analyzeRoutine } from './analyzeRoutine'
// import { getSuggestedExerciseConfig } from './analyzeRoutine' // Unused

interface ImprovementResult {
  routine: Routine
  changes: Array<{
    type: 'exercise_added' | 'rest_adjusted' | 'sets_adjusted' | 'exercise_removed'
    description: string
    details?: unknown
  }>
  summary: string
}

/**
 * Get exercise by ID from database
 */
function getExerciseById(exerciseId: string): Exercise | undefined {
  return EXERCISE_DATABASE.find(ex => ex.id === exerciseId)
}

/**
 * Check if exercise is compound (targets multiple muscle groups)
 */
function isCompoundExercise(exercise: Exercise): boolean {
  return exercise.muscleGroups.primary.length > 1 || 
         (exercise.muscleGroups.primary.length === 1 && exercise.muscleGroups.secondary.length >= 2)
}

/**
 * Find the best session to add an exercise to based on muscle group targeting
 */
function findBestSessionForMuscleGroup(
  routine: Routine,
  targetMuscleGroup: string
): RoutineSession | null {
  const sessions = routine.sessions || []
  if (sessions.length === 0) return null

  // Score each session based on how many exercises already target this muscle group
  const sessionScores = sessions.map(session => {
    let score = 0
    session.exercises.forEach(routineExercise => {
      const exercise = getExerciseById(routineExercise.exerciseId)
      if (exercise) {
        if (exercise.muscleGroups.primary.includes(targetMuscleGroup)) {
          score += 3
        } else if (exercise.muscleGroups.secondary.includes(targetMuscleGroup)) {
          score += 1
        }
      }
    })
    return { session, score }
  })

  // Prefer sessions that already target this muscle group (for efficiency)
  // But also consider session size (prefer smaller sessions for balance)
  sessionScores.sort((a, b) => {
    if (a.score > 0 && b.score === 0) return -1
    if (a.score === 0 && b.score > 0) return 1
    // If both have exercises targeting this muscle, prefer the one with fewer exercises
    return a.session.exercises.length - b.session.exercises.length
  })

  return sessionScores[0].session
}

/**
 * Add exercise to a session
 */
function addExerciseToSession(
  session: RoutineSession,
  exerciseId: string,
  sets: number = 3,
  reps: number = 10,
  restTime: number = 60
): RoutineExercise {
  const maxOrder = session.exercises.length > 0
    ? Math.max(...session.exercises.map(ex => ex.order))
    : -1

  const newExercise: RoutineExercise = {
    exerciseId,
    order: maxOrder + 1,
    sets: Array.from({ length: sets }, () => ({
      setType: 'working' as const,
      targetReps: reps,
      targetWeight: undefined,
      restAfter: restTime
    })),
    restTime
  }

  session.exercises.push(newExercise)
  return newExercise
}

/**
 * Adjust rest time for compound exercises
 */
function adjustRestTimes(routine: Routine): ImprovementResult['changes'] {
  const changes: ImprovementResult['changes'] = []
  const sessions = routine.sessions || []

  sessions.forEach(session => {
    session.exercises.forEach(routineExercise => {
      const exercise = getExerciseById(routineExercise.exerciseId)
      if (!exercise) return

      const isCompound = exercise.muscleGroups.primary.length > 1 ||
                        (exercise.muscleGroups.primary.length === 1 && 
                         exercise.muscleGroups.secondary.length >= 2)

      if (isCompound && routineExercise.restTime && routineExercise.restTime < 90) {
        const oldRest = routineExercise.restTime
        routineExercise.restTime = 90
        routineExercise.sets.forEach(set => {
          if (set.restAfter && set.restAfter < 90) {
            set.restAfter = 90
          }
        })
        changes.push({
          type: 'rest_adjusted',
          description: `Increased rest time for ${exercise.name} from ${oldRest}s to 90s`,
          details: { exerciseId: exercise.id, oldRest, newRest: 90 }
        })
      }
    })
  })

  return changes
}

/**
 * Add missing exercises based on high-priority improvements
 */
function addMissingExercises(
  routine: Routine,
  improvements: ReturnType<typeof analyzeRoutine>['improvements']
): ImprovementResult['changes'] {
  const changes: ImprovementResult['changes'] = []
  const sessions = routine.sessions || []
  
  if (sessions.length === 0) {
    // Create a default session if none exist
    const defaultSession: RoutineSession = {
      id: `session-${Date.now()}`,
      name: 'Workout Day',
      order: 0,
      exercises: [],
      estimatedDuration: 60
    }
    routine.sessions = [defaultSession]
  }

  // Process high and medium priority improvements that suggest exercises
  const exerciseImprovements = improvements.filter(
    imp => (imp.priority === 'high' || imp.priority === 'medium') &&
           imp.suggestedExercises &&
           imp.suggestedExercises.length > 0
  )

  // Track which muscle groups we've already added exercises for
  const addedMuscleGroups = new Set<string>()

  exerciseImprovements.forEach(improvement => {
    // Extract muscle group from issue (e.g., "Chest is undertrained" -> "chest")
    const muscleGroupMatch = improvement.issue.match(/(\w+) is (undertrained|missing)/i)
    if (!muscleGroupMatch) return

    const muscleGroup = muscleGroupMatch[1].toLowerCase()
    if (addedMuscleGroups.has(muscleGroup)) return // Don't add multiple exercises for same muscle group

    const suggestedExercise = improvement.suggestedExercises![0] // Take first suggestion
    const exercise = getExerciseById(suggestedExercise.id)
    if (!exercise) return

    // Find best session to add this exercise
    const targetSession = findBestSessionForMuscleGroup(routine, muscleGroup) || sessions[0]

    // Determine sets/reps based on exercise type
    let sets = 3
    let reps = 10
    let restTime = 60

    if (exercise.muscleGroups.primary.includes('core')) {
      // Core exercises: 3 sets, 12-15 reps or time-based
      sets = 3
      reps = 12
      restTime = 45
    } else if (isCompoundExercise(exercise)) {
      // Compound exercises: 3-4 sets, 8-10 reps
      sets = 3
      reps = 8
      restTime = 90
    } else {
      // Isolation exercises: 3 sets, 10-12 reps
      sets = 3
      reps = 10
      restTime = 60
    }

    // Add exercise to session
    addExerciseToSession(targetSession, suggestedExercise.id, sets, reps, restTime)
    addedMuscleGroups.add(muscleGroup)

    changes.push({
      type: 'exercise_added',
      description: `Added ${exercise.name} to ${targetSession.name} (${sets} sets × ${reps} reps)`,
      details: {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sessionId: targetSession.id,
        sessionName: targetSession.name,
        sets,
        reps,
        reason: improvement.issue
      }
    })
  })

  return changes
}

/**
 * Improve a routine automatically based on analysis
 */
export function improveRoutine(routine: Routine): ImprovementResult {
  const changes: ImprovementResult['changes'] = []
  
  // Create a deep copy to avoid mutating the original
  const improvedRoutine: Routine = JSON.parse(JSON.stringify(routine))
  
  // Analyze the routine first
  const analysis = analyzeRoutine(improvedRoutine)

  // Apply improvements
  // 1. Adjust rest times for compound exercises
  const restChanges = adjustRestTimes(improvedRoutine)
  changes.push(...restChanges)

  // 2. Add missing exercises
  const exerciseChanges = addMissingExercises(improvedRoutine, analysis.improvements)
  changes.push(...exerciseChanges)

  // 3. Update estimated durations
  improvedRoutine.sessions?.forEach(session => {
    const exerciseCount = session.exercises.length
    const avgTimePerExercise = 5 // minutes (warmup + sets + rest)
    session.estimatedDuration = exerciseCount * avgTimePerExercise
  })

  // 4. Update routine metadata
  improvedRoutine.updatedAt = new Date()

  // Generate summary
  const exerciseAddedCount = changes.filter(c => c.type === 'exercise_added').length
  const restAdjustedCount = changes.filter(c => c.type === 'rest_adjusted').length
  
  let summary = `Applied ${changes.length} improvement(s): `
  const summaryParts: string[] = []
  if (exerciseAddedCount > 0) {
    summaryParts.push(`${exerciseAddedCount} exercise(s) added`)
  }
  if (restAdjustedCount > 0) {
    summaryParts.push(`${restAdjustedCount} rest time(s) adjusted`)
  }
  summary += summaryParts.join(', ')

  return {
    routine: improvedRoutine,
    changes,
    summary
  }
}

/**
 * Get a preview of what changes would be made without actually modifying the routine
 */
export function previewImprovements(routine: Routine): ImprovementResult['changes'] {
  const analysis = analyzeRoutine(routine)
  const tempRoutine = JSON.parse(JSON.stringify(routine))
  
  const restChanges = adjustRestTimes(tempRoutine)
  const exerciseChanges = addMissingExercises(tempRoutine, analysis.improvements)
  
  return [...restChanges, ...exerciseChanges]
}

