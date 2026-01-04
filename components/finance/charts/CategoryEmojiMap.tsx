'use client'

import { useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { getCategoryEmoji, getCategoryColor } from '@/lib/categoryEmojis'
import { MapPin } from 'lucide-react'

interface CategoryEmojiMapProps {
  transactions: FinanceTransaction[]
}

interface CategoryData {
  category: string
  emoji: string
  amount: number
  percentage: number
  color: string
  count: number
  avgAmount: number
}

export default function CategoryEmojiMap({ transactions }: CategoryEmojiMapProps) {
  const categoryMap = useMemo(() => {
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

    const categories: CategoryData[] = Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        emoji: getCategoryEmoji(category),
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        color: getCategoryColor(category),
        count: data.count,
        avgAmount: data.count > 0 ? data.amount / data.count : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    return { categories, totalExpenses }
  }, [transactions])

  if (categoryMap.categories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Category Emoji Map
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No spending data to map yet. Start tracking expenses to see your category map!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Category Emoji Map
        </h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Visual map of your spending categories with emojis
      </p>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categoryMap.categories.map((cat) => (
          <div
            key={cat.category}
            className="group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl p-4 border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer hover:shadow-lg"
            style={{
              borderColor: cat.percentage > 10 ? `${cat.color}40` : 'transparent',
            }}
          >
            {/* Emoji */}
            <div className="text-center mb-3">
              <div
                className="text-5xl mb-2 transition-transform group-hover:scale-110"
                style={{ filter: cat.percentage > 10 ? 'none' : 'grayscale(50%)' }}
              >
                {cat.emoji}
              </div>
            </div>

            {/* Category Name */}
            <div className="text-center mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
                {cat.category}
              </h3>
              <div
                className="text-lg font-bold mb-1"
                style={{ color: cat.color }}
              >
                {new Intl.NumberFormat('et-EE', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(cat.amount)}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Share:</span>
                <span className="font-medium">{cat.percentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Transactions:</span>
                <span className="font-medium">{cat.count}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('et-EE', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  }).format(cat.avgAmount)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(cat.percentage, 100)}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Categories</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {categoryMap.categories.length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Spending</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('et-EE', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(categoryMap.totalExpenses)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

