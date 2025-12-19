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
import { getSuggestedCategory } from '@/lib/transactionCategorizer'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  transactions: FinanceTransaction[]
  limit?: number // Top N categories to show (default: 10)
}

export function FinanceCategoryBarChart({ transactions, limit = 10 }: Props) {
  const { data, options } = useMemo(() => {
    const categoryTotals: Record<string, number> = {}

    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()

      // Focus on expenses
      const isExpense = type === 'expense' || amount < 0
      if (!isExpense) continue

      const absAmount = Math.abs(amount)
      
      // Normalize category: if category looks like a description (contains POS pattern), recategorize it
      let category = tx.category || 'Other'
      
      // Always try to recategorize if:
      // 1. Category looks like a description (contains POS:, card numbers, etc.)
      // 2. Category is empty or "Other"
      // 3. Category contains card number patterns
      const needsRecategorization = 
        !category || 
        category === 'Other' ||
        category.includes('POS:') ||
        category.match(/\d{4}\s+\d{2}\*+/) ||
        category.toLowerCase().includes('pos') ||
        category.match(/^\d{4}\s+\d{2}\*+/)
      
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

    // Sort by amount and take top N
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)

    const categories = sortedCategories.map(([cat]) => cat)
    const amounts = sortedCategories.map(([, amount]) => amount)

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

    const chartData: ChartData<'bar'> = {
      labels: categories,
      datasets: [
        {
          label: 'Spending',
          data: amounts,
          backgroundColor: categories.map((_, i) => COLORS[i % COLORS.length]),
        },
      ],
    }

    const formatter = new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
    })

    const options: ChartOptions<'bar'> = {
      indexAxis: 'y' as const, // Horizontal bars
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.parsed.x || 0
              return formatter.format(value)
            },
          },
        },
      },
      scales: {
        x: {
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
  }, [transactions, limit])

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No expense data yet to show category breakdown.
      </div>
    )
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}

