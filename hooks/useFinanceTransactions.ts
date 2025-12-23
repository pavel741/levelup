/**
 * Custom hook for managing finance transactions
 * Extracts transaction management logic from FinancePage
 */

import { useState, useEffect } from 'react'
import {
  subscribeToTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
} from '@/lib/financeApi'
import type { FinanceTransaction } from '@/types/finance'
import { showError, showSuccess } from '@/lib/utils'

export interface UseFinanceTransactionsOptions {
  userId: string
  limit?: number
}

export interface UseFinanceTransactionsReturn {
  transactions: FinanceTransaction[]
  allTransactions: FinanceTransaction[]
  isLoading: boolean
  add: (transaction: Omit<FinanceTransaction, 'id'>) => Promise<void>
  update: (id: string, transaction: Partial<FinanceTransaction>) => Promise<void>
  remove: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useFinanceTransactions({ userId, limit }: UseFinanceTransactionsOptions): UseFinanceTransactionsReturn {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [allTransactions, setAllTransactions] = useState<FinanceTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Subscribe to transactions
  useEffect(() => {
    if (!userId) return

    const unsubscribe = subscribeToTransactions(
      userId,
      (data: FinanceTransaction[]) => {
        setTransactions(data)
        setIsLoading(false)
      },
      { limitCount: limit || 0 }
    )

    // Also fetch all transactions for summary
    getTransactions(userId).then((allData) => {
      setAllTransactions(allData)
    }).catch((error) => {
      showError(error, { component: 'useFinanceTransactions', action: 'getAllTransactions' })
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [userId, limit])

  const add = async (transaction: Omit<FinanceTransaction, 'id'>) => {
    try {
      await addTransaction(userId, transaction)
      showSuccess('Transaction added successfully')
    } catch (error) {
      showError(error, { component: 'useFinanceTransactions', action: 'addTransaction' })
      throw error
    }
  }

  const update = async (id: string, updates: Partial<FinanceTransaction>) => {
    try {
      await updateTransaction(userId, id, updates)
      showSuccess('Transaction updated successfully')
    } catch (error) {
      showError(error, { component: 'useFinanceTransactions', action: 'updateTransaction' })
      throw error
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteTransaction(userId, id)
      showSuccess('Transaction deleted successfully')
    } catch (error) {
      showError(error, { component: 'useFinanceTransactions', action: 'deleteTransaction' })
      throw error
    }
  }

  const refresh = async () => {
    setIsLoading(true)
    try {
      const data = await getTransactions(userId, limit ? { limitCount: limit } : undefined)
      setTransactions(data)
      const allData = await getTransactions(userId)
      setAllTransactions(allData)
    } catch (error) {
      showError(error, { component: 'useFinanceTransactions', action: 'refresh' })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    transactions,
    allTransactions,
    isLoading,
    add,
    update,
    remove,
    refresh,
  }
}

