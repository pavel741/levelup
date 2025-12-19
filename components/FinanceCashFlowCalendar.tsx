'use client'

import { useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth } from 'date-fns'

interface Props {
  transactions: FinanceTransaction[]
  months?: number // Number of months to show (default: 3)
  view?: 'net' | 'both' // 'net' shows net cash flow, 'both' shows income and expenses separately
}

interface DayData {
  day: number
  amount: number
  income?: number
  expenses?: number
  date: Date | null
}

export function FinanceCashFlowCalendar({ transactions, months = 3, view = 'net' }: Props) {
  const calendarData = useMemo(() => {
    const now = new Date()
    const calendars: Array<{
      month: string
      year: number
      weeks: Array<Array<{ day: number; amount: number; date: Date | null }>>
    }> = []

    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
      
      const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
      
      // Calculate income and expenses per day
      const dayIncome: Record<string, number> = {}
      const dayExpenses: Record<string, number> = {}
      
      transactions.forEach((tx) => {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
        const dayKey = format(txDate, 'yyyy-MM-dd')
        
        const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
        const absAmount = Math.abs(amount)
        
        if (isIncome) {
          dayIncome[dayKey] = (dayIncome[dayKey] || 0) + absAmount
        } else {
          dayExpenses[dayKey] = (dayExpenses[dayKey] || 0) + absAmount
        }
      })

      // Organize into weeks
      const weeks: Array<Array<DayData>> = []
      let currentWeek: Array<DayData> = []

      days.forEach((date, index) => {
        const dayKey = format(date, 'yyyy-MM-dd')
        const income = dayIncome[dayKey] || 0
        const expenses = dayExpenses[dayKey] || 0
        const netFlow = income - expenses
        const isCurrentMonth = isSameMonth(date, monthDate)
        
        currentWeek.push({
          day: date.getDate(),
          amount: netFlow, // Net cash flow (income - expenses)
          income,
          expenses,
          date: isCurrentMonth ? date : null,
        })

        if ((index + 1) % 7 === 0) {
          weeks.push(currentWeek)
          currentWeek = []
        }
      })

      if (currentWeek.length > 0) {
        weeks.push(currentWeek)
      }

      calendars.push({
        month: format(monthDate, 'MMMM'),
        year: monthDate.getFullYear(),
        weeks,
      })
    }

    return calendars
  }, [transactions, months, view])

  // Calculate max amount for color intensity
  const maxAmount = useMemo(() => {
    let max = 0
    calendarData.forEach((cal) => {
      cal.weeks.forEach((week) => {
        week.forEach((day) => {
          const absAmount = Math.abs(day.amount)
          if (absAmount > max) max = absAmount
        })
      })
    })
    return max
  }, [calendarData])

  const getColorIntensity = (amount: number, income?: number, expenses?: number): string => {
    if (view === 'both') {
      // Show both income and expenses
      if (income && income > 0 && expenses && expenses > 0) {
        // Both income and expenses - use gradient or mixed color
        return 'bg-gradient-to-br from-green-300 to-red-300 dark:from-green-700 dark:to-red-700'
      } else if (income && income > 0) {
        // Only income - green
        const intensity = maxAmount > 0 ? income / maxAmount : 0
        if (intensity < 0.3) return 'bg-green-100 dark:bg-green-900/20'
        if (intensity < 0.6) return 'bg-green-300 dark:bg-green-800/60'
        return 'bg-green-500 dark:bg-green-600'
      } else if (expenses && expenses > 0) {
        // Only expenses - red
        const intensity = maxAmount > 0 ? expenses / maxAmount : 0
        if (intensity < 0.3) return 'bg-red-100 dark:bg-red-900/20'
        if (intensity < 0.6) return 'bg-red-300 dark:bg-red-800/60'
        return 'bg-red-500 dark:bg-red-600'
      }
      return 'bg-gray-100 dark:bg-gray-800'
    } else {
      // Net cash flow view
      if (amount === 0) return 'bg-gray-100 dark:bg-gray-800'
      
      if (amount > 0) {
        // Positive cash flow (income > expenses) - green
        const intensity = maxAmount > 0 ? amount / maxAmount : 0
        if (intensity < 0.3) return 'bg-green-100 dark:bg-green-900/20'
        if (intensity < 0.6) return 'bg-green-300 dark:bg-green-800/60'
        return 'bg-green-500 dark:bg-green-600'
      } else {
        // Negative cash flow (expenses > income) - red
        const intensity = maxAmount > 0 ? Math.abs(amount) / maxAmount : 0
        if (intensity < 0.3) return 'bg-red-100 dark:bg-red-900/20'
        if (intensity < 0.6) return 'bg-red-300 dark:bg-red-800/60'
        return 'bg-red-500 dark:bg-red-600'
      }
    }
  }

  const formatter = new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No transaction data yet to show cash flow calendar.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {calendarData.map((cal, calIndex) => (
        <div key={`${cal.year}-${cal.month}`} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {cal.month} {cal.year}
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center py-1">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              {cal.weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day, dayIndex) => {
                    const tooltipText = day.date 
                      ? view === 'both' && day.income !== undefined && day.expenses !== undefined
                        ? `${format(day.date, 'MMM dd, yyyy')}\nIncome: ${formatter.format(day.income)}\nExpenses: ${formatter.format(day.expenses)}\nNet: ${formatter.format(day.amount)}`
                        : `${format(day.date, 'MMM dd, yyyy')}: ${formatter.format(day.amount)}`
                      : ''
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`
                          ${getColorIntensity(day.amount, day.income, day.expenses)}
                          ${day.date ? 'border border-gray-300 dark:border-gray-600' : 'border border-transparent'}
                          rounded p-2 min-h-[60px] flex flex-col items-center justify-center
                          ${day.date ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'opacity-50'}
                        `}
                        title={tooltipText}
                      >
                        <span className={`text-sm font-medium ${day.date ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                          {day.day}
                        </span>
                        {day.amount !== 0 && (
                          <span className={`text-xs mt-1 ${
                            view === 'net' 
                              ? day.amount > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {view === 'both' && day.income !== undefined && day.expenses !== undefined
                              ? `${day.income > 0 ? '+' : ''}${formatter.format(day.income)} / ${formatter.format(day.expenses)}`
                              : formatter.format(day.amount)
                            }
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          {calIndex === calendarData.length - 1 && (
            <div className="mt-4 flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-400">
              {view === 'net' ? (
                <>
                  <div className="flex items-center gap-4">
                    <span>Net Cash Flow:</span>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-green-300 dark:bg-green-800/60 rounded"></div>
                        <span>Positive (Income &gt; Expenses)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-red-300 dark:bg-red-800/60 rounded"></div>
                        <span>Negative (Expenses &gt; Income)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>Intensity:</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 bg-green-100 dark:bg-green-900/20 rounded"></div>
                      <div className="w-4 h-4 bg-green-300 dark:bg-green-800/60 rounded"></div>
                      <div className="w-4 h-4 bg-green-500 dark:bg-green-600 rounded"></div>
                    </div>
                    <span>Less → More</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <span>Income:</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 bg-green-100 dark:bg-green-900/20 rounded"></div>
                      <div className="w-4 h-4 bg-green-300 dark:bg-green-800/60 rounded"></div>
                      <div className="w-4 h-4 bg-green-500 dark:bg-green-600 rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>Expenses:</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 bg-red-100 dark:bg-red-900/20 rounded"></div>
                      <div className="w-4 h-4 bg-red-300 dark:bg-red-800/60 rounded"></div>
                      <div className="w-4 h-4 bg-red-500 dark:bg-red-600 rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>Both:</span>
                    <div className="w-4 h-4 bg-gradient-to-br from-green-300 to-red-300 dark:from-green-700 dark:to-red-700 rounded"></div>
                    <span>Day has both income and expenses</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

