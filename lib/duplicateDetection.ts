/**
 * Duplicate Transaction Detection
 * Detects similar transactions that might be duplicates
 */

import type { FinanceTransaction } from '@/types/finance'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import { differenceInDays } from 'date-fns'

export interface DuplicateAlert {
  transaction: FinanceTransaction
  similarTransactions: FinanceTransaction[]
  similarityScore: number
  reason: string
}

export interface DuplicateDetectionResult {
  alerts: DuplicateAlert[]
  totalDuplicates: number
}

/**
 * Calculate similarity between two transactions
 */
function calculateSimilarity(tx1: FinanceTransaction, tx2: FinanceTransaction): {
  score: number
  reasons: string[]
} {
  let score = 0
  const reasons: string[] = []

  // Amount similarity (exact match = 100 points)
  const amount1 = Math.abs(Number(tx1.amount) || 0)
  const amount2 = Math.abs(Number(tx2.amount) || 0)
  if (amount1 === amount2 && amount1 > 0) {
    score += 100
    reasons.push('Exact amount match')
  } else if (amount1 > 0 && amount2 > 0) {
    const diff = Math.abs(amount1 - amount2) / Math.max(amount1, amount2)
    if (diff < 0.01) {
      score += 80
      reasons.push('Nearly identical amount')
    } else if (diff < 0.05) {
      score += 50
      reasons.push('Similar amount')
    }
  }

  // Description similarity
  const desc1 = (tx1.description || '').toLowerCase().trim()
  const desc2 = (tx2.description || '').toLowerCase().trim()
  if (desc1 === desc2 && desc1.length > 0) {
    score += 80
    reasons.push('Exact description match')
  } else if (desc1.length > 0 && desc2.length > 0) {
    // Check for word overlap
    const words1 = desc1.split(/\s+/).filter(w => w.length > 2)
    const words2 = desc2.split(/\s+/).filter(w => w.length > 2)
    const commonWords = words1.filter(w => words2.includes(w))
    if (commonWords.length > 0) {
      const overlap = commonWords.length / Math.max(words1.length, words2.length)
      score += overlap * 60
      reasons.push(`${commonWords.length} common words`)
    }
  }

  // Recipient name similarity
  const recipient1 = (tx1.recipientName || '').toLowerCase().trim()
  const recipient2 = (tx2.recipientName || '').toLowerCase().trim()
  if (recipient1 === recipient2 && recipient1.length > 0) {
    score += 70
    reasons.push('Same recipient')
  }

  // Reference number match
  const ref1 = (tx1.referenceNumber || '').trim()
  const ref2 = (tx2.referenceNumber || '').trim()
  if (ref1 === ref2 && ref1.length > 0) {
    score += 90
    reasons.push('Same reference number')
  }

  // Date proximity (within 7 days = higher score)
  const date1 = parseTransactionDate(tx1.date)
  const date2 = parseTransactionDate(tx2.date)
  const daysDiff = Math.abs(differenceInDays(date1, date2))
  if (daysDiff === 0) {
    score += 50
    reasons.push('Same date')
  } else if (daysDiff <= 1) {
    score += 30
    reasons.push('Within 1 day')
  } else if (daysDiff <= 7) {
    score += 20
    reasons.push('Within 7 days')
  }

  // Category match
  if (tx1.category === tx2.category && tx1.category) {
    score += 20
    reasons.push('Same category')
  }

  return { score, reasons }
}

/**
 * Detect duplicate or similar transactions
 */
export function detectDuplicates(
  transactions: FinanceTransaction[],
  similarityThreshold: number = 150
): DuplicateDetectionResult {
  const alerts: DuplicateAlert[] = []
  const processed = new Set<string>()

  // Sort by date (most recent first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = parseTransactionDate(a.date).getTime()
    const dateB = parseTransactionDate(b.date).getTime()
    return dateB - dateA
  })

  for (let i = 0; i < sortedTransactions.length; i++) {
    const tx1 = sortedTransactions[i]
    if (processed.has(tx1.id)) continue

    const similar: FinanceTransaction[] = []

    for (let j = i + 1; j < sortedTransactions.length; j++) {
      const tx2 = sortedTransactions[j]
      if (processed.has(tx2.id)) continue

      const { score, reasons } = calculateSimilarity(tx1, tx2)

      if (score >= similarityThreshold) {
        similar.push(tx2)
        processed.add(tx2.id)
      }
    }

    if (similar.length > 0) {
      // Calculate average similarity
      const avgScore = similar.reduce((sum, tx) => {
        const { score } = calculateSimilarity(tx1, tx)
        return sum + score
      }, 0) / similar.length

      const { reasons } = calculateSimilarity(tx1, similar[0])

      alerts.push({
        transaction: tx1,
        similarTransactions: similar,
        similarityScore: avgScore,
        reason: reasons.join(', '),
      })

      processed.add(tx1.id)
    }
  }

  return {
    alerts,
    totalDuplicates: alerts.reduce((sum, alert) => sum + alert.similarTransactions.length, 0),
  }
}

