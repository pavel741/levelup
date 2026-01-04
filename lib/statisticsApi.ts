/**
 * Client-side API wrapper for statistics operations
 * Uses server-side aggregation for better performance
 */

export interface WorkoutStatistics {
  currentCount: number
  currentVolume: number
  currentDuration: number
  currentAvgVolume: number
  workoutChart: Array<{
    date: string
    count: number
    volume: number
    duration: number
  }>
  previousCount: number
  previousVolume: number
  previousDuration: number
  changeCount: number
  changeVolume: number
}

export interface FinanceStatistics {
  income: number
  expenses: number
  balance: number
  categoryChart: Array<{
    name: string
    value: number
  }>
  financeChart: Array<{
    date: string
    income: number
    expenses: number
    balance: number
  }>
  previousIncome: number
  previousExpenses: number
  changeIncome: number
  changeExpenses: number
}

export interface HabitsStatistics {
  currentCompletions: Array<{
    date: string
    dateStr: string
    completed: number
    total: number
  }>
  currentTotal: number
  currentAverage: number
  currentBest: number
  previousTotal: number
  previousAverage: number
  habitPerformance: Array<{
    name: string
    completed: number
    total: number
    rate: number
  }>
  change: number
}

export interface XPStatistics {
  currentXP: number
  currentAvg: number
  xpChartData: Array<{
    date: string
    xp: number
  }>
  previousXP: number
  previousAvg: number
  change: number
}

const API_BASE = '/api/statistics'

/**
 * Get workout statistics with server-side aggregation
 */
export async function getWorkoutStatistics(
  userId: string,
  options: {
    timeRange?: 'week' | 'month' | '3months' | '6months' | 'year' | 'all'
    comparePeriod?: boolean
  } = {}
): Promise<WorkoutStatistics> {
  const { timeRange = 'month', comparePeriod = false } = options

  const params = new URLSearchParams({
    userId,
    timeRange,
    comparePeriod: comparePeriod.toString()
  })

  const response = await fetch(`${API_BASE}/workouts?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch workout statistics: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || data
}

/**
 * Get finance statistics with server-side aggregation
 */
export async function getFinanceStatistics(
  userId: string,
  options: {
    timeRange?: 'week' | 'month' | '3months' | '6months' | 'year' | 'all'
    comparePeriod?: boolean
  } = {}
): Promise<FinanceStatistics> {
  const { timeRange = 'month', comparePeriod = false } = options

  const params = new URLSearchParams({
    userId,
    timeRange,
    comparePeriod: comparePeriod.toString()
  })

  const response = await fetch(`${API_BASE}/finance?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch finance statistics: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || data
}

/**
 * Get habits statistics with server-side aggregation
 */
export async function getHabitsStatistics(
  userId: string,
  options: {
    timeRange?: 'week' | 'month' | '3months' | '6months' | 'year' | 'all'
    comparePeriod?: boolean
  } = {}
): Promise<HabitsStatistics> {
  const { timeRange = 'month', comparePeriod = false } = options

  const params = new URLSearchParams({
    userId,
    timeRange,
    comparePeriod: comparePeriod.toString()
  })

  const response = await fetch(`${API_BASE}/habits?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch habits statistics: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || data
}

/**
 * Get XP statistics with server-side aggregation
 */
export async function getXPStatistics(
  userId: string,
  options: {
    timeRange?: 'week' | 'month' | '3months' | '6months' | 'year' | 'all'
    comparePeriod?: boolean
  } = {}
): Promise<XPStatistics> {
  const { timeRange = 'month', comparePeriod = false } = options

  const params = new URLSearchParams({
    userId,
    timeRange,
    comparePeriod: comparePeriod.toString()
  })

  const response = await fetch(`${API_BASE}/xp?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch XP statistics: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || data
}

