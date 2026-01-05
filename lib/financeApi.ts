// Client-side API wrapper for MongoDB finance operations
// This replaces direct MongoDB imports in client components
// 
// This module handles client-side encryption/decryption of sensitive financial data
// before it reaches the server, ensuring privacy even from database owners.

'use client'

import type { FinanceTransaction, FinanceCategories, FinanceSettings, FinanceRecurringTransaction } from '@/types/finance'
import { createSmartPoll } from '@/lib/utils/smart-polling'
import { cache, createCacheKey } from '@/lib/utils/cache'
import { createFinanceSSE, SSEClient } from '@/lib/utils/sseClient'
import { getEncryptionModules, isEncryptionEnabledSync } from '@/lib/utils/encryption/loader'

// Transactions
export const subscribeToTransactions = (
  userId: string,
  callback: (transactions: FinanceTransaction[], meta: { hasMore: boolean; lastDoc: any }) => void,
  options: { limitCount?: number; useSSE?: boolean } = {}
): (() => void) => {
  const limitCount = options.limitCount !== undefined && options.limitCount !== null ? options.limitCount : 0
  // Disable SSE in production (Vercel serverless doesn't support long-lived connections)
  const isProduction = typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('vercel.com') ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production')
  )
  const useSSE = options.useSSE !== false && !isProduction // Default to false in production

  // Try SSE first if supported and not in production, fallback to polling
  if (useSSE && typeof EventSource !== 'undefined') {
    try {
      let sseClient: SSEClient | null = null
      let lastDataHash: string | null = null
      let isFirstMessage = true

      const hashData = (transactions: FinanceTransaction[]): string => {
        if (transactions.length === 0) return 'empty'
        return `${transactions.length}-${transactions[0]?.id || ''}-${transactions[transactions.length - 1]?.id || ''}`
      }

      sseClient = createFinanceSSE(
        userId,
        'transactions',
        (data) => {
          if (data.type === 'update' && data.data) {
            let transactions = Array.isArray(data.data) ? data.data : []
            
            // Apply limit if specified
            if (limitCount > 0) {
              transactions = transactions.slice(0, limitCount)
            }

            // Decrypt sensitive fields if encryption is enabled (async IIFE)
            if (isEncryptionEnabledSync() && transactions.length > 0) {
              (async () => {
                try {
                  const encryption = await getEncryptionModules()
                  const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
                  const decryptedTransactions = await encryption.decryptTransactions(transactions, encryptionKey)
                  
                  // Only call callback if data changed
                  const newHash = hashData(decryptedTransactions)
                  if (isFirstMessage || newHash !== lastDataHash) {
                    isFirstMessage = false
                    lastDataHash = newHash
                    callback(decryptedTransactions, {
                      hasMore: false,
                      lastDoc: null,
                    })
                  }
                } catch (error) {
                  console.warn('Failed to decrypt transactions, data may be unencrypted (backward compatibility):', error)
                  // Fallback to unencrypted data
                  const newHash = hashData(transactions)
                  if (isFirstMessage || newHash !== lastDataHash) {
                    isFirstMessage = false
                    lastDataHash = newHash
                    callback(transactions, {
                      hasMore: false,
                      lastDoc: null,
                    })
                  }
                }
              })()
            } else {
              // No encryption needed, proceed normally
              const newHash = hashData(transactions)
              if (isFirstMessage || newHash !== lastDataHash) {
                isFirstMessage = false
                lastDataHash = newHash
                callback(transactions, {
                  hasMore: false,
                  lastDoc: null,
                })
              }
            }
          }
        },
        {
          onError: (error) => {
            console.warn('SSE connection failed, falling back to polling:', error)
            // Fallback to polling on error
            sseClient?.disconnect()
            sseClient = null
            // Restart with polling
            const pollingUnsubscribe = subscribeToTransactions(userId, callback, { ...options, useSSE: false })
            return pollingUnsubscribe
          },
        }
      )

      sseClient.connect()

      return () => {
        sseClient?.disconnect()
      }
    } catch (error) {
      console.warn('SSE initialization failed, falling back to polling:', error)
      // Fall through to polling
    }
  }

  // Fallback to smart polling
  const hashData = (transactions: FinanceTransaction[]): string => {
    if (transactions.length === 0) return 'empty'
    return `${transactions.length}-${transactions[0]?.id || ''}-${transactions[transactions.length - 1]?.id || ''}`
  }

  const fetchTransactions = async (): Promise<FinanceTransaction[]> => {
    const params = new URLSearchParams({ userId })
    
    if (limitCount > 0) {
      params.append('limit', limitCount.toString())
    }
    
    const response = await fetch(`/api/finance/transactions?${params}`)
    if (!response.ok) throw new Error('Failed to fetch transactions')
    
    const responseData = await response.json()
    let transactions = responseData.data?.transactions || responseData.transactions || []
    
    // Decrypt sensitive fields if encryption is enabled
    if (isEncryptionEnabledSync() && transactions.length > 0) {
      try {
        const encryption = await getEncryptionModules()
        const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
        transactions = await encryption.decryptTransactions(transactions, encryptionKey)
      } catch (error) {
        console.warn('Failed to decrypt transactions, data may be unencrypted (backward compatibility):', error)
      }
    }
    
    return transactions
  }

  return createSmartPoll(
    fetchTransactions,
    (transactions) => {
      callback(transactions, {
        hasMore: false,
        lastDoc: null,
      })
    },
    {
      activeInterval: limitCount === 0 ? 30000 : 10000,
      idleInterval: 120000,
      hiddenInterval: 300000,
      idleThreshold: 60000,
      hashFn: hashData,
      initialData: [],
    }
  )
}

