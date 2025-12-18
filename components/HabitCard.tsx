'use client'

import { useState } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { format } from 'date-fns'
import { CheckCircle2, Circle, Trash2, X, Edit2, AlertCircle } from 'lucide-react'
import { Habit } from '@/types'
import { validateMissedReason } from '@/lib/missedHabitValidation'

interface HabitCardProps {
  habit: Habit
  onEdit?: (habit: Habit) => void
}

export default function HabitCard({ habit, onEdit }: HabitCardProps) {
  const { completeHabit, uncompleteHabit, deleteHabit, markHabitMissed } = useFirestoreStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMissedModal, setShowMissedModal] = useState(false)
  const [missedReason, setMissedReason] = useState('')
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string } | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')
  const isCompleted = habit.completedDates.includes(today)
  const isMissed = habit.missedDates?.some((m) => m.date === today)
  
  // Check if habit has started
  const hasStarted = habit.startDate 
    ? (() => {
        const startDate = habit.startDate instanceof Date 
          ? habit.startDate 
          : new Date(habit.startDate)
        const startDateStr = format(startDate, 'yyyy-MM-dd')
        return today >= startDateStr
      })()
    : true // If no startDate, habit has started

  const handleToggle = () => {
    if (isCompleted) {
      uncompleteHabit(habit.id)
    } else {
      completeHabit(habit.id)
    }
  }

  const handleMarkMissed = async () => {
    if (!missedReason.trim()) {
      alert('Please provide a reason for missing this habit')
      return
    }

    const validation = validateMissedReason(missedReason)
    setValidationResult(validation)

    // Show validation result
    if (validation.message) {
      // Small delay to show message, then proceed
      setTimeout(async () => {
        await markHabitMissed(habit.id, today, missedReason)
        setShowMissedModal(false)
        setMissedReason('')
        setValidationResult(null)
      }, 1500)
    } else {
      await markHabitMissed(habit.id, today, missedReason)
      setShowMissedModal(false)
      setMissedReason('')
      setValidationResult(null)
    }
  }

  const handleReasonChange = (reason: string) => {
    setMissedReason(reason)
    if (reason.trim().length > 5) {
      const validation = validateMissedReason(reason)
      setValidationResult(validation)
    } else {
      setValidationResult(null)
    }
  }

  const handleDelete = async () => {
    await deleteHabit(habit.id)
    setShowDeleteConfirm(false)
  }

  const completionRate = habit.completedDates.length / 7 // Last 7 days
  const streak = calculateStreak(habit.completedDates)

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`${habit.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
              {habit.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{habit.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{habit.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCompleted && !isMissed && hasStarted && (
              <button
                onClick={() => setShowMissedModal(true)}
                className="p-2 rounded-lg text-orange-400 dark:text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                title="Mark as missed"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleToggle}
              disabled={!hasStarted}
              className={`p-2 rounded-lg transition-colors ${
                !hasStarted
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                  : isCompleted
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                  : isMissed
                  ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title={
                !hasStarted && habit.startDate
                  ? `Habit starts on ${habit.startDate instanceof Date ? format(habit.startDate, 'MMM d, yyyy') : format(new Date(habit.startDate), 'MMM d, yyyy')}`
                  : isCompleted 
                  ? 'Completed' 
                  : isMissed 
                  ? 'Missed' 
                  : 'Mark as complete'
              }
            >
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : isMissed ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(habit)}
                className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title="Edit habit"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete habit"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {!hasStarted && habit.startDate && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Circle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Starts Soon</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    This habit will begin on {habit.startDate instanceof Date 
                      ? format(habit.startDate, 'MMM d, yyyy') 
                      : habit.startDate 
                        ? format(new Date(habit.startDate), 'MMM d, yyyy')
                        : ''}
                  </p>
                </div>
              </div>
            </div>
          )}
          {isMissed && habit.missedDates && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-300">Missed Today</p>
                  <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                    {habit.missedDates.find((m) => m.date === today)?.reason}
                  </p>
                  {habit.missedDates.find((m) => m.date === today)?.valid === false && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                      ⚠️ Invalid reason - streak reset
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Frequency</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {habit.frequency === 'daily' ? 'Daily' : habit.frequency === 'weekly' ? 'Weekly' : 'Custom'}
              {habit.frequency !== 'daily' && habit.targetDays && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  ({habit.targetDays.length} day{habit.targetDays.length !== 1 ? 's' : ''}/week)
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Streak</span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">🔥 {streak} days</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">XP Reward</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">+{habit.xpReward} XP</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(completionRate * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mark as Missed Modal */}
      {showMissedModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mark as Missed</h3>
              <button
                onClick={() => {
                  setShowMissedModal(false)
                  setMissedReason('')
                  setValidationResult(null)
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Why did you miss <span className="font-semibold text-gray-900 dark:text-white">"{habit.name}"</span> today?
            </p>
            <div className="mb-4">
              <textarea
                value={missedReason}
                onChange={(e) => handleReasonChange(e.target.value)}
                placeholder="e.g., I was sick with the flu..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[100px] resize-none"
              />
              {validationResult && (
                <div className={`mt-2 p-3 rounded-lg text-sm ${
                  validationResult.valid
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  <div className="flex items-start gap-2">
                    {validationResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{validationResult.message}</span>
                  </div>
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <strong>Valid reasons:</strong> Sickness, emergencies, medical issues, accidents, weather, etc.<br />
                <strong>Invalid reasons:</strong> Hangover, laziness, forgot, didn't feel like it, etc.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMissedModal(false)
                  setMissedReason('')
                  setValidationResult(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkMissed}
                disabled={!missedReason.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark as Missed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Habit?</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{habit.name}"</span>? 
              This action cannot be undone and you'll lose all progress data for this habit.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0

  const sorted = [...completedDates].sort().reverse()
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < sorted.length; i++) {
    const date = new Date(sorted[i])
    date.setHours(0, 0, 0, 0)
    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)

    if (format(date, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
      streak++
    } else {
      break
    }
  }

  return streak
}

