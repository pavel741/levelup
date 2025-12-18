'use client'

import { useState } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
export const dynamic = 'force-dynamic'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ChallengeCard from '@/components/ChallengeCard'
import { Trophy, Plus, X } from 'lucide-react'
import { Challenge } from '@/types'

export default function ChallengesPage() {
  const { challenges, activeChallenges, addChallenge, user, habits } = useFirestoreStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    type: 'habit' as 'habit' | 'distraction' | 'goal' | 'community',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    xpReward: 100,
    duration: 7,
    requirements: [''],
    habitIds: [] as string[], // Selected habit IDs to link to challenge
  })
  const availableChallenges = challenges.filter(
    (c) => !activeChallenges.some((ac) => ac.id === c.id)
  )

  const handleAddChallenge = () => {
    if (!newChallenge.title.trim() || !user) return

    // Validate duration and XP reward
    const duration = newChallenge.duration && newChallenge.duration >= 1 ? newChallenge.duration : 7
    const xpReward = newChallenge.xpReward && newChallenge.xpReward >= 10 ? newChallenge.xpReward : 100

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + duration)

    const challenge: Challenge = {
      id: Date.now().toString(),
      title: newChallenge.title,
      description: newChallenge.description,
      type: newChallenge.type,
      difficulty: newChallenge.difficulty,
      xpReward: xpReward,
      duration: duration,
      requirements: newChallenge.requirements.filter((r) => r.trim() !== ''),
      participants: [user.id], // Automatically join the challenge you create
      habitIds: newChallenge.habitIds.length > 0 ? newChallenge.habitIds : undefined,
      progress: { [user.id]: 0 }, // Initialize progress
      completedDates: { [user.id]: [] }, // Initialize completed dates
      startDate,
      endDate,
      isActive: true,
    }

    addChallenge(challenge)

    // Reset form
    setNewChallenge({
      title: '',
      description: '',
      type: 'habit',
      difficulty: 'medium',
      xpReward: 100,
      duration: 7,
      requirements: [''],
      habitIds: [],
    })
    setShowAddModal(false)
  }

  const addRequirement = () => {
    setNewChallenge({
      ...newChallenge,
      requirements: [...newChallenge.requirements, ''],
    })
  }

  const updateRequirement = (index: number, value: string) => {
    const updated = [...newChallenge.requirements]
    updated[index] = value
    setNewChallenge({ ...newChallenge, requirements: updated })
  }

  const removeRequirement = (index: number) => {
    const updated = newChallenge.requirements.filter((_, i) => i !== index)
    setNewChallenge({ ...newChallenge, requirements: updated.length > 0 ? updated : [''] })
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Challenges</h1>
                  <p className="text-gray-600 dark:text-gray-400">Create and join challenges to earn bonus XP and level up faster</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Create Challenge
                </button>
              </div>

              {activeChallenges.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">My Active Challenges</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeChallenges.map((challenge) => (
                      <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Challenges</h2>
                {availableChallenges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableChallenges.map((challenge) => (
                      <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No available challenges</h3>
                    <p className="text-gray-600 dark:text-gray-400">Check back later for new challenges!</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      </div>

      {/* Create Challenge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Challenge</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Challenge Title</label>
                <input
                  type="text"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., 30-Day Fitness Challenge"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Describe your challenge..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select
                    value={newChallenge.type}
                    onChange={(e) => setNewChallenge({ ...newChallenge, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="habit">Habit</option>
                    <option value="distraction">Distraction</option>
                    <option value="goal">Goal</option>
                    <option value="community">Community</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                  <select
                    value={newChallenge.difficulty}
                    onChange={(e) => setNewChallenge({ ...newChallenge, difficulty: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (days)</label>
                  <input
                    type="number"
                    value={newChallenge.duration === 0 ? '' : newChallenge.duration}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        setNewChallenge({ ...newChallenge, duration: 0 })
                      } else {
                        const numValue = parseInt(value)
                        if (!isNaN(numValue)) {
                          setNewChallenge({ ...newChallenge, duration: numValue })
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value)
                      if (!value || value < 1) {
                        setNewChallenge({ ...newChallenge, duration: 7 })
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    max="365"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">XP Reward</label>
                  <input
                    type="number"
                    value={newChallenge.xpReward === 0 ? '' : newChallenge.xpReward}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        setNewChallenge({ ...newChallenge, xpReward: 0 })
                      } else {
                        const numValue = parseInt(value)
                        if (!isNaN(numValue)) {
                          setNewChallenge({ ...newChallenge, xpReward: numValue })
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value)
                      if (!value || value < 10) {
                        setNewChallenge({ ...newChallenge, xpReward: 100 })
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="10"
                    max="1000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Requirements</label>
                <div className="space-y-2">
                  {newChallenge.requirements.map((req, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder={`Requirement ${index + 1}`}
                      />
                      {newChallenge.requirements.length > 1 && (
                        <button
                          onClick={() => removeRequirement(index)}
                          className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addRequirement}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Add Requirement
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link Habits <span className="text-xs text-gray-500 dark:text-gray-400">(optional)</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Select habits that will automatically count towards this challenge when completed
                </p>
                {habits.filter(h => h.isActive).length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                    {habits.filter(h => h.isActive).map((habit) => (
                      <label
                        key={habit.id}
                        className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newChallenge.habitIds.includes(habit.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewChallenge({
                                ...newChallenge,
                                habitIds: [...newChallenge.habitIds, habit.id],
                              })
                            } else {
                              setNewChallenge({
                                ...newChallenge,
                                habitIds: newChallenge.habitIds.filter(id => id !== habit.id),
                              })
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-2xl">{habit.icon}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{habit.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    No active habits available. Create habits first to link them to challenges.
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddChallenge}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}

