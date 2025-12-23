/**
 * Custom hook for calculating finance summaries
 * Extracts summary calculation logic from FinancePage
 */

import { useMemo } from 'react'
import type { FinanceTransaction, FinanceSettings } from '@/types/finance'
import { getPeriodDates, parseTransactionDate } from '@/lib/financeDateUtils'

export interface FinanceSummary {
  income: number
  expenses: number
  balance: number
}

export interface UseFinanceSummaryOptions {
  transactions: FinanceTransaction[]
  selectedMonth: string
  financeSettings: FinanceSettings | null
  view: 'monthly' | 'alltime'
}

export function useFinanceSummary({
  transactions,
  selectedMonth,
  financeSettings,
  view,
}: UseFinanceSummaryOptions): {
  monthlySummary: FinanceSummary
  allTimeSummary: FinanceSummary
  summary: FinanceSummary
} {
  const monthlySummary = useMemo(() => {
    if (view === 'alltime' || transactions.length === 0) {
      return { income: 0, expenses: 0, balance: 0 }
    }

    const { startDate, endDate } = getPeriodDates(
      selectedMonth,
      financeSettings?.usePaydayPeriod || false,
      financeSettings?.periodStartDay || 1,
      financeSettings?.periodEndDay || null,
      financeSettings?.paydayCutoffHour || 13,
      financeSettings?.paydayStartCutoffHour || 14
    )

    let expenses = 0
    let income = 0

    transactions.forEach((tx) => {
      const txDate = parseTransactionDate(tx.date)
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()

      const isExpense = type === 'expense' || amount < 0
      if (!isExpense) {
        // For payday periods with cutoff times:
        // - Start: Last working day of previous month at 2pm (14:00) - transactions at/after 2pm belong to this period
        // - End: Last working day of current month at 1pm (13:00) - transactions before 1pm belong to this period
        if (financeSettings?.usePaydayPeriod) {
          const txTime = txDate.getHours() * 60 + txDate.getMinutes()
          const startCutoff = (financeSettings.paydayStartCutoffHour || 14) * 60
          const endCutoff = (financeSettings.paydayCutoffHour || 13) * 60

          // Check if transaction is within period considering cutoff times
          if (txDate >= startDate && txDate <= endDate) {
            // For start date: include if at or after cutoff
            if (txDate.getTime() === startDate.getTime() && txTime < startCutoff) {
              return // Before start cutoff, exclude
            }
            // For end date: include if before cutoff
            if (txDate.getTime() === endDate.getTime() && txTime >= endCutoff) {
              return // At or after end cutoff, exclude
            }
            income += Math.abs(amount)
          }
        } else {
          // Regular period: just check date range
          if (txDate >= startDate && txDate <= endDate) {
            income += Math.abs(amount)
          }
        }
      } else {
        // Expense handling with payday period logic
        if (financeSettings?.usePaydayPeriod) {
          const txTime = txDate.getHours() * 60 + txDate.getMinutes()
          const startCutoff = (financeSettings.paydayStartCutoffHour || 14) * 60
          const endCutoff = (financeSettings.paydayCutoffHour || 13) * 60

          if (txDate >= startDate && txDate <= endDate) {
            if (txDate.getTime() === startDate.getTime() && txTime < startCutoff) {
              return
            }
            if (txDate.getTime() === endDate.getTime() && txTime >= endCutoff) {
              return
            }
            expenses += Math.abs(amount)
          }
        } else {
          if (txDate >= startDate && txDate <= endDate) {
            expenses += Math.abs(amount)
          }
        }
      }
    })

    return {
      income,
      expenses,
      balance: income - expenses,
    }
  }, [transactions, selectedMonth, financeSettings, view])

  const allTimeSummary = useMemo(() => {
    let expenses = 0
    let income = 0

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()

      const isExpense = type === 'expense' || amount < 0
      if (isExpense) {
        expenses += Math.abs(amount)
      } else {
        income += Math.abs(amount)
      }
    })

    return {
      income,
      expenses,
      balance: income - expenses,
    }
  }, [transactions])

  const summary = view === 'monthly' ? monthlySummary : allTimeSummary

  return {
    monthlySummary,
    allTimeSummary,
    summary,
  }
}

