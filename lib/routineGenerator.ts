/**
 * Rule-Based Routine Generator
 * Generates personalized workout routines based on fitness science principles
 * No external APIs required - uses algorithms and exercise database
 */

import { EXERCISE_DATABASE } from './exerciseDatabase'
import type { Routine, RoutineSession, RoutineExercise, SetConfiguration } from '@/types/workout'

interface UserProfile {
  weight: number // kg
  height: number // cm
  goal: 'gain_muscle' | 'lose_weight' | 'maintenance' | 'strength' | 'endurance' | 'custom'
  experience: 'beginner' | 'intermediate' | 'advanced'
  daysPerWeek: number
  equipment: string[]
}

// Exercise categorization by muscle groups
const MUSCLE_GROUPS = {
  chest: ['bench-press', 'push-ups', 'dumbbell-flyes'],
  back: ['deadlift', 'pull-ups', 'barbell-row'],
  legs: ['squat', 'leg-press', 'lunges'],
  shoulders: ['overhead-press', 'lateral-raises'],
  arms: ['bicep-curls', 'tricep-dips'],
  core: ['plank', 'crunches'],
  cardio: ['running', 'cycling', 'jumping-jacks'],
}

// Workout split templates based on days per week
const SPLIT_TEMPLATES: Record<number, string[]> = {
  2: ['full-body-1', 'full-body-2'],
  3: ['push', 'pull', 'legs'],
  4: ['upper', 'lower', 'upper', 'lower'],
  5: ['push', 'pull', 'legs', 'upper', 'lower'],
  6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
}

// Normalize equipment names (handle singular/plural variations)
function normalizeEquipmentName(eq: string): string {
  const normalized = eq.toLowerCase().trim()
  // Handle common pluralizations
  const pluralMap: Record<string, string> = {
    'dumbbell': 'dumbbells',
    'dumbbells': 'dumbbells',
    'kettlebell': 'kettlebell',
    'kettlebells': 'kettlebell',
    'resistance_band': 'resistance_bands',
    'resistance_bands': 'resistance_bands',
    'pull-up-bar': 'pull-up-bar',
    'pull-up-bars': 'pull-up-bar',
    'jump-rope': 'jump-rope',
    'jump-ropes': 'jump-rope',
    'ab-wheel': 'ab-wheel',
    'ab-wheels': 'ab-wheel',
    'battle-ropes': 'battle-ropes',
    'battle-rope': 'battle-ropes',
  }
  return pluralMap[normalized] || normalized
}

// Get exercises filtered by equipment
function getExercisesByEquipment(equipment: string[]): typeof EXERCISE_DATABASE {
  if (equipment.length === 0) return EXERCISE_DATABASE
  
  // Normalize user's equipment list
  const normalizedUserEquipment = equipment.map(normalizeEquipmentName)
  
  return EXERCISE_DATABASE.filter((ex) => {
    // Always include bodyweight-only exercises
    if (ex.equipment.length === 0 || (ex.equipment.length === 1 && ex.equipment[0] === 'bodyweight')) {
      return true
    }
    
    // Normalize exercise equipment
    const normalizedExerciseEquipment = ex.equipment.map(normalizeEquipmentName)
    
    // Check if user has ALL required equipment for this exercise
    // OR if the exercise only requires bodyweight (which is always available)
    const requiresBodyweightOnly = normalizedExerciseEquipment.length === 1 && normalizedExerciseEquipment[0] === 'bodyweight'
    if (requiresBodyweightOnly) return true
    
    // Check if user has matching equipment
    const hasBodyweight = normalizedUserEquipment.includes('bodyweight')
    
    // Handle 'bench' as special case - assume available if user has barbell/dumbbells
    const exerciseEquipmentWithoutBench = normalizedExerciseEquipment.filter(eq => eq !== 'bench')
    const needsBench = normalizedExerciseEquipment.includes('bench')
    const hasBenchOrEquivalent = !needsBench || 
      normalizedUserEquipment.includes('bench') ||
      normalizedUserEquipment.includes('barbell') ||
      normalizedUserEquipment.includes('dumbbells')
    
    // Check if user has at least one matching equipment from the exercise's requirements
    // (exercises with multiple equipment types can usually be done with any of them)
    const hasMatchingEquipment = exerciseEquipmentWithoutBench.some((eq) => {
      return normalizedUserEquipment.includes(eq)
    })
    
    // Include if: 
    // 1. Has matching equipment AND (doesn't need bench OR has bench/equivalent)
    // 2. OR exercise needs bodyweight and user has bodyweight
    const shouldInclude = (hasMatchingEquipment && hasBenchOrEquivalent) || 
      (normalizedExerciseEquipment.includes('bodyweight') && hasBodyweight)
    
    if (!shouldInclude) {
    }
    
    return shouldInclude
  })
}

