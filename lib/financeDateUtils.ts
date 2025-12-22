import type { FinanceTransaction } from '@/types/finance'
import { startOfMonth, endOfMonth, addDays, subDays, isWeekend } from 'date-fns'

/**
 * Optimized date parsing for transactions
 * Caches parsed dates to avoid repeated parsing
 */
const dateCache = new Map<string, Date>()

/**
 * Get the last working day of a month (Monday-Friday)
 */
function getLastWorkingDayOfMonth(year: number, month: number): Date {
  // Get the last day of the month
  const lastDay = endOfMonth(new Date(year, month - 1))
  let currentDate = new Date(lastDay)
  
  // Go backwards until we find a weekday (Monday-Friday)
  while (isWeekend(currentDate)) {
    currentDate = subDays(currentDate, 1)
  }
  
  return currentDate
}

/**
 * Get period dates based on settings
 */
export function getPeriodDates(
  selectedMonth: string,
  usePaydayPeriod: boolean,
  periodStartDay: number,
  periodEndDay: number | null,
  paydayCutoffHour: number = 13, // Default 1pm (13:00) for end date
  paydayStartCutoffHour: number = 14 // Default 2pm (14:00) for start date
): { startDate: Date; endDate: Date; cutoffHour?: number; startCutoffHour?: number } {
  const [year, month] = selectedMonth.split('-').map(Number)
  
  if (usePaydayPeriod) {
    // Payday period: Last working day of previous month to last working day of current month
    // - Start: Last working day of previous month at 2pm (14:00) - transactions at/after 2pm belong to this period
    // - End: Last working day of current month at 1pm (13:00) - transactions before 1pm belong to this period
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const prevLastWorkingDay = getLastWorkingDayOfMonth(prevYear, prevMonth)
    const startDate = new Date(prevLastWorkingDay)
    startDate.setHours(paydayStartCutoffHour, 0, 0, 0) // Start from 2pm of previous month's last working day
    
    // End: Last working day of current month at 1pm (exclusive after 1pm)
    const endDate = getLastWorkingDayOfMonth(year, month)
    endDate.setHours(paydayCutoffHour, 0, 0, 0) // End at 1pm (transactions before this time are included)
    
    return { startDate, endDate, cutoffHour: paydayCutoffHour, startCutoffHour: paydayStartCutoffHour }
  } else if (periodStartDay) {
    // Custom period: Fixed day numbers
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
      // Limit cache size to prevent memory issues (LRU-like: remove oldest when full)
      if (dateCache.size >= 1000) {
        // Remove first 100 entries to make room (more efficient than one-by-one)
        const keysToDelete = Array.from(dateCache.keys()).slice(0, 100)
        keysToDelete.forEach(key => dateCache.delete(key))
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
