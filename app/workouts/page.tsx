'use client'

import { useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { Dumbbell, List, Play, History, Search } from 'lucide-react'
import ExerciseLibrary from '@/components/ExerciseLibrary'
import RoutineBuilder from '@/components/RoutineBuilder'
import type { Routine } from '@/types/workout'

export const dynamic = 'force-dynamic'

type WorkoutView = 'routines' | 'active' | 'history' | 'exercises'

export default function WorkoutsPage() {
  const { user } = useFirestoreStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentView, setCurrentView] = useState<WorkoutView>('routines')
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(false)
  const [routines, setRoutines] = useState<Routine[]>([])

  const views = [
    { id: 'routines' as WorkoutView, label: 'My Routines', icon: List },
    { id: 'active' as WorkoutView, label: 'Active Workout', icon: Play },
    { id: 'history' as WorkoutView, label: 'History', icon: History },
    { id: 'exercises' as WorkoutView, label: 'Exercises', icon: Search },
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Dumbbell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workouts</h1>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Build routines, track workouts, and achieve your fitness goals
                  </p>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-1 overflow-x-auto">
                    {views.map((view) => {
                      const Icon = view.icon
                      const isActive = currentView === view.id
                      return (
                        <button
                          key={view.id}
                          onClick={() => setCurrentView(view.id)}
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

                {/* Content Area */}
                <div className="mt-6">
                  {currentView === 'routines' && (
                    <div>
                      {showRoutineBuilder ? (
                        <RoutineBuilder
                          onSave={(routine) => {
                            // TODO: Save to Firestore
                            console.log('Saving routine:', routine)
                            alert('Routine saved! (Firestore integration coming soon)')
                            setShowRoutineBuilder(false)
                            // After saving, reload routines
                          }}
                          onCancel={() => setShowRoutineBuilder(false)}
                        />
                      ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Routines</h2>
                            <button
                              onClick={() => setShowRoutineBuilder(true)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              + Create Routine
                            </button>
                          </div>
                          {routines.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                              <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                              <p>No routines yet. Create your first workout routine!</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {routines.map((routine) => (
                                <div
                                  key={routine.id}
                                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                                >
                                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    {routine.name}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {routine.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{routine.exercises.length} exercises</span>
                                    <span>~{routine.estimatedDuration} min</span>
                                    <span className="capitalize">{routine.difficulty}</span>
                                    <span className="capitalize">{routine.goal}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {currentView === 'active' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Workout</h2>
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No active workout. Start a routine to begin tracking!</p>
                        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                          Start Workout
                        </button>
                      </div>
                    </div>
                  )}

                  {currentView === 'history' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Workout History</h2>
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No workout history yet. Complete your first workout to see it here!</p>
                      </div>
                    </div>
                  )}

                  {currentView === 'exercises' && (
                    <ExerciseLibrary />
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

