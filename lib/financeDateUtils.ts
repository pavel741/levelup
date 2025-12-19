// Date utility functions for finance periods

/**
 * Get the last working day of a month
 */
export function getLastWorkingDay(year: number, month: number): Date {
  // Get last day of month (month is 0-indexed in JS)
  const lastDay = new Date(year, month + 1, 0)
  
  // If it's Saturday (6) or Sunday (0), go back to Friday
  const dayOfWeek = lastDay.getDay()
  if (dayOfWeek === 0) {
    // Sunday - go back 2 days to Friday
    lastDay.setDate(lastDay.getDate() - 2)
  } else if (dayOfWeek === 6) {
    // Saturday - go back 1 day to Friday
    lastDay.setDate(lastDay.getDate() - 1)
  }
  
  return lastDay
}

/**
 * Get payday period for a given month
 * Returns period from last working day of previous month to last working day of current month
 */
export function getPaydayPeriod(monthStr: string): { startDate: Date; endDate: Date } {
  const [year, month] = monthStr.split('-').map(Number)
  const monthIndex = month - 1 // JavaScript months are 0-indexed
  
  // Start date: last working day of previous month
  const prevMonth = monthIndex === 0 ? 11 : monthIndex - 1
  const prevYear = monthIndex === 0 ? year - 1 : year
  const startDate = getLastWorkingDay(prevYear, prevMonth)
  startDate.setHours(0, 0, 0, 0)
  
  // End date: last working day of current month
  const endDate = getLastWorkingDay(year, monthIndex)
  endDate.setHours(23, 59, 59, 999)
  
  return { startDate, endDate }
}

/**
 * Get custom period for a given month
 */
export function getCustomPeriod(
  monthStr: string,
  startDay: number = 1,
  endDay: number | null = null
): { startDate: Date; endDate: Date } {
  const [year, month] = monthStr.split('-').map(Number)
  const monthIndex = month - 1 // JavaScript months are 0-indexed
  
  // Start date: specified day of current month
  const startDate = new Date(year, monthIndex, startDay)
  startDate.setHours(0, 0, 0, 0)
  
  // End date: specified day of current month, or last day if endDay is null
  let endDate: Date
  if (endDay === null || endDay === undefined) {
    // Last day of current month
    endDate = new Date(year, monthIndex + 1, 0)
  } else {
    // Specific day of current month
    endDate = new Date(year, monthIndex, endDay)
  }
  endDate.setHours(23, 59, 59, 999)
  
  return { startDate, endDate }
}

/**
 * Get period dates based on settings
 */
export function getPeriodDates(
  monthStr: string,
  usePaydayPeriod: boolean,
  periodStartDay: number = 1,
  periodEndDay: number | null = null
): { startDate: Date; endDate: Date } {
  if (usePaydayPeriod) {
    return getPaydayPeriod(monthStr)
  } else {
    return getCustomPeriod(monthStr, periodStartDay, periodEndDay)
  }
}

