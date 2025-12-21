'use client'

import { useState } from 'react'
import { Plus, X, GripVertical, Trash2, Save, ArrowUp, ArrowDown } from 'lucide-react'
import { EXERCISE_DATABASE, getExerciseById } from '@/lib/exerciseDatabase'
import ExerciseLibrary from './ExerciseLibrary'
import type { Routine, RoutineExercise, SetConfiguration, Exercise } from '@/types/workout'

interface RoutineBuilderProps {
  onSave?: (routine: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void
  onCancel?: () => void
  initialRoutine?: Partial<Routine>
}

export default function RoutineBuilder({ onSave, onCancel, initialRoutine }: RoutineBuilderProps) {
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)
  const [routineName, setRoutineName] = useState(initialRoutine?.name || '')
  const [routineDescription, setRoutineDescription] = useState(initialRoutine?.description || '')
  const [routineGoal, setRoutineGoal] = useState<Routine['goal']>(initialRoutine?.goal || 'custom')
  const [routineDifficulty, setRoutineDifficulty] = useState<Routine['difficulty']>(initialRoutine?.difficulty || 'medium')
  const [exercises, setExercises] = useState<RoutineExercise[]>(initialRoutine?.exercises || [])
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null)

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: RoutineExercise = {
      exerciseId: exercise.id,
      order: exercises.length,
      sets: [
        {
          setType: 'working',
          targetReps: 10,
          targetWeight: undefined,
          restAfter: 60
        }
      ],
      restTime: 60,
      notes: ''
    }
    setExercises([...exercises, newExercise])
    setShowExerciseLibrary(false)
  }

  const handleRemoveExercise = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index).map((ex, i) => ({ ...ex, order: i }))
    setExercises(updated)
  }

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === exercises.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const updated = [...exercises]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    
    // Update order
    updated.forEach((ex, i) => {
      ex.order = i
    })
    
    setExercises(updated)
  }

  const handleAddSet = (exerciseIndex: number) => {
    const updated = [...exercises]
    const exercise = updated[exerciseIndex]
    const newSet: SetConfiguration = {
      setType: 'working',
      targetReps: exercise.sets[exercise.sets.length - 1]?.targetReps || 10,
      targetWeight: exercise.sets[exercise.sets.length - 1]?.targetWeight,
      restAfter: 60
    }
    exercise.sets.push(newSet)
    setExercises(updated)
  }

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises]
    updated[exerciseIndex].sets.splice(setIndex, 1)
    setExercises(updated)
  }

  const handleUpdateSet = (exerciseIndex: number, setIndex: number, updates: Partial<SetConfiguration>) => {
    const updated = [...exercises]
    updated[exerciseIndex].sets[setIndex] = {
      ...updated[exerciseIndex].sets[setIndex],
      ...updates
    }
    setExercises(updated)
  }

  const handleUpdateExercise = (index: number, updates: Partial<RoutineExercise>) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], ...updates }
    setExercises(updated)
  }

  const calculateEstimatedDuration = () => {
    // Rough estimate: 2 minutes per set + rest time
    let totalMinutes = 0
    exercises.forEach(ex => {
      ex.sets.forEach(set => {
        totalMinutes += 2 // Exercise time
        totalMinutes += (set.restAfter || ex.restTime || 60) / 60 // Rest time
      })
    })
    return Math.round(totalMinutes)
  }

  const handleSave = () => {
    if (!routineName.trim()) {
      alert('Please enter a routine name')
      return
    }

    if (exercises.length === 0) {
      alert('Please add at least one exercise to your routine')
      return
    }

    const routine: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: routineName,
      description: routineDescription,
      goal: routineGoal,
      exercises: exercises,
      estimatedDuration: calculateEstimatedDuration(),
      difficulty: routineDifficulty,
      isTemplate: false,
      isPublic: false,
      createdBy: 'user', // Will be set by backend
      tags: []
    }

    onSave?.(routine)
  }

  return (
    <div className="space-y-6">
      {/* Routine Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Routine Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Routine Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="e.g., Push Day, Full Body, Upper Body"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={routineDescription}
              onChange={(e) => setRoutineDescription(e.target.value)}
              placeholder="Describe your routine..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Goal
              </label>
              <select
                value={routineGoal}
                onChange={(e) => setRoutineGoal(e.target.value as Routine['goal'])}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cutting">Cutting</option>
                <option value="bulking">Bulking</option>
                <option value="maintenance">Maintenance</option>
                <option value="strength">Strength</option>
                <option value="endurance">Endurance</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={routineDifficulty}
                onChange={(e) => setRoutineDifficulty(e.target.value as Routine['difficulty'])}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Estimated Duration: <span className="font-semibold">{calculateEstimatedDuration()} minutes</span>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Exercises ({exercises.length})
          </h2>
          <button
            onClick={() => setShowExerciseLibrary(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Exercise
          </button>
        </div>

        {exercises.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Plus className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No exercises added yet. Click "Add Exercise" to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((routineExercise, exerciseIndex) => {
              const exercise = getExerciseById(routineExercise.exerciseId)
              if (!exercise) return null

              return (
                <div
                  key={exerciseIndex}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
                >
                  {/* Exercise Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex flex-col gap-1 mt-1">
                        <button
                          onClick={() => handleMoveExercise(exerciseIndex, 'up')}
                          disabled={exerciseIndex === 0}
                          className={`p-1 ${exerciseIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} rounded`}
                        >
                          <ArrowUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleMoveExercise(exerciseIndex, 'down')}
                          disabled={exerciseIndex === exercises.length - 1}
                          className={`p-1 ${exerciseIndex === exercises.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} rounded`}
                        >
                          <ArrowDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {exerciseIndex + 1}. {exercise.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {exercise.muscleGroups.primary.join(', ')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(exerciseIndex)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Sets Configuration */}
                  <div className="space-y-2">
                    {routineExercise.sets.map((set, setIndex) => (
                      <div
                        key={setIndex}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8">
                          Set {setIndex + 1}
                        </span>
                        
                        <select
                          value={set.setType}
                          onChange={(e) => handleUpdateSet(exerciseIndex, setIndex, { setType: e.target.value as SetConfiguration['setType'] })}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="warmup">Warm-up</option>
                          <option value="working">Working</option>
                          <option value="drop">Drop Set</option>
                          <option value="failure">To Failure</option>
                        </select>

                        <input
                          type="number"
                          placeholder="Reps"
                          value={set.targetReps || ''}
                          onChange={(e) => handleUpdateSet(exerciseIndex, setIndex, { targetReps: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          min="1"
                        />

                        <input
                          type="number"
                          placeholder="Weight (kg)"
                          value={set.targetWeight || ''}
                          onChange={(e) => handleUpdateSet(exerciseIndex, setIndex, { targetWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          min="0"
                          step="0.5"
                        />

                        <input
                          type="number"
                          placeholder="Rest (sec)"
                          value={set.restAfter || routineExercise.restTime || ''}
                          onChange={(e) => {
                            const restTime = e.target.value ? parseInt(e.target.value) : undefined
                            if (setIndex === 0) {
                              handleUpdateExercise(exerciseIndex, { restTime })
                            }
                            handleUpdateSet(exerciseIndex, setIndex, { restAfter: restTime })
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          min="0"
                        />

                        {routineExercise.sets.length > 1 && (
                          <button
                            onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => handleAddSet(exerciseIndex)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Set
                    </button>
                  </div>

                  {/* Exercise Notes */}
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={routineExercise.notes || ''}
                      onChange={(e) => handleUpdateExercise(exerciseIndex, { notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!routineName.trim() || exercises.length === 0}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          Save Routine
        </button>
      </div>

      {/* Exercise Library Modal */}
      {showExerciseLibrary && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-6xl w-full shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Exercise</h2>
              <button
                onClick={() => setShowExerciseLibrary(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ExerciseLibrary onSelectExercise={handleAddExercise} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

