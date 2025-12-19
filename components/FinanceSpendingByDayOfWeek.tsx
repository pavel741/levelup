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
import { format } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  transactions: FinanceTransaction[]
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function FinanceSpendingByDayOfWeek({ transactions }: Props) {
  const { data, options } = useMemo(() => {
    const dayTotals: Record<number, number> = {
      0: 0, // Sunday
      1: 0, // Monday
      2: 0, // Tuesday
      3: 0, // Wednesday
      4: 0, // Thursday
      5: 0, // Friday
      6: 0, // Saturday
    }

    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      
      // Focus on expenses
      const isExpense = type === 'expense' || amount < 0
      if (!isExpense) continue

      const absAmount = Math.abs(amount)
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
      const dayOfWeek = txDate.getDay() // 0 = Sunday, 1 = Monday, etc.
      
      dayTotals[dayOfWeek] = (dayTotals[dayOfWeek] || 0) + absAmount
    }

    // Reorder: Monday (1) to Sunday (0)
    const orderedData = [
      dayTotals[1], // Monday
      dayTotals[2], // Tuesday
      dayTotals[3], // Wednesday
      dayTotals[4], // Thursday
      dayTotals[5], // Friday
      dayTotals[6], // Saturday
      dayTotals[0], // Sunday
    ]

    const chartData: ChartData<'bar'> = {
      labels: DAYS_SHORT,
      datasets: [
        {
          label: 'Spending',
          data: orderedData,
          backgroundColor: '#6366f1',
          borderRadius: 8,
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
              return formatter.format(value)
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
  }, [transactions])

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No transaction data yet to show spending by day of week.
      </div>
    )
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}

