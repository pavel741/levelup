'use client'

import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js'
import type { FinanceTransaction } from '@/types/finance'
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, subWeeks, startOfDay, endOfDay, eachDayOfInterval, subDays } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  transactions: FinanceTransaction[]
  view?: 'daily' | 'weekly' // View mode: daily or weekly averages
  days?: number // Number of days to show for daily view (default: 30)
  weeks?: number // Number of weeks to show for weekly view (default: 12)
}

export function FinanceSpendingVelocity({ transactions, view = 'weekly', days = 30, weeks = 12 }: Props) {
  const { data, options } = useMemo(() => {
    // Calculate the actual date range from transactions
    let minDate: Date | null = null
    let maxDate: Date | null = null
    
    transactions.forEach((tx) => {
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
      if (!minDate || txDate < minDate) minDate = txDate
      if (!maxDate || txDate > maxDate) maxDate = txDate
    })
    
    // If no transactions, use current date as fallback
    const endDate = maxDate || new Date()
    const startDate = minDate || new Date()
    
    let labels: string[] = []
    let velocityData: number[] = []

    if (view === 'daily') {
      // Use the actual date range from transactions
      // If transactions span fewer days than requested, use the transaction range
      // Otherwise, show the last 'days' days ending at the latest transaction date
      const calculatedStartDate = startOfDay(subDays(endDate, days - 1))
      const actualStartDate = calculatedStartDate < startDate ? startOfDay(startDate) : calculatedStartDate
      const dayDates = eachDayOfInterval({ start: actualStartDate, end: endDate })

      const dailyTotals: Record<string, number> = {}

      dayDates.forEach((date) => {
        const key = format(date, 'yyyy-MM-dd')
        dailyTotals[key] = 0
      })

      transactions.forEach((tx) => {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        
        const isExpense = type === 'expense' || amount < 0
        if (!isExpense) return

        const absAmount = Math.abs(amount)
        const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
        const dayKey = format(txDate, 'yyyy-MM-dd')
        
        if (dailyTotals[dayKey] !== undefined) {
          dailyTotals[dayKey] += absAmount
        }
      })

      labels = dayDates.map((date) => format(date, 'MMM dd'))
      velocityData = dayDates.map((date) => {
        const key = format(date, 'yyyy-MM-dd')
        return dailyTotals[key] || 0
      })
    } else {
      // Weekly view
      // Use the actual date range from transactions
      // If transactions span fewer weeks than requested, use the transaction range
      // Otherwise, show the last 'weeks' weeks ending at the latest transaction date
      const calculatedStartDate = startOfWeek(subWeeks(endDate, weeks - 1), { weekStartsOn: 1 })
      const actualStartDate = calculatedStartDate < startDate ? startOfWeek(startDate, { weekStartsOn: 1 }) : calculatedStartDate
      const weekStarts = eachWeekOfInterval({ start: actualStartDate, end: endDate }, { weekStartsOn: 1 }) // Monday

      const weeklyTotals: Array<{ week: string; total: number; days: number }> = []

      for (let i = 0; i < weekStarts.length; i++) {
        const weekStart = startOfWeek(weekStarts[i], { weekStartsOn: 1 })
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
        
        let total = 0
        let dayCount = 0

        transactions.forEach((tx) => {
          const amount = Number(tx.amount) || 0
          const type = (tx.type || '').toLowerCase()
          
          const isExpense = type === 'expense' || amount < 0
          if (!isExpense) return

          const absAmount = Math.abs(amount)
          const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
          
          if (txDate >= weekStart && txDate <= weekEnd) {
            total += absAmount
            dayCount = 7 // Each week has 7 days
          }
        })

        const avgDaily = dayCount > 0 ? total / dayCount : 0
        weeklyTotals.push({
          week: format(weekStart, 'MMM dd'),
          total: avgDaily,
          days: dayCount,
        })
      }

      labels = weeklyTotals.map((w) => w.week)
      velocityData = weeklyTotals.map((w) => w.total)
    }

    const chartData: ChartData<'bar'> = {
      labels,
      datasets: [
        {
          label: view === 'daily' ? 'Daily Spending' : 'Average Daily Spending',
          data: velocityData,
          backgroundColor: '#ef4444',
          borderRadius: 4,
        },
      ],
    }

    const formatter = new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
    })

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.parsed.y || 0
              return `${formatter.format(value)}${view === 'weekly' ? ' per day' : ''}`
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => {
              const numValue = typeof value === 'number' ? value : parseFloat(value.toString())
              return formatter.format(numValue)
            },
          },
        },
      },
    }

    return { data: chartData, options }
  }, [transactions, view, days, weeks])

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No transaction data yet to show spending velocity.
      </div>
    )
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}

