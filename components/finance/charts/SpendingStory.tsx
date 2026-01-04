'use client'

import { useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { generateSpendingStory } from '@/lib/spendingStory'
import { startOfMonth, endOfMonth } from 'date-fns'
import { BookOpen, Sparkles } from 'lucide-react'

interface SpendingStoryProps {
  transactions: FinanceTransaction[]
  periodStart?: Date
  periodEnd?: Date
}

export default function SpendingStory({ 
  transactions, 
  periodStart = startOfMonth(new Date()),
  periodEnd = endOfMonth(new Date())
}: SpendingStoryProps) {
  const story = useMemo(() => {
    return generateSpendingStory(transactions, periodStart, periodEnd)
  }, [transactions, periodStart, periodEnd])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Spending Story
        </h2>
      </div>

      {/* Story Title */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {story.title}
        </h3>
      </div>

      {/* Narrative */}
      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20 rounded-lg p-6 mb-6">
        <div className="space-y-3">
          {story.narrative.map((paragraph, idx) => (
            <p
              key={idx}
              className="text-base text-gray-800 dark:text-gray-200 leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Highlights */}
      {story.highlights.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Spending Highlights
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {story.highlights.map((highlight, idx) => (
              <div
                key={idx}
                className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{highlight.emoji}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {highlight.category}
                    </div>
                    <div className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {new Intl.NumberFormat('et-EE', {
                        style: 'currency',
                        currency: 'EUR',
                        maximumFractionDigits: 0,
                      }).format(highlight.amount)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {highlight.insight}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Spent</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('et-EE', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(story.summary.totalSpent)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Top Category</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {story.summary.topCategory}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transactions</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {story.summary.transactionCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Transaction</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('et-EE', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(story.summary.avgTransaction)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

