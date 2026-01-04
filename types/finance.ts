import { Timestamp } from 'firebase/firestore'



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
  [key: string]: any
}

export interface FinanceCategories {
  [category: string]: any
}

export interface FinanceBudgetGoals {
  [key: string]: any
}

export interface FinanceSettings {
  [key: string]: any
}

export interface FinanceReconciliationRecord {
  id: string
  timestamp: string | Date | Timestamp
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
  dueDate?: string | Date | Timestamp // Bill due date
  reminderDaysBefore?: number // Days before due date to send reminder
  isPaid?: boolean // Whether this bill has been paid
  lastPaidDate?: string | Date | Timestamp // Last payment date
  paymentHistory?: Array<{
    date: string | Date | Timestamp
    amount: number
    notes?: string
  }>
  [key: string]: any
}

export interface SavingsGoal {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate?: string | Date | Timestamp
  category?: string // e.g., 'vacation', 'emergency', 'house', etc.
  icon?: string // Icon identifier
  color?: string // Color for UI
  createdAt: Date | string
  updatedAt: Date | string
}

export interface BudgetCategoryLimit {
  category: string
  monthlyLimit: number
  weeklyLimit?: number
  alertThreshold?: number // Percentage (e.g., 80) to alert when reached
}

export interface BudgetAnalysis {
  category: string
  limit: number
  spent: number
  remaining: number
  percentageUsed: number
  isOverBudget: boolean
  period: 'monthly' | 'weekly'
  periodStart: Date
  periodEnd: Date
}

export interface ExpenseForecast {
  period: 'month' | 'quarter' | 'year'
  predictedExpenses: number
  predictedIncome: number
  predictedSavings: number
  confidence: number // 0-100, confidence in prediction
  basedOnMonths: number // Number of months of data used
  breakdown: Array<{
    category: string
    predictedAmount: number
    averageAmount: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }>
}


