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
    const startDate = new Date(year, month - 1, periodStartDay)
    const endDay = periodEndDay || periodStartDay - 1
    const endDate = new Date(year, month, endDay, 23, 59, 59)
    return { startDate, endDate }
  } else {
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))
    endDate.setHours(23, 59, 59)
    return { startDate, endDate }
  }
}

