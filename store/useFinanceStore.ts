/**
 * Finance Feature Store
 * Manages finance-related state (transactions, categories, settings)
 */

import { create } from 'zustand'
import type { FinanceTransaction, FinanceCategories, FinanceSettings } from '@/types/finance'
import {
  subscribeToTransactions,
  subscribeToCategories,
  getCategories,
  getFinanceSettings,
  getTransactions,
} from '@/lib/financeApi'
import { showError } from '@/lib/utils'

interface FinanceState {
  // Transactions
  transactions: FinanceTransaction[]
  allTransactions: FinanceTransaction[]
  isLoadingTransactions: boolean
  
  // Categories
  categories: FinanceCategories | null
  isLoadingCategories: boolean
  
  // Settings
  financeSettings: FinanceSettings | null
  isLoadingSettings: boolean
  
  // Actions
  setTransactions: (transactions: FinanceTransaction[]) => void
  setAllTransactions: (transactions: FinanceTransaction[]) => void
  subscribeTransactions: (userId: string, limit?: number) => () => void
  subscribeCategories: (userId: string) => () => void
  loadSettings: (userId: string) => Promise<void>
  loadCategories: (userId: string) => Promise<void>
  
  // Cleanup
  unsubscribe: () => void
}

let unsubscribeTransactions: (() => void) | null = null
let unsubscribeCategories: (() => void) | null = null

export const useFinanceStore = create<FinanceState>((set, get) => ({
  // Initial state
  transactions: [],
  allTransactions: [],
  isLoadingTransactions: true,
  categories: null,
  isLoadingCategories: false,
  financeSettings: null,
  isLoadingSettings: false,

  setTransactions: (transactions) => {
    set({ transactions, isLoadingTransactions: false })
  },

  setAllTransactions: (allTransactions) => {
    set({ allTransactions })
  },

  subscribeTransactions: (userId: string, limit?: number) => {
    // Clean up existing subscription
    if (unsubscribeTransactions) {
      unsubscribeTransactions()
    }

    set({ isLoadingTransactions: true })

    // Subscribe to transactions
    unsubscribeTransactions = subscribeToTransactions(
      userId,
      (data: FinanceTransaction[]) => {
        get().setTransactions(data)
      },
      { limitCount: limit || 0 }
    )

    // Also fetch all transactions for summary
    getTransactions(userId)
      .then((allData) => {
        get().setAllTransactions(allData)
      })
      .catch((error) => {
        showError(error, { component: 'useFinanceStore', action: 'getAllTransactions' })
      })

    return () => {
      if (unsubscribeTransactions) {
        unsubscribeTransactions()
        unsubscribeTransactions = null
      }
    }
  },

  subscribeCategories: (userId: string) => {
    // Clean up existing subscription
    if (unsubscribeCategories) {
      unsubscribeCategories()
    }

    set({ isLoadingCategories: true })

    unsubscribeCategories = subscribeToCategories(userId, (categories) => {
      set({ categories, isLoadingCategories: false })
    })

    return () => {
      if (unsubscribeCategories) {
        unsubscribeCategories()
        unsubscribeCategories = null
      }
    }
  },

  loadSettings: async (userId: string) => {
    set({ isLoadingSettings: true })
    try {
      const settings = await getFinanceSettings(userId)
      set({ financeSettings: settings, isLoadingSettings: false })
    } catch (error) {
      showError(error, { component: 'useFinanceStore', action: 'loadSettings' })
      set({ isLoadingSettings: false })
    }
  },

  loadCategories: async (userId: string) => {
    set({ isLoadingCategories: true })
    try {
      const categories = await getCategories(userId)
      set({ categories, isLoadingCategories: false })
    } catch (error) {
      showError(error, { component: 'useFinanceStore', action: 'loadCategories' })
      set({ isLoadingCategories: false })
    }
  },

  unsubscribe: () => {
    if (unsubscribeTransactions) {
      unsubscribeTransactions()
      unsubscribeTransactions = null
    }
    if (unsubscribeCategories) {
      unsubscribeCategories()
      unsubscribeCategories = null
    }
  },
}))

