import { FinanceTransaction, FinanceRecurringTransaction } from '@/types/finance'
import { differenceInDays } from 'date-fns'
import { parseTransactionDate } from '@/lib/utils'

export interface BillMatch {
  bill: FinanceRecurringTransaction
  transaction: FinanceTransaction
  score: number
  confidence: 'high' | 'medium' | 'low'
  reasons: string[]
}

export interface BillMatchingSettings {
  enabled: boolean
  autoMatchHighConfidence: boolean
  requireConfirmation: boolean
  amountTolerance: number // Percentage (default: 10%)
  dateToleranceDays: number // Days (default: 7)
  minMatchScore: number // Minimum score to consider match (default: 50)
}

export const DEFAULT_MATCHING_SETTINGS: BillMatchingSettings = {
  enabled: true,
  autoMatchHighConfidence: true,
  requireConfirmation: false,
  amountTolerance: 10, // 10%
  dateToleranceDays: 7,
  minMatchScore: 50,
}

/**
 * Normalize string for comparison (lowercase, remove extra spaces)
 */
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Check if two strings match (exact or partial)
 */
function stringMatches(str1: string, str2: string): { exact: boolean; partial: boolean } {
  const normalized1 = normalizeString(str1)
  const normalized2 = normalizeString(str2)
  
  const exact = normalized1 === normalized2
  const partial = normalized1.includes(normalized2) || normalized2.includes(normalized1)
  
  return { exact, partial }
}

/**
 * Calculate fuzzy match score between two strings
 */
function fuzzyMatch(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1)
  const normalized2 = normalizeString(str2)
  
  if (normalized1 === normalized2) return 1.0
  
  // Check if one contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const shorter = Math.min(normalized1.length, normalized2.length)
    const longer = Math.max(normalized1.length, normalized2.length)
    return shorter / longer
  }
  
  // Simple word overlap check
  const words1 = normalized1.split(/\s+/)
  const words2 = normalized2.split(/\s+/)
  const commonWords = words1.filter(w => words2.includes(w))
  
  if (commonWords.length === 0) return 0
  
  return commonWords.length / Math.max(words1.length, words2.length)
}

/**
 * Match transaction to a bill using scoring system
 */
