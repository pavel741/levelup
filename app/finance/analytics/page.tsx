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
const BudgetVsActualDashboard = nextDynamic(() => import('@/components/finance/charts/BudgetVsActualDashboard').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const FinancialHealthScore = nextDynamic(() => import('@/components/finance/charts/FinancialHealthScore').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const MerchantAnalysis = nextDynamic(() => import('@/components/finance/charts/MerchantAnalysis').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const SubscriptionCostAnalysis = nextDynamic(() => import('@/components/finance/charts/SubscriptionCostAnalysis').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const SpendingPersonality = nextDynamic(() => import('@/components/finance/charts/SpendingPersonality').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const SpendingHeatmap = nextDynamic(() => import('@/components/finance/charts/SpendingHeatmap').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const MoneyMilestones = nextDynamic(() => import('@/components/finance/charts/MoneyMilestones').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const SavingsStreaks = nextDynamic(() => import('@/components/finance/charts/SavingsStreaks').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const BudgetChallenges = nextDynamic(() => import('@/components/finance/BudgetChallenges').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const DuplicateDetection = nextDynamic(() => import('@/components/finance/DuplicateDetection').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const SpendingMoodBoard = nextDynamic(() => import('@/components/finance/charts/SpendingMoodBoard').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const FinancialTimeline = nextDynamic(() => import('@/components/finance/charts/FinancialTimeline').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const CategoryEmojiMap = nextDynamic(() => import('@/components/finance/charts/CategoryEmojiMap').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const SpendingStory = nextDynamic(() => import('@/components/finance/charts/SpendingStory').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const PDFExport = nextDynamic(() => import('@/components/finance/PDFExport').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const MultiCurrencySupport = nextDynamic(() => import('@/components/finance/MultiCurrencySupport').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
const EnhancedSavingsGoals = nextDynamic(() => import('@/components/finance/EnhancedSavingsGoals').then(m => ({ default: m.default })), {
  loading: () => <CardSkeleton />,
})
import { subscribeToTransactions, getFinanceSettings, getAllTransactionsForSummary, subscribeToRecurringTransactions, getCategories } from '@/lib/financeApi'
import { startOfMonth, endOfMonth } from 'date-fns'
import { subscribeToSavingsGoals } from '@/lib/savingsGoalsApi'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import type { FinanceTransaction, FinanceSettings, FinanceRecurringTransaction, BudgetCategoryLimit, FinanceCategories } from '@/types/finance'
import { BarChart3, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Percent, Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function FinanceAnalyticsPage() {
  const { user } = useFirestoreStore()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [financeSettings, setFinanceSettings] = useState<FinanceSettings | null>(null)
  const [budgetGoals, setBudgetGoals] = useState<BudgetCategoryLimit[]>([])
  const [recurringTransactions, setRecurringTransactions] = useState<FinanceRecurringTransaction[]>([])
  const [savingsGoals, setSavingsGoals] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | '6months' | '12months' | 'year' | 'all' | 'custom'>('month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [showCustomDateRange, setShowCustomDateRange] = useState(false)
  
  // Stable reference date to prevent flickering in BudgetVsActualDashboard
  const referenceDate = useMemo(() => new Date(), [])

  useEffect(() => {
    if (!user?.id) return

    setIsLoading(true)

    // Load finance settings
    getFinanceSettings(user.id).then(settings => {
      setFinanceSettings(settings)
    }).catch(err => {
      console.error('Error loading finance settings:', err)
    })

    // Load budget goals from categories
    getCategories(user.id).then((categories: FinanceCategories | null) => {
      if (categories && categories.expense) {
        const categoryLimits: BudgetCategoryLimit[] = Object.entries(categories.expense)
          .filter(([_category, data]: [string, any]) => data?.monthlyLimit || data?.limit)
          .map(([category, data]: [string, any]) => ({
            category,
            monthlyLimit: data.monthlyLimit || data.limit || 0,
            weeklyLimit: data.weeklyLimit,
            alertThreshold: data.alertThreshold || 80,
          }))
        // Only update if the content actually changed (prevent unnecessary re-renders)
        setBudgetGoals(prev => {
          const prevKey = prev.map(g => `${g.category}:${g.monthlyLimit}:${g.weeklyLimit}`).sort().join('|')
          const newKey = categoryLimits.map(g => `${g.category}:${g.monthlyLimit}:${g.weeklyLimit}`).sort().join('|')
          if (prevKey === newKey) return prev
          return categoryLimits
        })
      }
    }).catch(err => {
      console.error('Error loading budget goals:', err)
    })

    // Subscribe to recurring transactions
    let unsubscribeRecurring: (() => void) | null = null
    unsubscribeRecurring = subscribeToRecurringTransactions(
      user.id,
      (recurring) => {
        setRecurringTransactions(recurring)
      }
    )

    // Subscribe to savings goals
    const unsubscribeGoals = subscribeToSavingsGoals(user.id, (goals) => {
      setSavingsGoals(goals)
    })

    // Immediately fetch ALL transactions for analytics (no limit)
    getAllTransactionsForSummary(user.id).then(txs => {
      setTransactions(txs)
      setIsLoading(false)
      console.log(`✅ Analytics: Loaded ${txs.length} transactions for analytics`)
      
      // Calculate total amount for verification
      const totalAmount = txs.reduce((sum, tx) => {
        const amount = Math.abs(Number(tx.amount) || 0)
        return sum + amount
      }, 0)
      console.log(`💰 Analytics: Total transaction amount sum: ${totalAmount.toFixed(2)}`)
    }).catch(error => {
      console.error('Error fetching transactions on mount:', error)
      setIsLoading(false)
    })

    // Then set up subscription for ongoing updates (load recent transactions)
    // Note: We keep the initial full load separate from the subscription
    // to ensure we have all historical data for analytics
    // For analytics, we want ALL transactions, so we use a high limit or 0 for unlimited
    const unsubscribe = subscribeToTransactions(
      user.id,
      (txs) => {
        // Merge new transactions into existing set
        setTransactions(prev => {
          // Create a map of existing transactions by ID for quick lookup
          const existingMap = new Map(prev.map(tx => [tx.id, tx]))
          let hasChanges = false
          
          // Add/update transactions from subscription
          txs.forEach(tx => {
            const existing = existingMap.get(tx.id)
            // Simple comparison: check if transaction exists and if key fields changed
            if (!existing || 
                existing.amount !== tx.amount || 
                existing.category !== tx.category ||
                existing.date !== tx.date ||
                existing.type !== tx.type) {
              existingMap.set(tx.id, tx)
              hasChanges = true
            }
          })
          
          // Only update state if there are actual changes
          if (!hasChanges && existingMap.size === prev.length) {
            return prev
          }
          
          // Convert back to array and sort by date descending
          const newTransactions = Array.from(existingMap.values()).sort((a, b) => {
            const dateA = parseTransactionDate(a.date).getTime()
            const dateB = parseTransactionDate(b.date).getTime()
            return dateB - dateA
          })
          
          // Quick check: if same length and same IDs in same order, likely no change
          if (newTransactions.length === prev.length && 
              newTransactions.every((tx, idx) => tx.id === prev[idx]?.id)) {
            // Still check if amounts changed (most important for budget calculations)
            const amountsChanged = newTransactions.some((tx, idx) => {
              const prevTx = prev[idx]
              return !prevTx || tx.amount !== prevTx.amount || tx.category !== prevTx.category
            })
            if (!amountsChanged) {
              return prev
            }
          }
          
          return newTransactions
        })
        setIsLoading(false)
        // Log how many transactions are loaded
        if (txs.length > 0) {
          console.log(`📊 Analytics: Subscription updated with ${txs.length} transactions`)
        }
      },
      { limitCount: 0 } // Load ALL transactions for analytics (no limit)
    )

    return () => {
      unsubscribe()
      if (unsubscribeRecurring) {
        unsubscribeRecurring()
      }
      if (unsubscribeGoals) {
        unsubscribeGoals()
      }
    }
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

                {/* New Analytics Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Financial Health Score */}
                  <FinancialHealthScore
                    transactions={filteredTransactions}
                    periodMonths={
                      timeRange === 'month' ? 3 :
                      timeRange === '6months' ? 6 :
                      timeRange === '12months' || timeRange === 'year' ? 12 :
                      timeRange === 'all' ? 24 : 6
                    }
                  />

                  {/* Budget vs Actual */}
                  <BudgetVsActualDashboard
                    transactions={filteredTransactions}
                    budgetGoals={budgetGoals}
                    period="monthly"
                    referenceDate={referenceDate}
                  />
                </div>

                {/* Spending Personality & Milestones */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Spending Personality */}
                  <SpendingPersonality transactions={filteredTransactions} />

                  {/* Money Milestones */}
                  <MoneyMilestones
                    transactions={filteredTransactions}
                    periodMonths={
                      timeRange === 'month' ? 1 :
                      timeRange === '6months' ? 6 :
                      timeRange === '12months' || timeRange === 'year' ? 12 :
                      timeRange === 'all' ? 24 : 3
                    }
                  />
                </div>

                {/* Gamification Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Savings Streaks */}
                  <SavingsStreaks transactions={filteredTransactions} />

                  {/* Budget Challenges */}
                  <BudgetChallenges transactions={filteredTransactions} />
                </div>

                {/* Spending Heatmap */}
                <div className="mb-6">
                  <SpendingHeatmap
                    transactions={filteredTransactions}
                    months={
                      timeRange === 'today' || timeRange === 'week' ? 1 :
                      timeRange === 'month' ? 3 :
                      timeRange === 'year' ? 6 :
                      timeRange === '6months' ? 3 :
                      timeRange === '12months' ? 6 :
                      timeRange === 'custom' ? 3 :
                      3
                    }
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Merchant Analysis */}
                  <MerchantAnalysis
                    transactions={filteredTransactions}
                    topN={10}
                    months={
                      timeRange === 'month' ? 3 :
                      timeRange === '6months' ? 6 :
                      timeRange === '12months' || timeRange === 'year' ? 12 :
                      timeRange === 'all' ? 24 : 6
                    }
                  />

                  {/* Subscription Cost Analysis */}
                  <SubscriptionCostAnalysis
                    recurringTransactions={recurringTransactions}
                    transactions={filteredTransactions}
                    months={12}
                  />
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

                {/* Duplicate Detection */}
                <div className="mb-6">
                  <DuplicateDetection transactions={filteredTransactions} />
                </div>

                {/* Visual & Fun Section */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Visual & Fun
                  </h2>
                  
                  {/* Spending Mood Board */}
                  <div className="mb-6">
                    <SpendingMoodBoard transactions={filteredTransactions} />
                  </div>

                  {/* Category Emoji Map */}
                  <div className="mb-6">
                    <CategoryEmojiMap transactions={filteredTransactions} />
                  </div>

                  {/* Spending Story */}
                  <div className="mb-6">
                    <SpendingStory 
                      transactions={filteredTransactions}
                      periodStart={
                        timeRange === 'month' ? startOfMonth(new Date()) :
                        timeRange === 'year' ? new Date(new Date().getFullYear(), 0, 1) :
                        dateRangeInfo.start || startOfMonth(new Date())
                      }
                      periodEnd={
                        timeRange === 'month' ? endOfMonth(new Date()) :
                        timeRange === 'year' ? new Date(new Date().getFullYear(), 11, 31) :
                        dateRangeInfo.end || endOfMonth(new Date())
                      }
                    />
                  </div>

                  {/* Financial Timeline */}
                  <div className="mb-6">
                    <FinancialTimeline transactions={filteredTransactions} />
                  </div>
                </div>

                {/* Practical & Useful Section */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Practical & Useful
                  </h2>
                  
                  {/* PDF Export */}
                  <div className="mb-6">
                    <PDFExport 
                      transactions={filteredTransactions}
                      periodStart={
                        timeRange === 'month' ? startOfMonth(new Date()) :
                        timeRange === 'year' ? new Date(new Date().getFullYear(), 0, 1) :
                        dateRangeInfo.start || startOfMonth(new Date())
                      }
                      periodEnd={
                        timeRange === 'month' ? endOfMonth(new Date()) :
                        timeRange === 'year' ? new Date(new Date().getFullYear(), 11, 31) :
                        dateRangeInfo.end || endOfMonth(new Date())
                      }
                      periodLabel={dateRangeInfo.label}
                    />
                  </div>

                  {/* Multi-Currency Support */}
                  <div className="mb-6">
                    <MultiCurrencySupport 
                      transactions={filteredTransactions}
                      baseCurrency="EUR"
                    />
                  </div>

                  {/* Enhanced Savings Goals Visualization */}
                  {savingsGoals.length > 0 && (
                    <div className="mb-6">
                      <EnhancedSavingsGoals goals={savingsGoals} />
                    </div>
                  )}
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


