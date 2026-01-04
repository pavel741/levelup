/**
 * API Route: Finance Statistics (Server-Side Aggregation)
 * Calculates finance statistics in MongoDB instead of client-side
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

    if (!userId) {
      return handleApiError(new Error('User ID is required'), 'GET /api/statistics/finance')
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'month' // 'week' | 'month' | '3months' | '6months' | 'year' | 'all'
    const comparePeriod = searchParams.get('comparePeriod') === 'true'

    let db
    try {
      db = await getDatabase()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('MongoDB connection error:', error)
      return handleApiError(new Error(`MongoDB connection failed: ${errorMessage}`), 'GET /api/statistics/finance')
    }
    
    const collection = db.collection('finance_transactions')

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
            totalIncome: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: [{ $toLower: { $ifNull: ['$type', ''] } }, 'income'] },
                      { $gt: ['$amount', 0] }
                    ]
                  },
                  { $abs: '$amount' },
                  0
                ]
              }
            },
            totalExpenses: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: [{ $toLower: { $ifNull: ['$type', ''] } }, 'expense'] },
                      { $lt: ['$amount', 0] }
                    ]
                  },
                  { $abs: '$amount' },
                  0
                ]
              }
            }
          }
        }
      ]).toArray()
    } catch (error: unknown) {
      console.error('Error in currentStats aggregation:', error)
      console.error('currentMatch:', JSON.stringify(currentMatch, null, 2))
      throw error
    }

    // Category breakdown
    let categoryData: Array<{ name: string; value: number }> = []
    try {
      const result = await collection.aggregate([
        {
          $match: {
            ...currentMatch,
            $or: [
              { $lt: ['$amount', 0] },
              { $eq: [{ $toLower: { $ifNull: ['$type', ''] } }, 'expense'] }
            ]
          }
        },
      {
        $group: {
          _id: { $ifNull: ['$category', 'Uncategorized'] },
          value: { $sum: { $abs: '$amount' } }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: 1
        }
      },
      { $sort: { value: -1 } },
      { $limit: 6 }
    ]).toArray()
      categoryData = result as unknown as Array<{ name: string; value: number }>
    } catch (error: unknown) {
      console.error('Error in categoryData aggregation:', error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      categoryData = []
    }

    // Chart data - group by day/week
    const chartDataPipeline: Array<Record<string, unknown>> = [
      { $match: currentMatch },
      // Filter out documents with null or missing dates first
      {
        $match: {
          date: { $ne: null, $exists: true }
        }
      },
      {
        $project: {
          date: 1,
          amount: 1,
          type: { $ifNull: ['$type', ''] },
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: timeRange === 'week' ? '%a' : '%b %d',
              date: '$date'
            }
          },
          income: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: [{ $toLower: '$type' }, 'income'] },
                    { $gt: ['$amount', 0] }
                  ]
                },
                { $abs: '$amount' },
                0
              ]
            }
          },
          expenses: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: [{ $toLower: '$type' }, 'expense'] },
                    { $lt: ['$amount', 0] }
                  ]
                },
                { $abs: '$amount' },
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          income: 1,
          expenses: 1,
          balance: { $subtract: ['$income', '$expenses'] }
        }
      },
      { $sort: { date: 1 } }
    ]

    let financeChart: Array<{ date: string; income: number; expenses: number; balance: number }> = []
    try {
      const result = await collection.aggregate(chartDataPipeline).toArray()
      financeChart = result as unknown as Array<{ date: string; income: number; expenses: number; balance: number }>
    } catch (error: unknown) {
      console.error('Error in financeChart aggregation:', error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : undefined)
      console.error('chartDataPipeline:', JSON.stringify(chartDataPipeline, null, 2))
      // Return empty chart data if aggregation fails
      financeChart = []
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
            totalIncome: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: [{ $toLower: { $ifNull: ['$type', ''] } }, 'income'] },
                      { $gt: ['$amount', 0] }
                    ]
                  },
                  { $abs: '$amount' },
                  0
                ]
              }
            },
            totalExpenses: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: [{ $toLower: { $ifNull: ['$type', ''] } }, 'expense'] },
                      { $lt: ['$amount', 0] }
                    ]
                  },
                  { $abs: '$amount' },
                  0
                ]
              }
            }
          }
        }
      ]).toArray()

      previousStats = prevStats[0] || { totalIncome: 0, totalExpenses: 0 }
    }

    const current = currentStats[0] || { totalIncome: 0, totalExpenses: 0 }
    const balance = current.totalIncome - current.totalExpenses

    return successResponse({
      income: current.totalIncome,
      expenses: current.totalExpenses,
      balance,
      categoryChart: categoryData,
      financeChart,
      previousIncome: previousStats?.totalIncome || 0,
      previousExpenses: previousStats?.totalExpenses || 0,
      changeIncome: previousStats && previousStats.totalIncome > 0
        ? ((current.totalIncome - previousStats.totalIncome) / previousStats.totalIncome) * 100
        : 0,
      changeExpenses: previousStats && previousStats.totalExpenses > 0
        ? ((current.totalExpenses - previousStats.totalExpenses) / previousStats.totalExpenses) * 100
        : 0
    })
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/statistics/finance')
  }
}

