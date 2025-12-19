'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { FinanceCategoryChart } from '@/components/FinanceCategoryChart'
import { FinanceTrendChart } from '@/components/FinanceTrendChart'
import { FinanceMonthlyComparison } from '@/components/FinanceMonthlyComparison'
import { FinanceCategoryBarChart } from '@/components/FinanceCategoryBarChart'
import { FinanceSpendingByDayOfWeek } from '@/components/FinanceSpendingByDayOfWeek'
import { FinanceCategoryTrends } from '@/components/FinanceCategoryTrends'
import { FinanceYearOverYear } from '@/components/FinanceYearOverYear'
import { FinancePaymentMethodBreakdown } from '@/components/FinancePaymentMethodBreakdown'
import { FinanceAverageTransactionAmount } from '@/components/FinanceAverageTransactionAmount'
import { FinanceSpendingVelocity } from '@/components/FinanceSpendingVelocity'
import { FinanceExpenseDistribution } from '@/components/FinanceExpenseDistribution'
import { FinanceCashFlowCalendar } from '@/components/FinanceCashFlowCalendar'
import { FinanceCategoryForecast } from '@/components/FinanceCategoryForecast'
import { FinanceSpendingAlerts } from '@/components/FinanceSpendingAlerts'
import { FinanceRecurringExpenses } from '@/components/FinanceRecurringExpenses'
import { subscribeToTransactions } from '@/lib/financeApi'
import type { FinanceTransaction } from '@/types/finance'
import { BarChart3, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function FinanceAnalyticsPage() {
  const { user } = useFirestoreStore()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | '6months' | '12months' | 'year' | 'all' | 'custom'>('month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [showCustomDateRange, setShowCustomDateRange] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    setIsLoading(true)

    const unsubscribe = subscribeToTransactions(
      user.id,
      (txs) => {
        setTransactions(txs)
        setIsLoading(false)
        // Log how many transactions are loaded
        if (txs.length > 0) {
          console.log(`📊 Analytics: Loaded ${txs.length} transactions from MongoDB (no limit)`)
        }
      },
      { limitCount: 0 } // 0 = no limit, load ALL transactions (MongoDB can handle it!)
    )

    return () => unsubscribe()
  }, [user?.id])

  // Filter transactions by time range
  const filteredTransactions = useMemo(() => {
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = null

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0)
        startDate = weekStart
        endDate = now
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
        break
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        endDate = now
        break
      case '12months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1)
        endDate = now
        break
      case 'custom':
        if (customDateFrom && customDateTo) {
          startDate = new Date(customDateFrom)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(customDateTo)
          endDate.setHours(23, 59, 59, 999)
        }
        break
      case 'all':
      default:
        return transactions
    }

    if (!startDate || !endDate) return transactions

    return transactions.filter((tx) => {
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
      return txDate >= startDate! && txDate <= endDate!
    })
  }, [transactions, timeRange, customDateFrom, customDateTo])

  // Calculate summary stats based on filtered transactions
  const summaryStats = useMemo(() => {
    let totalIncome = 0
    let totalExpenses = 0
    let categoryCount = new Set<string>()

    filteredTransactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      
      const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
      const absAmount = Math.abs(amount)

      if (isIncome) {
        totalIncome += absAmount
      } else {
        totalExpenses += absAmount
        if (tx.category) {
          categoryCount.add(tx.category)
        }
      }
    })

    const savingsRate = totalIncome > 0 
      ? ((totalIncome - totalExpenses) / totalIncome * 100) 
      : 0

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      savingsRate,
      categoryCount: categoryCount.size,
      transactionCount: filteredTransactions.length,
    }
  }, [filteredTransactions])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-7xl mx-auto">
                <button
                  onClick={() => router.push('/finance')}
                  className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Finance
                </button>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance Analytics</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Comprehensive insights into your spending patterns and financial trends.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isLoading && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Loading…</span>
                    )}
                  </div>
                </div>

                {/* Time Period Filter */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Time Period:
                  </label>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {(['today', 'week', 'month', 'year', '6months', '12months', 'all'] as const).map((range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => {
                          setTimeRange(range)
                          setShowCustomDateRange(false)
                        }}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          timeRange === range && !showCustomDateRange
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        {range === 'today' ? 'Today' : 
                         range === 'week' ? 'This Week' : 
                         range === 'month' ? 'This Month' : 
                         range === 'year' ? 'This Year' : 
                         range === '6months' ? 'Last 6 Months' : 
                         range === '12months' ? 'Last 12 Months' : 
                         'All Time'}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setTimeRange('custom')
                        setShowCustomDateRange(true)
                      }}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        timeRange === 'custom' && showCustomDateRange
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                  
                  {/* Quick Filter Presets */}
                  <div className="flex gap-2 flex-wrap mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date()
                        const last7Days = new Date(today)
                        last7Days.setDate(last7Days.getDate() - 7)
                        setCustomDateFrom(last7Days.toISOString().split('T')[0])
                        setCustomDateTo(today.toISOString().split('T')[0])
                        setTimeRange('custom')
                        setShowCustomDateRange(true)
                      }}
                      className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      Last 7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date()
                        const last30Days = new Date(today)
                        last30Days.setDate(last30Days.getDate() - 30)
                        setCustomDateFrom(last30Days.toISOString().split('T')[0])
                        setCustomDateTo(today.toISOString().split('T')[0])
                        setTimeRange('custom')
                        setShowCustomDateRange(true)
                      }}
                      className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      Last 30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date()
                        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
                        setCustomDateFrom(lastMonth.toISOString().split('T')[0])
                        setCustomDateTo(lastMonthEnd.toISOString().split('T')[0])
                        setTimeRange('custom')
                        setShowCustomDateRange(true)
                      }}
                      className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      Last Month
                    </button>
                  </div>
                  
                  {showCustomDateRange && (
                    <div className="flex gap-2 items-end flex-wrap p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 mt-3">
                      <div>
                        <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">From:</label>
                        <input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => setCustomDateFrom(e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">To:</label>
                        <input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => setCustomDateTo(e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (customDateFrom && customDateTo) {
                              setTimeRange('custom')
                            }
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all"
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomDateRange(false)
                            setTimeRange('month')
                          }}
                          className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Active Filter Info */}
                  {filteredTransactions.length !== transactions.length && (
                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                      Showing {filteredTransactions.length.toLocaleString()} of {transactions.length.toLocaleString()} transactions
                    </div>
                  )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Income</span>
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(summaryStats.totalIncome)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</span>
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(summaryStats.totalExpenses)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
                      <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className={`text-2xl font-bold ${
                      summaryStats.balance >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(summaryStats.balance)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Savings Rate</span>
                      <Percent className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className={`text-2xl font-bold ${
                      summaryStats.savingsRate >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {summaryStats.savingsRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {summaryStats.savingsRate >= 0 ? 'Positive' : 'Negative'} savings
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Transactions</span>
                      <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summaryStats.transactionCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {summaryStats.categoryCount} categories
                    </p>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Spending Trends */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Spending Trends
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Income, expenses, and balance over time
                    </p>
                    <FinanceTrendChart 
                      transactions={filteredTransactions} 
                      months={
                        timeRange === 'today' || timeRange === 'week' ? 1 :
                        timeRange === 'month' ? 3 :
                        timeRange === 'year' ? 12 :
                        timeRange === '6months' ? 6 : 
                        timeRange === '12months' ? 12 : 
                        timeRange === 'custom' ? 12 :
                        24
                      } 
                    />
                  </div>

                  {/* Category Breakdown */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Spending by Category
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Visual breakdown of your expenses
                    </p>
                    <FinanceCategoryChart transactions={filteredTransactions} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Monthly Comparison */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Monthly Comparison
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Income vs expenses by month
                    </p>
                    <FinanceMonthlyComparison 
                      transactions={filteredTransactions} 
                      months={
                        timeRange === 'today' || timeRange === 'week' ? 1 :
                        timeRange === 'month' ? 3 :
                        timeRange === 'year' ? 12 :
                        timeRange === '6months' ? 6 : 
                        timeRange === '12months' ? 12 : 
                        timeRange === 'custom' ? 12 :
                        12
                      } 
                    />
                  </div>

                  {/* Top Categories */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Top Spending Categories
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Your biggest expense categories
                    </p>
                    <FinanceCategoryBarChart transactions={filteredTransactions} limit={10} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Spending by Day of Week */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Spending by Day of Week
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      See which days you spend the most
                    </p>
                    <FinanceSpendingByDayOfWeek transactions={filteredTransactions} />
                  </div>

                  {/* Payment Method Breakdown */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Payment Method Breakdown
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      How you pay for expenses
                    </p>
                    <FinancePaymentMethodBreakdown transactions={filteredTransactions} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Category Trends Over Time */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Category Trends Over Time
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      How your top categories change month-over-month
                    </p>
                    <FinanceCategoryTrends 
                      transactions={filteredTransactions} 
                      months={
                        timeRange === 'today' || timeRange === 'week' ? 1 :
                        timeRange === 'month' ? 3 :
                        timeRange === 'year' ? 12 :
                        timeRange === '6months' ? 6 : 
                        timeRange === '12months' ? 12 : 
                        timeRange === 'custom' ? 12 :
                        12
                      }
                      topCategories={5}
                    />
                  </div>

                  {/* Year-over-Year Comparison */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Year-over-Year Comparison
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Compare current period to same period last year
                    </p>
                    <FinanceYearOverYear 
                      transactions={filteredTransactions} 
                      months={
                        timeRange === 'today' || timeRange === 'week' ? 1 :
                        timeRange === 'month' ? 3 :
                        timeRange === 'year' ? 12 :
                        timeRange === '6months' ? 6 : 
                        timeRange === '12months' ? 12 : 
                        timeRange === 'custom' ? 12 :
                        12
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Average Transaction Amount */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Average Transaction Amount
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Average expense per transaction over time
                    </p>
                    <FinanceAverageTransactionAmount 
                      transactions={filteredTransactions} 
                      months={
                        timeRange === 'today' || timeRange === 'week' ? 1 :
                        timeRange === 'month' ? 3 :
                        timeRange === 'year' ? 12 :
                        timeRange === '6months' ? 6 : 
                        timeRange === '12months' ? 12 : 
                        timeRange === 'custom' ? 12 :
                        12
                      }
                    />
                  </div>

                  {/* Spending Velocity */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Spending Velocity
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Daily/weekly average spending rate
                    </p>
                    <FinanceSpendingVelocity 
                      transactions={filteredTransactions} 
                      view={timeRange === 'today' || timeRange === 'week' ? 'daily' : 'weekly'}
                      days={30}
                      weeks={
                        timeRange === 'month' ? 3 :
                        timeRange === 'year' ? 12 :
                        timeRange === '6months' ? 6 : 
                        timeRange === '12months' ? 12 : 
                        timeRange === 'custom' ? 12 :
                        12
                      }
                    />
                  </div>
                </div>

                {/* Expense Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Expense Distribution
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Histogram showing transaction amount distribution
                  </p>
                  <FinanceExpenseDistribution transactions={filteredTransactions} bins={20} />
                </div>

                {/* Cash Flow Calendar */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Cash Flow Calendar
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Net cash flow by day (Income - Expenses). Green = positive, Red = negative
                  </p>
                  <FinanceCashFlowCalendar 
                    transactions={filteredTransactions} 
                    months={
                      timeRange === 'today' || timeRange === 'week' ? 1 :
                      timeRange === 'month' ? 1 :
                      timeRange === 'year' ? 3 :
                      timeRange === '6months' ? 3 : 
                      timeRange === '12months' ? 6 : 
                      timeRange === 'custom' ? 3 :
                      3
                    }
                    view="net"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Category Forecast */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Category Forecast
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Predict next month's spending per category
                    </p>
                    <FinanceCategoryForecast 
                      transactions={filteredTransactions} 
                      months={
                        timeRange === 'today' || timeRange === 'week' ? 3 :
                        timeRange === 'month' ? 6 :
                        timeRange === 'year' ? 12 :
                        timeRange === '6months' ? 6 : 
                        timeRange === '12months' ? 12 : 
                        timeRange === 'custom' ? 6 :
                        6
                      }
                    />
                  </div>

                  {/* Spending Alerts */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Spending Alerts
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Unusual spending patterns and trends
                    </p>
                    <FinanceSpendingAlerts 
                      transactions={filteredTransactions} 
                      months={
                        timeRange === 'today' || timeRange === 'week' ? 3 :
                        timeRange === 'month' ? 6 :
                        timeRange === 'year' ? 12 :
                        timeRange === '6months' ? 6 : 
                        timeRange === '12months' ? 12 : 
                        timeRange === 'custom' ? 6 :
                        6
                      }
                    />
                  </div>
                </div>

                {/* Recurring Expenses Detection */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Recurring Expenses Detection
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Identify and highlight recurring transactions
                  </p>
                  <FinanceRecurringExpenses 
                    transactions={filteredTransactions} 
                    months={
                      timeRange === 'today' || timeRange === 'week' ? 3 :
                      timeRange === 'month' ? 6 :
                      timeRange === 'year' ? 12 :
                      timeRange === '6months' ? 6 : 
                      timeRange === '12months' ? 12 : 
                      timeRange === 'custom' ? 6 :
                      6
                    }
                  />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}


