/**
 * Client-side wrapper for Chart Web Worker
 * Provides a simple API for offloading chart calculations
 */

export interface TrendChartResult {
  labels: string[]
  incomeData: number[]
  expenseData: number[]
  balanceData: number[]
}

export interface CategoryChartResult {
  labels: string[]
  data: number[]
  colors: string[]
}

export interface MonthlyComparisonResult {
  labels: string[]
  incomeData: number[]
  expenseData: number[]
}

let worker: Worker | null = null

function getWorker(): Worker | null {
  if (typeof window === 'undefined') return null
  
  if (!worker && typeof Worker !== 'undefined') {
    try {
      worker = new Worker('/chartWorker.js')
    } catch (error) {
      console.warn('Failed to create chart worker:', error)
      return null
    }
  }
  return worker
}

/**
 * Process trend chart data in Web Worker
 */
export function processTrendChartInWorker(
  transactions: any[],
  months: number = 12
): Promise<TrendChartResult> {
  return new Promise((resolve, reject) => {
    try {
      const worker = getWorker()
      
      // Fallback to inline processing if Worker not available
      if (!worker) {
        resolve(processTrendChartInline(transactions, months))
        return
      }

      const messageId = Math.random().toString(36)

      const handler = (e: MessageEvent) => {
        if (e.data.messageId !== messageId) return
        
        worker!.removeEventListener('message', handler)
        
        if (e.data.success) {
          resolve(e.data.result)
        } else {
          reject(new Error(e.data.error))
        }
      }

      worker.addEventListener('message', handler)
      worker.postMessage({
        type: 'processTrendChart',
        transactions,
        options: { months },
        messageId,
      })
    } catch (error) {
      // Fallback to inline processing on error
      resolve(processTrendChartInline(transactions, months))
    }
  })
}

/**
 * Process category chart data in Web Worker
 */
export function processCategoryChartInWorker(
  transactions: any[]
): Promise<CategoryChartResult> {
  return new Promise((resolve, reject) => {
    try {
      const worker = getWorker()
      
      // Fallback to inline processing if Worker not available
      if (!worker) {
        resolve(processCategoryChartInline(transactions))
        return
      }

      const messageId = Math.random().toString(36)

      const handler = (e: MessageEvent) => {
        if (e.data.messageId !== messageId) return
        
        worker!.removeEventListener('message', handler)
        
        if (e.data.success) {
          resolve(e.data.result)
        } else {
          reject(new Error(e.data.error))
        }
      }

      worker.addEventListener('message', handler)
      worker.postMessage({
        type: 'processCategoryChart',
        transactions,
        messageId,
      })
    } catch (error) {
      // Fallback to inline processing on error
      resolve(processCategoryChartInline(transactions))
    }
  })
}

/**
 * Process monthly comparison data in Web Worker
 */
export function processMonthlyComparisonInWorker(
  transactions: any[],
  months: number = 6
): Promise<MonthlyComparisonResult> {
  return new Promise((resolve, reject) => {
    try {
      const worker = getWorker()
      
      // Fallback to inline processing if Worker not available
      if (!worker) {
        resolve(processMonthlyComparisonInline(transactions, months))
        return
      }

      const messageId = Math.random().toString(36)

      const handler = (e: MessageEvent) => {
        if (e.data.messageId !== messageId) return
        
        worker!.removeEventListener('message', handler)
        
        if (e.data.success) {
          resolve(e.data.result)
        } else {
          reject(new Error(e.data.error))
        }
      }

      worker.addEventListener('message', handler)
      worker.postMessage({
        type: 'processMonthlyComparison',
        transactions,
        options: { months },
        messageId,
      })
    } catch (error) {
      // Fallback to inline processing on error
      resolve(processMonthlyComparisonInline(transactions, months))
    }
  })
}

// Inline fallback functions (simplified versions)
function processTrendChartInline(transactions: any[], months: number): TrendChartResult {
  // Simplified inline processing - same logic as worker but runs on main thread
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
  const monthDates: Date[] = []
  
  for (let i = 0; i < months; i++) {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)
    monthDates.push(date)
  }

  const monthlyData: Record<string, { income: number; expenses: number }> = {}
  
  monthDates.forEach((date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyData[key] = { income: 0, expenses: 0 }
  })

  transactions.forEach((tx) => {
    const txDate = typeof tx.date === 'string' ? new Date(tx.date) : tx.date
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[monthKey]) return

    const amount = Number(tx.amount) || 0
    const type = (tx.type || '').toLowerCase()
    const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
    const absAmount = Math.abs(amount)

    if (isIncome) {
      monthlyData[monthKey].income += absAmount
    } else {
      monthlyData[monthKey].expenses += absAmount
    }
  })

  const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const labels = monthDates.map((date) => `${monthsNames[date.getMonth()]} ${date.getFullYear()}`)
  const incomeData = monthDates.map((date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return monthlyData[key]?.income || 0
  })
  const expenseData = monthDates.map((date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return monthlyData[key]?.expenses || 0
  })
  const balanceData = monthDates.map((date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const data = monthlyData[key] || { income: 0, expenses: 0 }
    return data.income - data.expenses
  })

  return { labels, incomeData, expenseData, balanceData }
}

function processCategoryChartInline(transactions: any[]): CategoryChartResult {
  const COLORS = [
    '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6',
  ]

  const categoryTotals: Record<string, number> = {}

  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0
    const type = (tx.type || '').toLowerCase()
    const isExpense = type === 'expense' || amount < 0
    if (!isExpense) continue

    const absAmount = Math.abs(amount)
    let category = tx.category || 'Other'
    if (!category || category === 'Other' || category.includes('POS:')) {
      category = 'Other'
    }
    
    categoryTotals[category] = (categoryTotals[category] || 0) + absAmount
  }

  const categories = Object.keys(categoryTotals)
  const amounts = categories.map((c) => categoryTotals[c])
  const colors = categories.map((_, i) => COLORS[i % COLORS.length])

  return { labels: categories, data: amounts, colors }
}

function processMonthlyComparisonInline(transactions: any[], months: number): MonthlyComparisonResult {
  const now = new Date()
  const monthlyData: Array<{ month: string; income: number; expenses: number }> = []

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    
    let income = 0
    let expenses = 0

    transactions.forEach((tx) => {
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : tx.date
      if (txDate < monthStart || txDate > monthEnd) return

      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
      const absAmount = Math.abs(amount)

      if (isIncome) {
        income += absAmount
      } else {
        expenses += absAmount
      }
    })

    const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    monthlyData.push({
      month: `${monthsNames[monthStart.getMonth()]} ${monthStart.getFullYear()}`,
      income,
      expenses,
    })
  }

  return {
    labels: monthlyData.map((d) => d.month),
    incomeData: monthlyData.map((d) => d.income),
    expenseData: monthlyData.map((d) => d.expenses),
  }
}

