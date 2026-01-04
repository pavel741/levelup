/**
 * API Route: XP Statistics (Server-Side Aggregation)
 * Calculates XP statistics in Firestore instead of client-side
 * Much faster for large datasets
 */

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getUserIdFromRequest, validateUserId, successResponse, handleApiError } from '@/lib/utils'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subDays, format } from 'date-fns'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db, waitForFirebaseInit } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    if (!userId) {
      return handleApiError(new Error('User ID is required'), 'GET /api/statistics/xp')
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
        currentStart = new Date(0)
        currentEnd = now
    }

    // Get all daily stats for the user
    const statsRef = collection(db, 'dailyStats')
    const statsQuery = query(statsRef, where('userId', '==', userId!))
    const statsSnapshot = await getDocs(statsQuery)

    const allStats = statsSnapshot.docs.map((doc) => {
      const data = doc.data()
      // Handle date field - could be string, Timestamp, or Date
      let dateStr: string
      if (data.date instanceof Date) {
        dateStr = format(data.date, 'yyyy-MM-dd')
      } else if (data.date?.toDate) {
        // Firestore Timestamp
        dateStr = format(data.date.toDate(), 'yyyy-MM-dd')
      } else if (typeof data.date === 'string') {
        dateStr = data.date
      } else {
        // Skip invalid dates
        return null
      }
      return {
        date: dateStr,
        xpEarned: (data.xpEarned || 0) as number,
      }
    }).filter((stat): stat is { date: string; xpEarned: number } => stat !== null)

    // Filter current period
    const currentStartStr = format(currentStart, 'yyyy-MM-dd')
    const currentEndStr = format(currentEnd, 'yyyy-MM-dd')
    
    const currentStats = allStats.filter(stat => {
      return stat.date >= currentStartStr && stat.date <= currentEndStr
    })

    const currentXP = currentStats.reduce((sum, stat) => sum + stat.xpEarned, 0)
    const currentAvg = currentStats.length > 0 ? currentXP / currentStats.length : 0

    // XP chart data
    const xpChartData = currentStats
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(stat => ({
        date: format(new Date(stat.date), timeRange === 'week' ? 'EEE' : 'MMM d'),
        xp: stat.xpEarned,
      }))

    // Previous period calculations
    let previousXP = 0
    let previousAvg = 0

    if (comparePeriod && previousStart && previousEnd) {
      const previousStartStr = format(previousStart, 'yyyy-MM-dd')
      const previousEndStr = format(previousEnd, 'yyyy-MM-dd')
      
      const previousStats = allStats.filter(stat => {
        return stat.date >= previousStartStr && stat.date <= previousEndStr
      })
      
      previousXP = previousStats.reduce((sum, stat) => sum + stat.xpEarned, 0)
      previousAvg = previousStats.length > 0 ? previousXP / previousStats.length : 0
    }

    return successResponse({
      currentXP,
      currentAvg,
      xpChartData,
      previousXP,
      previousAvg,
      change: previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0,
    })
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/statistics/xp')
  }
}

