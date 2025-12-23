'use client'

import { useMemo, useState, useEffect } from 'react'
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
import { processTrendChartInWorker } from '@/lib/utils/chartWorkerClient'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Props {
  transactions: FinanceTransaction[]
  months?: number // Number of months to show (default: 12)
}

export function FinanceTrendChart({ transactions, months = 12 }: Props) {
  const [processedData, setProcessedData] = useState<{
    labels: string[]
    incomeData: number[]
    expenseData: number[]
    balanceData: number[]
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  // Process chart data in Web Worker
  useEffect(() => {
    if (transactions.length === 0) {
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)
    processTrendChartInWorker(transactions, months)
      .then((result) => {
        setProcessedData(result)
        setIsProcessing(false)
      })
      .catch((error) => {
        console.error('Chart processing error:', error)
        setIsProcessing(false)
      })
  }, [transactions, months])

  const { data, options } = useMemo(() => {
    // Use processed data from worker or fallback to empty
    if (!processedData) {
      return {
        data: {
          labels: [],
          datasets: [],
        },
        options: {} as ChartOptions<'line'>,
      }
    }

    const { labels, incomeData, expenseData, balanceData } = processedData

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
  }, [processedData])

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No transaction data yet to show trends.
      </div>
    )
  }

  if (isProcessing || !processedData) {
    return (
      <div className="flex items-center justify-center h-80 text-sm text-gray-500 dark:text-gray-400">
        Processing chart data...
      </div>
    )
  }

  return (
    <div className="h-80">
      <Line data={data} options={options} />
    </div>
  )
}

