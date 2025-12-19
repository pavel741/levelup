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
import { format, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Props {
  transactions: FinanceTransaction[]
  months?: number // Number of months to show (default: 12)
}

export function FinanceTrendChart({ transactions, months = 12 }: Props) {
  const { data, options } = useMemo(() => {
    const now = new Date()
    const startDate = startOfMonth(subMonths(now, months - 1))
    const monthDates = eachMonthOfInterval({ start: startDate, end: now })

    const monthlyData: Record<string, { income: number; expenses: number }> = {}

    // Initialize all months
    monthDates.forEach((date) => {
      const key = format(date, 'yyyy-MM')
      monthlyData[key] = { income: 0, expenses: 0 }
    })

    // Process transactions
    transactions.forEach((tx) => {
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
      const monthKey = format(txDate, 'yyyy-MM')
      
      if (!monthlyData[monthKey]) return

      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      
      const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
      const absAmount = Math.abs(amount)

      if (isIncome) {
        monthlyData[monthKey].income += absAmount
      } else {
        monthlyData[monthKey].expenses += absAmount
      }
    })

    const labels = monthDates.map((date) => format(date, 'MMM yyyy'))
    const incomeData = monthDates.map((date) => {
      const key = format(date, 'yyyy-MM')
      return monthlyData[key]?.income || 0
    })
    const expenseData = monthDates.map((date) => {
      const key = format(date, 'yyyy-MM')
      return monthlyData[key]?.expenses || 0
    })
    const balanceData = monthDates.map((date) => {
      const key = format(date, 'yyyy-MM')
      const data = monthlyData[key] || { income: 0, expenses: 0 }
      return data.income - data.expenses
    })

    const chartData: ChartData<'line'> = {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Balance',
          data: balanceData,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: false,
          borderDash: [5, 5],
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
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.parsed.y || 0
              return `${ctx.dataset.label}: ${formatter.format(value)}`
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
        No transaction data yet to show trends.
      </div>
    )
  }

  return (
    <div className="h-80">
      <Line data={data} options={options} />
    </div>
  )
}

