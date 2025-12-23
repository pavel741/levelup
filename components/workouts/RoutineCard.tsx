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
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {routine.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {routine.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
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
              {routine.sessions.map((session, idx) => (
                <div key={idx}>
                  <span className="font-medium">{session.name}:</span>{' '}
                  {session.exercises.length} exercises (~{session.estimatedDuration} min)
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onStart(routine)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
          >
            <Play className="w-4 h-4" />
            Start
          </button>
          <button
            onClick={() => onEdit(routine)}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors text-sm"
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
