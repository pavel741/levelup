'use client'

import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  ChartOptions,
  ChartData,
} from 'chart.js'
import type { FinanceTransaction } from '@/types/finance'
import { getSuggestedCategory } from '@/lib/transactionCategorizer'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Props {
  transactions: FinanceTransaction[]
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
  '#a855f7',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#f43f5e',
]

export function FinanceCategoryChart({ transactions }: Props) {
  const { data, options } = useMemo(() => {
    const categoryTotals: Record<string, number> = {}

    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0
      // Use absolute value - transactions are already filtered by view type
      const absAmount = Math.abs(amount)
      
      // Check if this is an income transaction
      const type = (tx.type || '').toLowerCase()
      const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
      
      // Check for LHV card payment pattern in description or archiveId
      const description = tx.description || ''
      const archiveId = (tx as any).archiveId || ''
      const combinedText = `${description} ${archiveId}`.toLowerCase()
      const lhvCardPattern = /\(\.\.\d+\)\s+\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}/
      const hasLhvCardPattern = lhvCardPattern.test(description) || lhvCardPattern.test(archiveId) || lhvCardPattern.test(combinedText)
      
      // Normalize category: if category looks like a description (contains POS pattern), recategorize it
      let category = tx.category || 'Other'
      
      // For income transactions, always use "Income" category (override any expense categories)
      if (isIncome) {
        // Override expense categories like "Bills", "Card Payment", etc. with "Income"
        const expenseCategories = ['Bills', 'Card Payment', 'ATM Withdrawal', 'Other', 'Kommunaalid', 'Kodulaen', 'ESTO']
        const validIncomeCategories = ['Income', 'Palk', 'Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Bonus']
        // Set to "Income" if: empty, expense category, looks like description, or not a valid income category
        const isExpenseCategory = expenseCategories.some(exp => category.toLowerCase() === exp.toLowerCase())
        const isValidIncomeCategory = validIncomeCategories.some(valid => category.toLowerCase() === valid.toLowerCase())
        if (!category || isExpenseCategory || category.includes('POS:') || category.match(/\d{4}\s+\d{2}\*+/) || !isValidIncomeCategory) {
          category = 'Income'
        }
      } else {
        // For expenses, use the expense categorizer
        // Always try to recategorize if:
        // 1. Category looks like a description (contains POS:, card numbers, etc.)
        // 2. Category is empty or "Other"
        // 3. Category contains card number patterns
        // 4. LHV card payment pattern detected
        const needsRecategorization = 
          !category || 
          category === 'Other' ||
          category.includes('POS:') ||
          category.match(/\d{4}\s+\d{2}\*+/) ||
          category.toLowerCase().includes('pos') ||
          category.match(/^\d{4}\s+\d{2}\*+/) ||
          hasLhvCardPattern // Always recategorize if LHV pattern detected
        
        if (needsRecategorization) {
          // Include archiveId in description for LHV pattern detection
          const fullDescription = archiveId && archiveId.trim().length > 0
            ? `${description} ${archiveId}`.trim()
            : description
          
          const suggestedCategory = getSuggestedCategory(
            fullDescription || category,
            tx.referenceNumber,
            tx.recipientName,
            amount
          )
          if (suggestedCategory) {
            category = suggestedCategory
          }
        }
      }
      
      categoryTotals[category] = (categoryTotals[category] || 0) + absAmount
    }

    const categories = Object.keys(categoryTotals)
    const amounts = categories.map((c) => categoryTotals[c])
    const total = amounts.reduce((sum, v) => sum + v, 0)

    const chartData: ChartData<'doughnut'> = {
      labels: categories,
      datasets: [
        {
          data: amounts,
          backgroundColor: categories.map((_, i) => COLORS[i % COLORS.length]),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    }

    const options: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 14,
            font: {
              size: 11,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.parsed || 0
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
              const formatter = new Intl.NumberFormat('et-EE', {
                style: 'currency',
                currency: 'EUR',
              })
              return `${formatter.format(value)} (${percentage}%)`
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
        No expense data yet to show a category breakdown.
      </div>
    )
  }

  return (
    <div className="h-72">
      <Doughnut data={data} options={options} />
    </div>
  )
}


