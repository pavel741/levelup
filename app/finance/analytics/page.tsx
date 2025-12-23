'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useFirestoreStore } from '@/store/useFirestoreStore'
// Lazy load chart components for better performance
import nextDynamic from 'next/dynamic'
import { CardSkeleton } from '@/components/ui/Skeleton'

const FinanceCategoryChart = nextDynamic(() => import('@/components/finance/charts/FinanceCategoryChart').then(m => ({ default: m.FinanceCategoryChart })), {
  loading: () => <CardSkeleton />,
})
const FinanceTrendChart = nextDynamic(() => import('@/components/finance/charts/FinanceTrendChart').then(m => ({ default: m.FinanceTrendChart })), {
  loading: () => <CardSkeleton />,
})
const FinanceMonthlyComparison = nextDynamic(() => import('@/components/finance/charts/FinanceMonthlyComparison').then(m => ({ default: m.FinanceMonthlyComparison })), {
  loading: () => <CardSkeleton />,
})
const FinanceCategoryBarChart = nextDynamic(() => import('@/components/finance/charts/FinanceCategoryBarChart').then(m => ({ default: m.FinanceCategoryBarChart })), {
  loading: () => <CardSkeleton />,
})
const FinanceSpendingByDayOfWeek = nextDynamic(() => import('@/components/finance/charts/FinanceSpendingByDayOfWeek').then(m => ({ default: m.FinanceSpendingByDayOfWeek })), {
  loading: () => <CardSkeleton />,
})
const FinanceCategoryTrends = nextDynamic(() => import('@/components/finance/charts/FinanceCategoryTrends').then(m => ({ default: m.FinanceCategoryTrends })), {
  loading: () => <CardSkeleton />,
})
const FinanceYearOverYear = nextDynamic(() => import('@/components/finance/charts/FinanceYearOverYear').then(m => ({ default: m.FinanceYearOverYear })), {
  loading: () => <CardSkeleton />,
})
const FinancePaymentMethodBreakdown = nextDynamic(() => import('@/components/finance/charts/FinancePaymentMethodBreakdown').then(m => ({ default: m.FinancePaymentMethodBreakdown })), {
  loading: () => <CardSkeleton />,
})
const FinanceAverageTransactionAmount = nextDynamic(() => import('@/components/finance/charts/FinanceAverageTransactionAmount').then(m => ({ default: m.FinanceAverageTransactionAmount })), {
  loading: () => <CardSkeleton />,
})
const FinanceSpendingVelocity = nextDynamic(() => import('@/components/finance/charts/FinanceSpendingVelocity').then(m => ({ default: m.FinanceSpendingVelocity })), {
  loading: () => <CardSkeleton />,
})
const FinanceExpenseDistribution = nextDynamic(() => import('@/components/finance/charts/FinanceExpenseDistribution').then(m => ({ default: m.FinanceExpenseDistribution })), {
  loading: () => <CardSkeleton />,
})
const FinanceCashFlowCalendar = nextDynamic(() => import('@/components/finance/charts/FinanceCashFlowCalendar').then(m => ({ default: m.FinanceCashFlowCalendar })), {
  loading: () => <CardSkeleton />,
})
const FinanceCategoryForecast = nextDynamic(() => import('@/components/finance/charts/FinanceCategoryForecast').then(m => ({ default: m.FinanceCategoryForecast })), {
  loading: () => <CardSkeleton />,
})
const FinanceSpendingAlerts = nextDynamic(() => import('@/components/finance/charts/FinanceSpendingAlerts').then(m => ({ default: m.FinanceSpendingAlerts })), {
  loading: () => <CardSkeleton />,
})
const FinanceRecurringExpenses = nextDynamic(() => import('@/components/finance/charts/FinanceRecurringExpenses').then(m => ({ default: m.FinanceRecurringExpenses })), {
  loading: () => <CardSkeleton />,
})
const FinanceVerificationPanel = nextDynamic(() => import('@/components/finance/FinanceVerificationPanel').then(m => ({ default: m.FinanceVerificationPanel })), {
  loading: () => <CardSkeleton />,
})
import { subscribeToTransactions, getFinanceSettings, getTransactions } from '@/lib/financeApi'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import type { FinanceTransaction, FinanceSettings } from '@/types/finance'
import { BarChart3, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Percent, Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function FinanceAnalyticsPage() {
  const { user } = useFirestoreStore()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [financeSettings, setFinanceSettings] = useState<FinanceSettings | null>(null)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | '6months' | '12months' | 'year' | 'all' | 'custom'>('month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [showCustomDateRange, setShowCustomDateRange] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    setIsLoading(true)

    // Load finance settings
    getFinanceSettings(user.id).then(settings => {
      setFinanceSettings(settings)
    }).catch(err => {
      console.error('Error loading finance settings:', err)
    })

    // Immediately fetch fresh data on mount/navigation
    getTransactions(user.id, { limitCount: 0 }).then(txs => {
      setTransactions(txs)
      setIsLoading(false)
    }).catch(error => {
      console.error('Error fetching transactions on mount:', error)
    })

    // Then set up subscription for ongoing updates
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

    // Get latest transaction date if we should cap ranges to data
    const capToData = financeSettings?.capDateRangesToData !== false // Default to true
    let latestTransactionDate: Date | null = null
    if (capToData && transactions.length > 0) {
      transactions.forEach((tx) => {
        const txDate = parseTransactionDate(tx.date)
        if (!latestTransactionDate || txDate > latestTransactionDate) {
          latestTransactionDate = txDate
        }
      })
    }

    // Helper function to cap end date to latest transaction
    const capEndDate = (calculatedEndDate: Date): Date => {
      if (capToData && latestTransactionDate !== null && calculatedEndDate > latestTransactionDate) {
        return latestTransactionDate
      }
      return calculatedEndDate
    }

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = capEndDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59))
        break
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0)
        startDate = weekStart
        endDate = capEndDate(now)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = capEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59))
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = capEndDate(new Date(now.getFullYear(), 11, 31, 23, 59, 59))
        break
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        endDate = capEndDate(now)
        break
      case '12months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1)
        endDate = capEndDate(now)
        break
      case 'custom':
        if (customDateFrom && customDateTo) {
          startDate = new Date(customDateFrom)
          startDate.setHours(0, 0, 0, 0)
          const customEndDate = new Date(customDateTo)
          customEndDate.setHours(23, 59, 59, 999)
          endDate = capEndDate(customEndDate)
        }
        break
      case 'all':
      default:
        return transactions
    }

    if (!startDate || !endDate) return transactions

    return transactions.filter((tx) => {
      const txDate = parseTransactionDate(tx.date)
      return txDate >= startDate! && txDate <= endDate!
    })
  }, [transactions, timeRange, customDateFrom, customDateTo, financeSettings])

  // Calculate date range info for verification panel
  const dateRangeInfo = useMemo(() => {
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = null
    let label = ''

    // Get latest transaction date if we should cap ranges to data
    const capToData = financeSettings?.capDateRangesToData !== false // Default to true
    let latestTransactionDate: Date | null = null
    if (capToData && transactions.length > 0) {
      transactions.forEach((tx) => {
        const txDate = parseTransactionDate(tx.date)
        if (!latestTransactionDate || txDate > latestTransactionDate) {
          latestTransactionDate = txDate
        }
      })
    }

    // Helper function to cap end date to latest transaction
    const capEndDate = (calculatedEndDate: Date): Date => {
      if (capToData && latestTransactionDate !== null && calculatedEndDate > latestTransactionDate) {
        return latestTransactionDate
      }
      return calculatedEndDate
    }

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = capEndDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59))
        label = 'Today'
        break
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)
        startDate = weekStart
        endDate = capEndDate(now)
        label = 'This Week'
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = capEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59))
        label = 'This Month'
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = capEndDate(new Date(now.getFullYear(), 11, 31, 23, 59, 59))
        label = 'This Year'
        break
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        endDate = capEndDate(now)
        label = 'Last 6 Months'
        break
      case '12months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1)
        endDate = capEndDate(now)
        label = 'Last 12 Months'
        break
      case 'custom':
        if (customDateFrom && customDateTo) {
          startDate = new Date(customDateFrom)
          startDate.setHours(0, 0, 0, 0)
          const customEndDate = new Date(customDateTo)
          customEndDate.setHours(23, 59, 59, 999)
          endDate = capEndDate(customEndDate)
          label = 'Custom Range'
        } else {
          label = 'All Time'
        }
        break
      case 'all':
      default:
        label = 'All Time'
        break
    }

    return { start: startDate, end: endDate, label }
  }, [timeRange, customDateFrom, customDateTo, financeSettings, transactions])

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
                    {isLoading && transactions.length === 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Loading…</span>
                    )}
                  </div>
                </div>

                {/* Loading Screen */}
                {isLoading && transactions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin" />
                      <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
                      Loading analytics data...
                    </p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Processing your transaction history
                    </p>
                  </div>
                )}

                {/* Time Period Filter */}
                {!isLoading || transactions.length > 0 ? (
                <>
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

                {/* Verification Panel */}
                <FinanceVerificationPanel
                  transactions={transactions}
                  filteredTransactions={filteredTransactions}
                  dateRange={dateRangeInfo}
                />

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
                </>
                ) : null}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}


