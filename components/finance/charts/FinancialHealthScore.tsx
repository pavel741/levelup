'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react'
import type { FinanceTransaction } from '@/types/finance'
import { formatCurrency } from '@/lib/utils'
import { parseTransactionDate } from '@/lib/financeDateUtils'

interface FinancialHealthScoreProps {
  transactions: FinanceTransaction[]
  periodMonths?: number
}

interface HealthMetrics {
  savingsRate: number // 0-100
  spendingConsistency: number // 0-100 (lower variance = higher score)
  expenseGrowth: number // 0-100 (negative growth = higher score)
  incomeStability: number // 0-100 (consistent income = higher score)
  emergencyFundRatio: number // 0-100 (months of expenses covered)
}

export default function FinancialHealthScore({
  transactions,
  periodMonths = 6,
}: FinancialHealthScoreProps) {
  const healthData = useMemo(() => {
    if (transactions.length === 0) {
      return null
    }

    // Use all provided transactions (they're already filtered by timeRange from analytics page)
    // Calculate monthly income and expenses
    const monthlyData = new Map<string, { income: number; expenses: number }>()
    
    transactions.forEach((tx) => {
      const txDate = parseTransactionDate(tx.date)
      const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`
      
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
      const absAmount = Math.abs(amount)

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expenses: 0 })
      }

      const data = monthlyData.get(monthKey)!
      if (isIncome) {
        data.income += absAmount
      } else {
        data.expenses += absAmount
      }
    })

    const monthlyValues = Array.from(monthlyData.values())
    
    // Need at least 2 months of data for meaningful analysis
    if (monthlyValues.length < 2) {
      return null
    }

    // Calculate metrics
    const totalIncome = monthlyValues.reduce((sum, m) => sum + m.income, 0)
    const totalExpenses = monthlyValues.reduce((sum, m) => sum + m.expenses, 0)
    const avgMonthlyIncome = totalIncome / monthlyValues.length
    const avgMonthlyExpenses = totalExpenses / monthlyValues.length

    // 1. Savings Rate (0-100)
    const savingsRate = avgMonthlyIncome > 0
      ? Math.max(0, Math.min(100, ((avgMonthlyIncome - avgMonthlyExpenses) / avgMonthlyIncome) * 100))
      : 0

    // 2. Spending Consistency (0-100) - Lower variance = higher score
    const expenseValues = monthlyValues.map((m) => m.expenses)
    const avgExpenses = avgMonthlyExpenses
    const variance = expenseValues.reduce((sum, val) => sum + Math.pow(val - avgExpenses, 2), 0) / expenseValues.length
    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = avgExpenses > 0 ? stdDev / avgExpenses : 1
    const spendingConsistency = Math.max(0, Math.min(100, (1 - Math.min(coefficientOfVariation, 1)) * 100))

    // 3. Expense Growth (0-100) - Negative growth = higher score
    if (monthlyValues.length < 2) {
      return null
    }
    const recentExpenses = monthlyValues.slice(-3).reduce((sum, m) => sum + m.expenses, 0) / Math.min(3, monthlyValues.length)
    const olderExpenses = monthlyValues.slice(0, Math.max(1, monthlyValues.length - 3)).reduce((sum, m) => sum + m.expenses, 0) / Math.max(1, monthlyValues.length - 3)
    const expenseGrowthRate = olderExpenses > 0 ? ((recentExpenses - olderExpenses) / olderExpenses) * 100 : 0
    const expenseGrowth = Math.max(0, Math.min(100, 100 - Math.abs(expenseGrowthRate)))

    // 4. Income Stability (0-100) - Consistent income = higher score
    const incomeValues = monthlyValues.map((m) => m.income)
    const avgIncome = avgMonthlyIncome
    const incomeVariance = incomeValues.reduce((sum, val) => sum + Math.pow(val - avgIncome, 2), 0) / incomeValues.length
    const incomeStdDev = Math.sqrt(incomeVariance)
    const incomeCoefficientOfVariation = avgIncome > 0 ? incomeStdDev / avgIncome : 1
    const incomeStability = Math.max(0, Math.min(100, (1 - Math.min(incomeCoefficientOfVariation, 1)) * 100))

    // 5. Emergency Fund Ratio (0-100) - Estimate based on savings rate
    // Assuming 3-6 months expenses is ideal
    const actualMonths = monthlyValues.length
    const monthsOfExpenses = avgMonthlyIncome > avgMonthlyExpenses
      ? (avgMonthlyIncome - avgMonthlyExpenses) * actualMonths / avgMonthlyExpenses
      : 0
    const emergencyFundRatio = Math.max(0, Math.min(100, (monthsOfExpenses / 6) * 100))

    const metrics: HealthMetrics = {
      savingsRate,
      spendingConsistency,
      expenseGrowth,
      incomeStability,
      emergencyFundRatio,
    }

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      metrics.savingsRate * 0.3 +
      metrics.spendingConsistency * 0.2 +
      metrics.expenseGrowth * 0.15 +
      metrics.incomeStability * 0.15 +
      metrics.emergencyFundRatio * 0.2
    )

    return {
      score: overallScore,
      metrics,
      avgMonthlyIncome,
      avgMonthlyExpenses,
      totalIncome,
      totalExpenses,
      monthlyData: Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        ...data,
      })),
    }
  }, [transactions, periodMonths])

  if (!healthData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Health Score</h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Not enough data to calculate financial health score. Need at least 2 months of transaction data.</p>
          <p className="text-xs mt-2">Found {transactions.length} transactions. Try selecting a different time range.</p>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20'
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Health Score</h3>
      </div>

      {/* Main Score */}
      <div className={`${getScoreBgColor(healthData.score)} rounded-xl p-6 mb-6 text-center`}>
        <div className="text-5xl font-bold mb-2">
          <span className={getScoreColor(healthData.score)}>{healthData.score}</span>
          <span className="text-gray-600 dark:text-gray-400 text-2xl">/100</span>
        </div>
        <p className={`text-lg font-semibold ${getScoreColor(healthData.score)}`}>
          {getScoreLabel(healthData.score)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Based on {periodMonths} months of financial data
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg Monthly Income</p>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(healthData.avgMonthlyIncome)}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg Monthly Expenses</p>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(healthData.avgMonthlyExpenses)}
          </p>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Component Scores</h4>
        
        {[
          { label: 'Savings Rate', value: healthData.metrics.savingsRate, weight: '30%' },
          { label: 'Spending Consistency', value: healthData.metrics.spendingConsistency, weight: '20%' },
          { label: 'Expense Growth Control', value: healthData.metrics.expenseGrowth, weight: '15%' },
          { label: 'Income Stability', value: healthData.metrics.incomeStability, weight: '15%' },
          { label: 'Emergency Fund Ratio', value: healthData.metrics.emergencyFundRatio, weight: '20%' },
        ].map((component) => (
          <div key={component.label} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{component.label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">({component.weight})</span>
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(component.value)}`}>
                {Math.round(component.value)}/100
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    component.value >= 80
                      ? 'bg-green-500'
                      : component.value >= 60
                      ? 'bg-yellow-500'
                      : component.value >= 40
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(component.value, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Recommendations
        </h4>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          {healthData.metrics.savingsRate < 20 && (
            <li>• Increase your savings rate by reducing expenses or increasing income</li>
          )}
          {healthData.metrics.spendingConsistency < 60 && (
            <li>• Work on maintaining more consistent monthly spending patterns</li>
          )}
          {healthData.metrics.emergencyFundRatio < 50 && (
            <li>• Build an emergency fund covering 3-6 months of expenses</li>
          )}
          {healthData.metrics.incomeStability < 60 && (
            <li>• Consider diversifying income sources for better stability</li>
          )}
          {healthData.score >= 80 && (
            <li className="text-green-600 dark:text-green-400">• Great job! Keep maintaining your financial health</li>
          )}
        </ul>
      </div>
    </div>
  )
}

