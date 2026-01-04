import type { FinanceTransaction, BudgetCategoryLimit, BudgetAnalysis } from '@/types/finance'
import { parseTransactionDate } from './financeDateUtils'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

/**
 * Calculate budget vs actual spending for categories
 */
export function calculateBudgetAnalysis(
  transactions: FinanceTransaction[],
  categoryLimits: BudgetCategoryLimit[],
  period: 'monthly' | 'weekly' = 'monthly',
  referenceDate: Date = new Date()
): BudgetAnalysis[] {
  const analyses: BudgetAnalysis[] = []
  
  // Determine period boundaries
  const periodStart = period === 'monthly' 
    ? startOfMonth(referenceDate)
    : startOfWeek(referenceDate, { weekStartsOn: 1 })
  const periodEnd = period === 'monthly'
    ? endOfMonth(referenceDate)
    : endOfWeek(referenceDate, { weekStartsOn: 1 })

  // Calculate spending per category
  const categorySpending = new Map<string, number>()
  
  transactions.forEach((tx) => {
    const txDate = parseTransactionDate(tx.date)
    
    // Only count expenses within the period
    if (!isWithinInterval(txDate, { start: periodStart, end: periodEnd })) {
      return
    }
    
    const amount = Number(tx.amount) || 0
    const type = (tx.type || '').toLowerCase()
    
    // Only count expenses
    if (type === 'expense' || (type !== 'income' && amount < 0)) {
      const category = tx.category || 'Uncategorized'
      const currentSpending = categorySpending.get(category) || 0
      categorySpending.set(category, currentSpending + Math.abs(amount))
    }
  })

  // Create analysis for each category with a limit
  categoryLimits.forEach((limit) => {
    const spent = categorySpending.get(limit.category) || 0
    const budgetLimit = period === 'monthly' ? limit.monthlyLimit : (limit.weeklyLimit || 0)
    
    if (budgetLimit > 0) {
      const remaining = Math.max(0, budgetLimit - spent)
      const percentageUsed = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0
      const isOverBudget = spent > budgetLimit

      analyses.push({
        category: limit.category,
        limit: budgetLimit,
        spent,
        remaining,
        percentageUsed,
        isOverBudget,
        period,
        periodStart,
        periodEnd,
      })
    }
  })

  return analyses.sort((a, b) => b.spent - a.spent)
}

/**
 * Get categories that are approaching or over budget
 */
export function getBudgetAlerts(
  analyses: BudgetAnalysis[],
  alertThreshold: number = 80
): BudgetAnalysis[] {
  return analyses.filter(
    (analysis) => analysis.isOverBudget || analysis.percentageUsed >= alertThreshold
  )
}

