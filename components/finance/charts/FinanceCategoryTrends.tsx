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
import { getSuggestedCategory } from '@/lib/transactionCategorizer'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Props {
  transactions: FinanceTransaction[]
  months?: number // Number of months to show (default: 12)
  topCategories?: number // Number of top categories to show (default: 5)
}

const COLORS = [
  '#6366f1',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#14b8a6',
]

export function FinanceCategoryTrends({ transactions, months = 12, topCategories = 5 }: Props) {
  const { data, options } = useMemo(() => {
    const now = new Date()
    const startDate = startOfMonth(subMonths(now, months - 1))
    const monthDates = eachMonthOfInterval({ start: startDate, end: now })

    // First, get all category totals to find top categories
    const categoryTotals: Record<string, number> = {}
    
    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      
      const isExpense = type === 'expense' || amount < 0
      if (!isExpense) continue

      const absAmount = Math.abs(amount)
      let category = tx.category || 'Other'
      
      // Normalize category
      const needsRecategorization = 
        !category || 
        category === 'Other' ||
        category.includes('POS:') ||
        category.match(/\d{4}\s+\d{2}\*+/)
      
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
      
      categoryTotals[category] = (categoryTotals[category] || 0) + absAmount
    }

    // Get top N categories
    const topCats = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topCategories)
      .map(([cat]) => cat)

    // Initialize monthly data for each top category
    const monthlyData: Record<string, Record<string, number>> = {}
    topCats.forEach((cat) => {
      monthlyData[cat] = {}
      monthDates.forEach((date) => {
        const key = format(date, 'yyyy-MM')
        monthlyData[cat][key] = 0
      })
    })

    // Process transactions and group by month and category
    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      
      const isExpense = type === 'expense' || amount < 0
      if (!isExpense) continue

      const absAmount = Math.abs(amount)
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
      const monthKey = format(txDate, 'yyyy-MM')
      
      if (!monthDates.some(d => format(d, 'yyyy-MM') === monthKey)) continue

      let category = tx.category || 'Other'
      
      // Normalize category
      const needsRecategorization = 
        !category || 
        category === 'Other' ||
        category.includes('POS:') ||
        category.match(/\d{4}\s+\d{2}\*+/)
      
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

      if (topCats.includes(category) && monthlyData[category]) {
        monthlyData[category][monthKey] = (monthlyData[category][monthKey] || 0) + absAmount
      }
    }

    const labels = monthDates.map((date) => format(date, 'MMM yyyy'))

    const chartData: ChartData<'line'> = {
      labels,
      datasets: topCats.map((cat, index) => ({
        label: cat,
        data: monthDates.map((date) => {
          const key = format(date, 'yyyy-MM')
          return monthlyData[cat][key] || 0
        }),
        borderColor: COLORS[index % COLORS.length],
        backgroundColor: COLORS[index % COLORS.length] + '20',
        tension: 0.4,
        fill: false,
      })),
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
  }, [transactions, months, topCategories])

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No transaction data yet to show category trends.
      </div>
    )
  }

  return (
    <div className="h-80">
      <Line data={data} options={options} />
    </div>
  )
}

