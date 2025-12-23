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
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns'
import { getSuggestedCategory } from '@/lib/transactionCategorizer'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  transactions: FinanceTransaction[]
  months?: number // Number of months to use for prediction (default: 6)
}

export function FinanceCategoryForecast({ transactions, months = 6 }: Props) {
  const { data, options, forecastData } = useMemo(() => {
    // Calculate the actual date range from transactions
    let minDate: Date | null = null
    let maxDate: Date | null = null
    
    transactions.forEach((tx) => {
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
      if (!minDate || txDate < minDate) minDate = txDate
      if (!maxDate || txDate > maxDate) maxDate = txDate
    })
    
    // If no transactions, use current date as fallback
    const referenceDate = maxDate || new Date()
    
    const categoryMonthlyTotals: Record<string, number[]> = {}

    // Collect monthly totals for each category over the last N months from transaction date range
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(referenceDate, i))
      const monthEnd = endOfMonth(monthStart)

      transactions.forEach((tx) => {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        
        const isExpense = type === 'expense' || amount < 0
        if (!isExpense) return

        const absAmount = Math.abs(amount)
        const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
        
        if (!isWithinInterval(txDate, { start: monthStart, end: monthEnd })) return

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

        if (!categoryMonthlyTotals[category]) {
          categoryMonthlyTotals[category] = []
        }
        
        // Initialize array if needed
        const monthIndex = months - 1 - i
        while (categoryMonthlyTotals[category].length <= monthIndex) {
          categoryMonthlyTotals[category].push(0)
        }
        
        categoryMonthlyTotals[category][monthIndex] += absAmount
      })
    }

    // Calculate forecast for each category using simple moving average
    const forecast: Record<string, { predicted: number; trend: 'up' | 'down' | 'stable'; confidence: number }> = {}

    Object.entries(categoryMonthlyTotals).forEach(([category, monthlyAmounts]) => {
      if (monthlyAmounts.length < 2) {
        // Not enough data for prediction
        forecast[category] = {
          predicted: monthlyAmounts[0] || 0,
          trend: 'stable',
          confidence: 0.3,
        }
        return
      }

      // Calculate average of last 3 months (or all available if less)
      const recentMonths = monthlyAmounts.slice(-3)
      const average = recentMonths.reduce((sum, val) => sum + val, 0) / recentMonths.length
      
      // Calculate trend (comparing last month to previous month)
      const lastMonth = monthlyAmounts[monthlyAmounts.length - 1]
      const prevMonth = monthlyAmounts[monthlyAmounts.length - 2]
      const trend = lastMonth > prevMonth ? 'up' : lastMonth < prevMonth ? 'down' : 'stable'
      
      // Adjust prediction based on trend (simple linear extrapolation)
      const trendAdjustment = trend === 'up' ? 1.05 : trend === 'down' ? 0.95 : 1.0
      const predicted = average * trendAdjustment
      
      // Confidence based on data consistency (lower variance = higher confidence)
      const variance = recentMonths.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / recentMonths.length
      const stdDev = Math.sqrt(variance)
      const coefficientOfVariation = average > 0 ? stdDev / average : 1
      const confidence = Math.max(0.3, Math.min(0.9, 1 - coefficientOfVariation))

      forecast[category] = {
        predicted: Math.max(0, predicted),
        trend,
        confidence,
      }
    })

    // Sort by predicted amount and take top 10
    const sortedForecast = Object.entries(forecast)
      .sort(([, a], [, b]) => b.predicted - a.predicted)
      .slice(0, 10)

    const categories = sortedForecast.map(([cat]) => cat)
    const predictedAmounts = sortedForecast.map(([, data]) => data.predicted)
    const trends = sortedForecast.map(([, data]) => data.trend)
    const confidences = sortedForecast.map(([, data]) => data.confidence)

    const chartData: ChartData<'bar'> = {
      labels: categories,
      datasets: [
        {
          label: 'Predicted Spending',
          data: predictedAmounts,
          backgroundColor: predictedAmounts.map((_, i) => {
            const trend = trends[i]
            if (trend === 'up') return '#ef4444' // Red for increasing
            if (trend === 'down') return '#10b981' // Green for decreasing
            return '#6366f1' // Blue for stable
          }),
          borderRadius: 4,
        },
      ],
    }

    const formatter = new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
    })

    const options: ChartOptions<'bar'> = {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const index = ctx.dataIndex
              const predicted = predictedAmounts[index]
              const confidence = confidences[index]
              const trend = trends[index]
              const trendText = trend === 'up' ? '↑ Increasing' : trend === 'down' ? '↓ Decreasing' : '→ Stable'
              return [
                `Predicted: ${formatter.format(predicted)}`,
                `Trend: ${trendText}`,
                `Confidence: ${(confidence * 100).toFixed(0)}%`,
              ]
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

    return { data: chartData, options, forecastData: sortedForecast }
  }, [transactions, months])

  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
        No transaction data yet to generate forecast.
      </div>
    )
  }

  const formatter = new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
  })

  return (
    <div>
      <div className="h-80 mb-4">
        <Bar data={data} options={options} />
      </div>
      
      {/* Forecast Details Table */}
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Forecast Details:</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {forecastData.map(([category, forecast]) => (
            <div
              key={category}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-xs"
            >
              <span className="font-medium text-gray-900 dark:text-white">{category}</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-700 dark:text-gray-300">
                  {formatter.format(forecast.predicted)}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  forecast.trend === 'up' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  forecast.trend === 'down' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                }`}>
                  {forecast.trend === 'up' ? '↑' : forecast.trend === 'down' ? '↓' : '→'} {(forecast.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

