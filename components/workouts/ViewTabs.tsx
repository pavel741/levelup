'use client'

import { List, Play, History, Search, UtensilsCrossed, TrendingUp, Ruler } from 'lucide-react'

type WorkoutView = 'routines' | 'active' | 'history' | 'exercises' | 'meals' | 'analyze' | 'measurements'

interface ViewTabsProps {
  currentView: WorkoutView
  onViewChange: (view: WorkoutView) => void
}

const VIEWS = [
  { id: 'routines' as WorkoutView, label: 'My Routines', icon: List },
  { id: 'active' as WorkoutView, label: 'Active Workout', icon: Play },
  { id: 'history' as WorkoutView, label: 'History', icon: History },
  { id: 'exercises' as WorkoutView, label: 'Exercises', icon: Search },
  { id: 'meals' as WorkoutView, label: 'Meal Planner', icon: UtensilsCrossed },
  { id: 'measurements' as WorkoutView, label: 'Measurements', icon: Ruler },
  { id: 'analyze' as WorkoutView, label: 'Analyze', icon: TrendingUp },
]

export default function ViewTabs({ currentView, onViewChange }: ViewTabsProps) {
  return (
    <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
      <nav className="flex space-x-1 overflow-x-auto">
        {VIEWS.map((view) => {
          const Icon = view.icon
          const isActive = currentView === view.id
          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{view.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export type { WorkoutView }