// Get exercises by muscle group
function getExercisesForMuscleGroup(muscleGroup: string, availableExercises: typeof EXERCISE_DATABASE): typeof EXERCISE_DATABASE {
  const targetGroup = muscleGroup.toLowerCase()
  return availableExercises.filter((ex) => {
    const primary = ex.muscleGroups.primary.map((m) => m.toLowerCase())
    const secondary = ex.muscleGroups.secondary.map((m) => m.toLowerCase())
    // Match exact or partial
    return primary.some((m) => m === targetGroup || m.includes(targetGroup) || targetGroup.includes(m)) ||
           secondary.some((m) => m === targetGroup || m.includes(targetGroup) || targetGroup.includes(m))
  })
}

// Map session muscle groups to actual database muscle groups
const MUSCLE_GROUP_MAP: Record<string, string[]> = {
  'chest': ['chest'],
  'back': ['back', 'lats', 'rhomboids', 'traps'],
  'legs': ['legs', 'quadriceps', 'hamstrings', 'glutes', 'calves'],
  'shoulders': ['shoulders', 'deltoids', 'delts'],
  'arms': ['biceps', 'triceps', 'arms'],
  'core': ['core', 'abs', 'abdominals'],
}

// Calculate sets and reps based on goal and experience
function getSetRepScheme(
  goal: string,
  experience: string,
  exerciseType: 'compound' | 'isolation'
): { sets: number; reps: number; restTime: number } {
  const isCompound = exerciseType === 'compound'
  
  if (goal === 'strength') {
    return {
      sets: experience === 'beginner' ? 3 : experience === 'intermediate' ? 4 : 5,
      reps: isCompound ? (experience === 'beginner' ? 5 : 4) : 6,
      restTime: isCompound ? 180 : 120,
    }
  }
  
  if (goal === 'gain_muscle' || goal === 'bulking') {
    return {
      sets: experience === 'beginner' ? 3 : experience === 'intermediate' ? 4 : 5,
      reps: isCompound ? (experience === 'beginner' ? 8 : 6) : (experience === 'beginner' ? 12 : 10),
      restTime: isCompound ? 120 : 90,
    }
  }
  
  if (goal === 'lose_weight' || goal === 'cutting') {
    return {
      sets: experience === 'beginner' ? 3 : 4,
      reps: isCompound ? (experience === 'beginner' ? 12 : 10) : 15,
      restTime: isCompound ? 90 : 60,
    }
  }
  
  if (goal === 'endurance') {
    return {
      sets: 3,
      reps: 15,
      restTime: 45,
    }
  }
  
  // Default (maintenance)
  return {
    sets: experience === 'beginner' ? 3 : 4,
    reps: isCompound ? 8 : 10,
    restTime: isCompound ? 120 : 90,
  }
}

// Determine if exercise is compound
// A compound exercise targets multiple muscle groups (2+ primary groups or 1 primary + multiple secondary)
function isCompoundExercise(exerciseId: string): boolean {
  const exercise = EXERCISE_DATABASE.find(ex => ex.id === exerciseId)
  if (!exercise) return false
  
  // Consider it compound if:
  // 1. Has 2+ primary muscle groups, OR
  // 2. Has 1 primary + 2+ secondary muscle groups, OR
  // 3. Is a major compound movement (deadlift, squat, bench press, etc.)
  const primaryCount = exercise.muscleGroups.primary.length
  const secondaryCount = exercise.muscleGroups.secondary.length
  
  // Major compound movements (always compound)
  const majorCompounds = ['deadlift', 'squat', 'bench-press', 'overhead-press', 'barbell-row', 'pull-ups', 'chin-ups', 'front-squat', 'romanian-deadlift', 'thruster', 'clean-and-press']
  if (majorCompounds.includes(exerciseId)) return true
  
  // Multi-joint movements
  return primaryCount >= 2 || (primaryCount >= 1 && secondaryCount >= 2)
}

