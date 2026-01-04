import type { FinanceTransaction, ExpenseForecast } from '@/types/finance'
import { parseTransactionDate } from './financeDateUtils'
import { subMonths } from 'date-fns'

/**
 * Forecast future expenses based on historical data
 */
export function forecastExpenses(
  transactions: FinanceTransaction[],
  period: 'month' | 'quarter' | 'year' = 'month',
  monthsOfHistory: number = 6
): ExpenseForecast {
  const now = new Date()
  const historyStart = subMonths(now, monthsOfHistory)
  
  // Filter transactions to historical period
  const historicalTransactions = transactions.filter((tx) => {
    const txDate = parseTransactionDate(tx.date)
    return txDate >= historyStart && txDate <= now
  })

  // Group by month and category
  const monthlyData = new Map<string, Map<string, number>>() // month -> category -> amount
  
  historicalTransactions.forEach((tx) => {
    const txDate = parseTransactionDate(tx.date)
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`
    const amount = Number(tx.amount) || 0
    const type = (tx.type || '').toLowerCase()
    
    // Only count expenses
    if (type === 'expense' || (type !== 'income' && amount < 0)) {
      const category = tx.category || 'Uncategorized'
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, new Map())
      }
      
      const categoryMap = monthlyData.get(monthKey)!
      const currentAmount = categoryMap.get(category) || 0
      categoryMap.set(category, currentAmount + Math.abs(amount))
    }
  })

  // Calculate averages and trends per category
  const categoryStats = new Map<string, { amounts: number[]; average: number; trend: 'increasing' | 'decreasing' | 'stable' }>()
  
  monthlyData.forEach((categoryMap, _monthKey) => {
    categoryMap.forEach((amount, category) => {
      if (!categoryStats.has(category)) {
        categoryStats.set(category, { amounts: [], average: 0, trend: 'stable' })
      }
      const stats = categoryStats.get(category)!
      stats.amounts.push(amount)
    })
  })

  // Calculate averages and trends
  categoryStats.forEach((stats, _category) => {
    if (stats.amounts.length === 0) {
      stats.average = 0
      stats.trend = 'stable'
    } else {
      stats.average = stats.amounts.reduce((sum, val) => sum + val, 0) / stats.amounts.length
      
      // Determine trend (compare first half vs second half)
      if (stats.amounts.length >= 4) {
        const firstHalf = stats.amounts.slice(0, Math.floor(stats.amounts.length / 2))
        const secondHalf = stats.amounts.slice(Math.floor(stats.amounts.length / 2))
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
        
        const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100
        if (changePercent > 10) {
          stats.trend = 'increasing'
        } else if (changePercent < -10) {
          stats.trend = 'decreasing'
        } else {
          stats.trend = 'stable'
        }
      }
    }
  })

  // Calculate total predicted expenses
  let predictedExpenses = 0
  const breakdown: ExpenseForecast['breakdown'] = []
  
  categoryStats.forEach((stats, category) => {
    // Use trend-adjusted prediction
    let predictedAmount = stats.average
    if (stats.trend === 'increasing') {
      predictedAmount = stats.average * 1.1 // 10% increase
    } else if (stats.trend === 'decreasing') {
      predictedAmount = stats.average * 0.9 // 10% decrease
    }
    
    predictedExpenses += predictedAmount
    breakdown.push({
      category,
      predictedAmount,
      averageAmount: stats.average,
      trend: stats.trend,
    })
  })

  // Scale prediction based on period
  let periodMultiplier = 1
  if (period === 'quarter') {
    periodMultiplier = 3
  } else if (period === 'year') {
    periodMultiplier = 12
  }
  
  predictedExpenses *= periodMultiplier

  // Estimate income (simpler - use average)
  const incomeTransactions = historicalTransactions.filter((tx) => {
    const amount = Number(tx.amount) || 0
    const type = (tx.type || '').toLowerCase()
    return type === 'income' || (type !== 'expense' && amount > 0)
  })

  const monthlyIncome = incomeTransactions.reduce((sum, tx) => {
    const amount = Number(tx.amount) || 0
    return sum + Math.abs(amount)
  }, 0) / monthsOfHistory

  const predictedIncome = monthlyIncome * periodMultiplier
  const predictedSavings = predictedIncome - predictedExpenses

  // Calculate confidence based on data quality
  const confidence = Math.min(100, Math.max(50, (monthlyData.size / monthsOfHistory) * 100))

  return {
    period,
    predictedExpenses,
    predictedIncome,
    predictedSavings,
    confidence: Math.round(confidence),
    basedOnMonths: monthlyData.size,
    breakdown: breakdown.sort((a, b) => b.predictedAmount - a.predictedAmount),
  }
}

