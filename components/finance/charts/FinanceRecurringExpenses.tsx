'use client'

import { useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { format, differenceInDays } from 'date-fns'
import { Repeat, Calendar } from 'lucide-react'

interface Props {
  transactions: FinanceTransaction[]
  months?: number // Number of months to analyze (default: 6)
}

interface RecurringExpense {
  description: string
  category: string
  amount: number
  frequency: 'monthly' | 'bi-weekly' | 'weekly' | 'irregular'
  occurrences: number
  lastDate: Date
  averageInterval: number // days
  confidence: 'high' | 'medium' | 'low'
}

export function FinanceRecurringExpenses({ transactions, months = 6 }: Props) {
  const recurringExpenses = useMemo(() => {
    // Calculate the actual date range from transactions
    let minDate: Date | null = null
    let maxDate: Date | null = null
    
    transactions.forEach((tx) => {
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
      if (!minDate || txDate < minDate) minDate = txDate
      if (!maxDate || txDate > maxDate) maxDate = txDate
    })
    
    // Use all provided transactions (they're already filtered by timeRange from analytics page)
    // Group transactions by normalized description and category
    const transactionGroups: Record<string, FinanceTransaction[]> = {}

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      
      const isExpense = type === 'expense' || amount < 0
      if (!isExpense) return

      // Use all transactions - no date filtering needed

      // Normalize description (remove dates, card numbers, etc.)
      let normalizedDesc = (tx.description || '').trim()
      normalizedDesc = normalizedDesc
        .replace(/POS:\s*/i, '')
        .replace(/ATM:\s*/i, '')
        .replace(/\d{4}\s+\d{2}\*+\s+\*+\s+\d{4}/g, '') // Card numbers
        .replace(/\d{1,2}\.\d{1,2}\.\d{4}\s+\d{1,2}:\d{2}(:\d{2})?/g, '') // Dates/times
        .replace(/,\s*[A-Z]{3,}\s*,\s*EST/gi, '') // Location suffixes
        .replace(/\\/g, '')
        .trim()
        .substring(0, 50) // Limit length

      if (normalizedDesc.length < 3) return

      const category = tx.category || 'Other'
      const key = `${normalizedDesc}|${category}|${Math.round(Math.abs(amount) * 100) / 100}` // Round to 2 decimals

      if (!transactionGroups[key]) {
        transactionGroups[key] = []
      }
      transactionGroups[key].push(tx)
    })

    const recurring: RecurringExpense[] = []

    // Analyze each group for recurring patterns
    Object.entries(transactionGroups).forEach(([_key, txs]) => {
      if (txs.length < 2) return // Need at least 2 occurrences

      // Sort by date
      txs.sort((a, b) => {
        // Handle different date types: string, Date, or Timestamp
        const dateAValue = a.date
        const dateBValue = b.date
        
        const dateA = typeof dateAValue === 'string' 
          ? new Date(dateAValue) 
          : (dateAValue as any)?.toDate 
            ? (dateAValue as any).toDate() 
            : (dateAValue as Date)
        
        const dateB = typeof dateBValue === 'string' 
          ? new Date(dateBValue) 
          : (dateBValue as any)?.toDate 
            ? (dateBValue as any).toDate() 
            : (dateBValue as Date)
        
        return dateA.getTime() - dateB.getTime()
      })

      // Calculate intervals between transactions
      const intervals: number[] = []
      for (let i = 1; i < txs.length; i++) {
        // Handle different date types: string, Date, or Timestamp
        const dateAValue = txs[i - 1].date
        const dateBValue = txs[i].date
        
        const dateA = typeof dateAValue === 'string' 
          ? new Date(dateAValue) 
          : (dateAValue as any)?.toDate 
            ? (dateAValue as any).toDate() 
            : (dateAValue as Date)
        
        const dateB = typeof dateBValue === 'string' 
          ? new Date(dateBValue) 
          : (dateBValue as any)?.toDate 
            ? (dateBValue as any).toDate() 
            : (dateBValue as Date)
        
        const days = differenceInDays(dateB, dateA)
        if (days > 0) {
          intervals.push(days)
        }
      }

      if (intervals.length === 0) return

      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      const amount = Math.abs(Number(txs[0].amount) || 0)
      const lastDateValue = txs[txs.length - 1].date
      const lastDate = typeof lastDateValue === 'string' 
        ? new Date(lastDateValue) 
        : (lastDateValue as any)?.toDate 
          ? (lastDateValue as any).toDate() 
          : (lastDateValue as Date)

      // Determine frequency
      let frequency: 'monthly' | 'bi-weekly' | 'weekly' | 'irregular' = 'irregular'
      let confidence: 'high' | 'medium' | 'low' = 'low'

      if (avgInterval >= 25 && avgInterval <= 35) {
        frequency = 'monthly'
        confidence = intervals.every(i => i >= 25 && i <= 35) ? 'high' : 'medium'
      } else if (avgInterval >= 12 && avgInterval <= 18) {
        frequency = 'bi-weekly'
        confidence = intervals.every(i => i >= 12 && i <= 18) ? 'high' : 'medium'
      } else if (avgInterval >= 5 && avgInterval <= 9) {
        frequency = 'weekly'
        confidence = intervals.every(i => i >= 5 && i <= 9) ? 'high' : 'medium'
      } else {
        // Check if intervals are relatively consistent (within 20% of average)
        const isConsistent = intervals.every(i => Math.abs(i - avgInterval) / avgInterval < 0.2)
        confidence = isConsistent ? 'medium' : 'low'
      }

      // Only include if confidence is medium or high, or if there are 3+ occurrences
      if (confidence !== 'low' || txs.length >= 3) {
        recurring.push({
          description: txs[0].description || 'Unknown',
          category: txs[0].category || 'Other',
          amount,
          frequency,
          occurrences: txs.length,
          lastDate,
          averageInterval: Math.round(avgInterval),
          confidence,
        })
      }
    })

    // Sort by amount (descending) and then by occurrences
    recurring.sort((a, b) => {
      if (b.amount !== a.amount) return b.amount - a.amount
      return b.occurrences - a.occurrences
    })

    return recurring.slice(0, 15) // Top 15 recurring expenses
  }, [transactions, months])

  const getFrequencyColor = (frequency: RecurringExpense['frequency']) => {
    switch (frequency) {
      case 'monthly':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      case 'bi-weekly':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
      case 'weekly':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
    }
  }

  const getConfidenceColor = (confidence: RecurringExpense['confidence']) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
    }
  }

  const formatter = new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
  })

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No transaction data yet to detect recurring expenses.
      </div>
    )
  }

  if (recurringExpenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        <Repeat className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
        <p className="font-medium">No recurring expenses detected</p>
        <p className="text-xs mt-1">Need more transaction history to identify patterns</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto">
      {recurringExpenses.map((expense, index) => (
        <div
          key={index}
          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Repeat className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {expense.description}
                </h4>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {expense.category}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 dark:text-white">
                {formatter.format(expense.amount)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded ${getFrequencyColor(expense.frequency)}`}>
              {expense.frequency === 'monthly' ? 'Monthly' :
               expense.frequency === 'bi-weekly' ? 'Bi-weekly' :
               expense.frequency === 'weekly' ? 'Weekly' : 'Irregular'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${getConfidenceColor(expense.confidence)}`}>
              {expense.confidence === 'high' ? 'High' :
               expense.confidence === 'medium' ? 'Medium' : 'Low'} confidence
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {expense.occurrences}x
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              ~{expense.averageInterval} days apart
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Last: {format(expense.lastDate, 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

