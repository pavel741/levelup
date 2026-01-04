'use client'

import { useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { analyzeSpendingPersonality } from '@/lib/spendingPersonality'
import { Sparkles, TrendingUp } from 'lucide-react'

interface SpendingPersonalityProps {
  transactions: FinanceTransaction[]
}

export default function SpendingPersonality({ transactions }: SpendingPersonalityProps) {
  const analysis = useMemo(() => {
    return analyzeSpendingPersonality(transactions)
  }, [transactions])

  if (!analysis.primary || analysis.primary.type === 'unknown') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Spending Personality
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {analysis.primary?.description || 'Add more transactions to discover your spending personality!'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Your Spending Personality
        </h2>
      </div>

      {/* Primary Personality */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="text-4xl">{analysis.primary.icon}</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {analysis.primary.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {analysis.primary.description}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${analysis.primary.score}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {analysis.primary.score}%
              </span>
            </div>
            {analysis.primary.traits.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {analysis.primary.traits.map((trait, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white/60 dark:bg-gray-800/60 rounded text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Personality */}
      {analysis.secondary && analysis.secondary.score > 20 && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{analysis.secondary.icon}</div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {analysis.secondary.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {analysis.secondary.description}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gray-400 dark:bg-gray-500 h-2 rounded-full transition-all"
                    style={{ width: `${analysis.secondary.score}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {analysis.secondary.score}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Insights
          </h4>
          <ul className="space-y-1">
            {analysis.insights.map((insight, idx) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                • {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