export const addTransaction = async (
  userId: string,
  transaction: Omit<FinanceTransaction, 'id'>
): Promise<string> => {
  // Encrypt sensitive fields before sending to server
  let transactionToSave = transaction
  // Always try to encrypt on client-side (encryption is enabled by default)
  if (typeof window !== 'undefined') {
    try {
      console.log('🔐 Starting encryption for transaction:', { description: transaction.description?.substring(0, 50), selgitus: (transaction as any).selgitus?.substring(0, 50) })
      const encryption = await getEncryptionModules()
      console.log('🔐 Encryption modules loaded')
      const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
      console.log('🔐 Encryption key obtained:', encryptionKey ? 'YES' : 'NO')
      if (!encryptionKey) {
        throw new Error('Failed to get encryption key')
      }
      const beforeEncrypt = { ...transactionToSave }
      transactionToSave = await encryption.encryptTransaction(transaction as FinanceTransaction, encryptionKey)
      console.log('🔐 Encryption result:', {
        descriptionBefore: beforeEncrypt.description?.substring(0, 50),
        descriptionAfter: transactionToSave.description?.substring(0, 50),
        selgitusBefore: (beforeEncrypt as any).selgitus?.substring(0, 50),
        selgitusAfter: (transactionToSave as any).selgitus?.substring(0, 50),
      })
      console.log('✅ Transaction encrypted before saving')
    } catch (error) {
      console.error('❌ Failed to encrypt transaction:', error)
      console.error('❌ Error details:', error instanceof Error ? error.stack : error)
      // Don't throw - allow transaction to save unencrypted for backward compatibility
      // But log the error so we know encryption failed
    }
  } else {
    console.log('⚠️ Not encrypting - running on server-side')
  }
  
  const response = await fetch('/api/finance/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...transactionToSave }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add transaction')
  }
  
  const data = await response.json()
  
  // Invalidate transaction cache
  cache.invalidatePattern(new RegExp(`^transactions:${userId}`))
  
  return data.id
}

