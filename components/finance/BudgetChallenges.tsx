'use client'

import { useState, useEffect, useMemo } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { getCategories } from '@/lib/financeApi'
import type { Challenge, FinanceCategories } from '@/types'
import { format, addDays } from 'date-fns'
import { Target, Plus, X, TrendingDown } from 'lucide-react'
// Note: showSuccess/showError should be imported from your notification system
// For now, using console.log - replace with your notification system
const showSuccess = (message: string) => {
  console.log('Success:', message)
  // TODO: Replace with actual notification system
}
const showError = (error: unknown, _context?: string) => {
  console.error('Error:', error)
  // TODO: Replace with actual notification system
}

interface BudgetChallengesProps {
  transactions: any[]
}

export default function BudgetChallenges({ transactions }: BudgetChallengesProps) {
  const { user, challenges } = useFirestoreStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [financeChallenges, setFinanceChallenges] = useState<Challenge[]>([])

  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    category: '',
    targetPercentage: 20, // e.g., spend 20% less
    duration: 30, // days
    startDate: format(new Date(), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    if (user?.id) {
      // Load categories
      getCategories(user.id).then((cats: FinanceCategories | null) => {
        if (cats?.expense) {
          setCategories(Object.keys(cats.expense))
        }
      })

      // Filter finance challenges
      const finance = challenges.filter(
        (c) => c.type === 'finance' && c.isActive && c.financeGoalType === 'spending_limit'
      )
      setFinanceChallenges(finance)
    }
  }, [user?.id, challenges])

  const handleCreateChallenge = async () => {
    if (!user || !newChallenge.title.trim() || !newChallenge.category) return

    try {
      const challenge: Challenge = {
        id: Date.now().toString(),
        title: newChallenge.title.trim(),
        description: newChallenge.description.trim() || `Spend ${newChallenge.targetPercentage}% less on ${newChallenge.category} this month`,
        type: 'finance',
        difficulty: 'medium',
        xpReward: 100,
        duration: newChallenge.duration,
        requirements: [`Reduce ${newChallenge.category} spending by ${newChallenge.targetPercentage}%`],
        participants: [user.id],
        progress: { [user.id]: 0 },
        completedDates: { [user.id]: [] },
        startDate: new Date(newChallenge.startDate),
        endDate: addDays(new Date(newChallenge.startDate), newChallenge.duration),
        isActive: true,
        financeGoalType: 'spending_limit',
        financePeriod: 'monthly',
      }

      // Calculate target amount based on average spending
      const categoryTransactions = transactions.filter(
        (tx) => tx.category === newChallenge.category && (tx.type === 'expense' || Number(tx.amount) < 0)
      )
      const avgMonthlySpending = categoryTransactions.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0) / Math.max(1, categoryTransactions.length)
      const targetAmount = avgMonthlySpending * (1 - newChallenge.targetPercentage / 100)
      challenge.financeTarget = targetAmount

      await addChallenge(challenge)
      showSuccess('Budget challenge created!')
      setShowAddModal(false)
      setNewChallenge({
        title: '',
        description: '',
        category: '',
        targetPercentage: 20,
        duration: 30,
        startDate: format(new Date(), 'yyyy-MM-dd'),
      })
    } catch (error) {
      console.error('Error creating challenge:', error)
      showError(error, { component: 'BudgetChallenges', action: 'createChallenge' })
    }
  }

  // Calculate progress for each challenge
  const challengesWithProgress = useMemo(() => {
    return financeChallenges.map((challenge) => {
      if (!challenge.financeGoalType || challenge.financeGoalType !== 'spending_limit') {
        return { challenge, progress: 0, currentSpending: 0, targetSpending: challenge.financeTarget || 0 }
      }

      const now = new Date()
      const startDate = challenge.startDate instanceof Date ? challenge.startDate : new Date(challenge.startDate)
      const endDate = challenge.endDate instanceof Date ? challenge.endDate : new Date(challenge.endDate)

      // Get category from challenge description or requirements
      const categoryMatch = challenge.requirements?.[0]?.match(/Reduce (.+?) spending/)
      const category = categoryMatch ? categoryMatch[1] : ''

      // Calculate current spending in challenge period (only up to now, not future)
      const challengeTransactions = transactions.filter((tx) => {
        const txDate = typeof tx.date === 'string' ? new Date(tx.date) : tx.date
        const isExpense = (tx.type || '').toLowerCase() === 'expense' || Number(tx.amount) < 0
        const matchesCategory = category ? tx.category === category : true
        // Only count transactions up to now, not future dates
        return isExpense && matchesCategory && txDate >= startDate && txDate <= now
      })

      const currentSpending = challengeTransactions.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0)
      const targetSpending = challenge.financeTarget || 0

      // Calculate time elapsed vs total challenge duration
      const totalDurationMs = endDate.getTime() - startDate.getTime()
      const elapsedMs = now.getTime() - startDate.getTime()
      const timeProgress = Math.min(1, Math.max(0, elapsedMs / totalDurationMs)) // 0 to 1

      // Calculate expected spending at this point (proportional to time elapsed)
      const expectedSpendingAtThisPoint = targetSpending * timeProgress

      // Progress calculation: compare actual spending vs expected spending
      // If we've spent less than expected, we're ahead (progress > 0)
      // If we've spent more than expected, we're behind (progress < 0)
      let progress = 0
      if (expectedSpendingAtThisPoint > 0) {
        // Progress is based on how much we're under/over the expected spending
        const spendingRatio = currentSpending / expectedSpendingAtThisPoint
        // If spendingRatio < 1, we're under budget (good progress)
        // If spendingRatio > 1, we're over budget (negative progress)
        progress = Math.min(100, Math.max(0, (1 - spendingRatio) * 100))
      } else if (timeProgress === 0) {
        // Challenge just started
        progress = 100
      }

      // Also calculate completion status (whether we're on track to meet the goal)
      const projectedTotalSpending = timeProgress > 0 ? (currentSpending / timeProgress) : currentSpending
      const isOnTrack = projectedTotalSpending <= targetSpending

      return { 
        challenge, 
        progress: Math.max(0, Math.min(100, progress)), 
        currentSpending, 
        targetSpending,
        expectedSpendingAtThisPoint,
        timeProgress: timeProgress * 100,
        isOnTrack,
        projectedTotalSpending,
      }
    })
  }, [financeChallenges, transactions])

  if (!user) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Budget Challenges
          </h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Challenge
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Set challenges to reduce spending in specific categories
      </p>

      {/* Active Challenges */}
      {challengesWithProgress.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active budget challenges</p>
          <p className="text-sm mt-1">Create one to start saving!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {challengesWithProgress.map(({ 
            challenge, 
            progress, 
            currentSpending, 
            targetSpending,
            expectedSpendingAtThisPoint,
            timeProgress,
            isOnTrack,
            projectedTotalSpending,
          }) => {
            const now = new Date()
            const endDate = challenge.endDate instanceof Date ? challenge.endDate : new Date(challenge.endDate)
            const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            const isCompleted = now > endDate && currentSpending <= targetSpending
            const isOverBudget = projectedTotalSpending > targetSpending

            return (
              <div
                key={challenge.id}
                className={`border rounded-lg p-4 ${
                  isCompleted
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : isOverBudget
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : isOnTrack
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {challenge.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {challenge.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                      <span>{daysLeft} days left</span>
                      <span>{Math.round(timeProgress)}% of time elapsed</span>
                      <span>{challenge.xpReward} XP reward</span>
                    </div>
                  </div>
                  {isCompleted && (
                    <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium">
                      Completed! 🎉
                    </span>
                  )}
                  {!isCompleted && isOverBudget && (
                    <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium">
                      Over Budget ⚠️
                    </span>
                  )}
                  {!isCompleted && isOnTrack && !isOverBudget && (
                    <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium">
                      On Track ✓
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {isOnTrack ? 'Ahead of schedule' : isOverBudget ? 'Behind schedule' : 'Progress'}
                    </span>
                    <span className={`text-xs font-medium ${
                      isOnTrack ? 'text-green-600 dark:text-green-400' : 
                      isOverBudget ? 'text-red-600 dark:text-red-400' : 
                      'text-gray-700 dark:text-gray-300'
                    }`}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isCompleted
                          ? 'bg-green-600'
                          : isOverBudget
                          ? 'bg-red-600'
                          : isOnTrack
                          ? 'bg-green-600'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600'
                      }`}
                      style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-500">Spent: </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(currentSpending)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-500">Expected: </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(expectedSpendingAtThisPoint)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-500">Target: </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(targetSpending)}
                      </span>
                    </div>
                  </div>
                  {projectedTotalSpending !== currentSpending && (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      Projected total: {new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(projectedTotalSpending)}
                      {isOverBudget && (
                        <span className="text-red-600 dark:text-red-400 ml-1">
                          (over by {new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(projectedTotalSpending - targetSpending)})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Challenge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Budget Challenge</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Challenge Title
                </label>
                <input
                  type="text"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  placeholder="e.g., Reduce Dining Out"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={newChallenge.category}
                  onChange={(e) => setNewChallenge({ ...newChallenge, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reduce Spending By (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newChallenge.targetPercentage}
                  onChange={(e) =>
                    setNewChallenge({ ...newChallenge, targetPercentage: parseInt(e.target.value) || 20 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Target: Spend {newChallenge.targetPercentage}% less than average
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  min="7"
                  max="90"
                  value={newChallenge.duration}
                  onChange={(e) =>
                    setNewChallenge({ ...newChallenge, duration: parseInt(e.target.value) || 30 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChallenge}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <TrendingDown className="w-4 h-4" />
                  Create Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

