// Client-side API wrapper for budget analysis

import type { BudgetAnalysis } from '@/types/finance'

async function authenticatedFetch(url: string, options?: RequestInit): Promise<Response> {
  const { authenticatedFetch: fetchFn } = await import('@/lib/utils')
  return fetchFn(url, options)
}

export const getBudgetAnalysis = async (
  _userId: string,
  period: 'monthly' | 'weekly' = 'monthly',
  date?: Date,
  includeAlerts: boolean = false
): Promise<{ analyses: BudgetAnalysis[]; alerts?: BudgetAnalysis[] }> => {
  const params = new URLSearchParams({ period })
  if (date) {
    params.append('date', date.toISOString())
  }
  if (includeAlerts) {
    params.append('alerts', 'true')
  }
  
  const response = await authenticatedFetch(`/api/finance/budget-analysis?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get budget analysis')
  }
  
  const data = await response.json()
  return data.data || data
}