export const updateTransaction = async (
  userId: string,
  transactionId: string,
  updates: Partial<FinanceTransaction>
): Promise<void> => {
  // Encrypt sensitive fields in updates before sending
  let updatesToSend = updates
  // Always try to encrypt on client-side (encryption is enabled by default)
  if (typeof window !== 'undefined') {
    try {
      const encryption = await getEncryptionModules()
      const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
      // Encrypt fields that should be encrypted: description, account, recipientName, selgitus
      const fieldsToEncrypt = ['description', 'account', 'recipientName', 'selgitus'].filter(
        field => field in updates
      ) as (keyof FinanceTransaction)[]
      
      if (fieldsToEncrypt.length > 0) {
        const tempTransaction = { ...updates } as FinanceTransaction
        const encrypted = await encryption.encryptTransaction(tempTransaction, encryptionKey)
        updatesToSend = {}
        for (const field of fieldsToEncrypt) {
          if (encrypted[field] !== undefined) {
            updatesToSend[field] = encrypted[field]
          }
        }
        // Add non-encrypted fields
        for (const [key, value] of Object.entries(updates)) {
          if (!fieldsToEncrypt.includes(key as keyof FinanceTransaction)) {
            updatesToSend[key as keyof FinanceTransaction] = value
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to encrypt transaction updates:', error)
      // Don't throw - allow updates to save unencrypted for backward compatibility
    }
  }
  
  const response = await fetch('/api/finance/transactions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, id: transactionId, ...updatesToSend }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update transaction')
  }
  
  // Invalidate transaction cache
  cache.invalidatePattern(new RegExp(`^transactions:${userId}`))
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
  
  // Invalidate transaction cache
  cache.invalidatePattern(new RegExp(`^transactions:${userId}`))
}

export const batchAddTransactions = async (
  userId: string,
  transactions: Omit<FinanceTransaction, 'id'>[],
  progressCallback?: (current: number, total: number) => void,
  options?: { skipDuplicates?: boolean }
): Promise<{ success: number; errors: number; skipped: number }> => {
  // Encrypt sensitive fields before sending to server
  let transactionsToSave = transactions
  // Always try to encrypt on client-side (encryption is enabled by default)
  if (typeof window !== 'undefined') {
    try {
      const encryption = await getEncryptionModules()
      const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
      transactionsToSave = await encryption.encryptTransactions(
        transactions as FinanceTransaction[],
        encryptionKey
      )
      console.log(`✅ Encrypted ${transactionsToSave.length} transactions before batch save`)
    } catch (error) {
      console.error('❌ Failed to encrypt transactions:', error)
      // Don't throw - allow transactions to save unencrypted for backward compatibility
      // But log the error so we know encryption failed
    }
  }
  
  const response = await fetch('/api/finance/transactions/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, transactions: transactionsToSave, options }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to batch add transactions')
  }
  
  const result = await response.json()
  progressCallback?.(result.success, transactions.length)
  
  // Invalidate transaction cache
  cache.invalidatePattern(new RegExp(`^transactions:${userId}`))
  
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
  
  // Invalidate transaction cache
  cache.invalidatePattern(new RegExp(`^transactions:${userId}`))
}

export const deleteTransactionsBeforeDate = async (
  userId: string,
  beforeDate: Date
): Promise<number> => {
  const response = await fetch('/api/finance/transactions/delete-by-date', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, beforeDate: beforeDate.toISOString() }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete transactions by date')
  }
  
  const result = await response.json()
  
  // Invalidate transaction cache
  cache.invalidatePattern(new RegExp(`^transactions:${userId}`))
  
  return result.deletedCount || 0
}

export const deleteAllTransactions = async (
  userId: string
): Promise<number> => {
  const response = await fetch('/api/finance/transactions/delete-all', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete all transactions')
  }
  
  const result = await response.json()
  
  // Invalidate transaction cache
  cache.invalidatePattern(new RegExp(`^transactions:${userId}`))
  
  return result.deletedCount || 0
}

// Categories
export const subscribeToCategories = (
  userId: string,
  callback: (categories: FinanceCategories) => void,
  options: { useSSE?: boolean } = {}
): (() => void) => {
  // Disable SSE in production (Vercel serverless doesn't support long-lived connections)
  const isProduction = typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('vercel.com') ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production')
  )
  const useSSE = options.useSSE !== false && !isProduction // Default to false in production

  // Try SSE first if supported and not in production
  if (useSSE && typeof EventSource !== 'undefined') {
    try {
      let sseClient: SSEClient | null = null
      let lastDataHash: string | null = null
      let isFirstMessage = true

      const hashCategories = (categories: FinanceCategories): string => {
        const income = JSON.stringify(categories.income || [])
        const expense = JSON.stringify(categories.expense || [])
        return `${income}-${expense}`
      }

      sseClient = createFinanceSSE(
        userId,
        'categories',
        (data) => {
          if (data.type === 'update' && data.data) {
            const categories = data.data as FinanceCategories
            const newHash = hashCategories(categories)
            
            if (isFirstMessage || newHash !== lastDataHash) {
              isFirstMessage = false
              lastDataHash = newHash
              callback(categories)
            }
          }
        },
        {
          onError: (error) => {
            console.warn('SSE connection failed, falling back to polling:', error)
            sseClient?.disconnect()
            sseClient = null
            const pollingUnsubscribe = subscribeToCategories(userId, callback, { useSSE: false })
            return pollingUnsubscribe
          },
        }
      )

      sseClient.connect()
      return () => {
        sseClient?.disconnect()
      }
    } catch (error) {
      console.warn('SSE initialization failed, falling back to polling:', error)
    }
  }

  // Fallback to smart polling
  const fetchCategories = async (): Promise<FinanceCategories> => {
    const params = new URLSearchParams({ userId })
    const response = await fetch(`/api/finance/categories?${params}`)
    
    if (!response.ok) throw new Error('Failed to fetch categories')
    
    const data = await response.json()
    return data.categories || {}
  }

  const hashCategories = (categories: FinanceCategories): string => {
    const income = JSON.stringify(categories.income || [])
    const expense = JSON.stringify(categories.expense || [])
    return `${income}-${expense}`
  }

  return createSmartPoll(
    fetchCategories,
    callback,
    {
      activeInterval: 60000,
      idleInterval: 300000,
      hiddenInterval: 600000,
      idleThreshold: 60000,
      hashFn: hashCategories,
      initialData: {},
    }
  )
}

