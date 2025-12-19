'use client'

import { useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns'
import { AlertTriangle, TrendingUp, DollarSign, Calendar } from 'lucide-react'
import { getSuggestedCategory } from '@/lib/transactionCategorizer'

interface Props {
  transactions: FinanceTransaction[]
  months?: number // Number of months to analyze (default: 6)
}

interface Alert {
  type: 'spike' | 'unusual' | 'high' | 'trend'
  category: string
  message: string
  severity: 'high' | 'medium' | 'low'
  amount?: number
  percentage?: number
}

export function FinanceSpendingAlerts({ transactions, months = 6 }: Props) {
  const alerts = useMemo(() => {
    const now = new Date()
    const alertsList: Alert[] = []
    const categoryMonthlyTotals: Record<string, number[]> = {}
    const categoryNames: Record<string, string> = {}

    // Collect monthly totals for each category
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(monthStart)

      transactions.forEach((tx) => {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        
        const isExpense = type === 'expense' || amount < 0
        if (!isExpense) return

        const absAmount = Math.abs(amount)
        const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
        
        if (!isWithinInterval(txDate, { start: monthStart, end: monthEnd })) return

        // Normalize category using the same logic as other components
        let category = tx.category || 'Other'
        
        // Check if category needs recategorization (contains POS:, card numbers, etc.)
        const needsRecategorization = 
          !category || 
          category === 'Other' ||
          category.includes('POS:') ||
          category.includes('ATM:') ||
          category.match(/\d{4}\s+\d{2}\*+/) ||
          category.includes('PSD2') ||
          category.includes('KLIX')
        
        if (needsRecategorization) {
          const suggestedCategory = getSuggestedCategory(
            tx.description || category,
            tx.referenceNumber,
            tx.recipientName,
            amount
          )
          if (suggestedCategory) {
            category = suggestedCategory
          }
        }
        
        categoryNames[category] = category

        if (!categoryMonthlyTotals[category]) {
          categoryMonthlyTotals[category] = []
        }
        
        const monthIndex = months - 1 - i
        while (categoryMonthlyTotals[category].length <= monthIndex) {
          categoryMonthlyTotals[category].push(0)
        }
        
        categoryMonthlyTotals[category][monthIndex] += absAmount
      })
    }

    // Analyze each category for alerts
    Object.entries(categoryMonthlyTotals).forEach(([category, monthlyAmounts]) => {
      if (monthlyAmounts.length < 2) return

      const recentMonths = monthlyAmounts.slice(-3)
      const average = recentMonths.reduce((sum, val) => sum + val, 0) / recentMonths.length
      const lastMonth = monthlyAmounts[monthlyAmounts.length - 1]
      const prevMonth = monthlyAmounts[monthlyAmounts.length - 2]

      // Alert 1: Spending spike (last month > 150% of average)
      if (lastMonth > average * 1.5 && average > 0) {
        const increase = ((lastMonth - average) / average) * 100
        alertsList.push({
          type: 'spike',
          category,
          message: `Spending spike: ${increase.toFixed(0)}% above average`,
          severity: increase > 100 ? 'high' : increase > 50 ? 'medium' : 'low',
          amount: lastMonth,
          percentage: increase,
        })
      }

      // Alert 2: Unusual increase (last month > 200% of previous month)
      if (lastMonth > prevMonth * 2 && prevMonth > 0) {
        const increase = ((lastMonth - prevMonth) / prevMonth) * 100
        alertsList.push({
          type: 'unusual',
          category,
          message: `Unusual increase: ${increase.toFixed(0)}% from previous month`,
          severity: 'high',
          amount: lastMonth,
          percentage: increase,
        })
      }

      // Alert 3: High spending category (top 3 categories by total)
      const totalSpending = monthlyAmounts.reduce((sum, val) => sum + val, 0)
      const allTotals = Object.values(categoryMonthlyTotals).map(amounts => 
        amounts.reduce((sum, val) => sum + val, 0)
      ).sort((a, b) => b - a)
      
      if (totalSpending >= allTotals[2] && totalSpending > 0) {
        alertsList.push({
          type: 'high',
          category,
          message: `High spending category: Top 3 by total`,
          severity: 'medium',
          amount: totalSpending,
        })
      }

      // Alert 4: Consistent upward trend (last 3 months increasing)
      if (monthlyAmounts.length >= 3) {
        const lastThree = monthlyAmounts.slice(-3)
        const isIncreasing = lastThree[0] < lastThree[1] && lastThree[1] < lastThree[2]
        if (isIncreasing && lastThree[2] > 0) {
          const totalIncrease = ((lastThree[2] - lastThree[0]) / lastThree[0]) * 100
          alertsList.push({
            type: 'trend',
            category,
            message: `Upward trend: ${totalIncrease.toFixed(0)}% increase over 3 months`,
            severity: totalIncrease > 50 ? 'high' : 'medium',
            percentage: totalIncrease,
          })
        }
      }
    })

    // Sort by severity (high > medium > low) and then by amount
    alertsList.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity]
      }
      return (b.amount || 0) - (a.amount || 0)
    })

    return alertsList.slice(0, 10) // Top 10 alerts
  }, [transactions, months])

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'spike':
        return <TrendingUp className="w-4 h-4" />
      case 'unusual':
        return <AlertTriangle className="w-4 h-4" />
      case 'high':
        return <DollarSign className="w-4 h-4" />
      case 'trend':
        return <Calendar className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
      case 'low':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const formatter = new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
  })

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No transaction data yet to analyze for alerts.
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-medium">No unusual spending patterns detected</p>
        <p className="text-xs mt-1">Your spending looks normal!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${
              alert.severity === 'high' ? 'text-red-600 dark:text-red-400' :
              alert.severity === 'medium' ? 'text-orange-600 dark:text-orange-400' :
              'text-yellow-600 dark:text-yellow-400'
            }`}>
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {alert.category}
                </h4>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  alert.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  alert.severity === 'medium' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                }`}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                {alert.message}
              </p>
              {alert.amount && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Amount: {formatter.format(alert.amount)}
                  {alert.percentage && ` (${alert.percentage > 0 ? '+' : ''}${alert.percentage.toFixed(0)}%)`}
                </p>
              )}
              {alert.percentage && !alert.amount && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Change: {alert.percentage > 0 ? '+' : ''}{alert.percentage.toFixed(0)}%
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

