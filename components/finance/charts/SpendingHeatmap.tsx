'use client'

import { useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth } from 'date-fns'

interface SpendingHeatmapProps {
  transactions: FinanceTransaction[]
  months?: number // Number of months to show (default: 3)
}

interface DayData {
  day: number
  amount: number
  date: Date | null
  level: number // 0-4 for color intensity
}

export default function SpendingHeatmap({ transactions, months = 3 }: SpendingHeatmapProps) {
  const calendarData = useMemo(() => {
    // Calculate the actual date range from transactions
    let minDate: Date | null = null
    let maxDate: Date | null = null
    
    transactions.forEach((tx) => {
      const txDate = parseTransactionDate(tx.date)
      if (!minDate || txDate < minDate) minDate = txDate
      if (!maxDate || txDate > maxDate) maxDate = txDate
    })
    
    // If no transactions, use current date as fallback
    const endDate = maxDate || new Date()
    
    // Calculate the reference month (use the latest transaction month)
    const referenceMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    
    const calendars: Array<{
      month: string
      year: number
      weeks: Array<Array<DayData>>
    }> = []

    // Calculate daily spending
    const daySpending: Record<string, number> = {}
    let maxDailySpending = 0

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      const isExpense = type === 'expense' || amount < 0
      
      if (isExpense) {
        const txDate = parseTransactionDate(tx.date)
        const dayKey = format(txDate, 'yyyy-MM-dd')
        const absAmount = Math.abs(amount)
        daySpending[dayKey] = (daySpending[dayKey] || 0) + absAmount
        if (daySpending[dayKey] > maxDailySpending) {
          maxDailySpending = daySpending[dayKey]
        }
      }
    })

    // Generate calendar for each month
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth() - i, 1)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
      
      const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
      
      // Organize into weeks
      const weeks: Array<Array<DayData>> = []
      let currentWeek: Array<DayData> = []

      days.forEach((date, index) => {
        const dayKey = format(date, 'yyyy-MM-dd')
        const spending = daySpending[dayKey] || 0
        const isCurrentMonth = isSameMonth(date, monthDate)
        
        // Calculate intensity level (0-4)
        let level = 0
        if (spending > 0) {
          const intensity = maxDailySpending > 0 ? spending / maxDailySpending : 0
          if (intensity < 0.2) level = 1
          else if (intensity < 0.4) level = 2
          else if (intensity < 0.7) level = 3
          else level = 4
        }
        
        currentWeek.push({
          day: date.getDate(),
          amount: spending,
          date: isCurrentMonth ? date : null,
          level,
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
        month: format(monthDate, 'MMMM yyyy'),
        year: monthDate.getFullYear(),
        weeks,
      })
    }

    return { calendars, maxDailySpending }
  }, [transactions, months])

  const getColorClass = (level: number): string => {
    switch (level) {
      case 0:
        return 'bg-gray-100 dark:bg-gray-800'
      case 1:
        return 'bg-green-200 dark:bg-green-900/30'
      case 2:
        return 'bg-green-400 dark:bg-green-800/50'
      case 3:
        return 'bg-green-600 dark:bg-green-700'
      case 4:
        return 'bg-green-800 dark:bg-green-600'
      default:
        return 'bg-gray-100 dark:bg-gray-800'
    }
  }

  const formatter = new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Spending Heatmap
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Daily spending intensity. Darker = more spending
      </p>

      <div className="space-y-6">
        {calendarData.calendars.map((calendar, calIdx) => (
          <div key={calIdx}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {calendar.month}
            </h3>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Day labels */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div
                      key={day}
                      className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendar.weeks.flat().map((day, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square rounded text-xs flex flex-col items-center justify-center transition-all hover:scale-110 cursor-pointer ${
                        day.date
                          ? `${getColorClass(day.level)} text-gray-900 dark:text-white`
                          : 'bg-transparent text-gray-300 dark:text-gray-700'
                      }`}
                      title={
                        day.date
                          ? `${format(day.date, 'MMM d, yyyy')}: ${formatter.format(day.amount)}`
                          : ''
                      }
                    >
                      {day.date && (
                        <>
                          <span className="font-medium">{day.day}</span>
                          {day.amount > 0 && (
                            <span className="text-[10px] opacity-75">
                              {day.amount < 10 ? '€' : formatter.format(day.amount).replace('€', '')}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-3 h-3 rounded ${getColorClass(level)}`}
                title={`Level ${level}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">More</span>
        </div>
      </div>
    </div>
  )
}