// Internal fetch function (without cache)
const _getCategories = async (userId: string): Promise<FinanceCategories> => {
  const params = new URLSearchParams({ userId })
  const response = await fetch(`/api/finance/categories?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get categories')
  }
  
  const data = await response.json()
  return data.categories || {}
}

// Cached version with stale-while-revalidate
export const getCategories = async (userId: string): Promise<FinanceCategories> => {
  const key = createCacheKey('categories', userId)
  return cache.get(key, () => _getCategories(userId), {
    staleTime: 10 * 60 * 1000, // 10 minutes (categories change rarely)
    cacheTime: 60 * 60 * 1000, // 1 hour
  })
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
  
  // Invalidate cache after save
  const key = createCacheKey('categories', userId)
  cache.invalidate(key)
}

// Settings
// Internal fetch function (without cache)
const _getFinanceSettings = async (userId: string): Promise<FinanceSettings | null> => {
  const params = new URLSearchParams({ userId })
  const response = await fetch(`/api/finance/settings?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get settings')
  }
  
  const data = await response.json()
  return data.settings || null
}

// Cached version with stale-while-revalidate
export const getFinanceSettings = async (userId: string): Promise<FinanceSettings | null> => {
  const key = createCacheKey('financeSettings', userId)
  return cache.get(key, () => _getFinanceSettings(userId), {
    staleTime: 10 * 60 * 1000, // 10 minutes (settings change rarely)
    cacheTime: 60 * 60 * 1000, // 1 hour
  })
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
  
  // Invalidate cache after save
  const key = createCacheKey('financeSettings', userId)
  cache.invalidate(key)
}

