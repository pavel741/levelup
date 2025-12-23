'use client'

import { X, TrendingUp, TrendingDown, Minus, Clock, Target } from 'lucide-react'
import { getExerciseById } from '@/lib/exerciseDatabase'
import { calculateRecoveryTime, shouldIncreaseWeight } from '@/lib/workoutHelpers'
import type { WorkoutLog } from '@/types/workout'

interface PostWorkoutFeedbackProps {
  workoutLog: WorkoutLog
  onClose: () => void
}

export default function PostWorkoutFeedback({ workoutLog, onClose }: PostWorkoutFeedbackProps) {
  // Collect all muscle groups trained
  const muscleGroupsSet = new Set<string>()
  workoutLog.exercises.forEach(ex => {
    const exercise = getExerciseById(ex.exerciseId)
    if (exercise) {
      exercise.muscleGroups.primary.forEach(mg => muscleGroupsSet.add(mg))
      exercise.muscleGroups.secondary.forEach(mg => muscleGroupsSet.add(mg))
    }
  })
  const muscleGroups = Array.from(muscleGroupsSet)

  // Calculate recovery time
  const recovery = calculateRecoveryTime(muscleGroups)

  // Analyze each exercise for weight recommendations
  const exerciseAnalyses = workoutLog.exercises.map(ex => {
    const exercise = getExerciseById(ex.exerciseId)
    if (!exercise || ex.sets.length === 0) return null

    const firstSet = ex.sets[0]
    const currentWeight = firstSet.weight || 0
    const targetReps = firstSet.reps || 0
    const completedReps = ex.sets.reduce((sum, set) => sum + (set.reps || 0), 0) / ex.sets.length
    const setsCompleted = ex.sets.filter(s => s.completed).length
    
    // Calculate average RPE if available
    const rpeValues = ex.sets.map(s => s.rpe).filter((rpe): rpe is number => rpe !== undefined && rpe > 0)
    const averageRPE = rpeValues.length > 0 
      ? rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length 
      : undefined

    if (currentWeight === 0) return null

    const analysis = shouldIncreaseWeight(
      currentWeight,
      targetReps,
      completedReps,
      setsCompleted,
      ex.sets.length,
      averageRPE
    )

    return {
      exerciseName: exercise.name,
      exerciseId: ex.exerciseId,
      currentWeight,
      ...analysis
    }
  }).filter(Boolean)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workout Complete! 🎉
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Workout Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Workout Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {Math.floor(workoutLog.duration / 60)}:{(workoutLog.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Exercises:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {workoutLog.exercises.length}
                </span>
              </div>
              {workoutLog.totalVolume && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Volume:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {workoutLog.totalVolume.toLocaleString()} kg
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Muscle Groups Trained */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              💪 Muscle Groups Trained
            </h3>
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map(mg => (
                <span
                  key={mg}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium capitalize"
                >
                  {mg}
                </span>
              ))}
            </div>
          </div>

          {/* Recovery Time */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recovery Recommendation
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {recovery.message}
            </p>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Suggested rest: <span className="font-medium">{recovery.days} day(s) / {recovery.hours} hours</span>
            </div>
          </div>

          {/* Weight Recommendations */}
          {exerciseAnalyses.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                📈 Weight Recommendations
              </h3>
              <div className="space-y-3">
                {exerciseAnalyses.map((analysis, idx) => (
                  analysis && (
                    <div
                      key={idx}
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {analysis.exerciseName}
                        </div>
                        <div className="flex items-center gap-2">
                          {analysis.shouldIncrease ? (
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : analysis.suggestedIncrease < 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Current: <span className="font-medium">{analysis.currentWeight} kg</span>
                        {analysis.suggestedIncrease !== 0 && (
                          <span className="ml-2">
                            → <span className="font-medium">
                              {analysis.currentWeight + analysis.suggestedIncrease} kg
                            </span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {analysis.recommendation}
                      </p>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Great Workout!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

