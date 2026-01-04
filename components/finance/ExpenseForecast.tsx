'use client'

import { useEffect, useState } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { getExpenseForecast } from '@/lib/forecastApi'
import type { ExpenseForecast } from '@/types/finance'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, BarChart3, AlertCircle } from 'lucide-react'

interface ExpenseForecastProps {
  period?: 'month' | 'quarter' | 'year'
  monthsOfHistory?: number
}

export default function ExpenseForecastComponent({ period = 'month', monthsOfHistory = 6 }: ExpenseForecastProps) {
  const { user } = useFirestoreStore()
  const [forecast, setForecast] = useState<ExpenseForecast | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const loadForecast = async () => {
      try {
        setIsLoading(true)
        const data = await getExpenseForecast(user.id, period, monthsOfHistory)
        setForecast(data)
      } catch (error) {
        console.error('Error loading expense forecast:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadForecast()
  }, [user?.id, period, monthsOfHistory])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!forecast) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Expense Forecast
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Not enough data to generate forecast. Need at least 2 months of transaction history.
        </p>
      </div>
    )
  }

  const periodLabel = period === 'month' ? 'Next Month' : period === 'quarter' ? 'Next Quarter' : 'Next Year'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Expense Forecast
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {periodLabel} prediction based on {forecast.basedOnMonths} months of history
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className={`w-2 h-2 rounded-full ${forecast.confidence >= 70 ? 'bg-green-500' : forecast.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
          {forecast.confidence}% confidence
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="text-sm text-red-600 dark:text-red-400 mb-1">Predicted Expenses</div>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            {formatCurrency(forecast.predictedExpenses)}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-sm text-green-600 dark:text-green-400 mb-1">Predicted Income</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {formatCurrency(forecast.predictedIncome)}
          </div>
        </div>
        <div className={`rounded-lg p-4 ${forecast.predictedSavings >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
          <div className={`text-sm mb-1 ${forecast.predictedSavings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
            Predicted Savings
          </div>
          <div className={`text-2xl font-bold ${forecast.predictedSavings >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-orange-900 dark:text-orange-100'}`}>
            {formatCurrency(forecast.predictedSavings)}
          </div>
        </div>
      </div>

      {/* Low Confidence Warning */}
      {forecast.confidence < 50 && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Low confidence forecast. More transaction history needed for accurate predictions.
            </span>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Predictions</h3>
        {forecast.breakdown.map((item) => {
          const TrendIcon = item.trend === 'increasing' ? TrendingUp : item.trend === 'decreasing' ? TrendingDown : Minus
          const trendColor = item.trend === 'increasing' ? 'text-red-600 dark:text-red-400' : item.trend === 'decreasing' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'

          return (
            <div key={item.category} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">{item.category}</span>
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Avg: {formatCurrency(item.averageAmount)} • Trend: {item.trend}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(item.predictedAmount)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {period === 'month' ? 'per month' : period === 'quarter' ? 'per quarter' : 'per year'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Insights */}
      {forecast.predictedSavings < 0 && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <div className="font-semibold text-red-900 dark:text-red-100 mb-1">
                Projected Deficit
              </div>
              <div className="text-sm text-red-800 dark:text-red-200">
                If you continue spending at this rate, you'll have a deficit of {formatCurrency(Math.abs(forecast.predictedSavings))} {period === 'month' ? 'next month' : period === 'quarter' ? 'next quarter' : 'next year'}.
                Consider reducing expenses or increasing income.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

