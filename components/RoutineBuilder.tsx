'use client'

import { useState, useEffect } from 'react'
import { Plus, X, GripVertical, Trash2, Save, ArrowUp, ArrowDown } from 'lucide-react'
import { EXERCISE_DATABASE, getExerciseById } from '@/lib/exerciseDatabase'
import ExerciseLibrary from './ExerciseLibrary'
import type { Routine, RoutineExercise, RoutineSession, SetConfiguration, Exercise } from '@/types/workout'

interface RoutineBuilderProps {
  onSave?: (routine: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void
  onCancel?: () => void
  initialRoutine?: Partial<Routine>
}

export default function RoutineBuilder({ onSave, onCancel, initialRoutine }: RoutineBuilderProps) {
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [routineName, setRoutineName] = useState(initialRoutine?.name || '')
  const [routineDescription, setRoutineDescription] = useState(initialRoutine?.description || '')
  const [routineGoal, setRoutineGoal] = useState<Routine['goal']>(initialRoutine?.goal || 'custom')
  const [routineDifficulty, setRoutineDifficulty] = useState<Routine['difficulty']>(initialRoutine?.difficulty || 'medium')
  
  // Initialize sessions from initialRoutine, or create a default session
  const initializeSessions = (): RoutineSession[] => {
    if (initialRoutine?.sessions && initialRoutine.sessions.length > 0) {
      return initialRoutine.sessions
    }
    // If no sessions but has exercises, create a default session
    if (initialRoutine?.exercises && initialRoutine.exercises.length > 0) {
      return [{
        id: 'default-session',
        name: 'Workout Day',
        order: 0,
        exercises: initialRoutine.exercises.map((ex, idx) => ({ ...ex, order: idx })),
        estimatedDuration: 0
      }]
    }
    // Default: create one empty session
    return [{
      id: `session-${Date.now()}`,
      name: 'Day 1',
      order: 0,
      exercises: [],
      estimatedDuration: 0
    }]
  }
  
  const [sessions, setSessions] = useState<RoutineSession[]>(initializeSessions)
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<{ sessionId: string; exerciseIndex: number } | null>(null)

  // Load initial routine data when it changes
  useEffect(() => {
    if (initialRoutine) {
      if (initialRoutine.name) setRoutineName(initialRoutine.name)
      if (initialRoutine.description) setRoutineDescription(initialRoutine.description)
      if (initialRoutine.goal) setRoutineGoal(initialRoutine.goal)
      if (initialRoutine.difficulty) setRoutineDifficulty(initialRoutine.difficulty)
      if (initialRoutine.sessions && initialRoutine.sessions.length > 0) {
        setSessions(initialRoutine.sessions)
      } else if (initialRoutine.exercises && initialRoutine.exercises.length > 0) {
        setSessions([{
          id: 'default-session',
          name: 'Workout Day',
          order: 0,
          exercises: initialRoutine.exercises.map((ex, idx) => ({ ...ex, order: idx })),
          estimatedDuration: 0
        }])
      }
    }
  }, [initialRoutine])

  const handleAddSession = () => {
    const newSession: RoutineSession = {
      id: `session-${Date.now()}`,
      name: `Day ${sessions.length + 1}`,
      order: sessions.length,
      exercises: [],
      estimatedDuration: 0
    }
    setSessions([...sessions, newSession])
  }

  const handleRemoveSession = (sessionId: string) => {
    if (sessions.length === 1) {
      alert('You must have at least one workout day')
      return
    }
    setSessions(sessions.filter(s => s.id !== sessionId))
  }

  const handleUpdateSessionName = (sessionId: string, name: string) => {
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, name } : s))
  }

  const handleAddExercise = (exercise: Exercise, sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return

    const newExercise: RoutineExercise = {
      exerciseId: exercise.id,
      order: session.exercises.length,
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

    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { ...s, exercises: [...s.exercises, newExercise] }
        : s
    ))
    setShowExerciseLibrary(false)
    setSelectedSessionId(null)
  }

  const handleRemoveExercise = (sessionId: string, exerciseIndex: number) => {
    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { 
            ...s, 
            exercises: s.exercises.filter((_, i) => i !== exerciseIndex).map((ex, i) => ({ ...ex, order: i }))
          }
        : s
    ))
  }

  const handleMoveExercise = (sessionId: string, exerciseIndex: number, direction: 'up' | 'down') => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return

    if (direction === 'up' && exerciseIndex === 0) return
    if (direction === 'down' && exerciseIndex === session.exercises.length - 1) return

    const newIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1
    const updatedExercises = [...session.exercises]
    const temp = updatedExercises[exerciseIndex]
    updatedExercises[exerciseIndex] = updatedExercises[newIndex]
    updatedExercises[newIndex] = temp
    
    // Update order
    updatedExercises.forEach((ex, i) => {
      ex.order = i
    })
    
    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { ...s, exercises: updatedExercises }
        : s
    ))
  }

  const handleAddSet = (sessionId: string, exerciseIndex: number) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return

    const exercise = session.exercises[exerciseIndex]
    const newSet: SetConfiguration = {
      setType: 'working',
      targetReps: exercise.sets[exercise.sets.length - 1]?.targetReps || 10,
      targetWeight: exercise.sets[exercise.sets.length - 1]?.targetWeight,
      restAfter: 60
    }

    const updatedExercises = [...session.exercises]
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      sets: [...updatedExercises[exerciseIndex].sets, newSet]
    }

    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { ...s, exercises: updatedExercises }
        : s
    ))
  }

  const handleRemoveSet = (sessionId: string, exerciseIndex: number, setIndex: number) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return

    const updatedExercises = [...session.exercises]
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      sets: updatedExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex)
    }

    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { ...s, exercises: updatedExercises }
        : s
    ))
  }

  const handleUpdateSet = (sessionId: string, exerciseIndex: number, setIndex: number, updates: Partial<SetConfiguration>) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return

    const updatedExercises = [...session.exercises]
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      sets: updatedExercises[exerciseIndex].sets.map((set, i) => 
        i === setIndex ? { ...set, ...updates } : set
      )
    }

    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { ...s, exercises: updatedExercises }
        : s
    ))
  }

  const handleUpdateExercise = (sessionId: string, exerciseIndex: number, updates: Partial<RoutineExercise>) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return

    const updatedExercises = [...session.exercises]
    updatedExercises[exerciseIndex] = { ...updatedExercises[exerciseIndex], ...updates }

    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { ...s, exercises: updatedExercises }
        : s
    ))
  }

  const calculateSessionDuration = (session: RoutineSession): number => {
    let totalMinutes = 0
    session.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        totalMinutes += 2 // Exercise time
        totalMinutes += (set.restAfter || ex.restTime || 60) / 60 // Rest time
      })
    })
    return Math.round(totalMinutes)
  }

  const calculateTotalDuration = (): number => {
    return sessions.reduce((total, session) => total + calculateSessionDuration(session), 0)
  }

  const handleSave = () => {
    if (!routineName.trim()) {
      alert('Please enter a routine name')
      return
    }

    const totalExercises = sessions.reduce((sum, s) => sum + s.exercises.length, 0)
    if (totalExercises === 0) {
      alert('Please add at least one exercise to your routine')
      return
    }

    // Update estimated durations for each session
    const updatedSessions = sessions.map(s => ({
      ...s,
      estimatedDuration: calculateSessionDuration(s)
    }))

    const routine: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: routineName,
      description: routineDescription,
      goal: routineGoal,
      exercises: [], // Deprecated - using sessions
      sessions: updatedSessions,
      estimatedDuration: calculateTotalDuration(),
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
              placeholder="e.g., Push/Pull/Legs, Upper/Lower Split"
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
            Total Estimated Duration: <span className="font-semibold">{calculateTotalDuration()} minutes</span>
            {' '}({sessions.length} {sessions.length === 1 ? 'day' : 'days'})
          </div>
        </div>
      </div>

      {/* Workout Days (Sessions) */}
      <div className="space-y-4">
        {sessions.map((session, sessionIndex) => {
          const sessionDuration = calculateSessionDuration(session)
          return (
            <div
              key={session.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              {/* Session Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="text"
                    value={session.name}
                    onChange={(e) => handleUpdateSessionName(session.id, e.target.value)}
                    className="text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:outline-none px-1"
                    placeholder="Day name"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({session.exercises.length} {session.exercises.length === 1 ? 'exercise' : 'exercises'}, ~{sessionDuration} min)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {sessions.length > 1 && (
                    <button
                      onClick={() => handleRemoveSession(session.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove workout day"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedSessionId(session.id)
                      setShowExerciseLibrary(true)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Exercise
                  </button>
                </div>
              </div>

              {/* Exercises in this session */}
              {session.exercises.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No exercises yet. Click "Add Exercise" to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {session.exercises.map((routineExercise, exerciseIndex) => {
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
                                onClick={() => handleMoveExercise(session.id, exerciseIndex, 'up')}
                                disabled={exerciseIndex === 0}
                                className={`p-1 ${exerciseIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} rounded`}
                              >
                                <ArrowUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleMoveExercise(session.id, exerciseIndex, 'down')}
                                disabled={exerciseIndex === session.exercises.length - 1}
                                className={`p-1 ${exerciseIndex === session.exercises.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} rounded`}
                              >
                                <ArrowDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {exerciseIndex + 1}. {exercise.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {[...exercise.muscleGroups.primary, ...exercise.muscleGroups.secondary].join(', ')}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveExercise(session.id, exerciseIndex)}
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
                                onChange={(e) => handleUpdateSet(session.id, exerciseIndex, setIndex, { setType: e.target.value as SetConfiguration['setType'] })}
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
                                onChange={(e) => handleUpdateSet(session.id, exerciseIndex, setIndex, { targetReps: e.target.value ? parseInt(e.target.value) : undefined })}
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                min="1"
                              />

                              <input
                                type="number"
                                placeholder="Weight (kg)"
                                value={set.targetWeight || ''}
                                onChange={(e) => handleUpdateSet(session.id, exerciseIndex, setIndex, { targetWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
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
                                    handleUpdateExercise(session.id, exerciseIndex, { restTime })
                                  }
                                  handleUpdateSet(session.id, exerciseIndex, setIndex, { restAfter: restTime })
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                min="0"
                              />

                              {routineExercise.sets.length > 1 && (
                                <button
                                  onClick={() => handleRemoveSet(session.id, exerciseIndex, setIndex)}
                                  className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}

                          <button
                            onClick={() => handleAddSet(session.id, exerciseIndex)}
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
                            onChange={(e) => handleUpdateExercise(session.id, exerciseIndex, { notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Workout Day Button */}
      <div className="flex justify-center">
        <button
          onClick={handleAddSession}
          className="px-6 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Workout Day
        </button>
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
          disabled={!routineName.trim() || sessions.reduce((sum, s) => sum + s.exercises.length, 0) === 0}
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Select Exercise {selectedSessionId && `for ${sessions.find(s => s.id === selectedSessionId)?.name || 'this day'}`}
              </h2>
              <button
                onClick={() => {
                  setShowExerciseLibrary(false)
                  setSelectedSessionId(null)
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ExerciseLibrary 
                onSelectExercise={(exercise) => {
                  if (selectedSessionId) {
                    handleAddExercise(exercise, selectedSessionId)
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
