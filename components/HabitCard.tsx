'use client'

import React, { useState, useEffect, memo } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { format } from 'date-fns'
import { CheckCircle2, Circle, Trash2, X, Edit2, AlertCircle, TrendingUp } from 'lucide-react'
import { Habit } from '@/types'
import { validateMissedReason } from '@/lib/missedHabitValidation'

interface HabitCardProps {
  habit: Habit
  onEdit?: (habit: Habit) => void
}

function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0
  
  // Sort dates descending (most recent first)
  const sorted = [...completedDates].sort((a, b) => {
    const dateA = new Date(a)
    const dateB = new Date(b)
    return dateB.getTime() - dateA.getTime()
  })
  
  // Calculate consecutive days from today backwards
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < sorted.length; i++) {
    const date = new Date(sorted[i])
    date.setHours(0, 0, 0, 0)
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)
    
    if (date.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

function checkIfHabitStarted(startDate: Date | string | undefined, todayStr: string): boolean {
  if (!startDate) return true
  const start = startDate instanceof Date 
    ? startDate 
    : new Date(startDate)
  const startDateStr = format(start, 'yyyy-MM-dd')
  return todayStr >= startDateStr
}

function HabitCardComponent({ habit, onEdit }: HabitCardProps) {
  const { completeHabit, uncompleteHabit, deleteHabit, markHabitMissed, updateMissedReasonValidity, user } = useFirestoreStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMissedModal, setShowMissedModal] = useState(false)
  const [missedReason, setMissedReason] = useState('')
  const [missedDate, setMissedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string } | null>(null)
  const [showXPGain, setShowXPGain] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const today = format(new Date(), 'yyyy-MM-dd')
  const targetCount = (habit.targetCountPerDay ?? 1) as number
  const currentCount = (habit.completionsPerDay?.[today] ?? 0) as number
  const isCompleted = habit.completedDates.includes(today)
  const isMissed = habit.missedDates?.some((m) => m.date === today)
  const [prevCompleted, setPrevCompleted] = useState(isCompleted)
  
  // Track XP changes to show notification when habit becomes completed
  useEffect(() => {
    if (user && isCompleted && !prevCompleted) {
      // Show XP notification when habit is just completed
      setShowXPGain(true)
      setXpGained(habit.xpReward)
      const timer = setTimeout(() => {
        setShowXPGain(false)
      }, 3000)
      setPrevCompleted(true)
      return () => {
        clearTimeout(timer)
      }
    } else if (!isCompleted) {
      setPrevCompleted(false)
    }
  }, [isCompleted, habit.xpReward, user, prevCompleted])
  
  // Check if habit has started
  const hasStarted = checkIfHabitStarted(habit.startDate, today)

  const handleToggle = () => {
    const targetCount = habit.targetCountPerDay || 1
    const currentCount = habit.completionsPerDay?.[today] || 0
    
    // If already reached target, uncomplete (decrement)
    if (isCompleted && currentCount >= targetCount) {
      uncompleteHabit(habit.id)
    } else {
      // Otherwise, complete (increment)
      completeHabit(habit.id)
    }
  }

  const handleMarkMissed = async () => {
    if (!missedReason.trim()) {
      alert('Please provide a reason for missing this habit')
      return
    }

    // Validate the selected date
    const selectedDate = new Date(missedDate)
    const todayDate = new Date(today)
    
    // Can't mark future dates as missed
    if (selectedDate > todayDate) {
      alert('Cannot mark future dates as missed')
      return
    }

    // Check if date is already completed
    if (habit.completedDates.includes(missedDate)) {
      alert('This date is already marked as completed. Uncomplete it first if you want to mark it as missed.')
      return
    }

    // Check if date is already marked as missed
    if (habit.missedDates?.some((m) => m.date === missedDate)) {
      alert('This date is already marked as missed')
      return
    }

    // Check if date is before habit start date
    if (habit.startDate) {
      const startDate = habit.startDate instanceof Date 
        ? habit.startDate 
        : new Date(habit.startDate)
      const startDateStr = format(startDate, 'yyyy-MM-dd')
      if (missedDate < startDateStr) {
        alert(`Cannot mark dates before the habit start date (${format(startDate, 'MMM d, yyyy')})`)
        return
      }
    }

    const validation = validateMissedReason(missedReason)
    setValidationResult(validation)

    // Show validation result
    if (validation.message) {
      // Small delay to show message, then proceed
      setTimeout(async () => {
        await markHabitMissed(habit.id, missedDate, missedReason)
        setShowMissedModal(false)
        setMissedReason('')
        setMissedDate(format(new Date(), 'yyyy-MM-dd'))
        setValidationResult(null)
      }, 1500)
    } else {
      await markHabitMissed(habit.id, missedDate, missedReason)
      setShowMissedModal(false)
      setMissedReason('')
      setMissedDate(format(new Date(), 'yyyy-MM-dd'))
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
  const showTargetCount = (targetCount ?? 1) > 1

  return (
    <div>
      {/* XP Gain Notification */}
      {showXPGain && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-bold text-lg">+{xpGained} XP</span>
          </div>
        </div>
      )}
      
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
            {hasStarted && (
              <button
                onClick={() => {
                  setMissedDate(format(new Date(), 'yyyy-MM-dd'))
                  setShowMissedModal(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-sm font-medium"
                title="Mark as missed with explanation (can select past dates)"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Missed</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              {targetCount > 1 && (
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {currentCount}/{targetCount}
                </span>
              )}
              <button
                onClick={handleToggle}
                disabled={!hasStarted || (isCompleted && currentCount >= targetCount)}
                className={`p-2 rounded-lg transition-colors ${
                  !hasStarted
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                    : isCompleted && currentCount >= targetCount
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 cursor-default'
                    : isMissed
                    ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title={
                  !hasStarted && habit.startDate
                    ? `Habit starts on ${habit.startDate instanceof Date ? format(habit.startDate, 'MMM d, yyyy') : format(new Date(habit.startDate), 'MMM d, yyyy')}`
                    : isCompleted && currentCount >= targetCount
                    ? `Completed (${currentCount}/${targetCount})`
                    : targetCount > 1
                    ? `${currentCount}/${targetCount} - Click to add one more`
                    : isCompleted 
                    ? 'Completed' 
                    : isMissed 
                    ? 'Missed' 
                    : 'Mark as complete'
                }
              >
                {isCompleted && currentCount >= targetCount ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : isMissed ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
            </div>
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
          {habit.missedDates && habit.missedDates.length > 0 && (
            <div className="space-y-2">
              {habit.missedDates
                .filter((m) => {
                  // Show recent missed dates (last 7 days)
                  const missedDate = new Date(m.date)
                  const sevenDaysAgo = new Date()
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                  return missedDate >= sevenDaysAgo
                })
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 3) // Show max 3 recent missed dates
                .map((missed) => {
                  const isToday = missed.date === today
                  return (
                    <div key={missed.date} className={`p-3 rounded-lg border ${
                      missed.valid === false 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : missed.valid === true
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                    }`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          missed.valid === false 
                            ? 'text-red-600 dark:text-red-400'
                            : missed.valid === true
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-orange-600 dark:text-orange-400'
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            missed.valid === false 
                              ? 'text-red-900 dark:text-red-300'
                              : missed.valid === true
                              ? 'text-green-900 dark:text-green-300'
                              : 'text-orange-900 dark:text-orange-300'
                          }`}>
                            {isToday ? 'Missed Today' : `Missed on ${format(new Date(missed.date), 'MMM d, yyyy')}`}
                          </p>
                          <p className={`text-xs mt-1 ${
                            missed.valid === false 
                              ? 'text-red-700 dark:text-red-400'
                              : missed.valid === true
                              ? 'text-green-700 dark:text-green-400'
                              : 'text-orange-700 dark:text-orange-400'
                          }`}>
                            {missed.reason}
                          </p>
                          {missed.valid === false && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                              ⚠️ Invalid reason - streak reset
                            </p>
                          )}
                          {missed.valid === true && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                              ✓ Valid reason - streak preserved
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => updateMissedReasonValidity(habit.id, missed.date, true)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                missed.valid === true
                                  ? 'bg-green-600 text-white'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                              }`}
                              title="Mark as valid reason"
                            >
                              ✓ Valid
                            </button>
                            <button
                              onClick={() => updateMissedReasonValidity(habit.id, missed.date, false)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                missed.valid === false
                                  ? 'bg-red-600 text-white'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                              }`}
                              title="Mark as invalid reason"
                            >
                              ✗ Invalid
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
          {showTargetCount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Today's Progress</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400"> {String(currentCount)}/{String(targetCount)}</span>
            </div>
          )}
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-xl my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Mark as Missed</h3>
              <button
                onClick={() => {
                  setShowMissedModal(false)
                  setMissedReason('')
                  setMissedDate(format(new Date(), 'yyyy-MM-dd'))
                  setValidationResult(null)
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 flex-shrink-0">
              Why did you miss <span className="font-semibold text-gray-900 dark:text-white">"{habit.name}"</span>?
            </p>
            <div className="mb-4 overflow-y-auto flex-1 min-h-0 pr-2 -mr-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={missedDate}
                onChange={(e) => setMissedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              />
              {habit.startDate && (() => {
                const startDate = habit.startDate instanceof Date 
                  ? habit.startDate 
                  : new Date(habit.startDate)
                const startDateStr = format(startDate, 'yyyy-MM-dd')
                if (missedDate < startDateStr) {
                  return (
                    <p className="text-xs text-red-500 dark:text-red-400 mb-2">
                      Cannot mark dates before habit start date ({format(startDate, 'MMM d, yyyy')})
                    </p>
                  )
                }
                return null
              })()}
              {habit.completedDates.includes(missedDate) && (
                <p className="text-xs text-orange-500 dark:text-orange-400 mb-2">
                  ⚠️ This date is already marked as completed. Uncomplete it first if you want to mark it as missed.
                </p>
              )}
              {habit.missedDates?.some((m) => m.date === missedDate) && (
                <p className="text-xs text-orange-500 dark:text-orange-400 mb-2">
                  ⚠️ This date is already marked as missed.
                </p>
              )}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">
                Reason
              </label>
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
            <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => {
                  setShowMissedModal(false)
                  setMissedReason('')
                  setMissedDate(format(new Date(), 'yyyy-MM-dd'))
                  setValidationResult(null)
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkMissed}
                disabled={!missedReason.trim()}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Mark as Missed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-xl my-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Delete Habit?</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{habit.name}"</span>? 
              This action cannot be undone and you'll lose all progress data for this habit.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Memoize HabitCard to prevent unnecessary re-renders
export default memo(HabitCardComponent, (prevProps, nextProps) => {
  // Only re-render if habit data actually changed
  return (
    prevProps.habit.id === nextProps.habit.id &&
    prevProps.habit.completedDates.length === nextProps.habit.completedDates.length &&
    prevProps.habit.completedDates[prevProps.habit.completedDates.length - 1] === 
    nextProps.habit.completedDates[nextProps.habit.completedDates.length - 1] &&
    prevProps.habit.isActive === nextProps.habit.isActive
  )
})
