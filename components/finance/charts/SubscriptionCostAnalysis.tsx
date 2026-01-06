'use client'

import { useMemo, memo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Repeat, TrendingUp, AlertCircle } from 'lucide-react'
import type { FinanceRecurringTransaction, FinanceTransaction } from '@/types/finance'
import { formatCurrency } from '@/lib/utils'
import { parseTransactionDate } from '@/lib/financeDateUtils'
// Optimize date-fns imports - only import what's needed
import format from 'date-fns/format'
import addMonths from 'date-fns/addMonths'

interface SubscriptionCostAnalysisProps {
  recurringTransactions: FinanceRecurringTransaction[]
  transactions?: FinanceTransaction[]
  months?: number
}

interface SubscriptionData {
  name: string
  amount: number
  interval: string
  monthlyEquivalent: number
  yearlyCost: number
  category?: string
  nextDate?: Date
  isPaid: boolean
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

function SubscriptionCostAnalysis({
  recurringTransactions,
  transactions: _transactions = [],
  months = 12,
}: SubscriptionCostAnalysisProps) {
  const subscriptionData = useMemo(() => {
    return recurringTransactions
      .filter((rt) => {
        // Only include expenses (negative amounts or expense type)
        const amount = Number(rt.amount) || 0
        return amount > 0 // Recurring transactions are typically positive amounts
      })
      .map((rt): SubscriptionData => {
        const amount = Math.abs(Number(rt.amount) || 0)
        const interval = rt.interval || 'monthly'
        
        // Calculate monthly equivalent
        let monthlyEquivalent = 0
        let yearlyCost = 0
        
        switch (interval.toLowerCase()) {
          case 'daily':
            monthlyEquivalent = amount * 30
            yearlyCost = amount * 365
            break
          case 'weekly':
            monthlyEquivalent = amount * 4.33
            yearlyCost = amount * 52
            break
          case 'biweekly':
          case 'bi-weekly':
            monthlyEquivalent = amount * 2.17
            yearlyCost = amount * 26
            break
          case 'monthly':
            monthlyEquivalent = amount
            yearlyCost = amount * 12
            break
          case 'quarterly':
            monthlyEquivalent = amount / 3
            yearlyCost = amount * 4
            break
          case 'yearly':
          case 'annually':
            monthlyEquivalent = amount / 12
            yearlyCost = amount
            break
          default:
            // Assume monthly if unknown
            monthlyEquivalent = amount
            yearlyCost = amount * 12
        }

        return {
          name: rt.name || rt.description || 'Unnamed Subscription',
          amount,
          interval,
          monthlyEquivalent,
          yearlyCost,
          category: rt.category,
          nextDate: rt.nextDate ? parseTransactionDate(rt.nextDate) : undefined,
          isPaid: rt.isPaid || false,
        }
      })
      .sort((a, b) => b.yearlyCost - a.yearlyCost)
  }, [recurringTransactions])


  const totals = useMemo(() => {
    const totalMonthly = subscriptionData.reduce((sum, sub) => sum + sub.monthlyEquivalent, 0)
    const totalYearly = subscriptionData.reduce((sum, sub) => sum + sub.yearlyCost, 0)
    const unpaidMonthly = subscriptionData
      .filter((sub) => !sub.isPaid)
      .reduce((sum, sub) => sum + sub.monthlyEquivalent, 0)
    const unpaidYearly = subscriptionData
      .filter((sub) => !sub.isPaid)
      .reduce((sum, sub) => sum + sub.yearlyCost, 0)

    return {
      totalMonthly,
      totalYearly,
      unpaidMonthly,
      unpaidYearly,
      count: subscriptionData.length,
      unpaidCount: subscriptionData.filter((sub) => !sub.isPaid).length,
    }
  }, [subscriptionData])

  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map<string, number>()
    
    subscriptionData.forEach((sub) => {
      const category = sub.category || 'Uncategorized'
      categoryMap.set(category, (categoryMap.get(category) || 0) + sub.yearlyCost)
    })

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [subscriptionData])

  const monthlyProjection = useMemo(() => {
    const projection: Array<{ month: string; cost: number }> = []
    const now = new Date()
    
    for (let i = 0; i < months; i++) {
      const monthDate = addMonths(now, i)
      const monthKey = format(monthDate, 'MMM yyyy')
      
      // Calculate cost for this month
      let monthlyCost = 0
      subscriptionData.forEach((sub) => {
        if (sub.interval === 'monthly') {
          monthlyCost += sub.amount
        } else if (sub.interval === 'weekly') {
          monthlyCost += sub.amount * 4.33
        } else if (sub.interval === 'yearly' || sub.interval === 'annually') {
          // Only add if this is the payment month
          if (sub.nextDate) {
            const nextDate = parseTransactionDate(sub.nextDate)
            if (format(nextDate, 'yyyy-MM') === format(monthDate, 'yyyy-MM')) {
              monthlyCost += sub.amount
            }
          }
        }
        // Add other intervals as needed
      })
      
      projection.push({ month: monthKey, cost: monthlyCost })
    }
    
    return projection
  }, [subscriptionData, months])

  if (subscriptionData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Repeat className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Cost Analysis</h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No recurring transactions found. Add bills or subscriptions to see cost analysis.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Repeat className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Cost Analysis</h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Subscriptions</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{totals.count}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly Cost</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(totals.totalMonthly)}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Yearly Cost</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(totals.totalYearly)}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Unpaid</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {totals.unpaidCount} ({formatCurrency(totals.unpaidMonthly)}/mo)
          </p>
        </div>
      </div>

      {/* Monthly Projection */}
      {monthlyProjection.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Monthly Cost Projection ({months} months)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyProjection}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(value: any) => {
                if (value === undefined || value === null) return ''
                const numValue = typeof value === 'number' ? value : parseFloat(value)
                if (isNaN(numValue)) return ''
                return formatCurrency(numValue)
              }} />
              <Bar dataKey="cost" fill="#8b5cf6" name="Monthly Cost" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Cost by Category
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryBreakdown.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => {
                if (value === undefined || value === null) return ''
                const numValue = typeof value === 'number' ? value : parseFloat(value)
                if (isNaN(numValue)) return ''
                return formatCurrency(numValue)
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Subscription List */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Subscription Details</h4>
        {subscriptionData.map((sub, index) => {
          const percentage = totals.totalYearly > 0 ? (sub.yearlyCost / totals.totalYearly) * 100 : 0
          return (
            <div
              key={`${sub.name}-${index}`}
              className={`border rounded-lg p-3 ${
                sub.isPaid
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {!sub.isPaid && (
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">{sub.name}</span>
                  {sub.category && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                      {sub.category}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(sub.yearlyCost)}/yr
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{formatCurrency(sub.monthlyEquivalent)}/month</span>
                <span className="capitalize">{sub.interval}</span>
                {sub.nextDate && (
                  <span>Next: {format(sub.nextDate, 'MMM d, yyyy')}</span>
                )}
                {!sub.isPaid && (
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">Unpaid</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Savings Opportunity */}
      {totals.totalYearly > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Potential Savings
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              If you cancel your top 3 subscriptions, you could save approximately:
            </p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(
                subscriptionData.slice(0, 3).reduce((sum, sub) => sum + sub.yearlyCost, 0)
              )}{' '}
              per year
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Memoize to prevent unnecessary re-renders when props haven't changed
export default memo(SubscriptionCostAnalysis)

