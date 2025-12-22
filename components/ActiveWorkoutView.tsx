'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Check, X, Plus, Minus, Clock, RotateCcw, Save, RefreshCw, Info } from 'lucide-react'
import { getExerciseById, findSimilarExercises } from '@/lib/exerciseDatabase'
import ExerciseInstructions from '@/components/ExerciseInstructions'
import type { ActiveWorkout, ActiveWorkoutExercise, ActiveWorkoutSet, Routine, WorkoutLog } from '@/types/workout'
import { saveWorkoutLog } from '@/lib/workoutApi'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { format } from 'date-fns'

interface ActiveWorkoutViewProps {
  routine?: Routine
  onComplete?: (logId: string) => void
  onCancel?: () => void
}

export default function ActiveWorkoutView({ routine, onComplete, onCancel }: ActiveWorkoutViewProps) {
  const { user } = useFirestoreStore()
  const [workout, setWorkout] = useState<ActiveWorkout | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [restTimerActive, setRestTimerActive] = useState(false)
  const [replacingExercise, setReplacingExercise] = useState<number | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const restTimerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const workoutStartTimeRef = useRef<Date>(new Date())
  const pausedTimeRef = useRef<number>(0)
  const pauseStartTimeRef = useRef<Date | null>(null)

  // Initialize workout from routine
  useEffect(() => {
    if (routine && !workout) {
      const session = routine.sessions?.[0] // Start with first session
      if (!session || session.exercises.length === 0) {
        // Empty routine - create empty workout
        setWorkout({
          routineId: routine.id,
          routineName: routine.name,
          startTime: new Date(),
          exercises: [],
          currentExerciseIndex: 0,
          currentSetIndex: 0,
        })
        return
      }

      const activeExercises: ActiveWorkoutExercise[] = session.exercises.map((ex, idx) => ({
        exerciseId: ex.exerciseId,
        exerciseName: getExerciseById(ex.exerciseId)?.name || 'Unknown Exercise',
        order: idx,
        sets: ex.sets.map((set, setIdx) => ({
          setNumber: setIdx + 1,
          setType: set.setType,
          targetReps: set.targetReps,
          targetWeight: set.targetWeight,
          targetDuration: set.targetDuration,
          targetDistance: set.targetDistance,
          completed: false,
        })),
        restTime: ex.restTime,
        notes: ex.notes,
      }))

      setWorkout({
        routineId: routine.id,
        routineName: routine.name,
        startTime: new Date(),
        exercises: activeExercises,
        currentExerciseIndex: 0,
        currentSetIndex: 0,
      })
    } else if (!routine && !workout) {
      // Freeform workout (no routine)
      setWorkout({
        routineName: 'Freeform Workout',
        startTime: new Date(),
        exercises: [],
        currentExerciseIndex: 0,
        currentSetIndex: 0,
      })
    }
  }, [routine, workout])

  // Cleanup rest timer on unmount
  useEffect(() => {
    return () => {
      if (restTimerIntervalRef.current) {
        clearInterval(restTimerIntervalRef.current)
      }
    }
  }, [])

  const startRestTimer = (seconds: number) => {
    setRestTimer(seconds)
    setRestTimerActive(true)
    
    if (restTimerIntervalRef.current) {
      clearInterval(restTimerIntervalRef.current)
    }

    restTimerIntervalRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (prev === null || prev <= 1) {
          setRestTimerActive(false)
          if (restTimerIntervalRef.current) {
            clearInterval(restTimerIntervalRef.current)
          }
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopRestTimer = () => {
    setRestTimerActive(false)
    setRestTimer(null)
    if (restTimerIntervalRef.current) {
      clearInterval(restTimerIntervalRef.current)
      restTimerIntervalRef.current = null
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getWorkoutDuration = (): number => {
    if (!workout) return 0
    const now = new Date()
    const elapsed = (now.getTime() - workoutStartTimeRef.current.getTime()) / 1000
    return Math.floor(elapsed - pausedTimeRef.current)
  }

  const handlePause = () => {
    if (isPaused) {
      // Resume
      if (pauseStartTimeRef.current) {
        const pauseDuration = (new Date().getTime() - pauseStartTimeRef.current.getTime()) / 1000
        pausedTimeRef.current += pauseDuration
        pauseStartTimeRef.current = null
      }
      setIsPaused(false)
    } else {
      // Pause
      pauseStartTimeRef.current = new Date()
      setIsPaused(true)
      stopRestTimer()
    }
  }

  const handleSetComplete = (exerciseIndex: number, setIndex: number) => {
    if (!workout) return

    const updatedExercises = [...workout.exercises]
    const exercise = updatedExercises[exerciseIndex]
    const set = exercise.sets[setIndex]
    
    set.completed = !set.completed

    setWorkout({
      ...workout,
      exercises: updatedExercises,
    })

    // Start rest timer if set is completed and there's a rest time
    if (set.completed && exercise.restTime && setIndex < exercise.sets.length - 1) {
      startRestTimer(exercise.restTime)
    }
  }

  const handleSetUpdate = (exerciseIndex: number, setIndex: number, updates: Partial<ActiveWorkoutSet>) => {
    if (!workout) return

    const updatedExercises = [...workout.exercises]
    const exercise = updatedExercises[exerciseIndex]
    const set = exercise.sets[setIndex]
    
    Object.assign(set, updates)

    setWorkout({
      ...workout,
      exercises: updatedExercises,
    })
  }

  const handleAddSet = (exerciseIndex: number) => {
    if (!workout) return

    const updatedExercises = [...workout.exercises]
    const exercise = updatedExercises[exerciseIndex]
    const lastSet = exercise.sets[exercise.sets.length - 1]
    
    const newSet: ActiveWorkoutSet = {
      setNumber: exercise.sets.length + 1,
      setType: lastSet.setType,
      targetReps: lastSet.targetReps,
      targetWeight: lastSet.targetWeight,
      completed: false,
    }

    exercise.sets.push(newSet)
    setWorkout({
      ...workout,
      exercises: updatedExercises,
    })
  }

  const handleCompleteWorkout = async () => {
    if (!workout || !user) return

    const completedExercises = workout.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      order: ex.order,
      sets: ex.sets
        .filter((set) => set.completed)
        .map((set) => ({
          setNumber: set.setNumber,
          setType: set.setType,
          reps: set.completedReps || set.targetReps,
          weight: set.completedWeight || set.targetWeight,
          duration: set.completedDuration || set.targetDuration,
          distance: set.completedDistance || set.targetDistance,
          completed: true,
          rpe: set.rpe,
        })),
      notes: ex.notes,
    }))

    const totalVolume = completedExercises.reduce((total, ex) => {
      return total + ex.sets.reduce((vol, set) => {
        return vol + (set.weight || 0) * (set.reps || 0)
      }, 0)
    }, 0)

    const workoutLog: WorkoutLog = {
      id: `workout_${Date.now()}`,
      userId: user.id,
      routineId: workout.routineId,
      date: new Date(),
      startTime: workoutStartTimeRef.current,
      endTime: new Date(),
      exercises: completedExercises,
      duration: getWorkoutDuration(),
      totalVolume,
      completed: true,
    }

    try {
      await saveWorkoutLog(workoutLog)
      onComplete?.(workoutLog.id)
    } catch (error) {
      console.error('Error saving workout:', error)
      alert('Failed to save workout. Please try again.')
    }
  }

  if (!workout) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Preparing workout...</p>
        </div>
      </div>
    )
  }

  if (workout.exercises.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No exercises in this workout. Add exercises to get started!</p>
          <button
            onClick={handleCompleteWorkout}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Complete Empty Workout
          </button>
        </div>
      </div>
    )
  }

  const currentExercise = workout.exercises[workout.currentExerciseIndex]
  const exercise = getExerciseById(currentExercise.exerciseId)

  return (
    <div className="space-y-4">
      {/* Workout Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{workout.routineName}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {workout.currentExerciseIndex + 1} of {workout.exercises.length} exercises
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Clock className="w-5 h-5" />
                {formatTime(getWorkoutDuration())}
              </div>
              {isPaused && (
                <div className="text-xs text-yellow-600 dark:text-yellow-400">Paused</div>
              )}
            </div>
            <button
              onClick={handlePause}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Rest Timer */}
        {restTimerActive && restTimer !== null && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">Rest Timer</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatTime(restTimer)}
                </span>
                <button
                  onClick={stopRestTimer}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Exercise */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {exercise?.name || currentExercise.exerciseName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {exercise?.muscleGroups.primary.join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {exercise && (
                <>
                  <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Show exercise instructions"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setReplacingExercise(workout.currentExerciseIndex)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Replace with similar exercise"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Replace Exercise Modal */}
          {replacingExercise === workout.currentExerciseIndex && exercise && (
            <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Replace with Similar Exercise
                </h4>
                <button
                  onClick={() => setReplacingExercise(null)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Current: <span className="font-medium">{exercise.name}</span>
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {findSimilarExercises(exercise.id, 6).map((similarExercise) => (
                  <button
                    key={similarExercise.id}
                    onClick={() => {
                      const updatedExercises = [...workout.exercises]
                      updatedExercises[workout.currentExerciseIndex] = {
                        ...updatedExercises[workout.currentExerciseIndex],
                        exerciseId: similarExercise.id,
                        exerciseName: similarExercise.name,
                      }
                      setWorkout({
                        ...workout,
                        exercises: updatedExercises,
                      })
                      setReplacingExercise(null)
                    }}
                    className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {similarExercise.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {[...similarExercise.muscleGroups.primary, ...similarExercise.muscleGroups.secondary].join(', ')}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        similarExercise.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                        similarExercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {similarExercise.difficulty}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {similarExercise.equipment.join(', ')}
                      </span>
                    </div>
                  </button>
                ))}
                {findSimilarExercises(exercise.id, 6).length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    No similar exercises found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Exercise Instructions */}
        {exercise && showInstructions && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <ExerciseInstructions exercise={exercise} compact={true} />
          </div>
        )}

        {/* Sets */}
        <div className="space-y-3">
          {currentExercise.sets.map((set, setIndex) => (
            <div
              key={setIndex}
              className={`p-4 rounded-lg border-2 ${
                set.completed
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Set {set.setNumber}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    set.setType === 'warmup' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    set.setType === 'drop' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                    set.setType === 'failure' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {set.setType}
                  </span>
                </div>
                <button
                  onClick={() => handleSetComplete(workout.currentExerciseIndex, setIndex)}
                  className={`p-2 rounded-lg transition-colors ${
                    set.completed
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>

              {!set.completed && (
                <div className="grid grid-cols-2 gap-3">
                  {set.targetReps !== undefined && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reps
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSetUpdate(workout.currentExerciseIndex, setIndex, {
                            completedReps: Math.max(0, (set.completedReps || set.targetReps || 0) - 1)
                          })}
                          className="p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={set.completedReps ?? set.targetReps ?? ''}
                          onChange={(e) => handleSetUpdate(workout.currentExerciseIndex, setIndex, {
                            completedReps: parseInt(e.target.value) || 0
                          })}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                        />
                        <button
                          onClick={() => handleSetUpdate(workout.currentExerciseIndex, setIndex, {
                            completedReps: (set.completedReps || set.targetReps || 0) + 1
                          })}
                          className="p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Always show weight input for exercises that can use weight */}
                  {exercise && !exercise.equipment.includes('bodyweight') && exercise.equipment.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Weight (kg)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSetUpdate(workout.currentExerciseIndex, setIndex, {
                            completedWeight: Math.max(0, (set.completedWeight ?? set.targetWeight ?? 0) - 2.5)
                          })}
                          className="p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="0"
                          value={set.completedWeight ?? set.targetWeight ?? ''}
                          onChange={(e) => handleSetUpdate(workout.currentExerciseIndex, setIndex, {
                            completedWeight: parseFloat(e.target.value) || 0
                          })}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                        />
                        <button
                          onClick={() => handleSetUpdate(workout.currentExerciseIndex, setIndex, {
                            completedWeight: (set.completedWeight ?? set.targetWeight ?? 0) + 2.5
                          })}
                          className="p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Show bodyweight indicator for bodyweight-only exercises */}
                  {exercise && exercise.equipment.includes('bodyweight') && exercise.equipment.length === 1 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-400">
                        Bodyweight
                      </div>
                    </div>
                  )}
                </div>
              )}

              {set.completed && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {set.completedReps || set.targetReps} reps
                  {(set.completedWeight ?? set.targetWeight ?? 0) > 0 && (
                    <span> × {set.completedWeight ?? set.targetWeight} kg</span>
                  )}
                  {(set.completedWeight ?? set.targetWeight ?? 0) === 0 && exercise && exercise.equipment.includes('bodyweight') && (
                    <span> (Bodyweight)</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => handleAddSet(workout.currentExerciseIndex)}
          className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Set
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (workout.currentExerciseIndex > 0) {
              setWorkout({
                ...workout,
                currentExerciseIndex: workout.currentExerciseIndex - 1,
                currentSetIndex: 0,
              })
            }
          }}
          disabled={workout.currentExerciseIndex === 0}
          className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous Exercise
        </button>
        <button
          onClick={() => {
            if (workout.currentExerciseIndex < workout.exercises.length - 1) {
              setWorkout({
                ...workout,
                currentExerciseIndex: workout.currentExerciseIndex + 1,
                currentSetIndex: 0,
              })
            }
          }}
          disabled={workout.currentExerciseIndex === workout.exercises.length - 1}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Exercise
        </button>
      </div>

      {/* Complete Workout */}
      <button
        onClick={handleCompleteWorkout}
        className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg flex items-center justify-center gap-2"
      >
        <Save className="w-6 h-6" />
        Complete Workout
      </button>
    </div>
  )
}

