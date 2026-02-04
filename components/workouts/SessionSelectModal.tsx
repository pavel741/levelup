'use client'

import { useEffect } from 'react'
import { X, Play, Clock } from 'lucide-react'
import type { Routine, RoutineSession } from '@/types/workout'

interface SessionSelectModalProps {
  isOpen: boolean
  routine: Routine | null
  onClose: () => void
  onSelectSession: (sessionId: string) => void
}

export default function SessionSelectModal({ isOpen, routine, onClose, onSelectSession }: SessionSelectModalProps) {
  const sessions = routine?.sessions || []

  // If only one session, auto-select it (safety check)
  useEffect(() => {
    if (isOpen && routine && sessions.length === 1) {
      onSelectSession(sessions[0].id)
    }
  }, [isOpen, routine, sessions.length, onSelectSession])

  if (!isOpen || !routine) return null

  // If only one session, don't show modal (will be auto-selected via useEffect)
  if (sessions.length <= 1) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Workout Day</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{routine.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-4 sm:p-6">
          <div className="space-y-3">
            {sessions.map((session: RoutineSession) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {session.name}
                      </h3>
                      <Play className="w-4 h-4 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''}</span>
                      {session.estimatedDuration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          ~{session.estimatedDuration} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
