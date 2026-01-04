'use client'

import { useEffect, useState } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { getBudgetAnalysis } from '@/lib/budgetAnalysisApi'
import type { BudgetAnalysis } from '@/types/finance'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

interface BudgetDashboardProps {
  period?: 'monthly' | 'weekly'
  referenceDate?: Date
}

export default function BudgetDashboard({ period = 'monthly', referenceDate = new Date() }: BudgetDashboardProps) {
  const { user } = useFirestoreStore()
  const [analyses, setAnalyses] = useState<BudgetAnalysis[]>([])
  const [alerts, setAlerts] = useState<BudgetAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const loadAnalysis = async () => {
      try {
        setIsLoading(true)
        const data = await getBudgetAnalysis(user.id, period, referenceDate, true)
        setAnalyses(data.analyses)
        setAlerts(data.alerts || [])
      } catch (error) {
        console.error('Error loading budget analysis:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalysis()
  }, [user?.id, period, referenceDate])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Budget vs Actual
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No budget limits set. Set monthly limits for categories in Settings to see budget analysis.
        </p>
      </div>
    )
  }

  const totalBudget = analyses.reduce((sum, a) => sum + a.limit, 0)
  const totalSpent = analyses.reduce((sum, a) => sum + a.spent, 0)
  const totalRemaining = analyses.reduce((sum, a) => sum + a.remaining, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Budget vs Actual
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {period === 'monthly' ? format(referenceDate, 'MMMM yyyy') : `Week of ${format(referenceDate, 'MMM d')}`}
          </p>
        </div>
        {alerts.length > 0 && (
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Budget</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(totalBudget)}
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {formatCurrency(totalSpent)}
          </div>
        </div>
        <div className={`rounded-lg p-4 ${totalRemaining >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className={`text-sm mb-1 ${totalRemaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            Remaining
          </div>
          <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
            {formatCurrency(totalRemaining)}
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Budget Alerts
          </h3>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.category} className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white">{alert.category}:</span>
                <span className={`ml-2 ${alert.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {alert.isOverBudget ? 'Over budget' : `${alert.percentageUsed.toFixed(0)}% used`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">By Category</h3>
        {analyses.map((analysis) => {
          const percentage = Math.min(100, analysis.percentageUsed)
          const isOver = analysis.isOverBudget
          const isWarning = !isOver && analysis.percentageUsed >= 80

          return (
            <div key={analysis.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{analysis.category}</span>
                  {isOver && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  {isWarning && !isOver && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                  {!isOver && !isWarning && percentage < 80 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(analysis.spent)} / {formatCurrency(analysis.limit)}
                  </div>
                  <div className={`text-xs ${isOver ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {analysis.percentageUsed.toFixed(0)}% used
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOver
                      ? 'bg-red-500'
                      : isWarning
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {analysis.remaining > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {formatCurrency(analysis.remaining)} remaining
                </div>
              )}
              {isOver && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  Over by {formatCurrency(Math.abs(analysis.remaining))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

