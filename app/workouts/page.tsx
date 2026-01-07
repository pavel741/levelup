'use client'

import { useState, useEffect, useCallback } from 'react'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { Dumbbell, Sparkles, Play } from 'lucide-react'
// Lazy load heavy components for better performance
import nextDynamic from 'next/dynamic'
import { CardSkeleton, ListSkeleton } from '@/components/ui/Skeleton'

const ExerciseLibrary = nextDynamic(() => import('@/components/ExerciseLibrary'), {
  loading: () => <ListSkeleton items={5} />,
})
const RoutineBuilder = nextDynamic(() => import('@/components/RoutineBuilder'), {
  loading: () => <CardSkeleton />,
})
const ActiveWorkoutView = nextDynamic(() => import('@/components/ActiveWorkoutView'), {
  loading: () => <CardSkeleton />,
})
const WorkoutHistory = nextDynamic(() => import('@/components/WorkoutHistory'), {
  loading: () => <ListSkeleton items={5} />,
})
const MealPlanner = nextDynamic(() => import('@/components/MealPlanner'), {
  loading: () => <CardSkeleton />,
})
const BodyMeasurements = nextDynamic(() => import('@/components/BodyMeasurements'), {
  loading: () => <CardSkeleton />,
})
const RoutineAnalyzer = nextDynamic(() => import('@/components/RoutineAnalyzer'), {
  loading: () => <CardSkeleton />,
})
import RoutineCard from '@/components/workouts/RoutineCard'
import TemplateModal from '@/components/workouts/TemplateModal'
import ViewTabs, { type WorkoutView } from '@/components/workouts/ViewTabs'
import EmptyState from '@/components/workouts/EmptyState'
import { saveRoutine, deleteRoutine, deleteWorkoutLog, getWorkoutLogs } from '@/lib/workoutApi'
import { useWorkoutStore } from '@/store/useWorkoutStore'
import type { Routine, WorkoutLog } from '@/types/workout'
import { showError } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default function WorkoutsPage() {
  const { user } = useFirestoreStore()
  const { subscribeRoutines, loadWorkoutLogs } = useWorkoutStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentView, setCurrentView] = useState<WorkoutView>('routines')
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [routines, setRoutines] = useState<Routine[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<Routine> | null>(null)
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(true)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  // Subscribe to routines using workout store
  useEffect(() => {
    if (!user?.id) return

    setIsLoadingRoutines(true)
    const unsubscribe = subscribeRoutines(user.id)
    // Also load workout logs for analysis
    loadWorkoutLogs(user.id)

    // Subscribe to store changes
    const unsubscribeStore = useWorkoutStore.subscribe(
      (state) => {
        setRoutines(state.routines)
        setIsLoadingRoutines(state.isLoadingRoutines)
      }
    )

    return () => {
      unsubscribe()
      unsubscribeStore()
    }
  }, [user?.id, subscribeRoutines, loadWorkoutLogs])

  // Lazy load workout logs only when viewing history
  useEffect(() => {
    if (currentView === 'history' && user?.id) {
      setIsLoadingLogs(true)
      getWorkoutLogs(user.id)
        .then((logs) => {
          setWorkoutLogs(logs)
          setIsLoadingLogs(false)
        })
        .catch((error) => {
          console.error('Error refreshing workout logs:', error)
          setIsLoadingLogs(false)
        })
    }
  }, [currentView, user?.id])

  // Handler functions
  const handleSaveRoutine = useCallback(async (routineData: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
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
      showError(error, { component: 'WorkoutsPage', action: 'saveRoutine' })
    }
  }, [user?.id, editingRoutine])

  const handleCancelRoutineBuilder = useCallback(() => {
    setShowRoutineBuilder(false)
    setSelectedTemplate(null)
    setEditingRoutine(null)
  }, [])

  const handleStartRoutine = useCallback((routine: Routine) => {
    setActiveRoutine(routine)
    setCurrentView('active')
  }, [])

  const handleEditRoutine = useCallback((routine: Routine) => {
    setEditingRoutine(routine)
    setShowRoutineBuilder(true)
  }, [])

  const handleDeleteRoutine = useCallback(async (routineId: string) => {
    if (!user?.id) return

    try {
      await deleteRoutine(routineId, user.id)
    } catch (error) {
      console.error('Error deleting routine:', error)
      showError(error, { component: 'WorkoutsPage', action: 'deleteRoutine' })
    }
  }, [user?.id])

  const handleSelectTemplate = useCallback((template: Partial<Routine>) => {
    setSelectedTemplate(template)
    setShowRoutineBuilder(true)
  }, [])

  const handleDeleteWorkoutLog = useCallback(async (logId: string) => {
    if (!user?.id) return

    try {
      // Optimistically remove from UI immediately
      setWorkoutLogs((prevLogs) => prevLogs.filter((log) => log.id !== logId))
      // Then delete from database
      await deleteWorkoutLog(logId, user.id)
    } catch (error) {
      console.error('Error deleting workout log:', error)
      // Re-fetch logs to restore state if deletion failed
      const logs = await getWorkoutLogs(user.id)
      setWorkoutLogs(logs)
      showError('Failed to delete workout.', { component: 'WorkoutsPage', action: 'deleteWorkoutLog' })
    }
  }, [user?.id])

  const handleWorkoutComplete = useCallback(() => {
    setActiveRoutine(null)
    setCurrentView('history')
  }, [])

  const handleWorkoutCancel = useCallback(() => {
    if (confirm('Cancel this workout? Progress will be lost.')) {
      setActiveRoutine(null)
    }
  }, [])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Workouts</h1>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Build routines, track workouts, and achieve your fitness goals
                  </p>
                </div>

                {/* Navigation Tabs */}
                <ViewTabs currentView={currentView} onViewChange={setCurrentView} />

                {/* Content Area */}
                <div className="mt-6">
                  {currentView === 'routines' && (
                    <>
                      {showRoutineBuilder ? (
                        <RoutineBuilder
                          initialRoutine={editingRoutine || selectedTemplate || undefined}
                          onSave={handleSaveRoutine}
                          onCancel={handleCancelRoutineBuilder}
                        />
                      ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="mb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">My Routines</h2>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={() => setShowTemplates(true)}
                                  className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  <span>Templates</span>
                                </button>
                                <button
                                  onClick={() => setShowRoutineBuilder(true)}
                                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm sm:text-base"
                                >
                                  + Create Routine
                                </button>
                              </div>
                            </div>
                          </div>
                          {isLoadingRoutines ? (
                            <ListSkeleton items={5} />
                          ) : routines.length === 0 ? (
                            <EmptyState
                              message="No routines yet. Create your first workout routine!"
                              actionLabel="Create Routine"
                              onAction={() => setShowRoutineBuilder(true)}
                            />
                          ) : (
                            <div className="space-y-2 sm:space-y-3">
                              {routines.map((routine) => (
                                <RoutineCard
                                  key={routine.id}
                                  routine={routine}
                                  onStart={handleStartRoutine}
                                  onEdit={handleEditRoutine}
                                  onDelete={handleDeleteRoutine}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <TemplateModal
                    isOpen={showTemplates}
                    onClose={() => setShowTemplates(false)}
                    onSelectTemplate={handleSelectTemplate}
                  />

                  {currentView === 'active' && (
                    <>
                      {activeRoutine ? (
                        <ActiveWorkoutView
                          key={activeRoutine.id}
                          routine={activeRoutine}
                          onComplete={handleWorkoutComplete}
                          onCancel={handleWorkoutCancel}
                        />
                      ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Workout</h2>
                          {routines.length === 0 ? (
                            <EmptyState
                              icon={Dumbbell}
                              message="No routines yet. Create a routine first!"
                              actionLabel="Create Routine"
                              onAction={() => {
                                setCurrentView('routines')
                                setShowRoutineBuilder(true)
                              }}
                            />
                          ) : (
                            <EmptyState
                              icon={Play}
                              message="Select a routine to start your workout!"
                              actionLabel="Choose Routine"
                              onAction={() => setCurrentView('routines')}
                            />
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {currentView === 'history' && (
                    <div>
                      <div className="mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Workout History</h2>
                      </div>
                      {isLoadingLogs ? (
                        <ListSkeleton items={5} />
                      ) : (
                        <WorkoutHistory logs={workoutLogs} onDelete={handleDeleteWorkoutLog} />
                      )}
                    </div>
                  )}

                  {currentView === 'exercises' && <ExerciseLibrary />}
                  {currentView === 'meals' && user?.id && <MealPlanner userId={user.id} />}
                  {currentView === 'measurements' && user?.id && <BodyMeasurements userId={user.id} />}
                  {currentView === 'analyze' && <RoutineAnalyzer />}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
