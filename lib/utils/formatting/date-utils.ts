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

/** Payday mode for budget period calculation */
export type PaydayMode = 'calendarMonth' | 'dayOfMonth' | 'lastDay' | 'lastWorkingDay'

/** Finance settings shape used for period calculation */
export interface PeriodSettings {
  paydayMode?: PaydayMode
  paydayDayOfMonth?: number // 1-31 for dayOfMonth mode
  usePaydayPeriod?: boolean // Legacy: true = lastWorkingDay
  periodStartDay?: number // Legacy: for dayOfMonth
  periodEndDay?: number | null
  paydayCutoffHour?: number
  paydayStartCutoffHour?: number
}

/**
 * Get period dates from finance settings (preferred - supports all payday modes)
 */
export function getPeriodDatesFromSettings(
  selectedMonth: string,
  settings: PeriodSettings | null | undefined
): { startDate: Date; endDate: Date; hasTimeBoundaries: boolean } {
  if (!settings) {
    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))
    endDate.setHours(23, 59, 59)
    return { startDate, endDate, hasTimeBoundaries: false }
  }

  // Resolve payday mode (support new paydayMode + legacy usePaydayPeriod/periodStartDay)
  let mode: PaydayMode = settings.paydayMode || 'calendarMonth'
  if (!settings.paydayMode) {
    if (settings.usePaydayPeriod) mode = 'lastWorkingDay'
    else if (settings.periodStartDay !== undefined && settings.periodStartDay > 0)
      mode = 'dayOfMonth'
  }

  const paydayDay = settings.paydayDayOfMonth ?? settings.periodStartDay ?? 25
  const paydayCutoffHour = settings.paydayCutoffHour ?? 13
  const paydayStartCutoffHour = settings.paydayStartCutoffHour ?? 14
  const [year, month] = selectedMonth.split('-').map(Number)
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year

  if (mode === 'lastWorkingDay') {
    const prevLastWorkingDay = getLastWorkingDayOfMonth(prevYear, prevMonth)
    const startDate = new Date(prevLastWorkingDay)
    startDate.setHours(paydayStartCutoffHour, 0, 0, 0)
    const endDate = getLastWorkingDayOfMonth(year, month)
    endDate.setHours(paydayCutoffHour, 0, 0, 0)
    return { startDate, endDate, hasTimeBoundaries: true }
  }

  if (mode === 'dayOfMonth') {
    const day = Math.min(31, Math.max(1, paydayDay))
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate()
    const startDay = Math.min(day, prevLastDay)
    const startDate = new Date(prevYear, prevMonth - 1, startDay)
    startDate.setHours(0, 0, 0, 0)
    let endDate: Date
    if (day === 1) {
      endDate = new Date(year, month - 1, 0, 23, 59, 59)
    } else {
      const currLastDay = new Date(year, month, 0).getDate()
      const endDay = Math.min(day - 1, currLastDay)
      endDate = new Date(year, month - 1, endDay, 23, 59, 59)
    }
    return { startDate, endDate, hasTimeBoundaries: false }
  }

  if (mode === 'lastDay') {
    const prevLastDay = endOfMonth(new Date(prevYear, prevMonth - 1))
    const startDate = new Date(prevLastDay)
    startDate.setHours(0, 0, 0, 0)
    const endDate = endOfMonth(new Date(year, month - 1))
    endDate.setHours(23, 59, 59)
    return { startDate, endDate, hasTimeBoundaries: false }
  }

  // calendarMonth (default)
  const startDate = startOfMonth(new Date(year, month - 1))
  const endDate = endOfMonth(new Date(year, month - 1))
  endDate.setHours(23, 59, 59)
  return { startDate, endDate, hasTimeBoundaries: false }
}

/**
 * Get period dates based on settings (legacy signature - kept for backward compatibility)
 */
export function getPeriodDates(
  selectedMonth: string,
  usePaydayPeriod: boolean,
  periodStartDay: number,
  periodEndDay: number | null,
  paydayCutoffHour: number = 13,
  paydayStartCutoffHour: number = 14
): { startDate: Date; endDate: Date; cutoffHour?: number; startCutoffHour?: number } {
  const result = getPeriodDatesFromSettings(selectedMonth, {
    usePaydayPeriod,
    periodStartDay,
    periodEndDay,
    paydayCutoffHour,
    paydayStartCutoffHour,
  })
  return {
    ...result,
    cutoffHour: paydayCutoffHour,
    startCutoffHour: paydayStartCutoffHour,
  }
}

