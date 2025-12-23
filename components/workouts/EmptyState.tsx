'use client'

import { Dumbbell } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  message: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon: Icon = Dumbbell,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      <Icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
      <p>{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

