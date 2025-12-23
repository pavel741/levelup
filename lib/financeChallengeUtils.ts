import type { Challenge } from '@/types'
import type { FinanceTransaction } from '@/types/finance'
import { parseTransactionDate } from './financeDateUtils'

/**
 * Calculate finance challenge progress based on transactions
 */
export function calculateFinanceChallengeProgress(
  challenge: Challenge,
  transactions: FinanceTransaction[],
  _userId: string
): number {
  if (!challenge.financeGoalType || challenge.type !== 'finance') {
    return 0
  }

  const startDate = challenge.startDate instanceof Date ? challenge.startDate : new Date(challenge.startDate)
  const endDate = challenge.endDate instanceof Date ? challenge.endDate : new Date(challenge.endDate)
  const now = new Date()

  // Filter transactions within challenge period (using optimized date parser)
  const challengeTransactions = transactions.filter((tx) => {
    const txDate = parseTransactionDate(tx.date)
    return txDate >= startDate && txDate <= (now > endDate ? endDate : now)
  })

  // Calculate income and expenses
  let income = 0
  let expenses = 0

  challengeTransactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0
    const type = (tx.type || '').toLowerCase()
    if (type === 'income' || amount > 0) {
      income += Math.abs(amount)
    } else {
      expenses += Math.abs(amount)
    }
  })

  switch (challenge.financeGoalType) {
    case 'savings_rate': {
      // Target: Save X% of income
      const targetPercentage = challenge.financeTargetPercentage || 0
      if (income === 0) return 0
      const savings = income - expenses
      const currentRate = (savings / income) * 100
      const progress = Math.min(100, Math.max(0, (currentRate / targetPercentage) * 100))
      return Math.round(progress)
    }

    case 'spending_limit': {
      // Target: Spend less than X amount
      const targetAmount = challenge.financeTarget || 0
      if (targetAmount === 0) return 0
      const period = challenge.financePeriod || 'challenge_duration'
      
      // Calculate period multiplier
      let multiplier = 1
      if (period === 'daily') {
        const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
        multiplier = daysElapsed
      } else if (period === 'weekly') {
        const weeksElapsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)))
        multiplier = weeksElapsed
      } else if (period === 'monthly') {
        const monthsElapsed = Math.max(1, (now.getMonth() - startDate.getMonth()) + (now.getFullYear() - startDate.getFullYear()) * 12)
        multiplier = monthsElapsed
      }
      
      const periodLimit = targetAmount * multiplier
      const progress = Math.min(100, Math.max(0, ((periodLimit - expenses) / periodLimit) * 100))
      return Math.round(progress)
    }

    case 'savings_amount': {
      // Target: Save X amount
      const targetAmount = challenge.financeTarget || 0
      if (targetAmount === 0) return 0
      const savings = income - expenses
      const progress = Math.min(100, Math.max(0, (savings / targetAmount) * 100))
      return Math.round(progress)
    }

    case 'no_spend_days': {
      // Target: X days with no expenses
      const targetDays = challenge.financeTarget || 0
      if (targetDays === 0) return 0
      
      // Group transactions by date and count days with no expenses
      const datesWithExpenses = new Set<string>()
      challengeTransactions.forEach((tx) => {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        if (type === 'expense' || amount < 0) {
          const txDate = parseTransactionDate(tx.date)
          const dateStr = txDate.toISOString().split('T')[0]
          datesWithExpenses.add(dateStr)
        }
      })

      // Count days in challenge period
      const allDays = new Set<string>()
      let currentDate = new Date(startDate)
      while (currentDate <= (now > endDate ? endDate : now)) {
        allDays.add(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }

      const noSpendDays = allDays.size - datesWithExpenses.size
      const progress = Math.min(100, Math.max(0, (noSpendDays / targetDays) * 100))
      return Math.round(progress)
    }

    default:
      return 0
  }
}

/**
 * Get finance challenge status text
 */
export function getFinanceChallengeStatus(challenge: Challenge, progress: number): string {
  if (!challenge.financeGoalType) return ''

  switch (challenge.financeGoalType) {
    case 'savings_rate':
      return `${progress}% of ${challenge.financeTargetPercentage}% savings rate`
    case 'spending_limit':
      return `${progress}% of spending limit goal`
    case 'savings_amount':
      return `${progress}% of savings target`
    case 'no_spend_days':
      return `${progress}% of no-spend days`
    default:
      return ''
  }
}

