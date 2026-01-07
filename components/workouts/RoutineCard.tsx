'use client'

import { memo } from 'react'
import { Play, X } from 'lucide-react'
import type { Routine } from '@/types/workout'

interface RoutineCardProps {
  routine: Routine
  onStart: (routine: Routine) => void
  onEdit: (routine: Routine) => void
  onDelete: (routineId: string) => Promise<void>
}

function RoutineCardComponent({ routine, onStart, onEdit, onDelete }: RoutineCardProps) {
  const handleDelete = async () => {
    if (confirm('Delete this routine?')) {
      await onDelete(routine.id)
    }
  }

  return (
    <div className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white mb-1 break-words">
            {routine.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {routine.description}
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>
              {routine.sessions?.length || routine.exercises.length}{' '}
              {routine.sessions ? 'days' : 'exercises'}
            </span>
            <span>~{routine.estimatedDuration} min</span>
            <span className="capitalize">{routine.difficulty}</span>
            <span className="capitalize">{routine.goal}</span>
          </div>
          {routine.sessions && routine.sessions.length > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 mb-2">
              {routine.sessions.slice(0, 2).map((session, idx) => (
                <div key={idx}>
                  <span className="font-medium">{session.name}:</span>{' '}
                  {session.exercises.length} exercises (~{session.estimatedDuration} min)
                </div>
              ))}
              {routine.sessions.length > 2 && (
                <div className="text-gray-500 dark:text-gray-400">
                  +{routine.sessions.length - 2} more session{routine.sessions.length - 2 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 sm:ml-4 flex-shrink-0">
          <button
            onClick={() => onStart(routine)}
            className="flex-1 sm:flex-none px-3 sm:px-3 py-2 sm:py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-1"
          >
            <Play className="w-4 h-4" />
            <span className="sm:hidden">Start</span>
          </button>
          <button
            onClick={() => onEdit(routine)}
            className="px-3 py-2 sm:py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 transition-colors text-sm"
            aria-label="Edit routine"
          >
            <span className="hidden sm:inline">Edit</span>
            <span className="sm:hidden">✏️</span>
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-2 sm:py-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 active:bg-red-300 dark:active:bg-red-900/40 transition-colors text-sm"
            aria-label="Delete routine"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Memoize to prevent unnecessary re-renders when parent re-renders
export default memo(RoutineCardComponent)
