/**
 * Spending Story Generator
 * Generates narrative descriptions of spending patterns
 */

import type { FinanceTransaction } from '@/types/finance'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { getCategoryEmoji } from './categoryEmojis'

export interface SpendingStory {
  title: string
  narrative: string[]
  highlights: Array<{
    category: string
    amount: number
    emoji: string
    insight: string
  }>
  summary: {
    totalSpent: number
    topCategory: string
    transactionCount: number
    avgTransaction: number
  }
}

/**
 * Generate a spending story for a given period
 */
export function generateSpendingStory(
  transactions: FinanceTransaction[],
  periodStart: Date = startOfMonth(new Date()),
  periodEnd: Date = endOfMonth(new Date())
): SpendingStory {
  // Filter transactions for the period
  const periodTransactions = transactions.filter((tx) => {
    const txDate = parseTransactionDate(tx.date)
    return txDate >= periodStart && txDate <= periodEnd
  })

  if (periodTransactions.length === 0) {
    return {
      title: 'No Spending Data',
      narrative: ['You haven\'t tracked any spending for this period yet.'],
      highlights: [],
      summary: {
        totalSpent: 0,
        topCategory: 'N/A',
        transactionCount: 0,
        avgTransaction: 0,
      },
    }
  }

  // Calculate category totals
  const categoryTotals: Record<string, { amount: number; count: number }> = {}
  let totalExpenses = 0
  let totalIncome = 0

  periodTransactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0
    const type = (tx.type || '').toLowerCase()
    const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
    const isExpense = type === 'expense' || amount < 0

    if (isIncome) {
      totalIncome += Math.abs(amount)
    } else if (isExpense) {
      const absAmount = Math.abs(amount)
      const category = tx.category || 'Other'
      
      if (!categoryTotals[category]) {
        categoryTotals[category] = { amount: 0, count: 0 }
      }
      
      categoryTotals[category].amount += absAmount
      categoryTotals[category].count += 1
      totalExpenses += absAmount
    }
  })

  // Sort categories by amount
  const sortedCategories = Object.entries(categoryTotals)
    .map(([category, data]) => ({
      category,
      ...data,
      emoji: getCategoryEmoji(category),
    }))
    .sort((a, b) => b.amount - a.amount)

  const topCategory = sortedCategories[0]?.category || 'Other'
  const avgTransaction = totalExpenses / periodTransactions.filter(
    (tx) => (tx.type || '').toLowerCase() === 'expense' || Number(tx.amount) < 0
  ).length || 0

  // Generate narrative
  const narrative: string[] = []
  const periodName = format(periodStart, 'MMMM yyyy')
  
  narrative.push(`In ${periodName}, you spent ${new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(totalExpenses)} across ${sortedCategories.length} different categories.`)

  if (sortedCategories.length > 0) {
    const topCat = sortedCategories[0]
    narrative.push(`Your biggest expense was ${topCat.category} ${topCat.emoji}, totaling ${new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(topCat.amount)} (${((topCat.amount / totalExpenses) * 100).toFixed(0)}% of your spending).`)
  }

  if (sortedCategories.length > 1) {
    const secondCat = sortedCategories[1]
    narrative.push(`You also spent ${new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(secondCat.amount)} on ${secondCat.category} ${secondCat.emoji}.`)
  }

  const savings = totalIncome - totalExpenses
  if (savings > 0) {
    narrative.push(`After all expenses, you saved ${new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(savings)} this month! 🎉`)
  } else if (savings < 0) {
    narrative.push(`You spent ${new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(Math.abs(savings))} more than you earned this month.`)
  }

  // Generate highlights
  const highlights = sortedCategories.slice(0, 5).map((cat) => {
    const percentage = (cat.amount / totalExpenses) * 100
    let insight = ''
    
    if (percentage > 30) {
      insight = 'Major spending category'
    } else if (percentage > 15) {
      insight = 'Significant portion of budget'
    } else if (cat.count > 10) {
      insight = 'Frequent purchases'
    } else {
      insight = 'Regular expense'
    }

    return {
      category: cat.category,
      amount: cat.amount,
      emoji: cat.emoji,
      insight,
    }
  })

  return {
    title: `Your ${periodName} Spending Story`,
    narrative,
    highlights,
    summary: {
      totalSpent: totalExpenses,
      topCategory,
      transactionCount: periodTransactions.length,
      avgTransaction,
    },
  }
}

