/**
 * Unified Date Utilities
 * Consolidates all date handling logic from across the application
 */

import { startOfMonth, endOfMonth, subDays, isWeekend } from 'date-fns'

// Cache for parsed dates to improve performance
const dateCache = new Map<string, Date>()

/**
 * Normalize any date value to a Date object
 * Handles: Date objects, Firestore Timestamps, date strings, and other formats
 */
export function normalizeDate(value: unknown): Date | null {
  if (!value) return null

  // Already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  // Firestore Timestamp
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    try {
      return (value as { toDate: () => Date }).toDate()
    } catch {
      return null
    }
  }

  // String date
  if (typeof value === 'string') {
    // Check cache first
    if (dateCache.has(value)) {
      return dateCache.get(value)!
    }

    // Try parsing
    let parsed: Date
    
    // Handle YYYY-MM-DD format (add time to avoid timezone issues)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      parsed = new Date(value + 'T00:00:00')
    } else {
      parsed = new Date(value)
    }

    // Validate and cache
    if (!isNaN(parsed.getTime())) {
      // Limit cache size to prevent memory issues
      if (dateCache.size >= 1000) {
        const keysToDelete = Array.from(dateCache.keys()).slice(0, 100)
        keysToDelete.forEach((key) => dateCache.delete(key))
      }
      dateCache.set(value, parsed)
      return parsed
    }

    return null
  }

  // Fallback: try to construct Date
  try {
    const date = new Date(value as string | number)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Format date to YYYY-MM-DD string
 * Handles Date objects, Firestore Timestamps, and strings
 */
export function formatDate(value: unknown): string {
  const date = normalizeDate(value)
  if (!date) return ''

  return date.toISOString().split('T')[0]
}

/**
 * Format date for display (Estonian locale: DD.MM.YYYY)
 */
export function formatDisplayDate(value: unknown): string {
  const date = normalizeDate(value)
  if (!date) return ''

  return date.toLocaleDateString('et-EE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format date and time for display
 */
export function formatDateTime(value: unknown): string {
  const date = normalizeDate(value)
  if (!date) return ''

  return date.toLocaleString('et-EE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Parse transaction date (optimized for transaction data)
 * This is an alias for normalizeDate but kept for backward compatibility
 */
export function parseTransactionDate(date: string | Date | unknown): Date {
  const normalized = normalizeDate(date)
  return normalized || new Date()
}

/**
 * Clear date cache (useful for memory management)
 */
export function clearDateCache(): void {
  dateCache.clear()
}

/**
 * Get the last working day of a month (Monday-Friday)
 */
function getLastWorkingDayOfMonth(year: number, month: number): Date {
  const lastDay = endOfMonth(new Date(year, month - 1))
  let currentDate = new Date(lastDay)

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
  paydayCutoffHour: number = 13,
  paydayStartCutoffHour: number = 14
): { startDate: Date; endDate: Date; cutoffHour?: number; startCutoffHour?: number } {
  const [year, month] = selectedMonth.split('-').map(Number)

  if (usePaydayPeriod) {
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const prevLastWorkingDay = getLastWorkingDayOfMonth(prevYear, prevMonth)
    const startDate = new Date(prevLastWorkingDay)
    startDate.setHours(paydayStartCutoffHour, 0, 0, 0)

    const endDate = getLastWorkingDayOfMonth(year, month)
    endDate.setHours(paydayCutoffHour, 0, 0, 0)

    return { startDate, endDate, cutoffHour: paydayCutoffHour, startCutoffHour: paydayStartCutoffHour }
  } else if (periodStartDay) {
    // For custom periods, the period spans from periodStartDay of previous month
    // to (periodStartDay - 1) of current month
    // Example: If periodStartDay is 15 and viewing January:
    //   - Start: Dec 15 (previous month)
    //   - End: Jan 14 (current month, day before periodStartDay)
    
    // Calculate previous month
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    
    // Start date is periodStartDay of previous month
    const startDate = new Date(prevYear, prevMonth - 1, periodStartDay)
    
    // End date calculation
    let endDate: Date
    if (periodEndDay !== null && periodEndDay !== undefined) {
      // Use specified end day of current month
      endDate = new Date(year, month - 1, periodEndDay, 23, 59, 59)
    } else {
      // Calculate end day: period ends the day before periodStartDay of current month
      // Handle edge case where periodStartDay is 1
      if (periodStartDay === 1) {
        // If period starts on 1st, it ends on last day of previous month
        // But wait, that doesn't make sense. Let me reconsider...
        // Actually, if periodStartDay is 1, the period should be:
        //   - Start: 1st of previous month
        //   - End: Last day of previous month (which is day 0 of current month)
        endDate = new Date(year, month - 1, 0, 23, 59, 59)
      } else {
        // Period ends on (periodStartDay - 1) of current month
        endDate = new Date(year, month - 1, periodStartDay - 1, 23, 59, 59)
      }
    }
    return { startDate, endDate }
  } else {
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))
    endDate.setHours(23, 59, 59)
    return { startDate, endDate }
  }
}

