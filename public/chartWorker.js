/**
 * Web Worker for Chart Data Processing
 * Offloads heavy calculations from main thread
 */

// Helper functions
function formatDate(date, format) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const year = date.getFullYear()
  const month = date.getMonth()
  
  if (format === 'yyyy-MM') {
    return `${year}-${String(month + 1).padStart(2, '0')}`
  }
  if (format === 'MMM yyyy') {
    return `${months[month]} ${year}`
  }
  return date.toISOString()
}

function parseTransactionDate(date) {
  if (typeof date === 'string') {
    return new Date(date)
  }
  return date
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function subMonths(date, months) {
  const result = new Date(date)
  result.setMonth(result.getMonth() - months)
  return result
}

function eachMonthOfInterval(interval) {
  const months = []
  const current = new Date(interval.start)
  while (current <= interval.end) {
    months.push(new Date(current))
    current.setMonth(current.getMonth() + 1)
  }
  return months
}

function isWithinInterval(date, interval) {
  return date >= interval.start && date <= interval.end
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

// Process trend chart data
function processTrendChart(transactions, months = 12) {
  const now = new Date()
  const startDate = startOfMonth(subMonths(now, months - 1))
  const monthDates = eachMonthOfInterval({ start: startDate, end: now })

  const monthlyData = {}

  // Initialize all months
  monthDates.forEach((date) => {
    const key = formatDate(date, 'yyyy-MM')
    monthlyData[key] = { income: 0, expenses: 0 }
  })

  // Process transactions
  transactions.forEach((tx) => {
    const txDate = parseTransactionDate(tx.date)
    const monthKey = formatDate(txDate, 'yyyy-MM')
    
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

  const labels = monthDates.map((date) => formatDate(date, 'MMM yyyy'))
  const incomeData = monthDates.map((date) => {
    const key = formatDate(date, 'yyyy-MM')
    return monthlyData[key]?.income || 0
  })
  const expenseData = monthDates.map((date) => {
    const key = formatDate(date, 'yyyy-MM')
    return monthlyData[key]?.expenses || 0
  })
  const balanceData = monthDates.map((date) => {
    const key = formatDate(date, 'yyyy-MM')
    const data = monthlyData[key] || { income: 0, expenses: 0 }
    return data.income - data.expenses
  })

  return { labels, incomeData, expenseData, balanceData }
}

// Process category chart data
function processCategoryChart(transactions) {
  const COLORS = [
    '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6',
    '#a855f7', '#eab308', '#22c55e', '#3b82f6', '#f43f5e',
  ]

  const categoryTotals = {}

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

// Process monthly comparison data
function processMonthlyComparison(transactions, months = 6) {
  const now = new Date()
  const monthlyData = []

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i))
    const monthEnd = endOfMonth(monthStart)
    
    let income = 0
    let expenses = 0

    transactions.forEach((tx) => {
      const txDate = parseTransactionDate(tx.date)
      
      if (!isWithinInterval(txDate, { start: monthStart, end: monthEnd })) return

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

    monthlyData.push({
      month: formatDate(monthStart, 'MMM yyyy'),
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

// Worker message handler
self.onmessage = function(e) {
  const { type, transactions, options, messageId } = e.data

  try {
    let result

    switch (type) {
      case 'processTrendChart':
        result = processTrendChart(transactions, options?.months || 12)
        break
      case 'processCategoryChart':
        result = processCategoryChart(transactions)
        break
      case 'processMonthlyComparison':
        result = processMonthlyComparison(transactions, options?.months || 6)
        break
      default:
        throw new Error(`Unknown chart type: ${type}`)
    }

    self.postMessage({ success: true, result, messageId })
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error.message || 'Unknown error',
      messageId
    })
  }
}

