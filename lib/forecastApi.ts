// Client-side API wrapper for expense forecasting

import type { ExpenseForecast } from '@/types/finance'

async function authenticatedFetch(url: string, options?: RequestInit): Promise<Response> {
  const { authenticatedFetch: fetchFn } = await import('@/lib/utils')
  return fetchFn(url, options)
}

export const getExpenseForecast = async (
  _userId: string,
  period: 'month' | 'quarter' | 'year' = 'month',
  monthsOfHistory: number = 6
): Promise<ExpenseForecast> => {
  const params = new URLSearchParams({
    period,
    months: monthsOfHistory.toString(),
  })
  
  const response = await authenticatedFetch(`/api/finance/forecast?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get expense forecast')
  }
  
  const data = await response.json()
  return data.data || data
}

