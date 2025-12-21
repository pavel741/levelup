import type { FinanceTransaction } from '@/types/finance'
import { startOfMonth, endOfMonth, addDays, subDays } from 'date-fns'

/**
 * Optimized date parsing for transactions
 * Caches parsed dates to avoid repeated parsing
 */
const dateCache = new Map<string, Date>()

/**
 * Get period dates based on settings
 */
export function getPeriodDates(
  selectedMonth: string,
  usePaydayPeriod: boolean,
  periodStartDay: number,
  periodEndDay: number | null
): { startDate: Date; endDate: Date } {
  const [year, month] = selectedMonth.split('-').map(Number)
  
  if (usePaydayPeriod && periodStartDay) {
    // Payday period: e.g., 15th to 14th of next month
    const startDate = new Date(year, month - 1, periodStartDay)
    const endDay = periodEndDay || periodStartDay - 1
    const endDate = new Date(year, month, endDay, 23, 59, 59)
    return { startDate, endDate }
  } else {
    // Calendar month
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))
    endDate.setHours(23, 59, 59)
    return { startDate, endDate }
  }
}

export function parseTransactionDate(date: string | Date | any): Date {
  if (date instanceof Date) {
    return date
  }

  if (typeof date === 'string') {
    // Check cache first
    if (dateCache.has(date)) {
      return dateCache.get(date)!
    }
    
    const parsed = new Date(date)
    // Cache if valid
    if (!isNaN(parsed.getTime())) {
      // Limit cache size to prevent memory issues
      if (dateCache.size > 1000) {
        const firstKey = dateCache.keys().next().value
        if (firstKey !== undefined) {
          dateCache.delete(firstKey)
        }
      }
      dateCache.set(date, parsed)
    }
    return parsed
  }

  // Firestore Timestamp
  if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate()
  }

  // Fallback
  return new Date(date)
}

/**
 * Clear date cache (useful for memory management)
 */
export function clearDateCache() {
  dateCache.clear()
}
