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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  transactions: FinanceTransaction[]
  bins?: number // Number of bins/buckets (default: 20)
}

export function FinanceExpenseDistribution({ transactions, bins = 20 }: Props) {
  const { data, options } = useMemo(() => {
    // Get all expense amounts
    const amounts: number[] = []
    
    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      
      const isExpense = type === 'expense' || amount < 0
      if (!isExpense) continue

      const absAmount = Math.abs(amount)
      amounts.push(absAmount)
    }

    if (amounts.length === 0) {
      return { data: null, options: null }
    }

    // Calculate bin ranges
    const min = Math.min(...amounts)
    const max = Math.max(...amounts)
    const binSize = (max - min) / bins

    // Create bins
    const binCounts: number[] = new Array(bins).fill(0)
    const binLabels: string[] = []

    amounts.forEach((amount) => {
      let binIndex = Math.floor((amount - min) / binSize)
      if (binIndex >= bins) binIndex = bins - 1 // Handle edge case
      binCounts[binIndex]++
    })

    // Create labels for bins
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binSize
      const binEnd = min + (i + 1) * binSize
      binLabels.push(`${binStart.toFixed(0)}-${binEnd.toFixed(0)}`)
    }

    const chartData: ChartData<'bar'> = {
      labels: binLabels,
      datasets: [
        {
          label: 'Number of Transactions',
          data: binCounts,
          backgroundColor: '#6366f1',
          borderRadius: 4,
        },
      ],
    }

    const formatter = new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
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
            title: (items) => {
              const index = items[0].dataIndex
              const binStart = min + index * binSize
              const binEnd = min + (index + 1) * binSize
              return `${formatter.format(binStart)} - ${formatter.format(binEnd)}`
            },
            label: (ctx) => {
              const count = ctx.parsed.y || 0
              return `${count} transaction${count !== 1 ? 's' : ''}`
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            callback: function(value, index) {
              // Show every nth label to avoid crowding
              const showEvery = Math.ceil(bins / 10)
              return index % showEvery === 0 ? this.getLabelForValue(value) : ''
            },
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    }

    return { data: chartData, options }
  }, [transactions, bins])

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No transaction data yet to show expense distribution.
      </div>
    )
  }

  if (!data || !options) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No expense data available.
      </div>
    )
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}

