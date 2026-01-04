'use client'

import { useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { calculateSavingsStreak } from '@/lib/savingsStreaks'
import { format } from 'date-fns'
import { Flame, Trophy, TrendingUp } from 'lucide-react'

interface SavingsStreaksProps {
  transactions: FinanceTransaction[]
}

export default function SavingsStreaks({ transactions }: SavingsStreaksProps) {
  const streakData = useMemo(() => {
    return calculateSavingsStreak(transactions)
  }, [transactions])

  if (streakData.monthlySavings.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Savings Streaks
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Start saving to build your streak!
        </p>
      </div>
    )
  }

  const recentMonths = streakData.monthlySavings.slice(-6).reverse() // Last 6 months, most recent first

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Savings Streaks
        </h2>
      </div>

      {/* Current Streak */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 mb-4 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Streak</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Flame className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              {streakData.currentStreak}
              <span className="text-lg text-gray-600 dark:text-gray-400">
                {streakData.currentStreak === 1 ? 'month' : 'months'}
              </span>
            </div>
          </div>
          {streakData.streakStartDate && (
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-500">Since</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {format(streakData.streakStartDate, 'MMM yyyy')}
              </div>
            </div>
          )}
        </div>
        {streakData.currentStreak > 0 && (
          <div className="text-sm text-green-700 dark:text-green-400 font-medium">
            🎉 Keep it up! You're on a roll!
          </div>
        )}
      </div>

      {/* Longest Streak */}
      {streakData.longestStreak > streakData.currentStreak && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              Longest Streak
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {streakData.longestStreak} {streakData.longestStreak === 1 ? 'month' : 'months'}
          </div>
        </div>
      )}

      {/* Recent Months */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Recent Months
          </h3>
        </div>
        <div className="space-y-2">
          {recentMonths.map((month, idx) => {
            const isPositive = month.savings > 0
            const isInStreak = idx < streakData.currentStreak
            return (
              <div
                key={month.month}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  isInStreak
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isInStreak && (
                    <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {format(month.date, 'MMM yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-500">Savings</div>
                    <div
                      className={`text-sm font-semibold ${
                        isPositive
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {new Intl.NumberFormat('et-EE', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(month.savings)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

