'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Store } from 'lucide-react'
import type { FinanceTransaction } from '@/types/finance'
import { formatCurrency } from '@/lib/utils'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import { format } from 'date-fns'

interface MerchantAnalysisProps {
  transactions: FinanceTransaction[]
  topN?: number
  months?: number
}

interface MerchantData {
  name: string
  totalSpent: number
  transactionCount: number
  avgTransactionAmount: number
  firstSeen: Date
  lastSeen: Date
  monthlyTrend: Array<{ month: string; amount: number }>
}

export default function MerchantAnalysis({
  transactions,
  topN = 10,
  months = 6,
}: MerchantAnalysisProps) {
  const merchantData = useMemo(() => {
    // Extract merchant names from transaction descriptions
    const merchantMap = new Map<string, {
      transactions: FinanceTransaction[]
      amounts: number[]
    }>()

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      
      // Only process expenses
      if (type === 'expense' || (type !== 'income' && amount < 0)) {
        const absAmount = Math.abs(amount)
        
        // Try to extract merchant name from description
        let merchantName = 'Unknown Merchant'
        
        if (tx.description) {
          // Common patterns: "MERCHANT NAME", "Merchant Name - Description", etc.
          const desc = tx.description.trim()
          
          // Try to extract merchant (before common separators)
          const separators = [' - ', ' | ', ' at ', ' @ ', ' #']
          for (const sep of separators) {
            if (desc.includes(sep)) {
              merchantName = desc.split(sep)[0].trim()
              break
            }
          }
          
          // If no separator, use first part (up to 30 chars or first space after 10 chars)
          if (merchantName === 'Unknown Merchant') {
            if (desc.length <= 30) {
              merchantName = desc
            } else {
              const spaceIndex = desc.indexOf(' ', 10)
              merchantName = spaceIndex > 0 ? desc.substring(0, spaceIndex) : desc.substring(0, 30)
            }
          }
          
          // Clean up common prefixes/suffixes
          merchantName = merchantName
            .replace(/^(PAYMENT|PAY|TRANSFER|TRANSACTION)\s+/i, '')
            .replace(/\s+(PAYMENT|PAY|TRANSFER|TRANSACTION)$/i, '')
            .trim()
        }

        if (!merchantMap.has(merchantName)) {
          merchantMap.set(merchantName, { transactions: [], amounts: [] })
        }

        const merchant = merchantMap.get(merchantName)!
        merchant.transactions.push(tx)
        merchant.amounts.push(absAmount)
      }
    })

    // Calculate statistics for each merchant
    const merchants: MerchantData[] = Array.from(merchantMap.entries())
      .map(([name, data]) => {
        const totalSpent = data.amounts.reduce((sum, amt) => sum + amt, 0)
        const transactionCount = data.transactions.length
        const avgTransactionAmount = transactionCount > 0 ? totalSpent / transactionCount : 0

        // Find first and last transaction dates
        const dates = data.transactions.map((tx) => parseTransactionDate(tx.date))
        const firstSeen = new Date(Math.min(...dates.map((d) => d.getTime())))
        const lastSeen = new Date(Math.max(...dates.map((d) => d.getTime())))

        // Calculate monthly trend
        const monthlyMap = new Map<string, number>()
        data.transactions.forEach((tx) => {
          const txDate = parseTransactionDate(tx.date)
          const monthKey = format(txDate, 'yyyy-MM')
          const amount = Math.abs(Number(tx.amount) || 0)
          monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + amount)
        })

        const monthlyTrend = Array.from(monthlyMap.entries())
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => a.month.localeCompare(b.month))
          // Don't slice - show all months available in the data

        return {
          name,
          totalSpent,
          transactionCount,
          avgTransactionAmount,
          firstSeen,
          lastSeen,
          monthlyTrend,
        }
      })
      .filter((m) => m.totalSpent > 0) // Only merchants with spending
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, topN)

    return merchants
  }, [transactions, topN, months])

  const chartData = useMemo(() => {
    return merchantData.map((merchant) => ({
      name: merchant.name.length > 20 ? merchant.name.substring(0, 20) + '...' : merchant.name,
      fullName: merchant.name,
      amount: merchant.totalSpent,
      count: merchant.transactionCount,
      avg: merchant.avgTransactionAmount,
    }))
  }, [merchantData])

  const trendData = useMemo(() => {
    if (merchantData.length === 0) return []
    
    // Get all unique months from all merchants
    const allMonths = new Set<string>()
    merchantData.forEach((merchant) => {
      merchant.monthlyTrend.forEach((trend) => {
        allMonths.add(trend.month)
      })
    })

    // Use all available months, not just last N
    const sortedMonths = Array.from(allMonths).sort()

    // Create data for top merchants
    return sortedMonths.map((month) => {
      const data: { month: string; [key: string]: string | number } = { month }
      merchantData.slice(0, 5).forEach((merchant) => {
        const trendEntry = merchant.monthlyTrend.find((t) => t.month === month)
        data[merchant.name] = trendEntry?.amount || 0
      })
      return data
    })
  }, [merchantData, months])

  if (merchantData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Merchant Analysis</h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No merchant data available. Add transaction descriptions to see merchant analysis.</p>
        </div>
      </div>
    )
  }

  const totalSpent = merchantData.reduce((sum, m) => sum + m.totalSpent, 0)
  const totalTransactions = merchantData.reduce((sum, m) => sum + m.transactionCount, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Merchant Analysis</h3>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Merchants</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{merchantData.length}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Spent</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Transactions</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{totalTransactions}</p>
        </div>
      </div>

      {/* Top Merchants Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Top {topN} Merchants by Spending
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip
              formatter={(value: any) => {
                if (value === undefined || value === null) return ''
                const numValue = typeof value === 'number' ? value : parseFloat(value)
                if (isNaN(numValue)) return ''
                return formatCurrency(numValue)
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullName
                }
                return label
              }}
            />
            <Bar dataKey="amount" fill="#3b82f6" name="Total Spent" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Merchant Trends */}
      {trendData.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Top 5 Merchants - Monthly Trend
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(value: any) => {
                if (value === undefined || value === null) return ''
                const numValue = typeof value === 'number' ? value : parseFloat(value)
                if (isNaN(numValue)) return ''
                return formatCurrency(numValue)
              }} />
              {merchantData.slice(0, 5).map((merchant, index) => {
                const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
                return (
                  <Line
                    key={merchant.name}
                    type="monotone"
                    dataKey={merchant.name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    name={merchant.name.length > 20 ? merchant.name.substring(0, 20) + '...' : merchant.name}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Merchant List */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Merchant Details</h4>
        {merchantData.map((merchant, index) => {
          const percentage = totalSpent > 0 ? (merchant.totalSpent / totalSpent) * 100 : 0
          return (
            <div key={merchant.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{merchant.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(merchant.totalSpent)}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{merchant.transactionCount} transactions</span>
                <span>Avg: {formatCurrency(merchant.avgTransactionAmount)}</span>
                <span>Last: {format(merchant.lastSeen, 'MMM d, yyyy')}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

