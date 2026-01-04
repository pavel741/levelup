'use client'

import { useState, useEffect, useMemo } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { subscribeToSavingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, getSavingsGoals } from '@/lib/savingsGoalsApi'
import { getAllTransactionsForSummary } from '@/lib/financeApi'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Target, Plus, Edit2, Trash2, TrendingUp, Calendar, X, Wallet, ArrowRight } from 'lucide-react'
import type { SavingsGoal, FinanceTransaction } from '@/types/finance'
import { formatCurrency } from '@/lib/utils'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default function SavingsGoalsPage() {
  const { user } = useFirestoreStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [allocationMode, setAllocationMode] = useState<'proportional' | 'specific'>('proportional')
  const [selectedGoalId, setSelectedGoalId] = useState<string>('')
  const [isAllocating, setIsAllocating] = useState(false)
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: '',
    icon: '',
    color: '#6366f1',
  })

  const goalCategories = [
    { value: 'vacation', label: 'Vacation', icon: '🏖️' },
    { value: 'emergency', label: 'Emergency Fund', icon: '🆘' },
    { value: 'house', label: 'House', icon: '🏠' },
    { value: 'car', label: 'Car', icon: '🚗' },
    { value: 'education', label: 'Education', icon: '🎓' },
    { value: 'wedding', label: 'Wedding', icon: '💍' },
    { value: 'retirement', label: 'Retirement', icon: '💰' },
    { value: 'other', label: 'Other', icon: '🎯' },
  ]

  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToSavingsGoals(user.id, (goalsList) => {
      setGoals(goalsList)
      setIsLoading(false)
    })

    // Load transactions for balance calculation
    getAllTransactionsForSummary(user.id).then(txs => {
      setTransactions(txs)
    }).catch(err => {
      console.error('Error loading transactions:', err)
    })

    return () => {
      unsubscribe()
    }
  }, [user?.id])

  // Calculate current month balance
  const monthlyBalance = useMemo(() => {
    const now = new Date()
    const startDate = startOfMonth(now)
    const endDate = endOfMonth(now)
    
    let income = 0
    let expenses = 0
    
    transactions.forEach(tx => {
      const txDate = parseTransactionDate(tx.date)
      if (txDate >= startDate && txDate <= endDate) {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        
        if (type === 'income' || amount > 0) {
          income += Math.abs(amount)
        } else {
          expenses += Math.abs(amount)
        }
      }
    })
    
    return {
      income,
      expenses,
      balance: income - expenses,
    }
  }, [transactions])

  const handleAddGoal = async () => {
    if (!newGoal.name.trim() || !newGoal.targetAmount || !user?.id) return

    try {
      const goalId = await addSavingsGoal(user.id, {
        name: newGoal.name.trim(),
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: parseFloat(newGoal.currentAmount) || 0,
        targetDate: newGoal.targetDate ? parseTransactionDate(newGoal.targetDate) : undefined,
        category: newGoal.category || undefined,
        icon: newGoal.icon || undefined,
        color: newGoal.color,
      })

      // Optimistically add the goal to the list
      const newGoalData: SavingsGoal = {
        id: goalId,
        userId: user.id,
        name: newGoal.name.trim(),
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: parseFloat(newGoal.currentAmount) || 0,
        targetDate: newGoal.targetDate ? parseTransactionDate(newGoal.targetDate) : undefined,
        category: newGoal.category || undefined,
        icon: newGoal.icon || undefined,
        color: newGoal.color,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setGoals(prev => [...prev, newGoalData])

      // Manually refetch to ensure we have the latest data
      const { getSavingsGoals } = await import('@/lib/savingsGoalsApi')
      getSavingsGoals(user.id).then(updatedGoals => {
        setGoals(updatedGoals)
      }).catch(err => {
        console.error('Error refetching goals:', err)
      })

      setShowAddModal(false)
      setNewGoal({
        name: '',
        targetAmount: '',
        currentAmount: '',
        targetDate: '',
        category: '',
        icon: '',
        color: '#6366f1',
      })
    } catch (error) {
      console.error('Failed to add savings goal:', error)
    }
  }

  const handleEditGoal = async () => {
    if (!editingGoal || !user?.id) return

    try {
      await updateSavingsGoal(user.id, editingGoal.id, {
        name: editingGoal.name,
        targetAmount: editingGoal.targetAmount,
        currentAmount: editingGoal.currentAmount,
        targetDate: editingGoal.targetDate ? parseTransactionDate(editingGoal.targetDate) : undefined,
        category: editingGoal.category,
        icon: editingGoal.icon,
        color: editingGoal.color,
      })

      setShowEditModal(false)
      setEditingGoal(null)
    } catch (error) {
      console.error('Failed to update savings goal:', error)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!user?.id || !confirm('Are you sure you want to delete this savings goal?')) return

    try {
      await deleteSavingsGoal(user.id, goalId)
    } catch (error) {
      console.error('Failed to delete savings goal:', error)
    }
  }

  const getProgressPercentage = (goal: SavingsGoal): number => {
    if (goal.targetAmount === 0) return 0
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
  }

  const getDaysRemaining = (goal: SavingsGoal): number | null => {
    if (!goal.targetDate) return null
    const targetDate = parseTransactionDate(goal.targetDate)
    const today = new Date()
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getMonthlyContribution = (goal: SavingsGoal): number | null => {
    const daysRemaining = getDaysRemaining(goal)
    if (!daysRemaining || daysRemaining <= 0) return null
    const remaining = goal.targetAmount - goal.currentAmount
    if (remaining <= 0) return 0
    const monthsRemaining = daysRemaining / 30
    return remaining / Math.max(1, monthsRemaining)
  }

  const handleAllocateBalance = async () => {
    if (!user?.id || monthlyBalance.balance <= 0) return
    
    setIsAllocating(true)
    try {
      const availableBalance = monthlyBalance.balance
      
      if (allocationMode === 'proportional') {
        // Allocate proportionally based on remaining amounts needed
        const activeGoals = goals.filter(g => {
          const remaining = g.targetAmount - g.currentAmount
          return remaining > 0
        })
        
        if (activeGoals.length === 0) {
          alert('No active goals with remaining balance needed')
          setIsAllocating(false)
          return
        }
        
        const totalRemaining = activeGoals.reduce((sum, g) => sum + (g.targetAmount - g.currentAmount), 0)
        
        for (const goal of activeGoals) {
          const remaining = goal.targetAmount - goal.currentAmount
          const proportion = remaining / totalRemaining
          const allocation = Math.min(remaining, availableBalance * proportion)
          
          if (allocation > 0) {
            await updateSavingsGoal(user.id, goal.id, {
              currentAmount: goal.currentAmount + allocation,
            })
          }
        }
      } else {
        // Allocate to specific goal
        if (!selectedGoalId) {
          alert('Please select a goal')
          setIsAllocating(false)
          return
        }
        
        const goal = goals.find(g => g.id === selectedGoalId)
        if (!goal) {
          alert('Goal not found')
          setIsAllocating(false)
          return
        }
        
        const remaining = goal.targetAmount - goal.currentAmount
        const allocation = Math.min(remaining, availableBalance)
        
        if (allocation > 0) {
          await updateSavingsGoal(user.id, goal.id, {
            currentAmount: goal.currentAmount + allocation,
          })
        }
      }
      
      // Refetch goals to get updated data
      const updatedGoals = await getSavingsGoals(user.id)
      setGoals(updatedGoals)
      
      setShowAllocateModal(false)
      setAllocationMode('proportional')
      setSelectedGoalId('')
      
      // Reload transactions to recalculate balance
      const txs = await getAllTransactionsForSummary(user.id)
      setTransactions(txs)
    } catch (error) {
      console.error('Failed to allocate balance:', error)
      alert('Failed to allocate balance. Please try again.')
    } finally {
      setIsAllocating(false)
    }
  }

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
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      Savings Goals
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Set and track your savings targets
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {monthlyBalance.balance > 0 && (
                      <button
                        onClick={() => setShowAllocateModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Wallet className="w-5 h-5" />
                        Allocate Balance ({formatCurrency(monthlyBalance.balance)})
                      </button>
                    )}
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      New Goal
                    </button>
                  </div>
                </div>

                {/* Monthly Balance Card */}
                {monthlyBalance.balance !== 0 && (
                  <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          Current Month Balance
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(startOfMonth(new Date()), 'MMMM yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${monthlyBalance.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(monthlyBalance.balance)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Income: {formatCurrency(monthlyBalance.income)} • Expenses: {formatCurrency(monthlyBalance.expenses)}
                        </div>
                      </div>
                    </div>
                    {monthlyBalance.balance > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          💡 You have a positive balance this month! Click "Allocate Balance" to add it to your savings goals.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Goals Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : goals.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                    <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No Savings Goals Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Create your first savings goal to start tracking your progress
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                      Create Goal
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal) => {
                      const progress = getProgressPercentage(goal)
                      const daysRemaining = getDaysRemaining(goal)
                      const monthlyContribution = getMonthlyContribution(goal)
                      const categoryInfo = goalCategories.find(c => c.value === goal.category)

                      return (
                        <div
                          key={goal.id}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4"
                          style={{ borderLeftColor: goal.color }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {categoryInfo && <span className="text-2xl">{categoryInfo.icon}</span>}
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                  {goal.name}
                                </h3>
                              </div>
                              {goal.category && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                  {categoryInfo?.label || goal.category}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingGoal(goal)
                                  setShowEditModal(true)
                                }}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Progress Bar with Milestones */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                              </span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                            <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                              {/* Progress fill */}
                              <div
                                className="h-full transition-all duration-300 rounded-full"
                                style={{
                                  width: `${Math.min(progress, 100)}%`,
                                  backgroundColor: goal.color,
                                }}
                              />
                              
                              {/* Milestone markers (25%, 50%, 75%, 100%) */}
                              {[25, 50, 75, 100].map((milestone) => {
                                const milestoneAmount = (goal.targetAmount * milestone) / 100
                                const isCompleted = goal.currentAmount >= milestoneAmount
                                return (
                                  <div
                                    key={milestone}
                                    className={`absolute top-0 bottom-0 w-0.5 ${
                                      isCompleted
                                        ? 'bg-green-500 dark:bg-green-400'
                                        : 'bg-gray-400 dark:bg-gray-500 opacity-50'
                                    }`}
                                    style={{ left: `${milestone}%` }}
                                    title={`${milestone}% milestone: ${formatCurrency(milestoneAmount)}`}
                                  />
                                )
                              })}
                            </div>
                            
                            {/* Milestone labels */}
                            <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-500">
                              {[25, 50, 75, 100].map((milestone) => {
                                const milestoneAmount = (goal.targetAmount * milestone) / 100
                                const isCompleted = goal.currentAmount >= milestoneAmount
                                return (
                                  <span
                                    key={milestone}
                                    className={isCompleted ? 'text-green-600 dark:text-green-400 font-semibold' : ''}
                                  >
                                    {milestone}%
                                  </span>
                                )
                              })}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(goal.targetAmount - goal.currentAmount)}
                              </span>
                            </div>
                            {goal.targetDate && daysRemaining !== null && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Target Date:
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {format(parseTransactionDate(goal.targetDate), 'MMM d, yyyy')}
                                </span>
                              </div>
                            )}
                            {daysRemaining !== null && daysRemaining > 0 && monthlyContribution !== null && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <TrendingUp className="w-4 h-4" />
                                  Monthly needed:
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {formatCurrency(monthlyContribution)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>

        {/* Add Goal Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">New Savings Goal</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    placeholder="e.g., Vacation to Hawaii"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Amount
                    </label>
                    <input
                      type="number"
                      value={newGoal.targetAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Amount
                    </label>
                    <input
                      type="number"
                      value={newGoal.currentAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => {
                      const category = goalCategories.find(c => c.value === e.target.value)
                      setNewGoal({ ...newGoal, category: e.target.value, icon: category?.icon || '' })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select category</option>
                    {goalCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newGoal.color}
                    onChange={(e) => setNewGoal({ ...newGoal, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddGoal}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Create Goal
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Goal Modal */}
        {showEditModal && editingGoal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Savings Goal</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingGoal(null)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={editingGoal.name}
                    onChange={(e) => setEditingGoal({ ...editingGoal, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Amount
                    </label>
                    <input
                      type="number"
                      value={editingGoal.targetAmount}
                      onChange={(e) => setEditingGoal({ ...editingGoal, targetAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Amount
                    </label>
                    <input
                      type="number"
                      value={editingGoal.currentAmount}
                      onChange={(e) => setEditingGoal({ ...editingGoal, currentAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={editingGoal.targetDate ? format(parseTransactionDate(editingGoal.targetDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditingGoal({ ...editingGoal, targetDate: e.target.value ? new Date(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editingGoal.category || ''}
                    onChange={(e) => {
                      const category = goalCategories.find(c => c.value === e.target.value)
                      setEditingGoal({ ...editingGoal, category: e.target.value || undefined, icon: category?.icon || undefined })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select category</option>
                    {goalCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={editingGoal.color || '#6366f1'}
                    onChange={(e) => setEditingGoal({ ...editingGoal, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleEditGoal}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingGoal(null)
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Allocate Balance Modal */}
        {showAllocateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Allocate Balance to Savings</h3>
                <button
                  onClick={() => {
                    setShowAllocateModal(false)
                    setAllocationMode('proportional')
                    setSelectedGoalId('')
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available Balance</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(monthlyBalance.balance)}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allocation Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={allocationMode === 'proportional'}
                      onChange={() => setAllocationMode('proportional')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Proportional (distribute based on remaining amounts needed)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={allocationMode === 'specific'}
                      onChange={() => setAllocationMode('specific')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      To Specific Goal
                    </span>
                  </label>
                </div>
              </div>

              {allocationMode === 'specific' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Goal
                  </label>
                  <select
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a goal</option>
                    {goals
                      .filter(g => g.targetAmount - g.currentAmount > 0)
                      .map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.name} (Remaining: {formatCurrency(goal.targetAmount - goal.currentAmount)})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {allocationMode === 'proportional' && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Allocation Preview:
                  </div>
                  <div className="space-y-1 text-sm">
                    {goals
                      .filter(g => g.targetAmount - g.currentAmount > 0)
                      .map((goal) => {
                        const totalRemaining = goals
                          .filter(g => g.targetAmount - g.currentAmount > 0)
                          .reduce((sum, g) => sum + (g.targetAmount - g.currentAmount), 0)
                        const remaining = goal.targetAmount - goal.currentAmount
                        const proportion = remaining / totalRemaining
                        const allocation = Math.min(remaining, monthlyBalance.balance * proportion)
                        return (
                          <div key={goal.id} className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>{goal.name}:</span>
                            <span className="font-semibold">{formatCurrency(allocation)}</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAllocateModal(false)
                    setAllocationMode('proportional')
                    setSelectedGoalId('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAllocateBalance}
                  disabled={isAllocating || (allocationMode === 'specific' && !selectedGoalId)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isAllocating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Allocating...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Allocate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}

