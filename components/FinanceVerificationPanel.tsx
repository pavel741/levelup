'use client'

import { useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, Info, Copy, Download } from 'lucide-react'
import { useState } from 'react'

interface Props {
  transactions: FinanceTransaction[]
  filteredTransactions: FinanceTransaction[]
  dateRange: {
    start: Date | null
    end: Date | null
    label: string
  }
}

export function FinanceVerificationPanel({ transactions, filteredTransactions, dateRange }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const verificationData = useMemo(() => {
    // Calculate raw totals from filtered transactions
    let rawIncome = 0
    let rawExpenses = 0
    let rawIncomeCount = 0
    let rawExpenseCount = 0
    
    const categoryTotals: Record<string, { income: number; expenses: number; count: number }> = {}
    
    filteredTransactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      const absAmount = Math.abs(amount)
      
      const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
      
      if (isIncome) {
        rawIncome += absAmount
        rawIncomeCount++
      } else {
        rawExpenses += absAmount
        rawExpenseCount++
      }
      
      const category = tx.category || 'Uncategorized'
      if (!categoryTotals[category]) {
        categoryTotals[category] = { income: 0, expenses: 0, count: 0 }
      }
      
      if (isIncome) {
        categoryTotals[category].income += absAmount
      } else {
        categoryTotals[category].expenses += absAmount
      }
      categoryTotals[category].count++
    })
    
    // Calculate date range info
    let minDate: Date | null = null
    let maxDate: Date | null = null
    
    filteredTransactions.forEach((tx) => {
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
      if (!minDate || txDate < minDate) minDate = txDate
      if (!maxDate || txDate > maxDate) maxDate = txDate
    })
    
    // Calculate by transaction type
    const byType: Record<string, { count: number; total: number }> = {}
    filteredTransactions.forEach((tx) => {
      const type = (tx.type || '').toLowerCase() || 'unknown'
      const amount = Math.abs(Number(tx.amount) || 0)
      
      if (!byType[type]) {
        byType[type] = { count: 0, total: 0 }
      }
      byType[type].count++
      byType[type].total += amount
    })
    
    return {
      rawIncome,
      rawExpenses,
      rawBalance: rawIncome - rawExpenses,
      rawIncomeCount,
      rawExpenseCount,
      totalCount: filteredTransactions.length,
      categoryTotals: Object.entries(categoryTotals)
        .sort(([, a], [, b]) => (b.expenses + b.income) - (a.expenses + a.income))
        .slice(0, 10),
      byType,
      dateRange: {
        calculated: { min: minDate, max: maxDate },
        selected: dateRange,
      },
    }
  }, [filteredTransactions, dateRange])

  const copyToClipboard = () => {
    const text = `
Finance Analytics Verification Report
=====================================
Date Range: ${dateRange.label}
Selected Range: ${dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : 'N/A'} to ${dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : 'N/A'}
Calculated Range: ${verificationData.dateRange.calculated.min ? format(verificationData.dateRange.calculated.min, 'yyyy-MM-dd') : 'N/A'} to ${verificationData.dateRange.calculated.max ? format(verificationData.dateRange.calculated.max, 'yyyy-MM-dd') : 'N/A'}

Transaction Summary:
- Total Transactions: ${verificationData.totalCount}
- Income Transactions: ${verificationData.rawIncomeCount}
- Expense Transactions: ${verificationData.rawExpenseCount}

Amounts:
- Total Income: €${verificationData.rawIncome.toFixed(2)}
- Total Expenses: €${verificationData.rawExpenses.toFixed(2)}
- Balance: €${verificationData.rawBalance.toFixed(2)}

Top Categories:
${verificationData.categoryTotals.map(([cat, data]) => 
  `- ${cat}: €${(data.income + data.expenses).toFixed(2)} (${data.count} transactions)`
).join('\n')}

Transaction Types:
${Object.entries(verificationData.byType).map(([type, data]) => 
  `- ${type}: €${data.total.toFixed(2)} (${data.count} transactions)`
).join('\n')}
    `.trim()
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadReport = () => {
    const report = {
      dateRange: {
        label: dateRange.label,
        selected: {
          start: dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : null,
          end: dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : null,
        },
        calculated: {
          min: verificationData.dateRange.calculated.min ? format(verificationData.dateRange.calculated.min, 'yyyy-MM-dd') : null,
          max: verificationData.dateRange.calculated.max ? format(verificationData.dateRange.calculated.max, 'yyyy-MM-dd') : null,
        },
      },
      summary: {
        totalTransactions: verificationData.totalCount,
        incomeTransactions: verificationData.rawIncomeCount,
        expenseTransactions: verificationData.rawExpenseCount,
        totalIncome: verificationData.rawIncome,
        totalExpenses: verificationData.rawExpenses,
        balance: verificationData.rawBalance,
      },
      categories: verificationData.categoryTotals.map(([cat, data]) => ({
        category: cat,
        income: data.income,
        expenses: data.expenses,
        total: data.income + data.expenses,
        count: data.count,
      })),
      transactionTypes: Object.entries(verificationData.byType).map(([type, data]) => ({
        type,
        count: data.count,
        total: data.total,
      })),
      transactions: filteredTransactions.map(tx => ({
        id: tx.id,
        date: typeof tx.date === 'string' ? tx.date : format(tx.date as Date, 'yyyy-MM-dd'),
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        description: tx.description,
      })),
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-verification-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatter = new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
  })

  const dateMatch = 
    (!dateRange.start || !verificationData.dateRange.calculated.min || 
     format(dateRange.start, 'yyyy-MM-dd') === format(verificationData.dateRange.calculated.min, 'yyyy-MM-dd')) &&
    (!dateRange.end || !verificationData.dateRange.calculated.max || 
     format(dateRange.end, 'yyyy-MM-dd') === format(verificationData.dateRange.calculated.max, 'yyyy-MM-dd'))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Verification & Debug Panel
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={downloadReport}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Download report"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Income</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatter.format(verificationData.rawIncome)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {verificationData.rawIncomeCount} transactions
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Expenses</div>
          <div className="text-lg font-bold text-red-600 dark:text-red-400">
            {formatter.format(verificationData.rawExpenses)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {verificationData.rawExpenseCount} transactions
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Balance</div>
          <div className={`text-lg font-bold ${
            verificationData.rawBalance >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatter.format(verificationData.rawBalance)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Transactions</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {verificationData.totalCount}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {filteredTransactions.length !== transactions.length && (
              <span>of {transactions.length} total</span>
            )}
          </div>
        </div>
      </div>

      {/* Date Range Verification */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          {dateMatch ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white">Date Range</span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div>Selected: {dateRange.label}</div>
          {dateRange.start && dateRange.end && (
            <div>
              Range: {format(dateRange.start, 'yyyy-MM-dd')} to {format(dateRange.end, 'yyyy-MM-dd')}
            </div>
          )}
          {verificationData.dateRange.calculated.min && verificationData.dateRange.calculated.max && (
            <div>
              Calculated from transactions: {format(verificationData.dateRange.calculated.min, 'yyyy-MM-dd')} to {format(verificationData.dateRange.calculated.max, 'yyyy-MM-dd')}
            </div>
          )}
        </div>
      </div>

      {copied && (
        <div className="mb-4 p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm text-center">
          Copied to clipboard!
        </div>
      )}

      {isExpanded && (
        <div className="space-y-4 mt-4">
          {/* Top Categories */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Top Categories</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {verificationData.categoryTotals.map(([category, data]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-xs"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatter.format(data.income + data.expenses)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-500">
                      ({data.count} txns)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Types */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">By Transaction Type</h4>
            <div className="space-y-1">
              {Object.entries(verificationData.byType).map(([type, data]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-xs"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{type || 'unknown'}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatter.format(data.total)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-500">
                      ({data.count} txns)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

