'use client'

import { useMemo, useRef, memo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Target, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { FinanceTransaction, BudgetCategoryLimit } from '@/types/finance'
import { calculateBudgetAnalysis } from '@/lib/budgetAnalysis'
import { formatCurrency } from '@/lib/utils'

interface BudgetVsActualDashboardProps {
  transactions: FinanceTransaction[]
  budgetGoals: BudgetCategoryLimit[]
  period?: 'monthly' | 'weekly'
  referenceDate?: Date
}

// Helper function to create a stable hash from transactions array
function getTransactionsKey(transactions: FinanceTransaction[]): string {
  if (transactions.length === 0) return 'empty'
  // Create a hash based on transaction IDs and amounts for relevant transactions
  // Only include transactions that might affect budget analysis (expenses)
  const relevantTxs = transactions
    .filter(tx => {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      return type === 'expense' || (type !== 'income' && amount < 0)
    })
    .slice(0, 100) // Limit to first 100 to avoid performance issues
    .map(tx => `${tx.id}:${tx.amount}:${tx.category || ''}`)
    .join('|')
  return `${transactions.length}-${relevantTxs.slice(0, 500)}` // Truncate for performance
}

// Helper function to create a stable hash from budgetGoals array
function getBudgetGoalsKey(budgetGoals: BudgetCategoryLimit[]): string {
  if (!budgetGoals || budgetGoals.length === 0) return 'empty'
  return budgetGoals
    .map(goal => `${goal.category}:${goal.monthlyLimit || 0}:${goal.weeklyLimit || 0}`)
    .sort()
    .join('|')
}

function BudgetVsActualDashboard({
  transactions,
  budgetGoals,
  period = 'monthly',
  referenceDate,
}: BudgetVsActualDashboardProps) {
  // Normalize referenceDate to prevent flickering - use a stable date based on the date value, not the object reference
  // Convert date to a string key for stable comparison
  const dateKey = useMemo(() => {
    if (!referenceDate) return 'default'
    return `${referenceDate.getFullYear()}-${referenceDate.getMonth()}-${referenceDate.getDate()}`
  }, [referenceDate])
  
  const normalizedReferenceDate = useMemo(() => {
    const dateToUse = referenceDate || new Date()
    // Create a normalized date with only year/month/day (no time) to ensure stability
    return new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate())
  }, [dateKey])
  
  // Create stable keys for transactions and budgetGoals to prevent unnecessary recalculations
  const transactionsKey = useMemo(() => getTransactionsKey(transactions), [transactions])
  const budgetGoalsKey = useMemo(() => getBudgetGoalsKey(budgetGoals), [budgetGoals])
  
  // Use refs to cache previous results and only recalculate when keys actually change
  const cacheRef = useRef<{
    keys: string
    result: ReturnType<typeof calculateBudgetAnalysis>
  }>({ keys: '', result: [] })
  
  const analysis = useMemo(() => {
    const currentKeys = `${transactionsKey}|${budgetGoalsKey}|${dateKey}|${period}`
    
    // If keys haven't changed, return cached result
    if (cacheRef.current.keys === currentKeys) {
      return cacheRef.current.result
    }
    
    // Keys changed, recalculate
    if (!budgetGoals || budgetGoals.length === 0) {
      cacheRef.current = { keys: currentKeys, result: [] }
      return []
    }
    
    const result = calculateBudgetAnalysis(transactions, budgetGoals, period, normalizedReferenceDate)
    cacheRef.current = { keys: currentKeys, result }
    return result
  }, [transactionsKey, budgetGoalsKey, dateKey, period, transactions, budgetGoals, normalizedReferenceDate])

  const chartData = useMemo(() => {
    return analysis.map((item) => ({
      category: item.category,
      budget: item.limit,
      actual: item.spent,
      remaining: item.remaining,
      percentageUsed: item.percentageUsed,
      isOverBudget: item.isOverBudget,
    }))
  }, [analysis])

  const overallStats = useMemo(() => {
    const totalBudget = analysis.reduce((sum, item) => sum + item.limit, 0)
    const totalSpent = analysis.reduce((sum, item) => sum + item.spent, 0)
    const totalRemaining = analysis.reduce((sum, item) => sum + item.remaining, 0)
    const averageUsage = analysis.length > 0
      ? analysis.reduce((sum, item) => sum + item.percentageUsed, 0) / analysis.length
      : 0
    const overBudgetCount = analysis.filter((item) => item.isOverBudget).length
    const onTrackCount = analysis.filter((item) => !item.isOverBudget && item.percentageUsed < 80).length
    const warningCount = analysis.filter((item) => !item.isOverBudget && item.percentageUsed >= 80).length

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      averageUsage,
      overBudgetCount,
      onTrackCount,
      warningCount,
      adherenceRate: totalBudget > 0 ? ((totalBudget - Math.max(0, totalSpent - totalBudget)) / totalBudget) * 100 : 100,
    }
  }, [analysis])

  if (!budgetGoals || budgetGoals.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budget vs Actual</h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No budget goals set. Set up budget limits to see budget vs actual analysis.</p>
        </div>
      </div>
    )
  }

  if (analysis.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budget vs Actual</h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No spending data for this period.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budget vs Actual</h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Budget</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(overallStats.totalBudget)}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Spent</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(overallStats.totalSpent)}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Remaining</p>
          <p className={`text-lg font-bold ${
            overallStats.totalRemaining >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(overallStats.totalRemaining)}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Adherence</p>
          <p className={`text-lg font-bold ${
            overallStats.adherenceRate >= 90
              ? 'text-green-600 dark:text-green-400'
              : overallStats.adherenceRate >= 70
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {overallStats.adherenceRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="flex gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {overallStats.onTrackCount} On Track
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {overallStats.warningCount} Warning
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {overallStats.overBudgetCount} Over Budget
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="category"
              angle={-45}
              textAnchor="end"
              height={100}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip
              formatter={(value: any) => {
                if (value === undefined || value === null) return ''
                const numValue = typeof value === 'number' ? value : parseFloat(value)
                if (isNaN(numValue)) return ''
                return formatCurrency(numValue)
              }}
            />
            <Bar dataKey="budget" fill="#3b82f6" name="Budget" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" fill="#8b5cf6" name="Actual" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Category Breakdown</h4>
        {analysis.map((item) => (
          <div key={item.category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-white">{item.category}</span>
              <span className={`text-sm font-semibold ${
                item.isOverBudget
                  ? 'text-red-600 dark:text-red-400'
                  : item.percentageUsed >= 80
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {item.percentageUsed.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    item.isOverBudget
                      ? 'bg-red-500'
                      : item.percentageUsed >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(item.percentageUsed, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Budget: {formatCurrency(item.limit)}</span>
              <span>Spent: {formatCurrency(item.spent)}</span>
              <span className={item.remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {item.remaining >= 0 ? 'Remaining' : 'Over'}: {formatCurrency(Math.abs(item.remaining))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export default memo(BudgetVsActualDashboard, (prevProps, nextProps) => {
  // Custom comparison function
  // Only re-render if transactions, budgetGoals, period, or referenceDate actually changed
  
  // Compare transactions by checking if the key would be different
  const prevTxKey = getTransactionsKey(prevProps.transactions)
  const nextTxKey = getTransactionsKey(nextProps.transactions)
  if (prevTxKey !== nextTxKey) return false
  
  // Compare budgetGoals
  const prevBgKey = getBudgetGoalsKey(prevProps.budgetGoals)
  const nextBgKey = getBudgetGoalsKey(nextProps.budgetGoals)
  if (prevBgKey !== nextBgKey) return false
  
  // Compare period
  if (prevProps.period !== nextProps.period) return false
  
  // Compare referenceDate
  const prevDateKey = prevProps.referenceDate 
    ? `${prevProps.referenceDate.getFullYear()}-${prevProps.referenceDate.getMonth()}-${prevProps.referenceDate.getDate()}`
    : 'default'
  const nextDateKey = nextProps.referenceDate
    ? `${nextProps.referenceDate.getFullYear()}-${nextProps.referenceDate.getMonth()}-${nextProps.referenceDate.getDate()}`
    : 'default'
  if (prevDateKey !== nextDateKey) return false
  
  // All props are the same, skip re-render
  return true
})

