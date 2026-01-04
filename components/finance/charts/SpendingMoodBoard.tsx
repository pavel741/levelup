'use client'

import { useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { getCategoryEmoji, getCategoryColor } from '@/lib/categoryEmojis'
import { ImageIcon } from 'lucide-react'

interface SpendingMoodBoardProps {
  transactions: FinanceTransaction[]
}

interface CategoryVisual {
  category: string
  emoji: string
  amount: number
  percentage: number
  color: string
  count: number
}

export default function SpendingMoodBoard({ transactions }: SpendingMoodBoardProps) {
  const moodBoardData = useMemo(() => {
    const categoryTotals: Record<string, { amount: number; count: number }> = {}
    let totalExpenses = 0

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      const isExpense = type === 'expense' || amount < 0

      if (isExpense) {
        const absAmount = Math.abs(amount)
        const category = tx.category || 'Other'
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = { amount: 0, count: 0 }
        }
        
        categoryTotals[category].amount += absAmount
        categoryTotals[category].count += 1
        totalExpenses += absAmount
      }
    })

    const visuals: CategoryVisual[] = Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        emoji: getCategoryEmoji(category),
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        color: getCategoryColor(category),
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20) // Top 20 categories

    return { visuals, totalExpenses }
  }, [transactions])

  if (moodBoardData.visuals.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Spending Mood Board
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No spending data to visualize yet. Start tracking expenses to see your mood board!
        </p>
      </div>
    )
  }

  // Calculate size based on percentage (min 40px, max 200px)
  const getSize = (percentage: number) => {
    const minSize = 40
    const maxSize = 200
    return Math.max(minSize, Math.min(maxSize, (percentage / 100) * maxSize + minSize))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Spending Mood Board
        </h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Visual collage of your spending categories. Size represents spending amount.
      </p>

      {/* Visual Collage */}
      <div className="relative min-h-[400px] bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20 rounded-lg p-8 overflow-hidden">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {moodBoardData.visuals.map((visual, idx) => {
            const size = getSize(visual.percentage)
            return (
              <div
                key={visual.category}
                className="relative group cursor-pointer"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                  style={{
                    backgroundColor: `${visual.color}20`,
                    border: `3px solid ${visual.color}`,
                    fontSize: `${size * 0.4}px`,
                  }}
                  title={`${visual.category}: ${new Intl.NumberFormat('et-EE', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(visual.amount)} (${visual.percentage.toFixed(1)}%)`}
                >
                  {visual.emoji}
                </div>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                    <div className="font-semibold">{visual.category}</div>
                    <div className="text-gray-300">
                      {new Intl.NumberFormat('et-EE', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(visual.amount)}
                    </div>
                    <div className="text-gray-400">
                      {visual.percentage.toFixed(1)}% • {visual.count} transaction{visual.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Top Categories
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {moodBoardData.visuals.slice(0, 12).map((visual) => (
            <div
              key={visual.category}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
            >
              <span className="text-2xl">{visual.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {visual.category}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {visual.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

