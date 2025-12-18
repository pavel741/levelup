'use client'

import { useState } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { format } from 'date-fns'
import { CheckCircle2, Circle, Trash2, X, Edit2 } from 'lucide-react'
import { Habit } from '@/types'

interface HabitCardProps {
  habit: Habit
  onEdit?: (habit: Habit) => void
}

export default function HabitCard({ habit, onEdit }: HabitCardProps) {
  const { completeHabit, uncompleteHabit, deleteHabit } = useFirestoreStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')
  const isCompleted = habit.completedDates.includes(today)

  const handleToggle = () => {
    if (isCompleted) {
      uncompleteHabit(habit.id)
    } else {
      completeHabit(habit.id)
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
            <button
              onClick={handleToggle}
              className={`p-2 rounded-lg transition-colors ${
                isCompleted
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title={isCompleted ? 'Completed' : 'Mark as complete'}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6" />
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

