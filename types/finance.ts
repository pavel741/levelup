import { Timestamp } from 'firebase/firestore'

// Generic, forward-compatible types based on the Budget_app schema.
// Firestore is schemaless, so we keep these flexible and add fields as needed.

export interface FinanceTransaction {
  id: string
  date: string | Date | Timestamp
  amount: number
  category?: string
  description?: string
  account?: string
  type?: 'income' | 'expense' | 'transfer' | string
  currency?: string
  tags?: string[]
  // Allow extra fields from legacy data
  [key: string]: any
}

export interface FinanceCategories {
  // e.g. { "Groceries": { limit: 300, color: "#..." }, ... }
  [category: string]: any
}

export interface FinanceBudgetGoals {
  // e.g. { monthlySavingsTarget: 500, emergencyFundTarget: 3000, ... }
  [key: string]: any
}

export interface FinanceSettings {
  // Arbitrary app settings from the budget app (language, defaults, toggles, etc.)
  [key: string]: any
}

export interface FinanceReconciliationRecord {
  id: string
  timestamp: string | Date | Timestamp
  // other reconciliation fields (balances, notes, etc.)
  [key: string]: any
}

export interface FinanceRecurringTransaction {
  id: string
  name?: string
  amount: number
  category?: string
  description?: string
  interval?: string
  nextDate?: string | Date | Timestamp
  [key: string]: any
}


