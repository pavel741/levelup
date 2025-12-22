// Client-side API wrapper for MongoDB finance operations
// This replaces direct MongoDB imports in client components

import type { FinanceTransaction, FinanceCategories, FinanceSettings } from '@/types/finance'

// Transactions
export const subscribeToTransactions = (
  userId: string,
  callback: (transactions: FinanceTransaction[], meta: { hasMore: boolean; lastDoc: any }) => void,
  options: { limitCount?: number } = {}
): (() => void) => {
  const limitCount = options.limitCount !== undefined && options.limitCount !== null ? options.limitCount : 0
  let isActive = true
  let lastDataHash: string | null = null // Track data hash to avoid unnecessary callbacks

  // Simple hash function to detect data changes
  const hashData = (transactions: FinanceTransaction[]): string => {
    if (transactions.length === 0) return 'empty'
    // Use first and last transaction IDs + count as hash (fast comparison)
    return `${transactions.length}-${transactions[0]?.id || ''}-${transactions[transactions.length - 1]?.id || ''}`
  }

  const loadTransactions = async () => {
    if (!isActive) return

    try {
      const params = new URLSearchParams({
        userId,
      })
      
      // Only add limit if it's greater than 0
      if (limitCount > 0) {
        params.append('limit', limitCount.toString())
      }
      
      const response = await fetch(`/api/finance/transactions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch transactions')
      
      const data = await response.json()
      const transactions = data.transactions || []
      
      // Only call callback if data actually changed
      const newHash = hashData(transactions)
      if (newHash !== lastDataHash) {
        lastDataHash = newHash
        callback(transactions, {
          hasMore: false,
          lastDoc: null,
        })
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
      callback([], { hasMore: false, lastDoc: null })
    }
  }

  // Load immediately
  loadTransactions()

  // Poll every 30 seconds for updates (reduced frequency for better performance)
  // Only poll if there's no limit (for real-time updates) or if limitCount > 0
  const pollInterval = 30000 // 30s for all cases
  const intervalId = setInterval(() => {
    if (isActive) {
      loadTransactions()
    }
  }, pollInterval)

  return () => {
    isActive = false
    clearInterval(intervalId)
  }
}

export const addTransaction = async (
  userId: string,
  transaction: Omit<FinanceTransaction, 'id'>
): Promise<string> => {
  const response = await fetch('/api/finance/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...transaction }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add transaction')
  }
  
  const data = await response.json()
  return data.id
}

export const updateTransaction = async (
  userId: string,
  transactionId: string,
  updates: Partial<FinanceTransaction>
): Promise<void> => {
  const response = await fetch('/api/finance/transactions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, id: transactionId, ...updates }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update transaction')
  }
}

export const deleteTransaction = async (
  userId: string,
  transactionId: string
): Promise<void> => {
  const params = new URLSearchParams({ userId, id: transactionId })
  const response = await fetch(`/api/finance/transactions?${params}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete transaction')
  }
}

export const batchAddTransactions = async (
  userId: string,
  transactions: Omit<FinanceTransaction, 'id'>[],
  progressCallback?: (current: number, total: number) => void,
  options?: { skipDuplicates?: boolean }
): Promise<{ success: number; errors: number; skipped: number }> => {
  const response = await fetch('/api/finance/transactions/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, transactions, options }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to batch add transactions')
  }
  
  const result = await response.json()
  progressCallback?.(result.success, transactions.length)
  return result
}

export const batchDeleteTransactions = async (
  userId: string,
  transactionIds: string[]
): Promise<void> => {
  const response = await fetch('/api/finance/transactions/batch', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ids: transactionIds }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to batch delete transactions')
  }
}

// Categories
export const subscribeToCategories = (
  userId: string,
  callback: (categories: FinanceCategories) => void
): (() => void) => {
  let isActive = true

  const loadCategories = async () => {
    if (!isActive) return

    try {
      const params = new URLSearchParams({ userId })
      const response = await fetch(`/api/finance/categories?${params}`)
      
      if (!response.ok) throw new Error('Failed to fetch categories')
      
      const data = await response.json()
      callback(data.categories || {})
    } catch (error) {
      console.error('Error loading categories:', error)
      callback({})
    }
  }

  loadCategories()

  // Poll every 30 seconds for categories (reduced frequency)
  const intervalId = setInterval(() => {
    if (isActive) {
      loadCategories()
    }
  }, 30000)

  return () => {
    isActive = false
    clearInterval(intervalId)
  }
}

