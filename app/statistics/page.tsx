'use client'

import { useEffect, useState, useMemo } from 'react'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { getWorkoutStatistics, getFinanceStatistics, getHabitsStatistics, getXPStatistics } from '@/lib/statisticsApi'
import { format } from 'date-fns'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BarChart3, Target, Dumbbell, Wallet, Award, Download, Trophy, Flame } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { CardSkeleton } from '@/components/ui/Skeleton'

export const dynamic = 'force-dynamic'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function StatisticsPage() {
  const { user } = useFirestoreStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [workoutStats, setWorkoutStats] = useState<any>(null)
  const [financeStats, setFinanceStats] = useState<any>(null)
  const [habitsStats, setHabitsStats] = useState<any>(null)
  const [xpStats, setXpStats] = useState<any>(null)
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(true)
  const [isLoadingFinance, setIsLoadingFinance] = useState(true)
  const [isLoadingHabits, setIsLoadingHabits] = useState(true)
  const [isLoadingXP, setIsLoadingXP] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months' | '6months' | 'year' | 'all'>('month')
  const [comparePeriod, setComparePeriod] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    // Load aggregated statistics from server
    const loadWorkoutStats = async () => {
      try {
        setIsLoadingWorkouts(true)
        const stats = await getWorkoutStatistics(user.id, { timeRange, comparePeriod })
        setWorkoutStats(stats)
      } catch (error) {
        console.error('Error loading workout statistics:', error)
      } finally {
        setIsLoadingWorkouts(false)
      }
    }

    const loadFinanceStats = async () => {
      try {
        setIsLoadingFinance(true)
        const stats = await getFinanceStatistics(user.id, { timeRange, comparePeriod })
        setFinanceStats(stats)
      } catch (error) {
        console.error('Error loading finance statistics:', error)
      } finally {
        setIsLoadingFinance(false)
      }
    }

    const loadHabitsStats = async () => {
      try {
        setIsLoadingHabits(true)
        const stats = await getHabitsStatistics(user.id, { timeRange, comparePeriod })
        setHabitsStats(stats)
      } catch (error) {
        console.error('Error loading habits statistics:', error)
      } finally {
        setIsLoadingHabits(false)
      }
    }

    const loadXPStats = async () => {
      try {
        setIsLoadingXP(true)
        const stats = await getXPStatistics(user.id, { timeRange, comparePeriod })
        setXpStats(stats)
      } catch (error) {
        console.error('Error loading XP statistics:', error)
      } finally {
        setIsLoadingXP(false)
      }
    }

    // Load all in parallel
    loadWorkoutStats()
    loadFinanceStats()
    loadHabitsStats()
    loadXPStats()
  }, [user?.id, timeRange, comparePeriod])

  // Habits Statistics - now loaded from server-side aggregation
  const habitsStatsData = habitsStats || {
    currentCompletions: [],
    currentTotal: 0,
    currentAverage: 0,
    currentBest: 0,
    previousTotal: 0,
    previousAverage: 0,
    habitPerformance: [],
    change: 0,
  }

  // Workout Statistics - now loaded from server-side aggregation
  const workoutStatsData = workoutStats || {
    currentCount: 0,
    currentVolume: 0,
    currentDuration: 0,
    currentAvgVolume: 0,
    workoutChart: [],
    previousCount: 0,
    previousVolume: 0,
    previousDuration: 0,
    changeCount: 0,
    changeVolume: 0
  }

  // Finance Statistics - now loaded from server-side aggregation
  const financeStatsData = financeStats || {
    income: 0,
    expenses: 0,
    balance: 0,
    categoryChart: [],
    financeChart: [],
    previousIncome: 0,
    previousExpenses: 0,
    changeIncome: 0,
    changeExpenses: 0
  }

  // XP Statistics - now loaded from server-side aggregation
  const xpStatsData = xpStats || {
    currentXP: 0,
    currentAvg: 0,
    xpChartData: [],
    previousXP: 0,
    previousAvg: 0,
    change: 0,
  }

  // Personal Bests
  const personalBests = useMemo(() => {
    const allTimeStats = {
      longestStreak: user?.longestStreak || user?.streak || 0,
      currentStreak: user?.streak || 0,
      totalXP: user?.xp || 0,
      level: user?.level || 1,
      totalHabits: 0, // Not available from server-side stats
      activeHabits: 0, // Not available from server-side stats
      totalWorkouts: workoutStatsData.currentCount || 0,
      totalVolume: workoutStatsData.currentVolume || 0,
      bestWorkoutVolume: Math.max(...(workoutStatsData.workoutChart || []).map((d: any) => d.volume || 0), 0),
      totalIncome: financeStatsData.income || 0,
      totalExpenses: financeStatsData.expenses || 0,
    }
    
    return allTimeStats
  }, [user, workoutStatsData, financeStatsData])

  // Export to CSV
  const exportToCSV = () => {
    const csvData = [
      ['Statistic', 'Value'],
      ['Total XP', personalBests.totalXP],
      ['Current Level', personalBests.level],
      ['Current Streak', personalBests.currentStreak],
      ['Longest Streak', personalBests.longestStreak],
      ['Total Habits', personalBests.totalHabits],
      ['Active Habits', personalBests.activeHabits],
      ['Total Workouts', personalBests.totalWorkouts],
      ['Total Workout Volume', personalBests.totalVolume],
      ['Best Workout Volume', personalBests.bestWorkoutVolume],
      ['Total Income', personalBests.totalIncome],
      ['Total Expenses', personalBests.totalExpenses],
    ]
    
    const csv = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statistics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }


  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Statistics Dashboard
                      </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Track your progress across all areas of your life
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={exportToCSV}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Time Range Selector */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                  <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                    {(['week', 'month', '3months', '6months', 'year', 'all'] as const).map((range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                          timeRange === range
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {range === '3months' ? '3M' : range === '6months' ? '6M' : range.charAt(0).toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={comparePeriod}
                      onChange={(e) => setComparePeriod(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Compare with previous period</span>
                  </label>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Habits */}
                  {isLoadingHabits ? (
                    <CardSkeleton />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        {comparePeriod && habitsStatsData.previousAverage > 0 && (
                          <span className={`text-xs font-semibold ${habitsStatsData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {habitsStatsData.change >= 0 ? '+' : ''}{habitsStatsData.change.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Habits Completed</h3>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {habitsStatsData.currentAverage.toFixed(1)}/day
                      </div>
                      {comparePeriod && habitsStatsData.previousAverage > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Previous: {habitsStatsData.previousAverage.toFixed(1)}/day
                        </div>
                      )}
                    </div>
                  )}

                  {/* Workouts */}
                  {isLoadingWorkouts ? (
                    <CardSkeleton />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Dumbbell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        {comparePeriod && workoutStatsData.previousCount > 0 && (
                          <span className={`text-xs font-semibold ${workoutStatsData.changeCount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {workoutStatsData.changeCount >= 0 ? '+' : ''}{workoutStatsData.changeCount.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Workouts</h3>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {workoutStatsData.currentCount}
                      </div>
                      {comparePeriod && workoutStatsData.previousCount > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Previous: {workoutStatsData.previousCount}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Finance */}
                  {isLoadingFinance ? (
                    <CardSkeleton />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                        {comparePeriod && financeStatsData.previousExpenses > 0 && (
                          <span className={`text-xs font-semibold ${financeStatsData.changeExpenses <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {financeStatsData.changeExpenses >= 0 ? '+' : ''}{financeStatsData.changeExpenses.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Expenses</h3>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(financeStatsData.expenses)}
                      </div>
                      {comparePeriod && financeStatsData.previousExpenses > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Previous: {formatCurrency(financeStatsData.previousExpenses)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* XP */}
                  {isLoadingXP ? (
                    <CardSkeleton />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        {comparePeriod && xpStatsData.previousAvg > 0 && (
                          <span className={`text-xs font-semibold ${xpStatsData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {xpStatsData.change >= 0 ? '+' : ''}{xpStatsData.change.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">XP Earned</h3>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {xpStatsData.currentXP}
                      </div>
                      {comparePeriod && xpStatsData.previousAvg > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Previous: {xpStatsData.previousXP}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Habits Chart */}
                  {isLoadingHabits ? (
                    <CardSkeleton />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Habits Completion Trend
                      </h3>
                      {habitsStatsData.currentCompletions.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={habitsStatsData.currentCompletions}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip />
                            <Line type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} name="Completed" />
                            <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="Total" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                          No data available
                        </div>
                      )}
                    </div>
                  )}

                  {/* Workouts Chart */}
                  {isLoadingWorkouts ? (
                    <CardSkeleton />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Workout Frequency
                      </h3>
                      {workoutStatsData.workoutChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={workoutStatsData.workoutChart}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8b5cf6" name="Workouts" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                          No workout data available
                        </div>
                      )}
                    </div>
                  )}

                  {/* Finance Chart */}
                  {isLoadingFinance ? (
                    <CardSkeleton />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Finance Overview
                      </h3>
                      {financeStatsData.financeChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={financeStatsData.financeChart}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                            <Bar dataKey="income" fill="#10b981" name="Income" />
                            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                          No finance data available
                        </div>
                      )}
                    </div>
                  )}

                  {/* XP Chart */}
                  {isLoadingXP ? (
                    <CardSkeleton />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        XP Earned Over Time
                      </h3>
                      {xpStatsData.xpChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={xpStatsData.xpChartData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip />
                            <Line type="monotone" dataKey="xp" stroke="#f59e0b" strokeWidth={2} name="XP" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                          No XP data available
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Category Breakdown */}
                {isLoadingFinance ? (
                  <CardSkeleton />
                ) : financeStatsData.categoryChart.length > 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Expense Categories
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={financeStatsData.categoryChart}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {financeStatsData.categoryChart.map((_entry: { name: string; value: number }, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}

                {/* Personal Bests */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    Personal Bests & Records
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <Flame className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{personalBests.longestStreak} days</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <Award className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total XP</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{personalBests.totalXP.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Active Habits</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{personalBests.activeHabits}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <Dumbbell className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Workouts</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{personalBests.totalWorkouts}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <Dumbbell className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Best Workout Volume</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{personalBests.bestWorkoutVolume.toLocaleString()} kg</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <Wallet className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Income</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(personalBests.totalIncome)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

