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
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  transactions: FinanceTransaction[]
  months?: number // Number of months to compare (default: 12)
}

export function FinanceYearOverYear({ transactions, months = 12 }: Props) {
  const { data, options } = useMemo(() => {
    const now = new Date()
    const currentYearData: Array<{ month: string; income: number; expenses: number }> = []
    const previousYearData: Array<{ month: string; income: number; expenses: number }> = []

    // Current year (last N months)
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(monthStart)
      
      let income = 0
      let expenses = 0

      transactions.forEach((tx) => {
        const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
        
        if (!isWithinInterval(txDate, { start: monthStart, end: monthEnd })) return

        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        
        const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
        const absAmount = Math.abs(amount)

        if (isIncome) {
          income += absAmount
        } else {
          expenses += absAmount
        }
      })

      currentYearData.push({
        month: format(monthStart, 'MMM yyyy'),
        income,
        expenses,
      })
    }

    // Previous year (same months, one year ago)
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i + 12)) // One year ago
      const monthEnd = endOfMonth(monthStart)
      
      let income = 0
      let expenses = 0

      transactions.forEach((tx) => {
        const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
        
        if (!isWithinInterval(txDate, { start: monthStart, end: monthEnd })) return

        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        
        const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
        const absAmount = Math.abs(amount)

        if (isIncome) {
          income += absAmount
        } else {
          expenses += absAmount
        }
      })

      previousYearData.push({
        month: format(monthStart, 'MMM yyyy'),
        income,
        expenses,
      })
    }

    const labels = currentYearData.map((d) => format(new Date(d.month + ' 01'), 'MMM'))

    const chartData: ChartData<'bar'> = {
      labels,
      datasets: [
        {
          label: `${new Date().getFullYear()} Income`,
          data: currentYearData.map((d) => d.income),
          backgroundColor: '#10b981',
        },
        {
          label: `${new Date().getFullYear()} Expenses`,
          data: currentYearData.map((d) => d.expenses),
          backgroundColor: '#ef4444',
        },
        {
          label: `${new Date().getFullYear() - 1} Income`,
          data: previousYearData.map((d) => d.income),
          backgroundColor: '#86efac',
          borderDash: [5, 5],
        },
        {
          label: `${new Date().getFullYear() - 1} Expenses`,
          data: previousYearData.map((d) => d.expenses),
          backgroundColor: '#fca5a5',
          borderDash: [5, 5],
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
        No transaction data yet to show year-over-year comparison.
      </div>
    )
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}

