'use client'

import React, { useState, memo } from 'react'
import { format, differenceInDays, isPast } from 'date-fns'
import { Target, Edit2, Trash2, TrendingUp, Calendar, CheckCircle2, Circle } from 'lucide-react'
import { Goal } from '@/types'

interface GoalCardProps {
  goal: Goal
  onEdit?: (goal: Goal) => void
  onDelete: (goalId: string) => void
  onUpdateProgress?: (goalId: string, currentValue: number, note?: string) => void
}

const categoryColors = {
  health: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  finance: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  career: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
  personal: 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700',
  fitness: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
  learning: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700',
  other: 'bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700',
}

const statusColors = {
  active: 'text-green-600 dark:text-green-400',
  paused: 'text-yellow-600 dark:text-yellow-400',
  completed: 'text-blue-600 dark:text-blue-400',
  cancelled: 'text-gray-600 dark:text-gray-400',
}

function GoalCardComponent({ goal, onEdit, onDelete, onUpdateProgress }: GoalCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showProgressUpdate, setShowProgressUpdate] = useState(false)
  const [progressValue, setProgressValue] = useState(goal.currentValue.toString())
  const [progressNote, setProgressNote] = useState('')

  const handleDelete = () => {
    onDelete(goal.id)
    setShowDeleteConfirm(false)
  }

  const handleUpdateProgress = () => {
    const value = parseFloat(progressValue)
    if (!isNaN(value) && onUpdateProgress) {
      onUpdateProgress(goal.id, value, progressNote.trim() || undefined)
      setShowProgressUpdate(false)
      setProgressValue(goal.currentValue.toString())
      setProgressNote('')
    }
  }

  const daysUntilDeadline = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null
  const isOverdue = goal.deadline && goal.status !== 'completed' && isPast(new Date(goal.deadline))
  const progressPercentage = goal.progressPercentage || 0

  return (
    <div className={`border rounded-lg p-6 transition-all ${categoryColors[goal.category]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{goal.title}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[goal.status]}`}>
              {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
            </span>
          </div>
          {goal.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{goal.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="capitalize">{goal.category}</span>
            {goal.deadline && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                <Calendar className="w-3 h-3" />
                {isOverdue ? 'Overdue' : daysUntilDeadline !== null && daysUntilDeadline >= 0
                  ? `${daysUntilDeadline} days left`
                  : format(new Date(goal.deadline), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(goal)}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              aria-label="Edit goal"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            aria-label="Delete goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress: {goal.currentValue} / {goal.targetValue} {goal.unit}
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progressPercentage >= 100
                ? 'bg-green-500'
                : progressPercentage >= 75
                ? 'bg-blue-500'
                : progressPercentage >= 50
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      {goal.milestones && goal.milestones.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Milestones:</h4>
          <div className="space-y-1">
            {goal.milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center gap-2 text-xs">
                {milestone.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
                <span
                  className={
                    milestone.isCompleted
                      ? 'text-gray-500 dark:text-gray-400 line-through'
                      : 'text-gray-700 dark:text-gray-300'
                  }
                >
                  {milestone.title} ({milestone.currentValue} / {milestone.targetValue} {goal.unit})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Update Progress Button */}
      {goal.status === 'active' && onUpdateProgress && (
        <button
          onClick={() => setShowProgressUpdate(true)}
          className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Update Progress
        </button>
      )}

      {/* Progress Update Modal */}
      {showProgressUpdate && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Update Progress</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Value ({goal.unit})
                </label>
                <input
                  type="number"
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={`Current: ${goal.currentValue}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Note (optional)
                </label>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Add a note about your progress..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateProgress}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Update
                </button>
                <button
                  onClick={() => {
                    setShowProgressUpdate(false)
                    setProgressValue(goal.currentValue.toString())
                    setProgressNote('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Delete Goal</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete "{goal.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(GoalCardComponent)

