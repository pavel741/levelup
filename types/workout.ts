/**
 * Workout Planner Types
 * Inspired by JetFit's structure
 */

export interface Exercise {
  id: string
  name: string
  description: string
  category: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'other'
  muscleGroups: {
    primary: string[]
    secondary: string[]
  }
  equipment: string[] // 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | etc.
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions: string[]
  videoUrl?: string // HD video demonstration
  imageUrl?: string
  alternativeExercises?: string[] // Exercise IDs
  tips?: string[]
  commonMistakes?: string[]
}

export interface Routine {
  id: string
  userId: string
  name: string
  description: string
  goal: 'cutting' | 'bulking' | 'maintenance' | 'strength' | 'endurance' | 'custom'
  exercises: RoutineExercise[] // Deprecated - use sessions instead
  sessions: RoutineSession[] // Workout days/sessions
  estimatedDuration: number // minutes
  difficulty: 'easy' | 'medium' | 'hard'
  isTemplate: boolean
  isPublic: boolean
  createdBy: string // userId or 'system'
  tags: string[]
  rating?: number // Community rating
  timesUsed?: number // How many times used
  createdAt: Date
  updatedAt: Date
}

export interface RoutineSession {
  id: string
  name: string // e.g., "Push Day", "Pull Day", "Leg Day", "Upper Body", "Lower Body"
  order: number
  exercises: RoutineExercise[]
  estimatedDuration: number // minutes for this session
}

export interface RoutineExercise {
  exerciseId: string
  order: number
  sets: SetConfiguration[]
  restTime?: number // seconds between sets
  notes?: string
}

export interface SetConfiguration {
  setType: 'warmup' | 'working' | 'drop' | 'failure'
  targetReps?: number
  targetWeight?: number // kg
  targetDuration?: number // seconds (for time-based)
  targetDistance?: number // km (for cardio)
  restAfter?: number // seconds
}

export interface WorkoutLog {
  id: string
  userId: string
  routineId?: string // If started from a routine
  date: Date
  startTime: Date
  endTime?: Date
  exercises: CompletedExercise[]
  duration: number // actual minutes
  totalVolume?: number // Total weight × reps
  rpe?: number // Rate of Perceived Exertion 1-10
  notes?: string
  completed: boolean
}

export interface CompletedExercise {
  exerciseId: string
  order: number
  sets: CompletedSet[]
  notes?: string
  restTimes?: number[] // Actual rest between sets
}

export interface CompletedSet {
  setNumber: number
  setType: 'warmup' | 'working' | 'drop' | 'failure'
  reps?: number
  weight?: number // kg
  duration?: number // seconds
  distance?: number // km
  completed: boolean
  rpe?: number // Perceived exertion for this set
}

// Active workout state (client-side only)
export interface ActiveWorkout {
  routineId?: string
  routineName?: string
  startTime: Date
  exercises: ActiveWorkoutExercise[]
  currentExerciseIndex: number
  currentSetIndex: number
}

export interface ActiveWorkoutExercise {
  exerciseId: string
  exerciseName: string
  order: number
  sets: ActiveWorkoutSet[]
  restTime?: number
  notes?: string
}

export interface ActiveWorkoutSet {
  setNumber: number
  setType: 'warmup' | 'working' | 'drop' | 'failure'
  targetReps?: number
  targetWeight?: number
  targetDuration?: number
  targetDistance?: number
  // Completed data
  completedReps?: number
  completedWeight?: number
  completedDuration?: number
  completedDistance?: number
  completed: boolean
  rpe?: number
}

