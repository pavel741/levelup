/**
 * Money Milestones System
 * Tracks and celebrates financial achievements
 */

import type { FinanceTransaction } from '@/types/finance'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import { format, subDays } from 'date-fns'

export interface MoneyMilestone {
  id: string
  type: 'savings' | 'no_spend' | 'budget' | 'streak' | 'goal'
  title: string
  description: string
  icon: string
  achieved: boolean
  achievedDate?: Date
  progress: number
  target: number
  unit: string
}

export interface MilestoneAnalysis {
  milestones: MoneyMilestone[]
  recentAchievements: MoneyMilestone[]
  upcomingMilestones: MoneyMilestone[]
}

export function analyzeMoneyMilestones(
  transactions: FinanceTransaction[],
  periodMonths: number = 3
): MilestoneAnalysis {
  const milestones: MoneyMilestone[] = []
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth() - periodMonths, 1)

  // Filter transactions in period
  const periodTransactions = transactions.filter((tx) => {
    const txDate = parseTransactionDate(tx.date)
    return txDate >= periodStart && txDate <= now
  })

  // Calculate income and expenses
  let totalIncome = 0
  let totalExpenses = 0
  const dailySpending: Record<string, number> = {}
  const categorySpending: Record<string, number> = {}

  periodTransactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0
    const type = (tx.type || '').toLowerCase()
    const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
    const isExpense = type === 'expense' || amount < 0

    if (isIncome) {
      totalIncome += Math.abs(amount)
    } else if (isExpense) {
      const absAmount = Math.abs(amount)
      totalExpenses += absAmount

      const txDate = parseTransactionDate(tx.date)
      const dayKey = format(txDate, 'yyyy-MM-dd')
      dailySpending[dayKey] = (dailySpending[dayKey] || 0) + absAmount

      const category = tx.category || 'Other'
      categorySpending[category] = (categorySpending[category] || 0) + absAmount
    }
  })

  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0

  // 1. Savings Milestones
  const savingsMilestones = [
    { target: 100, title: 'Saved €100', icon: '💯' },
    { target: 500, title: 'Saved €500', icon: '💰' },
    { target: 1000, title: 'Saved €1,000', icon: '🎉' },
    { target: 2500, title: 'Saved €2,500', icon: '🏆' },
    { target: 5000, title: 'Saved €5,000', icon: '💎' },
    { target: 10000, title: 'Saved €10,000', icon: '👑' },
  ]

  savingsMilestones.forEach(({ target, title, icon }) => {
    const achieved = savings >= target
    milestones.push({
      id: `savings_${target}`,
      type: 'savings',
      title,
      description: `Save €${target.toLocaleString()} this period`,
      icon,
      achieved,
      achievedDate: achieved ? now : undefined,
      progress: Math.min(savings, target),
      target,
      unit: 'EUR',
    })
  })

  // 2. No-Spend Streaks
  // const sortedDays = Object.keys(dailySpending).sort() // Unused
  let currentStreak = 0
  let maxStreak = 0
  let streakStart: Date | null = null

  // Check last 30 days for streaks
  for (let i = 0; i < 30; i++) {
    const checkDate = subDays(now, i)
    const dayKey = format(checkDate, 'yyyy-MM-dd')
    const hasSpending = dailySpending[dayKey] && dailySpending[dayKey] > 0

    if (!hasSpending) {
      currentStreak++
      if (currentStreak === 1) {
        streakStart = checkDate
      }
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak
      }
    } else {
      currentStreak = 0
      streakStart = null
    }
  }

  const streakMilestones = [
    { target: 3, title: '3 Days No Spending', icon: '🔥' },
    { target: 7, title: '7 Days No Spending', icon: '💪' },
    { target: 14, title: '2 Weeks No Spending', icon: '🌟' },
    { target: 30, title: '30 Days No Spending', icon: '🏅' },
  ]

  streakMilestones.forEach(({ target, title, icon }) => {
    const achieved = maxStreak >= target
    milestones.push({
      id: `streak_${target}`,
      type: 'streak',
      title,
      description: `Go ${target} days without spending`,
      icon,
      achieved,
      achievedDate: achieved && streakStart ? streakStart : undefined,
      progress: maxStreak,
      target,
      unit: 'days',
    })
  })

  // 3. Budget Milestones (if spending is under certain thresholds)
  const monthlyAverage = totalExpenses / periodMonths
  const budgetMilestones = [
    { target: 500, title: 'Under €500/month', icon: '📉' },
    { target: 1000, title: 'Under €1,000/month', icon: '💵' },
    { target: 1500, title: 'Under €1,500/month', icon: '💸' },
  ]

  budgetMilestones.forEach(({ target, title, icon }) => {
    const achieved = monthlyAverage <= target
    milestones.push({
      id: `budget_${target}`,
      type: 'budget',
      title,
      description: `Keep monthly spending under €${target}`,
      icon,
      achieved,
      achievedDate: achieved ? now : undefined,
      progress: monthlyAverage,
      target,
      unit: 'EUR/month',
    })
  })

  // 4. Savings Rate Milestones
  const rateMilestones = [
    { target: 10, title: '10% Savings Rate', icon: '📊' },
    { target: 20, title: '20% Savings Rate', icon: '💹' },
    { target: 30, title: '30% Savings Rate', icon: '🚀' },
    { target: 50, title: '50% Savings Rate', icon: '🎯' },
  ]

  rateMilestones.forEach(({ target, title, icon }) => {
    const achieved = savingsRate >= target
    milestones.push({
      id: `rate_${target}`,
      type: 'savings',
      title,
      description: `Achieve ${target}% savings rate`,
      icon,
      achieved,
      achievedDate: achieved ? now : undefined,
      progress: savingsRate,
      target,
      unit: '%',
    })
  })

  // Separate into achieved and upcoming
  const recentAchievements = milestones
    .filter((m) => m.achieved)
    .sort((a, b) => {
      const dateA = a.achievedDate?.getTime() || 0
      const dateB = b.achievedDate?.getTime() || 0
      return dateB - dateA
    })
    .slice(0, 5)

  const upcomingMilestones = milestones
    .filter((m) => !m.achieved)
    .sort((a, b) => {
      // Sort by progress percentage (closest to achievement first)
      const progressA = (a.progress / a.target) * 100
      const progressB = (b.progress / b.target) * 100
      return progressB - progressA
    })
    .slice(0, 5)

  return {
    milestones,
    recentAchievements,
    upcomingMilestones,
  }
}

