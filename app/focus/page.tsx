'use client'

import { useState, useEffect, useRef } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { useFocusStore } from '@/store/useFocusStore'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Timer, Play, Pause, Square, Target, TrendingUp, Clock, X } from 'lucide-react'
import { format } from 'date-fns'
import type { FocusSession } from '@/types'

type SessionType = 'pomodoro' | 'short-break' | 'long-break' | 'custom'

const SESSION_DURATIONS: Record<SessionType, number> = {
  pomodoro: 25 * 60, // 25 minutes
  'short-break': 5 * 60, // 5 minutes
  'long-break': 15 * 60, // 15 minutes
  custom: 0, // User-defined
}

export default function FocusPage() {
  const { user, habits, addXP } = useFirestoreStore()
  const {
    sessions,
    isLoadingSessions,
    stats,
    subscribeSessions,
    addSession,
    updateSession,
    loadStats,
    unsubscribe,
  } = useFocusStore()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [sessionType, setSessionType] = useState<SessionType>('pomodoro')
  const [customDuration, setCustomDuration] = useState(25) // minutes
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATIONS.pomodoro)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null)
  const [distractions, setDistractions] = useState(0)
  const [distractionNotes, setDistractionNotes] = useState<string[]>([])
  const [showDistractionModal, setShowDistractionModal] = useState(false)
  const [newDistractionNote, setNewDistractionNote] = useState('')
  const [linkedHabitId, setLinkedHabitId] = useState<string>('')
  const [showSessionHistory, setShowSessionHistory] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (user?.id) {
      const cleanup = subscribeSessions(user.id)
      loadStats(user.id)
      return cleanup
    }
    return undefined
  }, [user?.id, subscribeSessions, loadStats])

  useEffect(() => {
    return () => {
      unsubscribe()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [unsubscribe])

  // Initialize audio for notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
      // Use a simple beep sound (you can replace with actual audio file)
      audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZURAJR6Tj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQYxh9Hz04IzBh5uwO/jmVEQCUek4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC'
    }
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startSession = async () => {
    if (!user?.id) return

    const duration = sessionType === 'custom' ? customDuration * 60 : SESSION_DURATIONS[sessionType]
    
    const sessionData: Omit<FocusSession, 'id' | 'userId' | 'createdAt'> = {
      type: sessionType,
      duration,
      completedDuration: 0,
      isCompleted: false,
      distractions: 0,
      distractionNotes: [],
      linkedHabitId: linkedHabitId || undefined,
      xpReward: sessionType === 'pomodoro' ? 10 : sessionType === 'long-break' ? 5 : 0,
      startedAt: new Date(),
    }

    try {
      const sessionId = await addSession(user.id, sessionData)
      const newSession: FocusSession = {
        ...sessionData,
        id: sessionId,
        userId: user.id,
        createdAt: new Date(),
      }
      setCurrentSession(newSession)
      setTimeRemaining(duration)
      setIsRunning(true)
      setIsPaused(false)
      setDistractions(0)
      setDistractionNotes([])
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  const pauseSession = () => {
    setIsPaused(true)
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const resumeSession = () => {
    setIsPaused(false)
    setIsRunning(true)
  }

  const stopSession = async () => {
    if (!currentSession || !user?.id) return

    try {
      await updateSession(user.id, currentSession.id, {
        completedDuration: currentSession.duration - timeRemaining,
        distractions,
        distractionNotes,
        isCompleted: timeRemaining === 0,
        completedAt: new Date(),
      })

      // Award XP if session completed
      if (timeRemaining === 0 && currentSession.xpReward) {
        await addXP(currentSession.xpReward)
      }

      // Update linked habit if exists
      if (currentSession.linkedHabitId && timeRemaining === 0) {
        const habit = habits.find((h) => h.id === currentSession.linkedHabitId)
        if (habit) {
          // Complete the habit for today
          const { completeHabit: completeHabitFn } = useFirestoreStore.getState()
          await completeHabitFn(habit.id)
        }
      }

      // Play completion sound
      if (timeRemaining === 0 && audioRef.current) {
        audioRef.current.play().catch(() => {
          // Ignore audio play errors
        })
      }

      setCurrentSession(null)
      setIsRunning(false)
      setIsPaused(false)
      setTimeRemaining(SESSION_DURATIONS[sessionType])
      setDistractions(0)
      setDistractionNotes([])
      loadStats(user.id)
    } catch (error) {
      console.error('Failed to stop session:', error)
    }
  }

  const addDistraction = () => {
    setDistractions(distractions + 1)
    setShowDistractionModal(true)
  }

  const saveDistractionNote = () => {
    if (newDistractionNote.trim()) {
      setDistractionNotes([...distractionNotes, newDistractionNote.trim()])
      setNewDistractionNote('')
    }
    setShowDistractionModal(false)
  }

  // Timer countdown
  useEffect(() => {
    if (isRunning && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer finished
            setIsRunning(false)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            // Auto-complete session
            setTimeout(() => {
              stopSession()
            }, 100)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, isPaused, timeRemaining])

  // Update session duration when type changes
  useEffect(() => {
    if (!currentSession) {
      const duration = sessionType === 'custom' ? customDuration * 60 : SESSION_DURATIONS[sessionType]
      setTimeRemaining(duration)
    }
  }, [sessionType, customDuration, currentSession])

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const recentSessions = sessions.slice(0, 10)
  const todaySessions = sessions.filter(
    (s) => format(new Date(s.startedAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  )

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Timer className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    Focus Timer
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Stay focused and track your productivity sessions
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Timer Section */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Session Type Selector */}
                    {!currentSession && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Select Session Type
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          {(['pomodoro', 'short-break', 'long-break', 'custom'] as SessionType[]).map((type) => (
                            <button
                              key={type}
                              onClick={() => setSessionType(type)}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                sessionType === type
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                              }`}
                            >
                              <div className="font-semibold capitalize mb-1">
                                {type === 'short-break' ? 'Short Break' : type === 'long-break' ? 'Long Break' : type}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {type === 'custom' ? 'Custom' : formatDuration(SESSION_DURATIONS[type])}
                              </div>
                            </button>
                          ))}
                        </div>

                        {sessionType === 'custom' && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Duration (minutes)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="120"
                              value={customDuration}
                              onChange={(e) => setCustomDuration(parseInt(e.target.value) || 1)}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        )}

                        {/* Link to Habit */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Link to Habit (Optional)
                          </label>
                          <select
                            value={linkedHabitId}
                            onChange={(e) => setLinkedHabitId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">None</option>
                            {habits
                              .filter((h) => h.isActive)
                              .map((habit) => (
                                <option key={habit.id} value={habit.id}>
                                  {habit.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <button
                          onClick={startSession}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-5 h-5" />
                          Start Session
                        </button>
                      </div>
                    )}

                    {/* Active Timer */}
                    {currentSession && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                        <div className="text-center">
                          <div className="text-7xl font-bold text-purple-600 dark:text-purple-400 mb-6">
                            {formatTime(timeRemaining)}
                          </div>

                          <div className="flex items-center justify-center gap-4 mb-6">
                            {!isRunning && !isPaused && (
                              <button
                                onClick={startSession}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Play className="w-5 h-5" />
                                Start
                              </button>
                            )}

                            {isRunning && (
                              <button
                                onClick={pauseSession}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Pause className="w-5 h-5" />
                                Pause
                              </button>
                            )}

                            {isPaused && (
                              <button
                                onClick={resumeSession}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Play className="w-5 h-5" />
                                Resume
                              </button>
                            )}

                            <button
                              onClick={stopSession}
                              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <Square className="w-5 h-5" />
                              Stop
                            </button>
                          </div>

                          <div className="flex items-center justify-center gap-4 mb-4">
                            <button
                              onClick={addDistraction}
                              className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1"
                            >
                              <X className="w-4 h-4" />
                              Add Distraction ({distractions})
                            </button>
                          </div>

                          {distractionNotes.length > 0 && (
                            <div className="mt-4 text-left">
                              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Distraction Notes:
                              </h3>
                              <ul className="space-y-1">
                                {distractionNotes.map((note, idx) => (
                                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                                    • {note}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Session History */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Recent Sessions
                        </h2>
                        <button
                          onClick={() => setShowSessionHistory(!showSessionHistory)}
                          className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          {showSessionHistory ? 'Hide' : 'Show All'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(showSessionHistory ? sessions : recentSessions).map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white capitalize">
                                {session.type === 'short-break' ? 'Short Break' : session.type === 'long-break' ? 'Long Break' : session.type}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {format(new Date(session.startedAt), 'MMM d, yyyy HH:mm')}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {formatDuration(session.completedDuration)}
                              </div>
                              {session.isCompleted && session.xpReward && (
                                <div className="text-sm text-green-600 dark:text-green-400">+{session.xpReward} XP</div>
                              )}
                            </div>
                          </div>
                        ))}
                        {sessions.length === 0 && !isLoadingSessions && (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                            No sessions yet. Start your first focus session!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats Sidebar */}
                  <div className="space-y-6">
                    {/* Today's Stats */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Today's Progress
                      </h2>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {todaySessions.length}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Focus Time</div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatDuration(
                              todaySessions.reduce((acc, s) => acc + s.completedDuration, 0)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Overall Stats */}
                    {stats && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Overall Stats
                        </h2>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {stats.totalSessions}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Focus Time</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatDuration(stats.totalFocusTime)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Session</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatDuration(Math.round(stats.averageSessionDuration))}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Distractions</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {stats.totalDistractions}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Distraction Modal */}
        {showDistractionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Add Distraction Note
              </h3>
              <textarea
                value={newDistractionNote}
                onChange={(e) => setNewDistractionNote(e.target.value)}
                placeholder="What distracted you?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={saveDistractionNote}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowDistractionModal(false)
                    setNewDistractionNote('')
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}

