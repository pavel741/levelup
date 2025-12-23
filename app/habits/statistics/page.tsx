'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFirestoreStore } from '@/store/useFirestoreStore'
export const dynamic = 'force-dynamic'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns'
import { TrendingUp, Calendar, Award, Target, ArrowUp, ArrowDown, ArrowLeft, BarChart3 } from 'lucide-react'
import { useTheme } from '@/components/common/ThemeProvider'

export default function HabitsStatisticsPage() {
  const { habits, user, dailyStats } = useFirestoreStore()
  const { theme } = useTheme()
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')
  const [sortBy, setSortBy] = useState<'completionRate' | 'totalCompletions' | 'name'>('completionRate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showAllHabits, setShowAllHabits] = useState(false)
  const [xpViewMode, setXpViewMode] = useState<'daily' | 'cumulative'>('daily')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date()
    let startDate: Date
    let endDate = now

    switch (timeRange) {
      case 'week':
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      default:
        startDate = user?.joinedAt || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get all completed dates from habits
    const allCompletedDates = habits.flatMap((h) => h.completedDates)
    const dateCounts: Record<string, number> = {}
    allCompletedDates.forEach((date) => {
      dateCounts[date] = (dateCounts[date] || 0) + 1
    })

    // Calculate weekly/monthly totals
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const weeklyData = days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      return {
        date: format(day, 'MMM dd'),
        fullDate: dateStr,
        habitsCompleted: dateCounts[dateStr] || 0,
      }
    })

    // Calculate streak helper function
    const calculateStreak = (completedDates: string[]): number => {
      if (completedDates.length === 0) return 0

      const sorted = [...completedDates].sort().reverse()
      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < sorted.length; i++) {
        const date = parseISO(sorted[i])
        date.setHours(0, 0, 0, 0)
        const expectedDate = new Date(today)
        expectedDate.setDate(expectedDate.getDate() - i)

        if (format(date, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
          streak++
        } else {
          break
        }
      }

      return streak
    }

    // Best performing habits - calculate for all habits
    const allHabitPerformance = habits
      .map((habit) => {
        const completedInRange = habit.completedDates.filter((date) => {
          const dateObj = parseISO(date)
          return dateObj >= startDate && dateObj <= endDate
        }).length
        const totalDays = days.length
        const completionRate = totalDays > 0 ? (completedInRange / totalDays) * 100 : 0
        const totalCompletions = habit.completedDates.length
        const possibleCompletions = totalDays
        const streak = calculateStreak(habit.completedDates)
        
        return {
          ...habit,
          completedInRange,
          completionRate,
          totalCompletions,
          possibleCompletions,
          streak,
        }
      })
      .filter((h) => h.totalCompletions > 0) // Only show habits with at least one completion
    
    // Sort habits
    const sortedHabits = [...allHabitPerformance].sort((a, b) => {
      let comparison = 0
      if (sortBy === 'completionRate') {
        comparison = a.completionRate - b.completionRate
      } else if (sortBy === 'totalCompletions') {
        comparison = a.totalCompletions - b.totalCompletions
      } else {
        comparison = a.name.localeCompare(b.name)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    const habitPerformance = showAllHabits ? sortedHabits : sortedHabits.slice(0, 5)

    // XP over time - calculate cumulative XP for better visualization
    let cumulativeXP = 0
    const baseXP = user?.xp ? user.xp - dailyStats.reduce((sum, s) => sum + (s.xpEarned || 0), 0) : 0
    
    const xpData = weeklyData.map((day) => {
      const dayStats = dailyStats.find((s) => s.date === day.fullDate)
      const dailyXP = dayStats?.xpEarned || 0
      cumulativeXP += dailyXP
      return {
        date: day.date,
        fullDate: day.fullDate,
        xp: dailyXP,
        cumulativeXP: baseXP + cumulativeXP,
      }
    })

    // Calendar heatmap data - last year (365 days)
    const oneYearAgo = subDays(now, 364)
    const yearDays = eachDayOfInterval({ start: oneYearAgo, end: now })
    const heatmapData = yearDays.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const count = dateCounts[dateStr] || 0
      return {
        date: day,
        dateStr,
        count,
        level: count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count >= 3 ? 3 : 0,
      }
    })

    // Summary stats
    const totalHabitsCompleted = weeklyData.reduce((sum, day) => sum + day.habitsCompleted, 0)
    const averagePerDay = weeklyData.length > 0 ? totalHabitsCompleted / weeklyData.length : 0
    const bestDay = weeklyData.reduce((best, day) => (day.habitsCompleted > best.habitsCompleted ? day : best), weeklyData[0] || { date: '', habitsCompleted: 0 })

    return {
      weeklyData,
      habitPerformance,
      allHabitPerformance,
      xpData,
      heatmapData,
      totalHabitsCompleted,
      averagePerDay,
      bestDay,
      startDate,
      endDate,
    }
  }, [habits, timeRange, user, dailyStats, sortBy, sortOrder, showAllHabits])

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-gray-200 dark:bg-gray-700'
    if (count === 1) return 'bg-green-200 dark:bg-green-800'
    if (count === 2) return 'bg-green-400 dark:bg-green-600'
    if (count === 3) return 'bg-green-600 dark:bg-green-400'
    return 'bg-green-800 dark:bg-green-200' // 4+
  }

  // Group heatmap data by week and day for GitHub-style layout
  const heatmapGrid = useMemo(() => {
    const grid: Array<Array<{ date: Date; count: number; dateStr: string } | null>> = []
    const oneYearAgo = subDays(new Date(), 364)
    const yearStart = new Date(oneYearAgo)
    yearStart.setDate(yearStart.getDate() - yearStart.getDay()) // Start from Sunday
    
    // Initialize 53 weeks x 7 days grid
    for (let week = 0; week < 53; week++) {
      grid[week] = []
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(yearStart)
        currentDate.setDate(currentDate.getDate() + week * 7 + day)
        
        // Only include dates within the last year
        if (currentDate >= oneYearAgo && currentDate <= new Date()) {
          const dateStr = format(currentDate, 'yyyy-MM-dd')
          const dayData = stats.heatmapData.find((d) => d.dateStr === dateStr)
          grid[week][day] = dayData
            ? { date: currentDate, count: dayData.count, dateStr }
            : { date: currentDate, count: 0, dateStr }
        } else {
          grid[week][day] = null
        }
      }
    }
    
    return grid
  }, [stats.heatmapData])

  // Calculate month positions for labels
  const monthLabels = useMemo(() => {
    const labels: Array<{ month: string; week: number }> = []
    const oneYearAgo = subDays(new Date(), 364)
    
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(new Date().getFullYear(), i, 1)
      if (monthDate >= oneYearAgo) {
        const yearStart = new Date(oneYearAgo)
        yearStart.setDate(yearStart.getDate() - yearStart.getDay())
        const daysSinceStart = Math.floor((monthDate.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000))
        const weekNumber = Math.floor(daysSinceStart / 7)
        labels.push({ month: format(monthDate, 'MMM'), week: weekNumber })
      }
    }
    
    return labels
  }, [])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => router.push('/habits')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title="Back to Habits"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
                        Statistics & Analytics
                      </h1>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Track your progress and see your growth</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTimeRange('week')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                        timeRange === 'week'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setTimeRange('month')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                        timeRange === 'month'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => setTimeRange('all')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                        timeRange === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      All Time
                    </button>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Completed</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.totalHabitsCompleted}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">habits this {timeRange}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Average</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.averagePerDay.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">habits per day</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Best Day</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.bestDay.habitsCompleted}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stats.bestDay.date || 'No data'}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{user?.streak || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">days 🔥</p>
                  </div>
                </div>

                {/* Calendar Heatmap - GitHub Style */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">Activity Heatmap (Last Year)</h2>
                  <div className="flex flex-col gap-2 overflow-x-auto">
                    {/* Month labels */}
                    <div className="flex items-center gap-1 ml-6 relative min-w-[742px]" style={{ height: '15px' }}>
                      {monthLabels.map((label, idx) => {
                        return (
                          <div
                            key={idx}
                            className="text-xs text-gray-500 dark:text-gray-400 absolute"
                            style={{ left: `${label.week * 14}px` }}
                          >
                            {label.month}
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Heatmap grid */}
                    <div className="flex gap-2 min-w-[742px]">
                      {/* Day labels */}
                      <div className="flex flex-col gap-1 pt-1 flex-shrink-0">
                        {['Sun', '', 'Mon', '', 'Tue', '', 'Wed', '', 'Thu', '', 'Fri', '', 'Sat'].map((day, idx) => (
                          <div key={idx} className="text-xs text-gray-500 dark:text-gray-400 h-3 leading-3 w-6 text-right">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Heatmap squares */}
                      <div className="flex-1 overflow-x-auto">
                        <div className="inline-flex gap-1">
                          {Array.from({ length: 53 }, (_, weekIdx) => (
                            <div key={weekIdx} className="flex flex-col gap-1">
                              {Array.from({ length: 7 }, (_, dayIdx) => {
                                const dayData = heatmapGrid[weekIdx]?.[dayIdx]
                                if (!dayData) {
                                  return <div key={dayIdx} className="w-3 h-3"></div>
                                }
                                
                                return (
                                  <div
                                    key={dayIdx}
                                    className={`w-3 h-3 rounded-sm transition-all cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 ${getHeatmapColor(dayData.count)}`}
                                    title={`${dayData.count} ${dayData.count === 1 ? 'habit' : 'habits'} completed on ${format(dayData.date, 'MMM dd, yyyy')}`}
                                  />
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex items-center gap-2 ml-6 mt-2 flex-wrap">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Less</span>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" title="0 habits"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800" title="1 habit"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600" title="2 habits"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-400" title="3 habits"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-800 dark:bg-green-200" title="4+ habits"></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">More</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Habit Completion Trends */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Habit Completion Trends</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.weeklyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#4B5563' : '#E5E7EB'} />
                        <XAxis 
                          dataKey="date" 
                          stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                          fontSize={12}
                          tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                        />
                        <YAxis 
                          stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                          fontSize={12}
                          tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
                            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                            borderRadius: '8px',
                            color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                          labelStyle={{
                            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            fontWeight: 'bold',
                            marginBottom: '4px',
                          }}
                          itemStyle={{
                            color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
                          }}
                          formatter={(value: number | undefined) => [`${value ?? 0} habits`, 'Completed']}
                          labelFormatter={(label) => {
                            const fullDate = stats.weeklyData.find(d => d.date === label)?.fullDate
                            return fullDate ? format(parseISO(fullDate), 'MMM dd, yyyy') : label
                          }}
                        />
                        <Bar 
                          dataKey="habitsCompleted" 
                          fill="#3b82f6" 
                          radius={[8, 8, 0, 0]}
                          animationDuration={750}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* XP Earned Over Time */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">XP Earned Over Time</h2>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">View:</span>
                        <button
                          onClick={() => setXpViewMode('daily')}
                          className={`px-3 py-1 rounded-lg transition-colors text-xs font-medium ${
                            xpViewMode === 'daily'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          Daily
                        </button>
                        <button
                          onClick={() => setXpViewMode('cumulative')}
                          className={`px-3 py-1 rounded-lg transition-colors text-xs font-medium ${
                            xpViewMode === 'cumulative'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          Cumulative
                        </button>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart 
                        data={stats.xpData}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#4B5563' : '#E5E7EB'} />
                        <XAxis 
                          dataKey="date" 
                          stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                          fontSize={12}
                          tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                        />
                        <YAxis 
                          stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                          fontSize={12}
                          tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                          label={{ 
                            value: 'XP', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
                            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                            borderRadius: '8px',
                            color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                          labelStyle={{
                            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            fontWeight: 'bold',
                            marginBottom: '4px',
                          }}
                          itemStyle={{
                            color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
                          }}
                          formatter={(value: number | undefined, _name?: string) => {
                            const val = value ?? 0
                            if (xpViewMode === 'daily') {
                              return [`${val} XP`, 'Daily XP']
                            } else {
                              return [`${val} XP`, 'Total XP']
                            }
                          }}
                          labelFormatter={(label) => {
                            const fullDate = stats.xpData.find(d => d.date === label)?.fullDate
                            return fullDate ? format(parseISO(fullDate), 'MMM dd, yyyy') : label
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey={xpViewMode === 'daily' ? 'xp' : 'cumulativeXP'} 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          dot={{ 
                            fill: '#8b5cf6', 
                            r: xpViewMode === 'daily' ? 5 : 0,
                            strokeWidth: 2,
                            stroke: theme === 'dark' ? '#1F2937' : '#FFFFFF'
                          }}
                          activeDot={{ 
                            r: 7,
                            fill: '#8b5cf6',
                            stroke: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                            strokeWidth: 2
                          }}
                          animationDuration={750}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span>{xpViewMode === 'daily' ? 'Daily XP Earned' : 'Cumulative XP'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {xpViewMode === 'daily' 
                            ? `Total: ${stats.xpData.reduce((sum, d) => sum + d.xp, 0)} XP`
                            : `Current: ${stats.xpData[stats.xpData.length - 1]?.cumulativeXP || 0} XP`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best Performing Habits */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Best Performing Habits</h2>
                    {stats.allHabitPerformance.length > 5 && (
                      <button
                        onClick={() => setShowAllHabits(!showAllHabits)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium self-start sm:self-auto"
                      >
                        {showAllHabits ? 'Show Top 5' : `Show All (${stats.allHabitPerformance.length})`}
                      </button>
                    )}
                  </div>

                  {/* Sort Controls */}
                  {stats.habitPerformance.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-full sm:w-auto">Sort by:</span>
                      <button
                        onClick={() => {
                          if (sortBy === 'completionRate') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy('completionRate')
                            setSortOrder('desc')
                          }
                        }}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          sortBy === 'completionRate'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Completion Rate
                        {sortBy === 'completionRate' && (
                          sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (sortBy === 'totalCompletions') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy('totalCompletions')
                            setSortOrder('desc')
                          }
                        }}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          sortBy === 'totalCompletions'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Total Completions
                        {sortBy === 'totalCompletions' && (
                          sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (sortBy === 'name') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy('name')
                            setSortOrder('asc')
                          }
                        }}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          sortBy === 'name'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Name
                        {sortBy === 'name' && (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {stats.habitPerformance.length > 0 ? (
                    <div className="space-y-4">
                      {stats.habitPerformance.map((habit) => (
                        <div key={habit.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`${habit.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0`}>
                              {habit.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white truncate">{habit.name}</span>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                  <div className="text-right">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{habit.completionRate.toFixed(1)}%</span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">completion</p>
                                  </div>
                                  <div className="text-right sm:hidden">
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">{habit.completedInRange}</div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">this {timeRange}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                                <div
                                  className={`h-2.5 rounded-full transition-all duration-300 ${
                                    habit.completionRate >= 80
                                      ? 'bg-green-500'
                                      : habit.completionRate >= 50
                                      ? 'bg-blue-500'
                                      : habit.completionRate >= 25
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(habit.completionRate, 100)}%` }}
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600 dark:text-gray-400">
                                <span>{habit.completedInRange} completed in {timeRange}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{habit.totalCompletions} total completions</span>
                                {habit.streak > 0 && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="text-orange-600 dark:text-orange-400 font-medium">🔥 {habit.streak} day streak</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 hidden sm:block">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{habit.completedInRange}</div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">this {timeRange}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Target className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p>No habits completed yet. Start tracking to see your stats!</p>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