// Generate exercises for a session type
function generateSessionExercises(
  sessionType: string,
  availableExercises: typeof EXERCISE_DATABASE,
  goal: string,
  experience: string
): RoutineExercise[] {
  const exercises: RoutineExercise[] = []
  const usedExerciseIds = new Set<string>()
  
  // Define session structure
  const sessionStructure: Record<string, { muscleGroups: string[]; exerciseCount: number }> = {
    'push': { muscleGroups: ['chest', 'shoulders', 'arms'], exerciseCount: experience === 'beginner' ? 4 : experience === 'intermediate' ? 5 : 6 },
    'pull': { muscleGroups: ['back', 'arms'], exerciseCount: experience === 'beginner' ? 4 : experience === 'intermediate' ? 5 : 6 },
    'legs': { muscleGroups: ['legs', 'core'], exerciseCount: experience === 'beginner' ? 4 : experience === 'intermediate' ? 5 : 6 },
    'upper': { muscleGroups: ['chest', 'back', 'shoulders', 'arms'], exerciseCount: experience === 'beginner' ? 5 : experience === 'intermediate' ? 6 : 7 },
    'lower': { muscleGroups: ['legs', 'core'], exerciseCount: experience === 'beginner' ? 4 : experience === 'intermediate' ? 5 : 6 },
    'full-body-1': { muscleGroups: ['chest', 'back', 'legs'], exerciseCount: experience === 'beginner' ? 5 : experience === 'intermediate' ? 6 : 7 },
    'full-body-2': { muscleGroups: ['shoulders', 'arms', 'core'], exerciseCount: experience === 'beginner' ? 4 : experience === 'intermediate' ? 5 : 6 },
  }
  
  const structure = sessionStructure[sessionType] || sessionStructure['full-body-1']
  
  // Prioritize compound movements first
  for (const muscleGroup of structure.muscleGroups) {
    if (exercises.length >= structure.exerciseCount) break
    
    // Get all matching exercises for this muscle group
    let muscleGroupExercises: typeof EXERCISE_DATABASE = []
    
    // Try mapped muscle groups first (more comprehensive)
    if (MUSCLE_GROUP_MAP[muscleGroup]) {
      for (const mappedGroup of MUSCLE_GROUP_MAP[muscleGroup]) {
        const mappedExercises = getExercisesForMuscleGroup(mappedGroup, availableExercises)
        muscleGroupExercises = [...muscleGroupExercises, ...mappedExercises]
      }
    }
    
    // Also try direct match
    const directMatches = getExercisesForMuscleGroup(muscleGroup, availableExercises)
    muscleGroupExercises = [...muscleGroupExercises, ...directMatches]
    
    // Remove duplicates
    muscleGroupExercises = muscleGroupExercises.filter((ex, idx, self) => 
      idx === self.findIndex((e) => e.id === ex.id)
    )
    
    // Filter exercises by difficulty based on experience level
    // Advanced users can do all exercises, intermediate can do intermediate+beginner, beginner can do beginner+some intermediate
    const difficultyFilter: Record<string, string[]> = {
      'beginner': ['beginner', 'intermediate'], // Beginners can do beginner and some intermediate exercises for variety
      'intermediate': ['beginner', 'intermediate'], // Intermediate can do beginner and intermediate
      'advanced': ['beginner', 'intermediate', 'advanced'], // Advanced can do ALL difficulty levels (prioritizes advanced)
    }
    
    const allowedDifficulties = difficultyFilter[experience] || ['beginner', 'intermediate', 'advanced']
    
    // Filter and sort exercises
    muscleGroupExercises = muscleGroupExercises
      .filter((ex) => {
        // Always include if not used
        if (usedExerciseIds.has(ex.id)) return false
        // Filter by difficulty - allow exercises at or below user's level
        return allowedDifficulties.includes(ex.difficulty)
      })
      .sort((a, b) => {
        // First priority: Match user's experience level
        const aMatchesLevel = a.difficulty === experience
        const bMatchesLevel = b.difficulty === experience
        if (aMatchesLevel && !bMatchesLevel) return -1
        if (!aMatchesLevel && bMatchesLevel) return 1
        
        // Second priority: Prefer harder exercises (for advanced/intermediate) or easier (for beginner)
        const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 }
        if (experience === 'advanced' || experience === 'intermediate') {
          // Prefer harder exercises
          if (difficultyOrder[a.difficulty] > difficultyOrder[b.difficulty]) return -1
          if (difficultyOrder[a.difficulty] < difficultyOrder[b.difficulty]) return 1
        } else {
          // Beginner: prefer easier exercises
          if (difficultyOrder[a.difficulty] < difficultyOrder[b.difficulty]) return -1
          if (difficultyOrder[a.difficulty] > difficultyOrder[b.difficulty]) return 1
        }
        
        // Third priority: Prioritize compound movements
        const aIsCompound = isCompoundExercise(a.id)
        const bIsCompound = isCompoundExercise(b.id)
        if (aIsCompound && !bIsCompound) return -1
        if (!aIsCompound && bIsCompound) return 1
        
        return 0
      })
    
    // Take 1-2 exercises per muscle group
    const exercisesToAdd = muscleGroupExercises.slice(0, muscleGroup === 'legs' || muscleGroup === 'chest' || muscleGroup === 'back' ? 2 : 1)
    
    for (const exercise of exercisesToAdd) {
      if (exercises.length >= structure.exerciseCount) break
      if (usedExerciseIds.has(exercise.id)) continue
      
      const isCompound = isCompoundExercise(exercise.id)
      const scheme = getSetRepScheme(goal, experience, isCompound ? 'compound' : 'isolation')
      
      const sets: SetConfiguration[] = []
      
      // Add warmup set for compound movements
      if (isCompound && experience !== 'beginner') {
        sets.push({
          setType: 'warmup',
          targetReps: 10,
          targetWeight: 0, // User determines weight
          restAfter: 60,
        })
      }
      
      // Add working sets
      for (let i = 0; i < scheme.sets; i++) {
        sets.push({
          setType: 'working',
          targetReps: scheme.reps,
          targetWeight: 0, // User determines weight
          restAfter: scheme.restTime,
        })
      }
      
      exercises.push({
        exerciseId: exercise.id,
        order: exercises.length,
        sets,
        restTime: scheme.restTime,
        notes: isCompound ? 'Focus on form' : undefined,
      })
      
      usedExerciseIds.add(exercise.id)
    }
  }
  
  // Fallback: if we don't have enough exercises, add any available exercises
  if (exercises.length < structure.exerciseCount) {
    const remainingExercises = availableExercises
      .filter((ex) => !usedExerciseIds.has(ex.id))
      .slice(0, structure.exerciseCount - exercises.length)
    
    for (const exercise of remainingExercises) {
      const isCompound = isCompoundExercise(exercise.id)
      const scheme = getSetRepScheme(goal, experience, isCompound ? 'compound' : 'isolation')
      
      const sets: SetConfiguration[] = []
      
      if (isCompound && experience !== 'beginner') {
        sets.push({
          setType: 'warmup',
          targetReps: 10,
          targetWeight: 0,
          restAfter: 60,
        })
      }
      
      for (let i = 0; i < scheme.sets; i++) {
        sets.push({
          setType: 'working',
          targetReps: scheme.reps,
          targetWeight: 0,
          restAfter: scheme.restTime,
        })
      }
      
      exercises.push({
        exerciseId: exercise.id,
        order: exercises.length,
        sets,
        restTime: scheme.restTime,
      })
      
      usedExerciseIds.add(exercise.id)
    }
  }
  
  return exercises
}

