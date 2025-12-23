/**
 * Finance Summary Cards Component
 * Displays income, expenses, and balance summary
 */

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface FinanceSummary {
  income: number
  expenses: number
  balance: number
}

interface FinanceSummaryCardsProps {
  summary: FinanceSummary
  view: 'monthly' | 'alltime'
}

export default function FinanceSummaryCards({ summary, view }: FinanceSummaryCardsProps) {
  const labels = {
    monthly: {
      balance: 'Monthly Balance',
      income: 'Monthly Income',
      expenses: 'Monthly Expenses',
    },
    alltime: {
      balance: 'Total Balance',
      income: 'Total Income',
      expenses: 'Total Expenses',
    },
  }

  const currentLabels = labels[view]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {currentLabels.balance}
          </h3>
          <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
          {formatCurrency(summary.balance)}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {currentLabels.income}
          </h3>
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono tabular-nums">
          {formatCurrency(summary.income)}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {currentLabels.expenses}
          </h3>
          <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono tabular-nums">
          {formatCurrency(summary.expenses)}
        </div>
      </div>
    </div>
  )
}

