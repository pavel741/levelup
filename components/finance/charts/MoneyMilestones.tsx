'use client'

import { useMemo, useState } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { analyzeMoneyMilestones } from '@/lib/moneyMilestones'
import { Trophy, Target, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

interface MoneyMilestonesProps {
  transactions: FinanceTransaction[]
  periodMonths?: number
}

export default function MoneyMilestones({ transactions, periodMonths = 3 }: MoneyMilestonesProps) {
  const analysis = useMemo(() => {
    return analyzeMoneyMilestones(transactions, periodMonths)
  }, [transactions, periodMonths])

  const [showAll, setShowAll] = useState(false)

  if (analysis.milestones.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Money Milestones
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Start tracking your finances to unlock milestones!
        </p>
      </div>
    )
  }

  const displayAchievements = showAll ? analysis.recentAchievements : analysis.recentAchievements.slice(0, 3)
  const displayUpcoming = showAll ? analysis.upcomingMilestones : analysis.upcomingMilestones.slice(0, 3)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Money Milestones
        </h2>
      </div>

      {/* Recent Achievements */}
      {displayAchievements.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Recent Achievements
            </h3>
          </div>
          <div className="space-y-2">
            {displayAchievements.map((milestone) => (
              <div
                key={milestone.id}
                className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{milestone.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {milestone.title}
                      </span>
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                        Achieved
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {milestone.description}
                    </p>
                    {milestone.achievedDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {format(milestone.achievedDate, 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Milestones */}
      {displayUpcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Upcoming Milestones
            </h3>
          </div>
          <div className="space-y-2">
            {displayUpcoming.map((milestone) => {
              const progressPercentage = (milestone.progress / milestone.target) * 100
              return (
                <div
                  key={milestone.id}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl opacity-60">{milestone.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {milestone.title}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(progressPercentage)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {milestone.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {milestone.progress.toFixed(0)} / {milestone.target.toLocaleString()} {milestone.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Show More/Less */}
      {(analysis.recentAchievements.length > 3 || analysis.upcomingMilestones.length > 3) && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          {showAll ? 'Show Less' : `Show All (${analysis.recentAchievements.length + analysis.upcomingMilestones.length} total)`}
        </button>
      )}
    </div>
  )
}