// Generate session name
function getSessionName(sessionType: string, index: number): string {
  const names: Record<string, string[]> = {
    'push': ['Push Day', 'Chest & Shoulders', 'Upper Push'],
    'pull': ['Pull Day', 'Back & Biceps', 'Upper Pull'],
    'legs': ['Leg Day', 'Lower Body', 'Legs & Glutes'],
    'upper': ['Upper Body', 'Upper Body Day', 'Upper Body Workout'],
    'lower': ['Lower Body', 'Lower Body Day', 'Leg Day'],
    'full-body-1': ['Full Body', 'Full Body Workout', 'Total Body'],
    'full-body-2': ['Full Body', 'Full Body Workout', 'Total Body'],
  }
  
  const options = names[sessionType] || ['Workout']
  return options[index % options.length]
}

// Calculate estimated duration
function calculateDuration(exercises: RoutineExercise[]): number {
  // Base time per exercise: 5 minutes
  // Add time for sets and rest
  let totalMinutes = 0
  
  for (const exercise of exercises) {
    const setsCount = exercise.sets.length
    const restTime = exercise.restTime || 90
    const restMinutes = (setsCount - 1) * (restTime / 60)
    const exerciseTime = 5 + restMinutes + (setsCount * 2) // 2 min per set
    totalMinutes += exerciseTime
  }
  
  return Math.round(totalMinutes)
}

