'use client'

import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js'
import type { FinanceTransaction } from '@/types/finance'
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Props {
  transactions: FinanceTransaction[]
  months?: number // Number of months to show (default: 12)
}

export function FinanceAverageTransactionAmount({ transactions, months = 12 }: Props) {
  const { data, options } = useMemo(() => {
    // Use actual transaction dates instead of fixed date range
    // Find min and max dates from transactions
    let minDate: Date | null = null
    let maxDate: Date | null = null
    
    transactions.forEach((tx) => {
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
      if (!minDate || txDate < minDate) minDate = txDate
      if (!maxDate || txDate > maxDate) maxDate = txDate
    })
    
    // Use transaction date range, or fallback to last N months if no transactions
    const endDate = maxDate || new Date()
    const startDate = minDate || startOfMonth(subMonths(new Date(), months - 1))
    const monthDates = eachMonthOfInterval({ start: startOfMonth(startDate), end: endOfMonth(endDate) })

    const monthlyData: Record<string, { total: number; count: number }> = {}

    // Initialize all months from actual transaction range
    monthDates.forEach((date) => {
      const key = format(date, 'yyyy-MM')
      monthlyData[key] = { total: 0, count: 0 }
    })

    // Process all transactions (already filtered by timeRange)
    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      
      // Focus on expenses
      const isExpense = type === 'expense' || amount < 0
      if (!isExpense) return

      const absAmount = Math.abs(amount)
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
      const monthKey = format(txDate, 'yyyy-MM')
      
      if (!monthlyData[monthKey]) return

      monthlyData[monthKey].total += absAmount
      monthlyData[monthKey].count += 1
    })

    const labels = monthDates.map((date) => format(date, 'MMM yyyy'))
    const averageData = monthDates.map((date) => {
      const key = format(date, 'yyyy-MM')
      const data = monthlyData[key]
      return data.count > 0 ? data.total / data.count : 0
    })

    const chartData: ChartData<'line'> = {
      labels,
      datasets: [
        {
          label: 'Average Transaction Amount',
          data: averageData,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    }

    const formatter = new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
    })

    const options: ChartOptions<'line'> = {
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
              return `Average: ${formatter.format(value)}`
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
  }, [transactions, months])

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No transaction data yet to show average transaction amount.
      </div>
    )
  }

  return (
    <div className="h-80">
      <Line data={data} options={options} />
    </div>
  )
}

