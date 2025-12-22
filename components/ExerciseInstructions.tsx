'use client'

import { useState } from 'react'
import { Play, X, Info, AlertCircle, Lightbulb, Video } from 'lucide-react'
import type { Exercise } from '@/types/workout'

interface ExerciseInstructionsProps {
  exercise: Exercise
  onClose?: () => void
  compact?: boolean // For inline display in workout view
  showAddButton?: boolean // Show "Add to Routine" button
  onAddToRoutine?: () => void // Callback for add button
}

export default function ExerciseInstructions({ exercise, onClose, compact = false, showAddButton = false, onAddToRoutine }: ExerciseInstructionsProps) {
  const [showVideo, setShowVideo] = useState(false)

  if (compact) {
    return (
      <div className="mt-4 space-y-3">
        {/* Instructions */}
        {exercise.instructions && exercise.instructions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Instructions
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {exercise.instructions.map((instruction, idx) => (
                <li key={idx}>{instruction}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Video */}
        {exercise.videoUrl && (
          <div>
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              <Video className="w-4 h-4" />
              {showVideo ? 'Hide' : 'Show'} Video Demonstration
            </button>
            {showVideo && (
              <div className="mt-2 rounded-lg overflow-hidden">
                <iframe
                  src={exercise.videoUrl}
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${exercise.name} demonstration`}
                />
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        {exercise.tips && exercise.tips.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              Tips
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {exercise.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Common Mistakes */}
        {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              Common Mistakes to Avoid
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {exercise.commonMistakes.map((mistake, idx) => (
                <li key={idx}>{mistake}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // Full modal view
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{exercise.name}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400">{exercise.description}</p>

            {/* Video */}
            {exercise.videoUrl && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Video Demonstration
                </h3>
                <div className="rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={exercise.videoUrl}
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${exercise.name} demonstration`}
                  />
                </div>
              </div>
            )}

            {/* Instructions */}
            {exercise.instructions && exercise.instructions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Step-by-Step Instructions
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  {exercise.instructions.map((instruction, idx) => (
                    <li key={idx} className="pl-2">{instruction}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tips */}
            {exercise.tips && exercise.tips.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  Pro Tips
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  {exercise.tips.map((tip, idx) => (
                    <li key={idx} className="pl-2">{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common Mistakes */}
            {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  Common Mistakes to Avoid
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  {exercise.commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="pl-2">{mistake}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Muscle Groups */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Primary Muscles</h4>
                <div className="flex flex-wrap gap-2">
                  {exercise.muscleGroups.primary.map((muscle) => (
                    <span
                      key={muscle}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
              {exercise.muscleGroups.secondary.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Secondary Muscles</h4>
                  <div className="flex flex-wrap gap-2">
                    {exercise.muscleGroups.secondary.map((muscle) => (
                      <span
                        key={muscle}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add to Routine Button */}
            {showAddButton && onAddToRoutine && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onAddToRoutine}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Add to Routine
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

