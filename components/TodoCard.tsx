'use client'

import React, { useState, memo } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, Circle, Trash2, Edit2, X, Calendar, Tag, Zap } from 'lucide-react'
import { Todo } from '@/types'

interface TodoCardProps {
  todo: Todo
  onEdit?: (todo: Todo) => void
  onComplete: (todoId: string) => void
  onDelete: (todoId: string) => void
}

const priorityColors = {
  urgent: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  important: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
  'nice-to-have': 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
}

const priorityLabels = {
  urgent: 'Urgent',
  important: 'Important',
  'nice-to-have': 'Nice to Have',
}

function TodoCardComponent({ todo, onEdit, onComplete, onDelete }: TodoCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    onDelete(todo.id)
    setShowDeleteConfirm(false)
  }

  const isOverdue = todo.dueDate && !todo.isCompleted && new Date(todo.dueDate) < new Date()

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        todo.isCompleted
          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
          : priorityColors[todo.priority]
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onComplete(todo.id)}
          className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          aria-label={todo.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {todo.isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold text-gray-900 dark:text-white ${
                  todo.isCompleted ? 'line-through' : ''
                }`}
              >
                {todo.title}
              </h3>
              {todo.description && (
                <p
                  className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${
                    todo.isCompleted ? 'line-through' : ''
                  }`}
                >
                  {todo.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {todo.xpReward && todo.xpReward > 0 && (
                <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                  <Zap className="w-3 h-3" />
                  <span>{todo.xpReward} XP</span>
                </div>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(todo)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  aria-label="Edit todo"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Delete todo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className={`px-2 py-0.5 rounded font-medium ${
              todo.priority === 'urgent'
                ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                : todo.priority === 'important'
                ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
            }`}>
              {priorityLabels[todo.priority]}
            </span>

            {todo.category && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>{todo.category}</span>
              </div>
            )}

            {todo.dueDate && (
              <div className={`flex items-center gap-1 ${
                isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : ''
              }`}>
                <Calendar className="w-3 h-3" />
                <span>
                  {format(new Date(todo.dueDate), 'MMM d, yyyy')}
                  {isOverdue && ' (Overdue)'}
                </span>
              </div>
            )}

            {todo.recurring && (
              <span className="text-xs">
                🔁 {todo.recurring.type} (every {todo.recurring.interval || 1})
              </span>
            )}

            {todo.tags && todo.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {todo.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {todo.completedAt && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Completed: {format(new Date(todo.completedAt), 'MMM d, yyyy HH:mm')}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Todo?</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <span className="font-semibold">"{todo.title}"</span>?
              This action cannot be undone.
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
    </div>
  )
}

export default memo(TodoCardComponent)

