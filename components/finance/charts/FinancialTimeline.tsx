'use client'

import { useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface FinancialTimelineProps {
  transactions: FinanceTransaction[]
}

interface TimelineEvent {
  date: Date
  type: 'income' | 'expense' | 'milestone'
  title: string
  description: string
  amount?: number
  category?: string
  icon: string
}

export default function FinancialTimeline({ transactions }: FinancialTimelineProps) {
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = []
    
    if (transactions.length === 0) return events

    // Group transactions by month
    const monthlyData = new Map<string, { income: number; expenses: number; transactions: FinanceTransaction[] }>()
    
    transactions.forEach((tx) => {
      const txDate = parseTransactionDate(tx.date)
      const monthKey = format(txDate, 'yyyy-MM')
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expenses: 0, transactions: [] })
      }
      
      const data = monthlyData.get(monthKey)!
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
      
      data.transactions.push(tx)
      
      if (isIncome) {
        data.income += Math.abs(amount)
      } else {
        data.expenses += Math.abs(amount)
      }
    })

    // Create timeline events
    const sortedMonths = Array.from(monthlyData.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    
    sortedMonths.forEach(([monthKey, data]) => {
      const monthDate = new Date(monthKey + '-01')
      const savings = data.income - data.expenses
      
      // Monthly summary event
      events.push({
        date: monthDate,
        type: savings > 0 ? 'income' : 'expense',
        title: format(monthDate, 'MMMM yyyy'),
        description: `Income: €${data.income.toFixed(0)} • Expenses: €${data.expenses.toFixed(0)} • Savings: €${savings.toFixed(0)}`,
        amount: savings,
        icon: savings > 0 ? '💰' : '💸',
      })

      // Find largest transaction
      const largestExpense = data.transactions
        .filter((tx) => {
          const amount = Number(tx.amount) || 0
          return amount < 0 || (tx.type || '').toLowerCase() === 'expense'
        })
        .sort((a, b) => Math.abs(Number(b.amount) || 0) - Math.abs(Number(a.amount) || 0))[0]

      if (largestExpense) {
        const amount = Math.abs(Number(largestExpense.amount) || 0)
        if (amount > data.expenses * 0.2) { // More than 20% of monthly expenses
          events.push({
            date: parseTransactionDate(largestExpense.date),
            type: 'expense',
            title: `Major Expense: ${largestExpense.category || 'Uncategorized'}`,
            description: largestExpense.description || 'No description',
            amount: amount,
            category: largestExpense.category,
            icon: '💳',
          })
        }
      }

      // Find largest income
      const largestIncome = data.transactions
        .filter((tx) => {
          const amount = Number(tx.amount) || 0
          return amount > 0 && (tx.type || '').toLowerCase() === 'income'
        })
        .sort((a, b) => Math.abs(Number(b.amount) || 0) - Math.abs(Number(a.amount) || 0))[0]

      if (largestIncome && data.income > 0) {
        const amount = Math.abs(Number(largestIncome.amount) || 0)
        if (amount > data.income * 0.5) { // More than 50% of monthly income
          events.push({
            date: parseTransactionDate(largestIncome.date),
            type: 'income',
            title: `Income: ${largestIncome.description || 'Salary'}`,
            description: largestIncome.category || 'Income',
            amount: amount,
            category: largestIncome.category,
            icon: '💵',
          })
        }
      }
    })

    // Add milestones (first transaction, savings milestones, etc.)
    if (sortedMonths.length > 0) {
      const firstMonth = sortedMonths[0]
      events.push({
        date: new Date(firstMonth[0] + '-01'),
        type: 'milestone',
        title: 'Started Tracking',
        description: 'First transaction recorded',
        icon: '🎯',
      })
    }

    // Sort by date
    events.sort((a, b) => a.date.getTime() - b.date.getTime())

    return events
  }, [transactions])

  if (timelineEvents.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Financial Timeline
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No financial events to display yet. Start tracking transactions to see your timeline!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Financial Timeline
        </h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Interactive timeline of major financial events and milestones
      </p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>

        {/* Events */}
        <div className="space-y-6">
          {timelineEvents.map((event, idx) => {
            const isIncome = event.type === 'income'
            const isExpense = event.type === 'expense'
            const isMilestone = event.type === 'milestone'

            return (
              <div key={idx} className="relative flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg ${
                    isIncome
                      ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                      : isExpense
                      ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                      : 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                  }`}
                >
                  {event.icon}
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {event.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(event.date, 'MMM d, yyyy')}
                      </p>
                    </div>
                    {event.amount !== undefined && (
                      <div
                        className={`text-lg font-bold ${
                          isIncome
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {new Intl.NumberFormat('et-EE', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(event.amount)}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {event.description}
                  </p>
                  {event.category && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                      {event.category}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

