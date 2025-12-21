'use client'

import { useState } from 'react'
import { Sparkles, Loader2, X, Save } from 'lucide-react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { saveRoutine } from '@/lib/workoutMongo'
import type { Routine } from '@/types/workout'
import { EXERCISE_DATABASE } from '@/lib/exerciseDatabase'

interface AIRoutineGeneratorProps {
  onRoutineGenerated?: (routine: Routine) => void
  onClose?: () => void
}

export default function AIRoutineGenerator({ onRoutineGenerated, onClose }: AIRoutineGeneratorProps) {
  const { user } = useFirestoreStore()
  const [weight, setWeight] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [goal, setGoal] = useState<string>('gain_muscle')
  const [experience, setExperience] = useState<string>('beginner')
  const [daysPerWeek, setDaysPerWeek] = useState<string>('3')
  const [equipment, setEquipment] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedRoutine, setGeneratedRoutine] = useState<Routine | null>(null)
  const [error, setError] = useState<string | null>(null)

  const availableEquipment = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'resistance_bands']

  const toggleEquipment = (eq: string) => {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    )
  }

  const handleGenerate = async () => {
    console.log('handleGenerate called', { weight, height, goal, experience, daysPerWeek, equipment })
    
    if (!weight || !height) {
      console.log('Validation failed: missing weight or height')
      setError('Please enter your weight and height')
      return
    }

    if (!user?.id) {
      console.log('Validation failed: user not logged in')
      setError('You must be logged in to generate routines')
      return
    }

    console.log('Starting generation...')
    setIsGenerating(true)
    setError(null)
    setGeneratedRoutine(null)

    try {
      const requestBody = {
        weight: parseFloat(weight),
        height: parseFloat(height),
        goal,
        experience,
        daysPerWeek: parseInt(daysPerWeek),
        equipment: equipment.length > 0 ? equipment : availableEquipment,
      }
      
      console.log('Sending request:', requestBody)
      
      const response = await fetch('/api/workouts/generate-routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      console.log('Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate routine')
      }

      const data = await response.json()
      
      if (!data.routine) {
        throw new Error('No routine data received from server')
      }
      
      console.log('Generated routine:', data.routine)
      
      // Auto-save the routine if user is logged in
      if (user?.id && data.routine) {
        try {
          const routineToSave: Routine = {
            ...data.routine,
            id: `routine_${Date.now()}`,
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            isTemplate: false,
            isPublic: false,
            createdBy: user.id,
          }
          console.log('Auto-saving routine:', routineToSave)
          await saveRoutine(routineToSave)
          console.log('Routine saved successfully!')
        } catch (saveError) {
          console.error('Error auto-saving routine:', saveError)
          // Don't throw - still show the routine so user can manually save
        }
      }
      
      setGeneratedRoutine(data.routine)
      onRoutineGenerated?.(data.routine)
    } catch (err: any) {
      console.error('Error generating routine:', err)
      setError(err.message || 'Failed to generate routine. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveRoutine = async () => {
    if (!generatedRoutine || !user?.id) return

    try {
      const routineToSave: Routine = {
        ...generatedRoutine,
        id: `routine_${Date.now()}`,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isTemplate: false,
        isPublic: false,
        createdBy: user.id,
      }
      await saveRoutine(routineToSave)
      console.log('Routine saved manually:', routineToSave)
      // Show success message
      const successMsg = 'Routine saved successfully! It will appear in your routines list.'
      alert(successMsg)
      // Reset form
      setGeneratedRoutine(null)
      setWeight('')
      setHeight('')
      setGoal('gain_muscle')
      setExperience('beginner')
      setDaysPerWeek('3')
      setEquipment([])
      // Close modal - Firestore subscription will auto-update the routines list
      onClose?.()
    } catch (error) {
      console.error('Error saving routine:', error)
      alert('Failed to save routine. Please try again.')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Routine Generator</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!generatedRoutine ? (
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Tell us about yourself and your goals, and we'll generate a personalized workout routine based on proven fitness science principles!
          </p>

          {/* Body Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fitness Goal
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="gain_muscle">Gain Muscle (Bulking)</option>
              <option value="lose_weight">Lose Weight (Cutting)</option>
              <option value="maintenance">Maintain Current Weight</option>
              <option value="strength">Build Strength</option>
              <option value="endurance">Improve Endurance</option>
              <option value="custom">Custom Goal</option>
            </select>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Experience Level
            </label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Days Per Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Days Per Week
            </label>
            <select
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="2">2 days</option>
              <option value="3">3 days</option>
              <option value="4">4 days</option>
              <option value="5">5 days</option>
              <option value="6">6 days</option>
            </select>
          </div>

          {/* Available Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Equipment (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableEquipment.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEquipment(eq)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    equipment.includes(eq)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {eq.charAt(0).toUpperCase() + eq.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
            {equipment.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                No equipment selected - will assume all equipment available
              </p>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Button clicked')
              handleGenerate()
            }}
            disabled={isGenerating || !weight || !height}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Routine...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Routine
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              ✓ Routine Generated Successfully!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Review the routine below and save it to your routines.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {generatedRoutine.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {generatedRoutine.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span>{generatedRoutine.sessions?.length || 0} workout days</span>
              <span>~{generatedRoutine.estimatedDuration} min per session</span>
              <span className="capitalize">{generatedRoutine.difficulty}</span>
              <span className="capitalize">{generatedRoutine.goal}</span>
            </div>

            {generatedRoutine.sessions && generatedRoutine.sessions.length > 0 && (
              <div className="space-y-3">
                {generatedRoutine.sessions.map((session, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {session.name}
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {session.exercises.length} exercises • ~{session.estimatedDuration} min
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {session.exercises.slice(0, 5).map((ex, exIdx) => {
                        const exercise = EXERCISE_DATABASE.find((e) => e.id === ex.exerciseId)
                        return (
                          <span
                            key={exIdx}
                            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs"
                          >
                            {exercise?.name || ex.exerciseId}
                          </span>
                        )
                      })}
                      {session.exercises.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                          +{session.exercises.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setGeneratedRoutine(null)
                setError(null)
              }}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Generate Another
            </button>
            <button
              onClick={handleSaveRoutine}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Routine
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

