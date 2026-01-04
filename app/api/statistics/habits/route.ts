/**
 * API Route: Habits Statistics (Server-Side Aggregation)
 * Calculates habits statistics in Firestore instead of client-side
 * Much faster for large datasets
 */

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getUserIdFromRequest, validateUserId, successResponse, handleApiError } from '@/lib/utils'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subDays, eachDayOfInterval, format } from 'date-fns'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db, waitForFirebaseInit } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    if (!userId) {
      return handleApiError(new Error('User ID is required'), 'GET /api/statistics/habits')
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'month' // 'week' | 'month' | '3months' | '6months' | 'year' | 'all'
    const comparePeriod = searchParams.get('comparePeriod') === 'true'

    // Wait for Firebase initialization
    await waitForFirebaseInit()
    
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const now = new Date()
    let currentStart: Date
    let currentEnd = now
    let previousStart: Date | null = null
    let previousEnd: Date | null = null

    // Calculate date ranges
    switch (timeRange) {
      case 'week':
        currentStart = startOfWeek(now)
        currentEnd = endOfWeek(now)
        if (comparePeriod) {
          previousEnd = subDays(currentStart, 1)
          previousStart = startOfWeek(previousEnd)
        }
        break
      case 'month':
        currentStart = startOfMonth(now)
        currentEnd = endOfMonth(now)
        if (comparePeriod) {
          previousEnd = subDays(currentStart, 1)
          previousStart = startOfMonth(previousEnd)
        }
        break
      case '3months':
        currentStart = subMonths(now, 3)
        currentEnd = now
        if (comparePeriod) {
          previousEnd = subDays(currentStart, 1)
          previousStart = subMonths(previousEnd, 3)
        }
        break
      case '6months':
        currentStart = subMonths(now, 6)
        currentEnd = now
        if (comparePeriod) {
          previousEnd = subDays(currentStart, 1)
          previousStart = subMonths(previousEnd, 6)
        }
        break
      case 'year':
        currentStart = subMonths(now, 12)
        currentEnd = now
        if (comparePeriod) {
          previousEnd = subDays(currentStart, 1)
          previousStart = subMonths(previousEnd, 12)
        }
        break
      default: // 'all'
        // For 'all', we'll use a very early date
        currentStart = new Date(0)
        currentEnd = now
    }

    // Get all habits for the user
    const habitsRef = collection(db, 'habits')
    const habitsQuery = query(habitsRef, where('userId', '==', userId!))
    const habitsSnapshot = await getDocs(habitsQuery)
    
    const habits = habitsSnapshot.docs.map((doc) => {
      const data = doc.data()
      // Handle completedDates - convert any Timestamps or Dates to strings
      const completedDates = (data.completedDates || []).map((date: unknown) => {
        if (typeof date === 'string') {
          return date
        } else if (date && typeof date === 'object' && 'toDate' in date && typeof (date as { toDate: () => Date }).toDate === 'function') {
          // Firestore Timestamp
          return format((date as { toDate: () => Date }).toDate(), 'yyyy-MM-dd')
        } else if (date instanceof Date) {
          return format(date, 'yyyy-MM-dd')
        } else {
          // Skip invalid dates
          return null
        }
      }).filter((date: string | null): date is string => date !== null)
      
      return {
        id: doc.id,
        name: data.name || '',
        isActive: data.isActive !== false,
        completedDates,
      }
    })

    const activeHabits = habits.filter(h => h.isActive)

    // Current period calculations
    const currentDays = eachDayOfInterval({ start: currentStart, end: currentEnd })
    const currentCompletions = currentDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const completed = activeHabits.filter(h => h.completedDates.includes(dateStr)).length
      return { 
        date: format(day, 'MMM d'), 
        dateStr, 
        completed, 
        total: activeHabits.length 
      }
    })

    const currentTotal = currentCompletions.reduce((sum, d) => sum + d.completed, 0)
    const currentAverage = currentCompletions.length > 0 ? currentTotal / currentCompletions.length : 0
    const currentBest = Math.max(...currentCompletions.map(d => d.completed), 0)

    // Previous period calculations
    let previousCompletions: typeof currentCompletions = []
    let previousTotal = 0
    let previousAverage = 0

    if (comparePeriod && previousStart && previousEnd) {
      const prevDays = eachDayOfInterval({ start: previousStart, end: previousEnd })
      previousCompletions = prevDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const completed = activeHabits.filter(h => h.completedDates.includes(dateStr)).length
        return { 
          date: format(day, 'MMM d'), 
          dateStr, 
          completed, 
          total: activeHabits.length 
        }
      })
      previousTotal = previousCompletions.reduce((sum, d) => sum + d.completed, 0)
      previousAverage = previousCompletions.length > 0 ? previousTotal / previousCompletions.length : 0
    }

    // Habit performance
    const habitPerformance = activeHabits.map(habit => {
      const completed = currentDays.filter(day => 
        habit.completedDates.includes(format(day, 'yyyy-MM-dd'))
      ).length
      const rate = currentDays.length > 0 ? (completed / currentDays.length) * 100 : 0
      return {
        name: habit.name,
        completed,
        total: currentDays.length,
        rate: Math.round(rate),
      }
    }).sort((a, b) => b.rate - a.rate)

    return successResponse({
      currentCompletions,
      currentTotal,
      currentAverage,
      currentBest,
      previousTotal,
      previousAverage,
      habitPerformance,
      change: previousAverage > 0 ? ((currentAverage - previousAverage) / previousAverage) * 100 : 0,
    })
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/statistics/habits')
  }
}

