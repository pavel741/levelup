/**
 * Subscription Analyzer
 * Analyzes recurring transactions and suggests cancellations
 */

import type { FinanceRecurringTransaction, FinanceTransaction } from '@/types/finance'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import { differenceInDays, isPast, addMonths } from 'date-fns'

export interface SubscriptionSuggestion {
  subscription: FinanceRecurringTransaction
  reason: string
  priority: 'high' | 'medium' | 'low'
  potentialSavings: number
  lastUsed?: Date
  usageFrequency?: number
}

export interface SubscriptionAnalysis {
  suggestions: SubscriptionSuggestion[]
  totalPotentialSavings: number
  unusedSubscriptions: FinanceRecurringTransaction[]
}

/**
 * Analyze subscriptions and suggest cancellations
 */
export function analyzeSubscriptions(
  recurringTransactions: FinanceRecurringTransaction[],
  allTransactions: FinanceTransaction[]
): SubscriptionAnalysis {
  const suggestions: SubscriptionSuggestion[] = []
  const unusedSubscriptions: FinanceRecurringTransaction[] = []

  recurringTransactions.forEach((sub) => {
    const amount = Math.abs(Number(sub.amount) || 0)
    if (amount === 0) return

    // Find related transactions
    const relatedTransactions = allTransactions.filter((tx) => {
      const txAmount = Math.abs(Number(tx.amount) || 0)
      const txDate = parseTransactionDate(tx.date)
      
      // Match by amount (within 5% tolerance)
      const amountMatch = Math.abs(txAmount - amount) / amount < 0.05
      
      // Match by description/recipient
      const descMatch = 
        (sub.name && tx.description?.toLowerCase().includes(sub.name.toLowerCase())) ||
        (sub.recipientName && tx.recipientName?.toLowerCase().includes(sub.recipientName.toLowerCase())) ||
        (sub.description && tx.description?.toLowerCase().includes(sub.description.toLowerCase()))

      return amountMatch && descMatch
    })

    // Calculate usage frequency
    const now = new Date()
    const sixMonthsAgo = addMonths(now, -6)
    const recentTransactions = relatedTransactions.filter((tx) => {
      const txDate = parseTransactionDate(tx.date)
      return txDate >= sixMonthsAgo && txDate <= now
    })

    const usageFrequency = recentTransactions.length / 6 // transactions per month
    const lastUsed = relatedTransactions.length > 0
      ? parseTransactionDate(relatedTransactions[relatedTransactions.length - 1].date)
      : undefined

    // Calculate monthly cost
    const interval = (sub.interval || 'monthly').toLowerCase()
    let monthlyCost = amount
    switch (interval) {
      case 'daily':
        monthlyCost = amount * 30
        break
      case 'weekly':
        monthlyCost = amount * 4.33
        break
      case 'biweekly':
      case 'bi-weekly':
        monthlyCost = amount * 2.17
        break
      case 'monthly':
        monthlyCost = amount
        break
      case 'quarterly':
        monthlyCost = amount / 3
        break
      case 'yearly':
      case 'annually':
        monthlyCost = amount / 12
        break
    }

    const yearlyCost = monthlyCost * 12

    // Suggestion reasons
    if (recentTransactions.length === 0 && lastUsed) {
      const daysSinceLastUse = differenceInDays(now, lastUsed)
      if (daysSinceLastUse > 90) {
        suggestions.push({
          subscription: sub,
          reason: `Not used in ${Math.floor(daysSinceLastUse / 30)} months`,
          priority: daysSinceLastUse > 180 ? 'high' : 'medium',
          potentialSavings: yearlyCost,
          lastUsed,
          usageFrequency: 0,
        })
        unusedSubscriptions.push(sub)
      }
    } else if (usageFrequency < 0.5 && monthlyCost > 10) {
      // Used less than once every 2 months and costs more than €10/month
      suggestions.push({
        subscription: sub,
        reason: `Low usage (${recentTransactions.length} times in 6 months)`,
        priority: monthlyCost > 30 ? 'high' : 'medium',
        potentialSavings: yearlyCost,
        lastUsed,
        usageFrequency,
      })
    } else if (yearlyCost > 500 && usageFrequency < 2) {
      // High cost but low usage
      suggestions.push({
        subscription: sub,
        reason: `High cost (€${yearlyCost.toFixed(0)}/year) with low usage`,
        priority: 'high',
        potentialSavings: yearlyCost,
        lastUsed,
        usageFrequency,
      })
    } else if (monthlyCost > 50 && !sub.isPaid) {
      // Expensive unpaid subscription
      suggestions.push({
        subscription: sub,
        reason: `Expensive subscription (€${monthlyCost.toFixed(0)}/month)`,
        priority: 'medium',
        potentialSavings: yearlyCost,
        lastUsed,
        usageFrequency,
      })
    }
  })

  // Sort by priority and potential savings
  suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return b.potentialSavings - a.potentialSavings
  })

  const totalPotentialSavings = suggestions.reduce(
    (sum, s) => sum + s.potentialSavings,
    0
  )

  return {
    suggestions,
    totalPotentialSavings,
    unusedSubscriptions,
  }
}