// Internal fetch function (without cache)
const _getTransactions = async (
  userId: string,
  options: { limitCount?: number } = {}
): Promise<FinanceTransaction[]> => {
  const limitCount = options.limitCount !== undefined && options.limitCount !== null ? options.limitCount : 0
  const params = new URLSearchParams({ userId })
  
  // If limitCount is 0, use forSummary=true to load all transactions
  // Otherwise, append limit parameter
  if (limitCount === 0) {
    params.append('forSummary', 'true')
  } else if (limitCount > 0) {
    params.append('limit', limitCount.toString())
  }
  
  const response = await fetch(`/api/finance/transactions?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get transactions')
  }
  
  const responseData = await response.json()
  let transactions = responseData.data?.transactions || responseData.transactions || []
  
  // Decrypt sensitive fields if encryption is enabled
  if (isEncryptionEnabledSync() && transactions.length > 0) {
    try {
      const encryption = await getEncryptionModules()
      const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
      transactions = await encryption.decryptTransactions(transactions, encryptionKey)
    } catch (error) {
      console.warn('Failed to decrypt transactions, data may be unencrypted (backward compatibility):', error)
    }
  }
  
  return transactions
}

// Cached version with stale-while-revalidate
export const getTransactions = async (
  userId: string,
  options: { limitCount?: number } = {}
): Promise<FinanceTransaction[]> => {
  const limitCount = options.limitCount !== undefined && options.limitCount !== null ? options.limitCount : 0
  const key = createCacheKey('transactions', userId, limitCount)
  return cache.get(key, () => _getTransactions(userId, options), {
    staleTime: 30 * 1000, // 30 seconds (transactions change frequently)
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
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
  
  const responseData = await response.json()
  let transactions = responseData.data?.transactions || responseData.transactions || []
  
  // Decrypt sensitive fields if encryption is enabled
  if (isEncryptionEnabledSync() && transactions.length > 0) {
    try {
      const encryption = await getEncryptionModules()
      const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
      transactions = await encryption.decryptTransactions(transactions, encryptionKey)
    } catch (error) {
      console.warn('Failed to decrypt transactions, data may be unencrypted (backward compatibility):', error)
    }
  }
  
  return transactions
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
// Get recurring transactions
export const getRecurringTransactions = async (userId: string): Promise<FinanceRecurringTransaction[]> => {
  const params = new URLSearchParams({ userId })
  const response = await fetch(`/api/finance/recurring?${params}`)
  
  if (!response.ok) throw new Error('Failed to fetch recurring transactions')
  
  const data = await response.json()
  let transactions = data.data?.transactions || data.transactions || data.data || data || []
  
  // Decrypt sensitive fields if encryption is enabled
  if (isEncryptionEnabledSync() && transactions.length > 0) {
    try {
      const encryption = await getEncryptionModules()
      const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
      transactions = await encryption.decryptRecurringTransactions(transactions, encryptionKey)
    } catch (error) {
      console.warn('Failed to decrypt recurring transactions, data may be unencrypted (backward compatibility):', error)
    }
  }
  
  return transactions
}

export const subscribeToRecurringTransactions = (
  userId: string,
  callback: (transactions: FinanceRecurringTransaction[]) => void
): (() => void) => {
  const fetchRecurringTransactions = async (): Promise<FinanceRecurringTransaction[]> => {
    return getRecurringTransactions(userId)
  }

  // Hash function for recurring transactions
  const hashRecurring = (transactions: any[]): string => {
    if (transactions.length === 0) return 'empty'
    return `${transactions.length}-${transactions.map(t => t.id).join(',')}`
  }

  // Use smart polling - recurring transactions change infrequently
  return createSmartPoll(
    fetchRecurringTransactions,
    callback,
    {
      activeInterval: 60000, // 1 minute when active (recurring transactions rarely change)
      idleInterval: 300000, // 5 minutes when idle
      hiddenInterval: 600000, // 10 minutes when tab hidden
      idleThreshold: 60000, // 1 minute before considered idle
      hashFn: hashRecurring,
      initialData: [],
    }
  )
}

export const addRecurringTransaction = async (
  userId: string,
  transaction: Omit<FinanceRecurringTransaction, 'id'>
): Promise<string> => {
  // Encrypt sensitive fields before sending to server
  let transactionToSave = transaction
  if (isEncryptionEnabledSync()) {
    try {
      const encryption = await getEncryptionModules()
      const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
      // Create a temporary transaction with a placeholder id for encryption
      // Only encrypt fields that exist in the transaction
      const tempTransaction = { ...transaction, id: 'temp' } as FinanceRecurringTransaction
      const encrypted = await encryption.encryptRecurringTransaction(tempTransaction, encryptionKey)
      // Remove the temp id before sending
      const { id: _, ...encryptedWithoutId } = encrypted
      transactionToSave = encryptedWithoutId as Omit<FinanceRecurringTransaction, 'id'>
    } catch (error) {
      console.error('Failed to encrypt recurring transaction:', error)
      throw new Error('Failed to encrypt recurring transaction data. Please try again.')
    }
  }
  
  const response = await fetch('/api/finance/recurring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...transactionToSave }),
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
  updates: Partial<FinanceRecurringTransaction>
): Promise<void> => {
  // Encrypt sensitive fields in updates before sending
  let updatesToSend = updates
  if (isEncryptionEnabledSync()) {
    try {
      const encryption = await getEncryptionModules()
      const encryptionKey = await encryption.ensureUserHasEncryptionKey(userId)
      // Only encrypt fields that are in the updates and should be encrypted
      const fieldsToEncrypt = ['name', 'description', 'paymentHistory'].filter(
        field => field in updates
      ) as (keyof FinanceRecurringTransaction)[]
      
      if (fieldsToEncrypt.length > 0) {
        const tempTransaction = { ...updates } as FinanceRecurringTransaction
        const encrypted = await encryption.encryptRecurringTransaction(tempTransaction, encryptionKey)
        updatesToSend = {}
        for (const field of fieldsToEncrypt) {
          if (encrypted[field] !== undefined) {
            updatesToSend[field] = encrypted[field]
          }
        }
        // Add non-encrypted fields
        for (const [key, value] of Object.entries(updates)) {
          if (!fieldsToEncrypt.includes(key as keyof FinanceRecurringTransaction)) {
            updatesToSend[key as keyof FinanceRecurringTransaction] = value
          }
        }
      }
    } catch (error) {
      console.error('Failed to encrypt recurring transaction updates:', error)
      throw new Error('Failed to encrypt recurring transaction updates. Please try again.')
    }
  }
  
  const response = await fetch('/api/finance/recurring', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, id, ...updatesToSend }),
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
  _userId: string,
  callback: (records: any[]) => void
): (() => void) => {
  // TODO: Implement API route for reconciliation
  // For now, return empty array
  callback([])
  return () => {}
}

export const getLastReconciliation = async (_userId: string): Promise<any> => {
  // TODO: Implement API route
  return null
}

export const saveLastReconciliation = async (
  _userId: string,
  _record: any
): Promise<void> => {
  // TODO: Implement API route
}

