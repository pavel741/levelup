/**
 * API Route: Workout Statistics (Server-Side Aggregation)
 * Calculates workout statistics in MongoDB instead of client-side
 * Much faster for large datasets
 */

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { getUserIdFromRequest, validateUserId, successResponse, handleApiError } from '@/lib/utils'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'month' // 'week' | 'month' | '3months' | '6months' | 'year' | 'all'
    const comparePeriod = searchParams.get('comparePeriod') === 'true'

    let db
    try {
      db = await getDatabase()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('MongoDB connection error:', error)
      return handleApiError(new Error(`MongoDB connection failed: ${errorMessage}`), 'GET /api/statistics/workouts')
    }
    
    const collection = db.collection('workout_logs')

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
        currentStart = new Date(0) // Beginning of time
        currentEnd = now
    }

    // Current period aggregation
    const currentMatch: { userId: string; date?: { $gte?: Date; $lte?: Date } } = { userId: userId! }
    if (timeRange !== 'all') {
      // MongoDB stores dates as Date objects, so we need to compare with Date objects
      // Set time to start/end of day for proper comparison
      const startOfDay = new Date(currentStart)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(currentEnd)
      endOfDay.setHours(23, 59, 59, 999)
      
      currentMatch.date = {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }

    let currentStats
    try {
      currentStats = await collection.aggregate([
        { $match: currentMatch },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalVolume: { $sum: { $ifNull: ['$totalVolume', 0] } },
            totalDuration: { $sum: { $ifNull: ['$duration', 0] } },
            avgVolume: { $avg: { $ifNull: ['$totalVolume', 0] } }
          }
        }
      ]).toArray()
    } catch (error: unknown) {
      console.error('Error in currentStats aggregation:', error)
      console.error('currentMatch:', JSON.stringify(currentMatch, null, 2))
      throw error
    }

    // Chart data - group by day/week
    const chartDataPipeline: Array<Record<string, unknown>> = [
      { $match: currentMatch },
      // Filter out documents with null or missing dates
      {
        $match: {
          date: { $ne: null, $exists: true }
        }
      },
      {
        $project: {
          date: 1,
          totalVolume: { $ifNull: ['$totalVolume', 0] },
          duration: { $ifNull: ['$duration', 0] },
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: timeRange === 'week' ? '%a' : '%b %d',
              date: '$date' // date is already a Date object in MongoDB
            }
          },
          count: { $sum: 1 },
          volume: { $sum: '$totalVolume' },
          duration: { $sum: '$duration' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
          volume: 1,
          duration: 1
        }
      },
      { $sort: { date: 1 } }
    ]

    let workoutChart
    try {
      workoutChart = await collection.aggregate(chartDataPipeline).toArray()
    } catch (error: unknown) {
      console.error('Error in workoutChart aggregation:', error)
      console.error('Error message:', error.message)
      console.error('chartDataPipeline:', JSON.stringify(chartDataPipeline, null, 2))
      // Return empty chart data if aggregation fails
      workoutChart = []
    }

    // Previous period aggregation (if comparing)
    let previousStats = null
    if (comparePeriod && previousStart && previousEnd) {
      // Set time to start/end of day for proper comparison
      const prevStartOfDay = new Date(previousStart)
      prevStartOfDay.setHours(0, 0, 0, 0)
      const prevEndOfDay = new Date(previousEnd)
      prevEndOfDay.setHours(23, 59, 59, 999)
      
      const previousMatch: { userId: string; date: { $gte: Date; $lte: Date } } = {
        userId: userId!,
        date: {
          $gte: prevStartOfDay,
          $lte: prevEndOfDay
        }
      }

      const prevStats = await collection.aggregate([
        { $match: previousMatch },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalVolume: { $sum: { $ifNull: ['$totalVolume', 0] } },
            totalDuration: { $sum: { $ifNull: ['$duration', 0] } }
          }
        }
      ]).toArray()

      previousStats = prevStats[0] || { count: 0, totalVolume: 0, totalDuration: 0 }
    }

    const current = currentStats[0] || { count: 0, totalVolume: 0, totalDuration: 0, avgVolume: 0 }

    return successResponse({
      currentCount: current.count,
      currentVolume: current.totalVolume,
      currentDuration: current.totalDuration,
      currentAvgVolume: current.avgVolume || 0,
      workoutChart,
      previousCount: previousStats?.count || 0,
      previousVolume: previousStats?.totalVolume || 0,
      previousDuration: previousStats?.totalDuration || 0,
      changeCount: previousStats && previousStats.count > 0
        ? ((current.count - previousStats.count) / previousStats.count) * 100
        : 0,
      changeVolume: previousStats && previousStats.totalVolume > 0
        ? ((current.totalVolume - previousStats.totalVolume) / previousStats.totalVolume) * 100
        : 0
    })
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/statistics/workouts')
  }
}

