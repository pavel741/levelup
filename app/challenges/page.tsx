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
import { format } from 'date-fns'
import { useFinanceChallengeUpdater } from '@/hooks/useFinanceChallengeUpdater'

export default function ChallengesPage() {
  const { challenges, activeChallenges, addChallenge, updateChallenge, user, habits } = useFirestoreStore()
  
  // Auto-update finance challenge progress when transactions change
  useFinanceChallengeUpdater()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    type: 'habit' as 'habit' | 'distraction' | 'goal' | 'community' | 'finance',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    xpReward: 100,
    duration: 7,
    requirements: [''],
    habitIds: [] as string[], // Selected habit IDs to link to challenge
    startDate: format(new Date(), 'yyyy-MM-dd'), // Default to today
    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // Default to 7 days from today
    // Finance-specific fields
    financeGoalType: undefined as 'savings_rate' | 'spending_limit' | 'savings_amount' | 'no_spend_days' | undefined,
    financeTarget: undefined as number | undefined,
    financeTargetPercentage: undefined as number | undefined,
    financePeriod: 'challenge_duration' as 'daily' | 'weekly' | 'monthly' | 'challenge_duration',
  })
  const availableChallenges = challenges.filter(
    (c) => !activeChallenges.some((ac) => ac.id === c.id)
  )

  const handleAddChallenge = () => {
    if (!newChallenge.title.trim() || !user) return

    // Validate finance challenge fields
    if (newChallenge.type === 'finance') {
      if (!newChallenge.financeGoalType) {
        alert('Please select a finance goal type')
        return
      }
      if (newChallenge.financeGoalType === 'savings_rate' && (!newChallenge.financeTargetPercentage || newChallenge.financeTargetPercentage <= 0)) {
        alert('Please enter a valid savings rate percentage (e.g., 15 for 15%)')
        return
      }
      if ((newChallenge.financeGoalType === 'spending_limit' || newChallenge.financeGoalType === 'savings_amount' || newChallenge.financeGoalType === 'no_spend_days') && (!newChallenge.financeTarget || newChallenge.financeTarget <= 0)) {
        alert(`Please enter a valid target ${newChallenge.financeGoalType === 'no_spend_days' ? 'number of days' : 'amount'}`)
        return
      }
    }

    // Validate duration and XP reward
    const duration = newChallenge.duration && newChallenge.duration >= 1 ? newChallenge.duration : 7
    const xpReward = newChallenge.xpReward && newChallenge.xpReward >= 10 ? newChallenge.xpReward : 100

    // Use provided dates or calculate from duration
    const startDate = newChallenge.startDate ? new Date(newChallenge.startDate) : new Date()
    const endDate = newChallenge.endDate ? new Date(newChallenge.endDate) : (() => {
      const calculatedEnd = new Date(startDate)
      calculatedEnd.setDate(calculatedEnd.getDate() + duration)
      return calculatedEnd
    })()
    
    // Validate that end date is after start date
    if (endDate <= startDate) {
      alert('End date must be after start date')
      return
    }

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
      // Finance-specific fields
      financeGoalType: newChallenge.financeGoalType,
      financeTarget: newChallenge.financeTarget,
      financeTargetPercentage: newChallenge.financeTargetPercentage,
      financePeriod: newChallenge.financePeriod,
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
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      financeGoalType: undefined,
      financeTarget: undefined,
      financeTargetPercentage: undefined,
      financePeriod: 'challenge_duration',
    })
    setShowAddModal(false)
  }

  const handleEditChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge)
    const startDate = challenge.startDate instanceof Date 
      ? format(challenge.startDate, 'yyyy-MM-dd')
      : format(new Date(challenge.startDate), 'yyyy-MM-dd')
    const endDate = challenge.endDate instanceof Date 
      ? format(challenge.endDate, 'yyyy-MM-dd')
      : format(new Date(challenge.endDate), 'yyyy-MM-dd')
    
    setNewChallenge({
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      difficulty: challenge.difficulty,
      xpReward: challenge.xpReward,
      duration: challenge.duration,
      requirements: challenge.requirements.length > 0 ? challenge.requirements : [''],
      habitIds: challenge.habitIds || [],
      startDate: startDate,
      endDate: endDate,
      financeGoalType: challenge.financeGoalType,
      financeTarget: challenge.financeTarget,
      financeTargetPercentage: challenge.financeTargetPercentage,
      financePeriod: challenge.financePeriod || 'challenge_duration',
    })
    setShowEditModal(true)
  }

  const handleUpdateChallenge = () => {
    if (!editingChallenge || !newChallenge.title.trim() || !user) return

    // Validate duration and XP reward
    const duration = newChallenge.duration && newChallenge.duration >= 1 ? newChallenge.duration : 7
    const xpReward = newChallenge.xpReward && newChallenge.xpReward >= 10 ? newChallenge.xpReward : 100

    // Use provided dates or calculate from duration
    const startDate = newChallenge.startDate ? new Date(newChallenge.startDate) : new Date()
    const endDate = newChallenge.endDate ? new Date(newChallenge.endDate) : (() => {
      const calculatedEnd = new Date(startDate)
      calculatedEnd.setDate(calculatedEnd.getDate() + duration)
      return calculatedEnd
    })()
    
    // Validate that end date is after start date
    if (endDate <= startDate) {
      alert('End date must be after start date')
      return
    }

    updateChallenge(editingChallenge.id, {
      title: newChallenge.title,
      description: newChallenge.description,
      type: newChallenge.type,
      difficulty: newChallenge.difficulty,
      xpReward: xpReward,
      duration: duration,
      requirements: newChallenge.requirements.filter((r) => r.trim() !== ''),
      habitIds: newChallenge.habitIds.length > 0 ? newChallenge.habitIds : undefined,
      startDate,
      endDate,
      // Finance-specific fields
      financeGoalType: newChallenge.financeGoalType,
      financeTarget: newChallenge.financeTarget,
      financeTargetPercentage: newChallenge.financeTargetPercentage,
      financePeriod: newChallenge.financePeriod,
    })

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
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      financeGoalType: undefined,
      financeTarget: undefined,
      financeTargetPercentage: undefined,
      financePeriod: 'challenge_duration',
    })
    setShowEditModal(false)
    setEditingChallenge(null)
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
                      <ChallengeCard key={challenge.id} challenge={challenge} onEdit={handleEditChallenge} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Challenges</h2>
                {availableChallenges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableChallenges.map((challenge) => (
                      <ChallengeCard key={challenge.id} challenge={challenge} onEdit={handleEditChallenge} />
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
                    onChange={(e) => {
                      const newType = e.target.value as any
                      setNewChallenge({ 
                        ...newChallenge, 
                        type: newType,
                        // Reset finance fields when switching away from finance type
                        financeGoalType: newType === 'finance' ? newChallenge.financeGoalType : undefined,
                        financeTarget: newType === 'finance' ? newChallenge.financeTarget : undefined,
                        financeTargetPercentage: newType === 'finance' ? newChallenge.financeTargetPercentage : undefined,
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="habit">Habit</option>
                    <option value="distraction">Distraction</option>
                    <option value="goal">Goal</option>
                    <option value="community">Community</option>
                    <option value="finance">Finance</option>
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
                          // Auto-update end date based on duration
                          const startDate = newChallenge.startDate ? new Date(newChallenge.startDate) : new Date()
                          const newEndDate = new Date(startDate)
                          newEndDate.setDate(newEndDate.getDate() + numValue)
                          setNewChallenge({ 
                            ...newChallenge, 
                            duration: numValue,
                            endDate: format(newEndDate, 'yyyy-MM-dd')
                          })
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value)
                      if (!value || value < 1) {
                        const startDate = newChallenge.startDate ? new Date(newChallenge.startDate) : new Date()
                        const newEndDate = new Date(startDate)
                        newEndDate.setDate(newEndDate.getDate() + 7)
                        setNewChallenge({ 
                          ...newChallenge, 
                          duration: 7,
                          endDate: format(newEndDate, 'yyyy-MM-dd')
                        })
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    max="365"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Duration will auto-update end date
                  </p>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newChallenge.startDate}
                    onChange={(e) => {
                      setNewChallenge({ ...newChallenge, startDate: e.target.value })
                      // Auto-update end date if it becomes invalid
                      if (newChallenge.endDate && e.target.value >= newChallenge.endDate) {
                        const newEndDate = new Date(e.target.value)
                        newEndDate.setDate(newEndDate.getDate() + newChallenge.duration)
                        setNewChallenge({ 
                          ...newChallenge, 
                          startDate: e.target.value,
                          endDate: format(newEndDate, 'yyyy-MM-dd')
                        })
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newChallenge.endDate}
                    onChange={(e) => setNewChallenge({ ...newChallenge, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={newChallenge.startDate || format(new Date(), 'yyyy-MM-dd')}
                  />
                  {newChallenge.endDate && newChallenge.startDate && newChallenge.endDate <= newChallenge.startDate && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      End date must be after start date
                    </p>
                  )}
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

      {/* Edit Challenge Modal */}
      {showEditModal && editingChallenge && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-2xl w-full shadow-xl my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Edit Challenge</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingChallenge(null)
                  setNewChallenge({
                    title: '',
                    description: '',
                    type: 'habit',
                    difficulty: 'medium',
                    xpReward: 100,
                    duration: 7,
                    requirements: [''],
                    habitIds: [],
                    startDate: format(new Date(), 'yyyy-MM-dd'),
                    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                    financeGoalType: undefined,
                    financeTarget: undefined,
                    financeTargetPercentage: undefined,
                    financePeriod: 'challenge_duration',
                  })
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-2 -mr-2">
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
                    onChange={(e) => {
                      const newType = e.target.value as any
                      setNewChallenge({ 
                        ...newChallenge, 
                        type: newType,
                        // Reset finance fields when switching away from finance type
                        financeGoalType: newType === 'finance' ? newChallenge.financeGoalType : undefined,
                        financeTarget: newType === 'finance' ? newChallenge.financeTarget : undefined,
                        financeTargetPercentage: newType === 'finance' ? newChallenge.financeTargetPercentage : undefined,
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="habit">Habit</option>
                    <option value="distraction">Distraction</option>
                    <option value="goal">Goal</option>
                    <option value="community">Community</option>
                    <option value="finance">Finance</option>
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
                          // Auto-update end date based on duration
                          const startDate = newChallenge.startDate ? new Date(newChallenge.startDate) : new Date()
                          const newEndDate = new Date(startDate)
                          newEndDate.setDate(newEndDate.getDate() + numValue)
                          setNewChallenge({ 
                            ...newChallenge, 
                            duration: numValue,
                            endDate: format(newEndDate, 'yyyy-MM-dd')
                          })
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value)
                      if (!value || value < 1) {
                        const startDate = newChallenge.startDate ? new Date(newChallenge.startDate) : new Date()
                        const newEndDate = new Date(startDate)
                        newEndDate.setDate(newEndDate.getDate() + 7)
                        setNewChallenge({ 
                          ...newChallenge, 
                          duration: 7,
                          endDate: format(newEndDate, 'yyyy-MM-dd')
                        })
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    max="365"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Duration will auto-update end date
                  </p>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newChallenge.startDate}
                    onChange={(e) => {
                      setNewChallenge({ ...newChallenge, startDate: e.target.value })
                      // Auto-update end date if it becomes invalid
                      if (newChallenge.endDate && e.target.value >= newChallenge.endDate) {
                        const newEndDate = new Date(e.target.value)
                        newEndDate.setDate(newEndDate.getDate() + newChallenge.duration)
                        setNewChallenge({ 
                          ...newChallenge, 
                          startDate: e.target.value,
                          endDate: format(newEndDate, 'yyyy-MM-dd')
                        })
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newChallenge.endDate}
                    onChange={(e) => setNewChallenge({ ...newChallenge, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={newChallenge.startDate || format(new Date(), 'yyyy-MM-dd')}
                  />
                  {newChallenge.endDate && newChallenge.startDate && newChallenge.endDate <= newChallenge.startDate && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      End date must be after start date
                    </p>
                  )}
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
              
              {/* Finance Challenge Fields */}
              {newChallenge.type === 'finance' && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Finance Goal Settings</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Goal Type
                    </label>
                    <select
                      value={newChallenge.financeGoalType || ''}
                      onChange={(e) => setNewChallenge({ 
                        ...newChallenge, 
                        financeGoalType: e.target.value as any || undefined 
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select goal type...</option>
                      <option value="savings_rate">Savings Rate (%)</option>
                      <option value="spending_limit">Spending Limit</option>
                      <option value="savings_amount">Savings Amount</option>
                      <option value="no_spend_days">No-Spend Days</option>
                    </select>
                  </div>

                  {newChallenge.financeGoalType === 'savings_rate' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Savings Rate (%)
                      </label>
                      <input
                        type="number"
                        value={newChallenge.financeTargetPercentage || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value)
                          setNewChallenge({ ...newChallenge, financeTargetPercentage: value })
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., 15 for 15%"
                        min="0"
                        max="100"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Target percentage of income to save (e.g., 15 = save 15% of income)
                      </p>
                    </div>
                  )}

                  {(newChallenge.financeGoalType === 'spending_limit' || newChallenge.financeGoalType === 'savings_amount') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Target Amount (€)
                        </label>
                        <input
                          type="number"
                          value={newChallenge.financeTarget || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : parseFloat(e.target.value)
                            setNewChallenge({ ...newChallenge, financeTarget: value })
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="e.g., 1000"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {newChallenge.financeGoalType === 'spending_limit' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Period
                          </label>
                          <select
                            value={newChallenge.financePeriod}
                            onChange={(e) => setNewChallenge({ 
                              ...newChallenge, 
                              financePeriod: e.target.value as any 
                            })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="challenge_duration">Entire Challenge</option>
                          </select>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Spending limit applies per selected period
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {newChallenge.financeGoalType === 'no_spend_days' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target No-Spend Days
                      </label>
                      <input
                        type="number"
                        value={newChallenge.financeTarget || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value)
                          setNewChallenge({ ...newChallenge, financeTarget: value })
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., 10"
                        min="1"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Number of days with zero expenses during the challenge
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Habit Linking - only show for non-finance challenges */}
              {newChallenge.type !== 'finance' && (
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
              )}
            </div>
            <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingChallenge(null)
                  setNewChallenge({
                    title: '',
                    description: '',
                    type: 'habit',
                    difficulty: 'medium',
                    xpReward: 100,
                    duration: 7,
                    requirements: [''],
                    habitIds: [],
                    startDate: format(new Date(), 'yyyy-MM-dd'),
                    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                    financeGoalType: undefined,
                    financeTarget: undefined,
                    financeTargetPercentage: undefined,
                    financePeriod: 'challenge_duration',
                  })
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateChallenge}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}

