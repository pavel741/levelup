'use client'

import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js'
import type { FinanceTransaction } from '@/types/finance'
import { getSuggestedCategory } from '@/lib/transactionCategorizer'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Props {
  transactions: FinanceTransaction[]
}

const COLORS = {
  'Card Payment': '#6366f1',
  'ATM Withdrawal': '#ef4444',
  'Bills': '#10b981',
  'ESTO': '#f59e0b',
  'Other': '#8b5cf6',
}

export function FinancePaymentMethodBreakdown({ transactions }: Props) {
  const { data, options } = useMemo(() => {
    const methodTotals: Record<string, number> = {
      'Card Payment': 0,
      'ATM Withdrawal': 0,
      'Bills': 0,
      'ESTO': 0,
      'Other': 0,
    }

    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      
      // Focus on expenses
      const isExpense = type === 'expense' || amount < 0
      if (!isExpense) continue

      const absAmount = Math.abs(amount)
      let category = tx.category || 'Other'
      
      // Check for LHV card payment pattern in description or archiveId
      const description = tx.description || ''
      const archiveId = (tx as any).archiveId || ''
      const combinedText = `${description} ${archiveId}`.toLowerCase()
      const lhvCardPattern = /\(\.\.\d+\)\s+\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}/
      const hasLhvCardPattern = lhvCardPattern.test(description) || lhvCardPattern.test(archiveId) || lhvCardPattern.test(combinedText)
      
      // Normalize category to determine payment method
      const needsRecategorization = 
        !category || 
        category === 'Other' ||
        category.includes('POS:') ||
        category.includes('ATM:') ||
        category.match(/\d{4}\s+\d{2}\*+/) ||
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

      // Map categories to payment methods
      let paymentMethod = 'Other'
      
      if (category === 'Card Payment' || category.includes('POS:')) {
        paymentMethod = 'Card Payment'
      } else if (category === 'ATM Withdrawal' || category.includes('ATM:')) {
        paymentMethod = 'ATM Withdrawal'
      } else if (category === 'Bills' || tx.referenceNumber) {
        paymentMethod = 'Bills'
      } else if (category === 'ESTO' || /psd2|klix/i.test(tx.description || '')) {
        paymentMethod = 'ESTO'
      } else {
        paymentMethod = 'Other'
      }
      
      methodTotals[paymentMethod] = (methodTotals[paymentMethod] || 0) + absAmount
    }

    // Filter out methods with zero spending
    const methods = Object.entries(methodTotals)
      .filter(([, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a)

    const labels = methods.map(([method]) => method)
    const amounts = methods.map(([, amount]) => amount)
    const colors = methods.map(([method]) => COLORS[method as keyof typeof COLORS] || COLORS.Other)

    const chartData: ChartData<'doughnut'> = {
      labels,
      datasets: [
        {
          data: amounts,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    }

    const formatter = new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
    })

    const options: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 15,
            generateLabels: (chart) => {
              const data = chart.data
              if (data.labels?.length && data.datasets?.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i] as number
                  const total = amounts.reduce((sum, v) => sum + v, 0)
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
                  return {
                    text: `${label}: ${formatter.format(value)} (${percentage}%)`,
                    fillStyle: colors[i],
                    strokeStyle: colors[i],
                    lineWidth: 2,
                    hidden: false,
                    index: i,
                  }
                })
              }
              return []
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const label = ctx.label || ''
              const value = ctx.parsed || 0
              const total = amounts.reduce((sum, v) => sum + v, 0)
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
              return `${label}: ${formatter.format(value)} (${percentage}%)`
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
        No transaction data yet to show payment method breakdown.
      </div>
    )
  }

  return (
    <div className="h-80">
      <Doughnut data={data} options={options} />
    </div>
  )
}

