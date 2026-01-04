'use client'

import { useState } from 'react'
import { Calendar, Clock, TrendingUp, X, Filter } from 'lucide-react'
import { getExerciseById } from '@/lib/exerciseDatabase'
import PostWorkoutFeedback from '@/components/PostWorkoutFeedback'
import { VirtualList } from '@/components/ui/VirtualList'
import type { WorkoutLog } from '@/types/workout'
import { format } from 'date-fns'

interface WorkoutHistoryProps {
  logs: WorkoutLog[]
  onDelete?: (logId: string) => void
}

export default function WorkoutHistory({ logs, onDelete }: WorkoutHistoryProps) {
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackLog, setFeedbackLog] = useState<WorkoutLog | null>(null)
  const [filterDate, setFilterDate] = useState<string>('')

  const filteredLogs = logs.filter((log) => {
    if (!filterDate) return true
    return format(log.date, 'yyyy-MM-dd') === filterDate
  })

  const totalWorkouts = filteredLogs.length
  const totalVolume = filteredLogs.reduce((sum, log) => sum + (log.totalVolume || 0), 0)
  // Duration is stored in seconds, convert to minutes
  const totalDurationSeconds = filteredLogs.reduce((sum, log) => sum + log.duration, 0)
  const totalDurationMinutes = Math.round(totalDurationSeconds / 60)
  const avgDuration = totalWorkouts > 0 ? Math.round(totalDurationMinutes / totalWorkouts) : 0

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Workouts</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalWorkouts}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Volume</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalVolume.toLocaleString()} kg
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Duration</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{avgDuration} min</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Time</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.floor(totalDurationMinutes / 60)}h {totalDurationMinutes % 60}m
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Workout List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No workouts yet</h3>
          <p className="text-gray-600 dark:text-gray-400">Complete your first workout to see it here!</p>
        </div>
      ) : filteredLogs.length > 50 ? (
        // Use virtual scrolling for large lists
        <VirtualList
          items={filteredLogs}
          itemHeight={180} // Approximate height of each workout card
          containerHeight={600} // Fixed container height
          overscan={5} // Render 5 extra items above/below for smooth scrolling
          className="space-y-3"
          renderItem={(log) => (
            <div
              key={log.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {format(log.date, 'EEEE, MMMM d, yyyy')}
                    </h3>
                    {log.completed && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded text-xs font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.round(log.duration / 60)} min
                    </div>
                    {log.totalVolume && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {log.totalVolume.toLocaleString()} kg volume
                      </div>
                    )}
                    <div>{log.exercises.length} exercises</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {log.exercises.slice(0, 5).map((ex, idx) => {
                      const exercise = getExerciseById(ex.exerciseId)
                      return (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs"
                        >
                          {exercise?.name || 'Unknown'}
                        </span>
                      )
                    })}
                    {log.exercises.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                        +{log.exercises.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
                {onDelete && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (confirm('Delete this workout?')) {
                        // Close modals if this log is selected
                        if (selectedLog?.id === log.id) {
                          setSelectedLog(null)
                        }
                        if (feedbackLog?.id === log.id) {
                          setShowFeedback(false)
                          setFeedbackLog(null)
                        }
                        await onDelete(log.id)
                      }
                    }}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        />
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {format(log.date, 'EEEE, MMMM d, yyyy')}
                    </h3>
                    {log.completed && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded text-xs font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.round(log.duration / 60)} min
                    </div>
                    {log.totalVolume && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {log.totalVolume.toLocaleString()} kg volume
                      </div>
                    )}
                    <div>{log.exercises.length} exercises</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {log.exercises.slice(0, 5).map((ex, idx) => {
                      const exercise = getExerciseById(ex.exerciseId)
                      return (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs"
                        >
                          {exercise?.name || 'Unknown'}
                        </span>
                      )
                    })}
                    {log.exercises.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                        +{log.exercises.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
                {onDelete && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (confirm('Delete this workout?')) {
                        // Close modals if this log is selected
                        if (selectedLog?.id === log.id) {
                          setSelectedLog(null)
                        }
                        if (feedbackLog?.id === log.id) {
                          setShowFeedback(false)
                          setFeedbackLog(null)
                        }
                        await onDelete(log.id)
                      }
                    }}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workout Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {format(selectedLog.date, 'EEEE, MMMM d, yyyy')}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span>{Math.round(selectedLog.duration / 60)} minutes</span>
                    {selectedLog.totalVolume && (
                      <span>{selectedLog.totalVolume.toLocaleString()} kg total volume</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedLog.exercises.map((ex, exIdx) => {
                  const exercise = getExerciseById(ex.exerciseId)
                  return (
                    <div
                      key={exIdx}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {exIdx + 1}. {exercise?.name || 'Unknown Exercise'}
                      </h3>
                      <div className="space-y-2">
                        {ex.sets.map((set, setIdx) => {
                          const isBodyweight = exercise && exercise.equipment.includes('bodyweight') && exercise.equipment.length === 1
                          const hasWeight = set.weight && set.weight > 0
                          const hasReps = set.reps && set.reps > 0
                          
                          return (
                            <div
                              key={setIdx}
                              className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400"
                            >
                              <span className="font-medium w-12">Set {set.setNumber}:</span>
                              {hasReps && (
                                <>
                                  {hasWeight ? (
                                    <span>{set.reps} reps × {set.weight} kg</span>
                                  ) : isBodyweight ? (
                                    <span>{set.reps} reps (Bodyweight)</span>
                                  ) : (
                                    <span>{set.reps} reps</span>
                                  )}
                                </>
                              )}
                              {set.duration && (
                                <span>{Math.round(set.duration / 60)}:{(set.duration % 60).toString().padStart(2, '0')}</span>
                              )}
                              {set.distance && (
                                <span>{set.distance} km</span>
                              )}
                              {set.rpe && (
                                <span className="ml-auto">RPE: {set.rpe}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {ex.notes && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                          Notes: {ex.notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {selectedLog.notes && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Workout Notes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLog.notes}</p>
                </div>
              )}

              {/* Show Feedback Button */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setFeedbackLog(selectedLog)
                    setShowFeedback(true)
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  View Workout Feedback & Recommendations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post-Workout Feedback Modal */}
      {showFeedback && feedbackLog && (
        <PostWorkoutFeedback
          workoutLog={feedbackLog}
          onClose={() => {
            setShowFeedback(false)
            setFeedbackLog(null)
          }}
        />
      )}
    </div>
  )
}

