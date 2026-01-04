// Client-side API wrapper for savings goals

import type { SavingsGoal } from '@/types/finance'
import { cache, createCacheKey } from './utils/cache'
import { createSmartPoll } from './utils/smart-polling'
import { parseTransactionDate } from './financeDateUtils'

// Get savings goals
export const getSavingsGoals = async (userId: string): Promise<SavingsGoal[]> => {
  const key = createCacheKey('savings_goals', userId)
  
  return cache.get(
    key,
    async () => {
      const { authenticatedFetch } = await import('@/lib/utils')
      const response = await authenticatedFetch('/api/finance/savings-goals')
      if (!response.ok) throw new Error('Failed to fetch savings goals')
      
      const data = await response.json()
      const goals = data.data?.goals || data.goals || []
      return goals.map((g: any) => ({
        ...g,
        createdAt: g.createdAt ? parseTransactionDate(g.createdAt) : new Date(),
        updatedAt: g.updatedAt ? parseTransactionDate(g.updatedAt) : new Date(),
        targetDate: g.targetDate ? parseTransactionDate(g.targetDate) : undefined,
      }))
    },
    {
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    }
  )
}

// Subscribe to savings goals
export const subscribeToSavingsGoals = (
  userId: string,
  callback: (goals: SavingsGoal[]) => void
): (() => void) => {
  const fetchGoals = async (): Promise<SavingsGoal[]> => {
    return getSavingsGoals(userId)
  }

  return createSmartPoll(
    fetchGoals,
    callback,
    {
      activeInterval: 60000,
      hashFn: (goals) => {
        if (goals.length === 0) return 'empty'
        return `${goals.length}-${goals.map((g: SavingsGoal) => g.id).join(',')}`
      },
    }
  )
}

// Add a savings goal
export const addSavingsGoal = async (
  userId: string,
  goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const response = await authenticatedFetch('/api/finance/savings-goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add savings goal')
  }
  
  const data = await response.json()
  const goalId = data.data?.id || data.id
  
  // Invalidate cache
  cache.invalidatePattern(new RegExp(`^savings_goals:.*:${userId}`))
  
  return goalId
}

// Update a savings goal
export const updateSavingsGoal = async (
  userId: string,
  goalId: string,
  updates: Partial<SavingsGoal>
): Promise<void> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const response = await authenticatedFetch('/api/finance/savings-goals', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: goalId, ...updates }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update savings goal')
  }
  
  // Invalidate cache
  cache.invalidatePattern(new RegExp(`^savings_goals:.*:${userId}`))
}

// Delete a savings goal
export const deleteSavingsGoal = async (userId: string, goalId: string): Promise<void> => {
  const { authenticatedFetch } = await import('@/lib/utils')
  const response = await authenticatedFetch(`/api/finance/savings-goals?id=${goalId}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete savings goal')
  }
  
  // Invalidate cache
  cache.invalidatePattern(new RegExp(`^savings_goals:.*:${userId}`))
}

