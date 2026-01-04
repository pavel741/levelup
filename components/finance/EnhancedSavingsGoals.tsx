'use client'

import { useMemo } from 'react'
import type { SavingsGoal } from '@/types/finance'
import { formatCurrency } from '@/lib/utils'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import { format, differenceInDays, addMonths } from 'date-fns'
import { Target, TrendingUp, Calendar, Award } from 'lucide-react'

interface EnhancedSavingsGoalsProps {
  goals: SavingsGoal[]
}

interface GoalWithMilestones extends SavingsGoal {
  milestones: Array<{
    label: string
    targetAmount: number
    progress: number
    isCompleted: boolean
    percentage: number
  }>
  progressPercentage: number
  daysRemaining: number | null
  monthlyContribution: number | null
  estimatedCompletionDate: Date | null
}

export default function EnhancedSavingsGoals({ goals }: EnhancedSavingsGoalsProps) {
  const enhancedGoals = useMemo(() => {
    return goals.map((goal): GoalWithMilestones => {
      const currentAmount = goal.currentAmount || 0
      const targetAmount = goal.targetAmount || 0
      const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0

      // Generate milestones (25%, 50%, 75%, 100%)
      const milestones = [
        { percentage: 25, label: 'Quarter Way' },
        { percentage: 50, label: 'Halfway' },
        { percentage: 75, label: 'Three Quarters' },
        { percentage: 100, label: 'Complete' },
      ].map(({ percentage, label }) => {
        const targetAmount = (goal.targetAmount * percentage) / 100
        const progress = Math.min(currentAmount, targetAmount)
        const isCompleted = currentAmount >= targetAmount

        return {
          label,
          targetAmount,
          progress,
          isCompleted,
          percentage,
        }
      })

      // Calculate days remaining
      let daysRemaining: number | null = null
      if (goal.targetDate) {
        const targetDate = parseTransactionDate(goal.targetDate)
        const now = new Date()
        daysRemaining = Math.max(0, differenceInDays(targetDate, now))
      }

      // Calculate monthly contribution needed
      let monthlyContribution: number | null = null
      if (goal.targetDate && daysRemaining !== null && daysRemaining > 0) {
        const remainingAmount = targetAmount - currentAmount
        const monthsRemaining = daysRemaining / 30
        monthlyContribution = monthsRemaining > 0 ? remainingAmount / monthsRemaining : null
      }

      // Estimate completion date based on current progress rate
      let estimatedCompletionDate: Date | null = null
      if (goal.createdAt && currentAmount > 0 && progressPercentage > 0 && progressPercentage < 100) {
        const createdAt = parseTransactionDate(goal.createdAt)
        const daysElapsed = differenceInDays(new Date(), createdAt)
        if (daysElapsed > 0) {
          const dailyRate = currentAmount / daysElapsed
          const remainingAmount = targetAmount - currentAmount
          if (dailyRate > 0) {
            const daysToComplete = remainingAmount / dailyRate
            estimatedCompletionDate = addMonths(new Date(), Math.ceil(daysToComplete / 30))
          }
        }
      }

      return {
        ...goal,
        milestones,
        progressPercentage,
        daysRemaining,
        monthlyContribution,
        estimatedCompletionDate,
      }
    })
  }, [goals])

  if (enhancedGoals.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Savings Goals Visualization
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create savings goals to see progress visualization with milestones!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Savings Goals with Milestones
        </h2>
      </div>

      <div className="space-y-6">
        {enhancedGoals.map((goal) => (
          <div
            key={goal.id}
            className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2"
            style={{ borderColor: goal.color || '#6366f1' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {goal.name}
                </h3>
                {goal.category && (
                  <span className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                    {goal.category}
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {goal.progressPercentage.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Complete
                </div>
              </div>
            </div>

            {/* Main Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatCurrency(goal.targetAmount - goal.currentAmount)} remaining
                </span>
              </div>
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                {/* Progress fill */}
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(goal.progressPercentage, 100)}%`,
                    backgroundColor: goal.color || '#6366f1',
                  }}
                />
                
                {/* Milestone markers */}
                {goal.milestones.map((milestone, idx) => (
                  <div
                    key={idx}
                    className={`absolute top-0 bottom-0 w-0.5 ${
                      milestone.isCompleted
                        ? 'bg-green-500 dark:bg-green-400'
                        : 'bg-gray-400 dark:bg-gray-500'
                    }`}
                    style={{ left: `${milestone.percentage}%` }}
                    title={`${milestone.label}: ${milestone.percentage}%`}
                  />
                ))}
              </div>

              {/* Milestone Labels */}
              <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                {goal.milestones.map((milestone, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center ${
                      milestone.isCompleted ? 'text-green-600 dark:text-green-400 font-semibold' : ''
                    }`}
                  >
                    {milestone.isCompleted && (
                      <Award className="w-3 h-3 mb-1" />
                    )}
                    <span>{milestone.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones Detail */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {goal.milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-2 ${
                    milestone.isCompleted
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {milestone.label}
                  </div>
                  <div className={`text-sm font-semibold ${
                    milestone.isCompleted
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {formatCurrency(milestone.progress)} / {formatCurrency(milestone.targetAmount)}
                  </div>
                  {milestone.isCompleted && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ Achieved
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {goal.daysRemaining !== null && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Days Remaining</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {goal.daysRemaining}
                    </div>
                  </div>
                </div>
              )}
              {goal.monthlyContribution !== null && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Monthly Needed</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(goal.monthlyContribution)}
                    </div>
                  </div>
                </div>
              )}
              {goal.estimatedCompletionDate && (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Est. Completion</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {format(goal.estimatedCompletionDate, 'MMM yyyy')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

