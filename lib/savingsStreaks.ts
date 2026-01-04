/**
 * Savings Streaks System
 * Tracks consecutive months of saving money
 */

import type { FinanceTransaction } from '@/types/finance'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import { startOfMonth, endOfMonth, format, subMonths, isAfter, isBefore } from 'date-fns'

export interface SavingsStreak {
  currentStreak: number // Consecutive months with positive savings
  longestStreak: number // Longest streak ever achieved
  streakStartDate?: Date // When current streak started
  monthlySavings: Array<{
    month: string // Format: "YYYY-MM"
    income: number
    expenses: number
    savings: number
    date: Date
  }>
}

export function calculateSavingsStreak(transactions: FinanceTransaction[]): SavingsStreak {
  if (transactions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      monthlySavings: [],
    }
  }

  // Group transactions by month
  const monthlyData = new Map<string, { income: number; expenses: number; date: Date }>()

  transactions.forEach((tx) => {
    const txDate = parseTransactionDate(tx.date)
    const monthKey = format(txDate, 'yyyy-MM')
    const monthStart = startOfMonth(txDate)

    const amount = Number(tx.amount) || 0
    const type = (tx.type || '').toLowerCase()
    const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
    const isExpense = type === 'expense' || amount < 0

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { income: 0, expenses: 0, date: monthStart })
    }

    const data = monthlyData.get(monthKey)!
    if (isIncome) {
      data.income += Math.abs(amount)
    } else if (isExpense) {
      data.expenses += Math.abs(amount)
    }
  })

  // Convert to array and sort by date
  const monthlySavings = Array.from(monthlyData.entries())
    .map(([monthKey, data]) => ({
      month: monthKey,
      income: data.income,
      expenses: data.expenses,
      savings: data.income - data.expenses,
      date: data.date,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  // Calculate streaks
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let streakStartDate: Date | undefined

  // Check from most recent month backwards
  for (let i = monthlySavings.length - 1; i >= 0; i--) {
    const month = monthlySavings[i]
    if (month.savings > 0) {
      tempStreak++
      if (tempStreak === 1) {
        streakStartDate = month.date
      }
      if (i === monthlySavings.length - 1) {
        // This is the current streak
        currentStreak = tempStreak
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak
      }
    } else {
      tempStreak = 0
      streakStartDate = undefined
    }
  }

  return {
    currentStreak,
    longestStreak,
    streakStartDate,
    monthlySavings,
  }
}