export function matchTransactionToBill(
  transaction: FinanceTransaction,
  bill: FinanceRecurringTransaction,
  settings: BillMatchingSettings = DEFAULT_MATCHING_SETTINGS
): BillMatch | null {
  let score = 0
  const reasons: string[] = []
  
  // If bill is already paid, check if transaction date is newer than last payment
  // This allows matching new monthly payments even if previous month was marked as paid
  if (bill.isPaid && bill.lastPaidDate) {
    try {
      const lastPaidDate = parseTransactionDate(bill.lastPaidDate)
      const txDate = parseTransactionDate(transaction.date)
      
      // Only allow matching if transaction is at least 1 day after last payment
      // This prevents matching the same payment twice
      if (differenceInDays(txDate, lastPaidDate) <= 0) {
        return null // Transaction is same date or before last payment
      }
      // Transaction is newer, allow matching (will create new payment entry)
    } catch (error) {
      // Date parsing failed, skip matching for already paid bills
      if (bill.isPaid) {
        return null
      }
    }
  } else if (bill.isPaid && !bill.lastPaidDate) {
    // Bill is marked as paid but has no payment date - skip to be safe
    return null
  }
  
  // 1. Name/Description Matching (40 points)
  const billName = bill.name || bill.description || ''
  const transactionDesc = transaction.description || ''
  
  if (billName && transactionDesc) {
    const nameMatch = stringMatches(billName, transactionDesc)
    const fuzzyScore = fuzzyMatch(billName, transactionDesc)
    
    if (nameMatch.exact) {
      score += 40
      reasons.push('Exact name match')
    } else if (nameMatch.partial) {
      score += 30
      reasons.push('Partial name match')
    } else if (fuzzyScore > 0.5) {
      score += 20
      reasons.push(`Fuzzy name match (${Math.round(fuzzyScore * 100)}%)`)
    }
  }
  
  // 2. Category Matching (30 points)
  if (bill.category && transaction.category) {
    const categoryMatch = stringMatches(bill.category, transaction.category)
    if (categoryMatch.exact) {
      score += 30
      reasons.push('Exact category match')
    } else if (categoryMatch.partial) {
      score += 15
      reasons.push('Partial category match')
    }
  }
  
  // 3. Recipient Name Matching (20 points)
  const billRecipient = (bill as any).recipientName || ''
  const transactionRecipient = (transaction as any).recipientName || ''
  
  if (billRecipient && transactionRecipient) {
    const recipientMatch = stringMatches(billRecipient, transactionRecipient)
    if (recipientMatch.exact) {
      score += 20
      reasons.push('Exact recipient match')
    } else if (recipientMatch.partial) {
      score += 10
      reasons.push('Partial recipient match')
    }
  }
  
  // 4. Amount Matching (30 points for exact, less for close matches)
  const billAmount = Math.abs(bill.amount)
  const transactionAmount = Math.abs(transaction.amount)
  let hasExactAmountMatch = false
  
  if (billAmount > 0 && transactionAmount > 0) {
    const difference = Math.abs(billAmount - transactionAmount)
    const percentageDiff = (difference / billAmount) * 100
    
    if (difference === 0) {
      score += 30 // Increased from 10 - exact amount is a very strong signal
      hasExactAmountMatch = true
      reasons.push('Exact amount match')
    } else if (percentageDiff <= settings.amountTolerance) {
      score += 15 // Increased from 8
      reasons.push(`Amount within tolerance (${percentageDiff.toFixed(1)}% diff)`)
    } else if (percentageDiff <= settings.amountTolerance * 2) {
      score += 8 // Increased from 5
      reasons.push(`Amount close (${percentageDiff.toFixed(1)}% diff)`)
    }
  }
  
  // Bonus: Exact name + Exact amount = very high confidence (add 10 bonus points)
  const hasExactNameMatch = reasons.some(r => r === 'Exact name match')
  if (hasExactNameMatch && hasExactAmountMatch) {
    score += 10
    reasons.push('Bonus: Exact name + Exact amount match')
  }
  
  // 5. Date Proximity (Bonus points)
  if (bill.dueDate) {
    try {
      const dueDate = parseTransactionDate(bill.dueDate)
      const txDate = parseTransactionDate(transaction.date)
      
      const daysDiff = Math.abs(differenceInDays(txDate, dueDate))
      
      // Determine expected tolerance based on interval
      let expectedTolerance = settings.dateToleranceDays
      if (bill.interval === 'weekly') {
        expectedTolerance = 3
      } else if (bill.interval === 'yearly') {
        expectedTolerance = 30
      }
      
      if (daysDiff <= expectedTolerance) {
        const bonusPoints = Math.max(0, 10 - daysDiff)
        score += bonusPoints
        reasons.push(`Date within tolerance (${daysDiff} days from due date)`)
      } else if (daysDiff <= expectedTolerance * 2) {
        score += 2
        reasons.push(`Date somewhat close (${daysDiff} days from due date)`)
      }
    } catch (error) {
      // Date parsing failed, skip date matching
    }
  }
  
  // Check if score meets minimum threshold
  if (score < settings.minMatchScore) {
    return null
  }
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low'
  if (score >= 70) {
    confidence = 'high'
  } else if (score >= 50) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }
  
  return {
    bill,
    transaction,
    score,
    confidence,
    reasons,
  }
}

/**
 * Find all bill matches for a list of transactions
 */
export function findBillMatches(
  transactions: FinanceTransaction[],
  bills: FinanceRecurringTransaction[],
  settings: BillMatchingSettings = DEFAULT_MATCHING_SETTINGS
): BillMatch[] {
  const matches: BillMatch[] = []
  const usedBills = new Set<string>()
  const usedTransactions = new Set<string>()
  
  // First pass: Find all potential matches
  const potentialMatches: BillMatch[] = []
  
  for (const transaction of transactions) {
    // Only match expense transactions
    if (transaction.type !== 'expense') continue
    
    for (const bill of bills) {
      // matchTransactionToBill handles paid bills internally
      const match = matchTransactionToBill(transaction, bill, settings)
      if (match) {
        potentialMatches.push(match)
      }
    }
  }
  
  // Sort by score (highest first)
  potentialMatches.sort((a, b) => b.score - a.score)
  
  // Second pass: Assign matches (one transaction to one bill)
  for (const match of potentialMatches) {
    const txId = match.transaction.id || JSON.stringify(match.transaction)
    const billId = match.bill.id
    
    // Skip if transaction or bill already matched
    if (usedTransactions.has(txId) || usedBills.has(billId)) {
      continue
    }
    
    matches.push(match)
    usedTransactions.add(txId)
    usedBills.add(billId)
  }
  
  return matches
}

/**
 * Calculate next due date based on interval
 */
export function calculateNextDueDate(
  bill: FinanceRecurringTransaction,
  paymentDate: Date
): Date {
  const baseDate = bill.dueDate 
    ? parseTransactionDate(bill.dueDate)
    : paymentDate
  
  const interval = bill.interval || 'monthly'
  
  switch (interval) {
    case 'weekly':
      return new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    case 'monthly':
      return new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    case 'yearly':
      return new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000)
    default:
      return new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000) // Default to monthly
  }
}

