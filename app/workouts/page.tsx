'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { Dumbbell, List, Play, History, Search, Sparkles, X, UtensilsCrossed } from 'lucide-react'
import ExerciseLibrary from '@/components/ExerciseLibrary'
import RoutineBuilder from '@/components/RoutineBuilder'
import ActiveWorkoutView from '@/components/ActiveWorkoutView'
import WorkoutHistory from '@/components/WorkoutHistory'
import AIRoutineGenerator from '@/components/AIRoutineGenerator'
import MealPlanner from '@/components/MealPlanner'
import { ROUTINE_TEMPLATES } from '@/lib/routineTemplates'
import { subscribeToRoutines, saveRoutine, deleteRoutine, subscribeToWorkoutLogs, deleteWorkoutLog } from '@/lib/workoutApi'
import type { Routine, WorkoutLog } from '@/types/workout'

export const dynamic = 'force-dynamic'

type WorkoutView = 'routines' | 'active' | 'history' | 'exercises' | 'meals'

export default function WorkoutsPage() {
  const { user } = useFirestoreStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentView, setCurrentView] = useState<WorkoutView>('routines')
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [routines, setRoutines] = useState<Routine[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<Routine> | null>(null)
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(false)

  // Subscribe to routines
  useEffect(() => {
    if (!user?.id) return

    let unsubscribeRoutines: (() => void) | null = null
    let unsubscribeLogs: (() => void) | null = null

    unsubscribeRoutines = subscribeToRoutines(user.id, (routines) => {
      setRoutines(routines)
    })

    unsubscribeLogs = subscribeToWorkoutLogs(user.id, (logs) => {
      setWorkoutLogs(logs)
    })

    return () => {
      if (unsubscribeRoutines) unsubscribeRoutines()
      if (unsubscribeLogs) unsubscribeLogs()
    }
  }, [user?.id])

  const views = [
    { id: 'routines' as WorkoutView, label: 'My Routines', icon: List },
    { id: 'active' as WorkoutView, label: 'Active Workout', icon: Play },
    { id: 'history' as WorkoutView, label: 'History', icon: History },
    { id: 'exercises' as WorkoutView, label: 'Exercises', icon: Search },
    { id: 'meals' as WorkoutView, label: 'Meal Planner', icon: UtensilsCrossed },
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
                          initialRoutine={editingRoutine || selectedTemplate || undefined}
                          onSave={async (routineData) => {
                            if (!user?.id) return
                            
                            try {
                              const routine: Routine = {
                                ...routineData,
                                id: editingRoutine?.id || `routine_${Date.now()}`,
                                userId: user.id,
                                createdAt: editingRoutine?.createdAt || new Date(),
                                updatedAt: new Date(),
                              }
                              await saveRoutine(routine)
                              setShowRoutineBuilder(false)
                              setSelectedTemplate(null)
                              setEditingRoutine(null)
                            } catch (error) {
                              console.error('Error saving routine:', error)
                              alert('Failed to save routine. Please try again.')
                            }
                          }}
                          onCancel={() => {
                            setShowRoutineBuilder(false)
                            setSelectedTemplate(null)
                            setEditingRoutine(null)
                          }}
                        />
                      ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Routines</h2>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowAIGenerator(true)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium flex items-center gap-2"
                              >
                                <Sparkles className="w-4 h-4" />
                                AI Generator
                              </button>
                              <button
                                onClick={() => setShowTemplates(true)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
                              >
                                <Sparkles className="w-4 h-4" />
                                Templates
                              </button>
                              <button
                                onClick={() => setShowRoutineBuilder(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                + Create Routine
                              </button>
                            </div>
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
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        {routine.name}
                                      </h3>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        {routine.description}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        <span>{routine.sessions?.length || routine.exercises.length} {routine.sessions ? 'days' : 'exercises'}</span>
                                        <span>~{routine.estimatedDuration} min</span>
                                        <span className="capitalize">{routine.difficulty}</span>
                                        <span className="capitalize">{routine.goal}</span>
                                      </div>
                                      {routine.sessions && routine.sessions.length > 0 && (
                                        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 mb-2">
                                          {routine.sessions.map((session, idx) => (
                                            <div key={idx}>
                                              <span className="font-medium">{session.name}:</span> {session.exercises.length} exercises (~{session.estimatedDuration} min)
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                      <button
                                        onClick={() => {
                                          setActiveRoutine(routine)
                                          setCurrentView('active')
                                        }}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
                                      >
                                        <Play className="w-4 h-4" />
                                        Start
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingRoutine(routine)
                                          setShowRoutineBuilder(true)
                                        }}
                                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (confirm('Delete this routine?') && user?.id) {
                                            try {
                                              await deleteRoutine(routine.id, user.id)
                                            } catch (error) {
                                              console.error('Error deleting routine:', error)
                                              alert('Failed to delete routine.')
                                            }
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors text-sm"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Generator Modal */}
                  {showAIGenerator && (
                    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
                        <AIRoutineGenerator
                          onRoutineGenerated={(routine) => {
                            // Routine is already saved by AIRoutineGenerator (auto-saved)
                            console.log('Routine generated callback:', routine)
                            // Don't close immediately - let user see the routine and optionally save again
                            // The Firestore subscription will automatically update the routines list
                          }}
                          onClose={() => {
                            setShowAIGenerator(false)
                            // Routines list will auto-update via Firestore subscription
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Templates Modal */}
                  {showTemplates && (
                    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Routine Templates</h2>
                          <button
                            onClick={() => setShowTemplates(false)}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Choose a pre-built routine template to get started. You can customize it after loading.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {ROUTINE_TEMPLATES.map((template, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {template.name}
                                </h3>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  template.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                  template.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {template.difficulty}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {template.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                <span>{template.sessions?.length || template.exercises.length} {template.sessions ? 'days' : 'exercises'}</span>
                                <span>~{template.estimatedDuration} min</span>
                                <span className="capitalize">{template.goal}</span>
                              </div>
                              {template.sessions && template.sessions.length > 0 && (
                                <div className="mb-3 space-y-1">
                                  {template.sessions.map((session, sessionIndex) => (
                                    <div key={sessionIndex} className="text-xs text-gray-600 dark:text-gray-300">
                                      <span className="font-medium">{session.name}:</span> {session.exercises.length} exercises (~{session.estimatedDuration} min)
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="mt-3 flex flex-wrap gap-1">
                                {template.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  setShowTemplates(false)
                                  // Load template into builder
                                  const templateRoutine: Partial<Routine> = {
                                    ...template,
                                    isTemplate: true,
                                    isPublic: false,
                                    createdBy: 'system',
                                    rating: undefined,
                                    timesUsed: undefined
                                  }
                                  setShowRoutineBuilder(true)
                                  // We'll need to pass this to RoutineBuilder
                                  // For now, we'll use a state to store selected template
                                  setSelectedTemplate(templateRoutine)
                                }}
                                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                Use This Template
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentView === 'active' && (
                    <div>
                      {activeRoutine ? (
                        <ActiveWorkoutView
                          routine={activeRoutine}
                          onComplete={(logId) => {
                            setActiveRoutine(null)
                            setCurrentView('history')
                            // Show success message
                          }}
                          onCancel={() => {
                            if (confirm('Cancel this workout? Progress will be lost.')) {
                              setActiveRoutine(null)
                            }
                          }}
                        />
                      ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Workout</h2>
                          {routines.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                              <p>No routines yet. Create a routine first!</p>
                              <button
                                onClick={() => {
                                  setCurrentView('routines')
                                  setShowRoutineBuilder(true)
                                }}
                                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                Create Routine
                              </button>
                            </div>
                          ) : (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                              <p>Select a routine to start your workout!</p>
                              <button
                                onClick={() => setCurrentView('routines')}
                                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                Choose Routine
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {currentView === 'history' && (
                    <div>
                      <div className="mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Workout History</h2>
                      </div>
                      <WorkoutHistory
                        logs={workoutLogs}
                        onDelete={async (logId) => {
                          if (!user?.id) return
                          try {
                            await deleteWorkoutLog(logId, user.id)
                          } catch (error) {
                            console.error('Error deleting workout log:', error)
                            alert('Failed to delete workout.')
                          }
                        }}
                      />
                    </div>
                  )}

                  {currentView === 'exercises' && (
                    <ExerciseLibrary />
                  )}
                  {currentView === 'meals' && user?.id && (
                    <MealPlanner userId={user.id} />
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