export const getCategories = async (userId: string): Promise<FinanceCategories> => {
  const params = new URLSearchParams({ userId })
  const response = await fetch(`/api/finance/categories?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get categories')
  }
  
  const data = await response.json()
  return data.categories || {}
}

export const saveCategories = async (
  userId: string,
  categories: FinanceCategories
): Promise<void> => {
  const response = await fetch('/api/finance/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, categories }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save categories')
  }
}

// Settings
export const getFinanceSettings = async (userId: string): Promise<FinanceSettings | null> => {
  const params = new URLSearchParams({ userId })
  const response = await fetch(`/api/finance/settings?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get settings')
  }
  
  const data = await response.json()
  return data.settings || null
}

export const saveFinanceSettings = async (
  userId: string,
  settings: FinanceSettings
): Promise<void> => {
  const response = await fetch('/api/finance/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, settings }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save settings')
  }
}

// Helper for getting all transactions for summary
export const getAllTransactionsForSummary = async (
  userId: string
): Promise<FinanceTransaction[]> => {
  const params = new URLSearchParams({ userId, forSummary: 'true' })
  const response = await fetch(`/api/finance/transactions?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get transactions')
  }
  
  const data = await response.json()
  return data.transactions || []
}

// Budget Goals
export const getBudgetGoals = async (userId: string): Promise<any> => {
  const params = new URLSearchParams({ userId })
  const response = await fetch(`/api/finance/budget-goals?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get budget goals')
  }
  
  const data = await response.json()
  return data.goals || null
}

export const saveBudgetGoals = async (
  userId: string,
  goals: any
): Promise<void> => {
  const response = await fetch('/api/finance/budget-goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, goals }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save budget goals')
  }
}

// Recurring Transactions
export const subscribeToRecurringTransactions = (
  userId: string,
  callback: (transactions: any[]) => void
): (() => void) => {
  let isActive = true

  const loadTransactions = async () => {
    if (!isActive) return

    try {
      const params = new URLSearchParams({ userId })
      const response = await fetch(`/api/finance/recurring?${params}`)
      
      if (!response.ok) throw new Error('Failed to fetch recurring transactions')
      
      const data = await response.json()
      callback(data.transactions || [])
    } catch (error) {
      console.error('Error loading recurring transactions:', error)
      callback([])
    }
  }

  loadTransactions()

  // Poll every 30 seconds for recurring transactions (less frequent updates needed)
  const intervalId = setInterval(() => {
    if (isActive) {
      loadTransactions()
    }
  }, 30000)

  return () => {
    isActive = false
    clearInterval(intervalId)
  }
}

export const addRecurringTransaction = async (
  userId: string,
  transaction: any
): Promise<string> => {
  const response = await fetch('/api/finance/recurring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...transaction }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add recurring transaction')
  }
  
  const data = await response.json()
  return data.id
}

export const updateRecurringTransaction = async (
  userId: string,
  id: string,
  updates: any
): Promise<void> => {
  const response = await fetch('/api/finance/recurring', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, id, ...updates }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update recurring transaction')
  }
}

export const deleteRecurringTransaction = async (
  userId: string,
  id: string
): Promise<void> => {
  const params = new URLSearchParams({ userId, id })
  const response = await fetch(`/api/finance/recurring?${params}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete recurring transaction')
  }
}

// Reconciliation
export const subscribeToReconciliationHistory = (
  userId: string,
  callback: (records: any[]) => void
): (() => void) => {
  // TODO: Implement API route for reconciliation
  // For now, return empty array
  callback([])
  return () => {}
}

export const getLastReconciliation = async (userId: string): Promise<any> => {
  // TODO: Implement API route
  return null
}

export const saveLastReconciliation = async (
  userId: string,
  record: any
): Promise<void> => {
  // TODO: Implement API route
}