// Main generator function
export function generateRoutine(profile: UserProfile): Routine {
  const { weight, height, goal, experience, daysPerWeek, equipment } = profile
  
  // Calculate BMI for context
  const heightInMeters = height / 100
  const bmi = weight / (heightInMeters * heightInMeters)
  
  // Get available exercises - respect user's equipment selection
  let availableExercises = getExercisesByEquipment(equipment)
  
  if (availableExercises.length === 0) {
    console.warn('⚠️ No exercises available with selected equipment! Including bodyweight exercises as fallback.')
    // Fallback: at least include bodyweight exercises
    availableExercises = getExercisesByEquipment(['bodyweight'])
    if (availableExercises.length === 0) {
      console.error('❌ Even bodyweight exercises not available! Using all exercises as ultimate fallback.')
      // Ultimate fallback: return all exercises
      availableExercises = EXERCISE_DATABASE
    }
  }
  
  // Get split template
  const splitTemplate = SPLIT_TEMPLATES[daysPerWeek] || SPLIT_TEMPLATES[3]
  
  // Generate sessions
  const sessions: RoutineSession[] = splitTemplate.map((sessionType, index) => {
    const exercises = generateSessionExercises(sessionType, availableExercises, goal, experience)
    const duration = calculateDuration(exercises)
    
    return {
      id: `session-${index + 1}`,
      name: getSessionName(sessionType, index),
      order: index + 1,
      exercises,
      estimatedDuration: duration,
    }
  })
  
  // Calculate total duration
  const totalDuration = sessions.reduce((sum, session) => sum + session.estimatedDuration, 0)
  
  // Generate routine name
  const goalNames: Record<string, string> = {
    gain_muscle: 'Muscle Gain',
    lose_weight: 'Weight Loss',
    maintenance: 'Maintenance',
    strength: 'Strength',
    endurance: 'Endurance',
    custom: 'Custom',
  }
  
  const experienceNames: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  }
  
  const routineName = `${experienceNames[experience]} ${goalNames[goal]} ${daysPerWeek}-Day Split`
  
  // Generate description
  const descriptions: Record<string, string> = {
    gain_muscle: `Designed for muscle hypertrophy with ${daysPerWeek} training days per week. Focus on progressive overload and proper form.`,
    lose_weight: `High-intensity routine for fat loss and muscle preservation. ${daysPerWeek} days per week with emphasis on compound movements.`,
    maintenance: `Balanced routine to maintain current fitness level. ${daysPerWeek} days per week with moderate intensity.`,
    strength: `Strength-focused routine emphasizing heavy compound lifts. ${daysPerWeek} days per week for maximum strength gains.`,
    endurance: `Endurance-focused routine with higher reps and shorter rest periods. ${daysPerWeek} days per week.`,
    custom: `Customized routine based on your profile. ${daysPerWeek} days per week.`,
  }
  
  const description = descriptions[goal] || descriptions.custom
  
  // Map goal to routine goal type
  const goalMap: Record<string, 'cutting' | 'bulking' | 'maintenance' | 'strength' | 'endurance' | 'custom'> = {
    gain_muscle: 'bulking',
    lose_weight: 'cutting',
    maintenance: 'maintenance',
    strength: 'strength',
    endurance: 'endurance',
    custom: 'custom',
  }
  
  // Map experience to difficulty
  const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
    beginner: 'easy',
    intermediate: 'medium',
    advanced: 'hard',
  }
  
  // Generate tags
  const tags = [
    `${daysPerWeek}-day`,
    experience,
    goal.replace('_', '-'),
    ...(equipment.length > 0 ? equipment.slice(0, 2) : ['all-equipment']),
  ]
  
  return {
    id: `generated_routine_${Date.now()}`,
    userId: '', // Will be set when saved
    name: routineName,
    description,
    goal: goalMap[goal] || 'custom',
    exercises: [], // Deprecated
    sessions,
    estimatedDuration: totalDuration,
    difficulty: difficultyMap[experience] || 'medium',
    isTemplate: false,
    isPublic: false,
    createdBy: 'generator',
    tags,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

