/**
 * API Route: Finance Summary (Server-Side Aggregation)
 * Calculates summaries in MongoDB instead of client-side
 * Much faster for large datasets
 */

export const dynamic = 'force-dynamic' // This route uses request.url, must be dynamic

import { NextRequest } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { getUserIdFromRequest, validateUserId, successResponse, errorResponse, handleApiError } from '@/lib/utils'
import { startOfMonth, endOfMonth, parse } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // Format: YYYY-MM
    const view = searchParams.get('view') || 'monthly' // 'monthly' | 'alltime'

    const db = await getDatabase()
    const collection = db.collection('finance_transactions')

    if (view === 'alltime') {
      // All-time summary using aggregation
      const result = await collection.aggregate([
        { $match: { userId: userId! } },
        {
          $group: {
            _id: null,
            totalIncome: {
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
            totalExpenses: {
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
            },
            count: { $sum: 1 }
          }
        }
      ]).toArray()

      const summary = result[0] || { totalIncome: 0, totalExpenses: 0, count: 0 }
      return successResponse({
        income: summary.totalIncome,
        expenses: summary.totalExpenses,
        balance: summary.totalIncome - summary.totalExpenses,
        transactionCount: summary.count
      })
    } else {
      // Monthly summary
      if (!month) {
        return errorResponse('Month parameter is required for monthly view', 400)
      }

      // Parse month and get start/end dates (simple monthly period, not payday period)
      const monthDate = parse(month + '-01', 'yyyy-MM-dd', new Date())
      const startDate = startOfMonth(monthDate)
      const endDate = endOfMonth(monthDate)
      
      const result = await collection.aggregate([
        {
          $match: {
            userId: userId!,
            date: {
              $gte: startDate.toISOString().split('T')[0],
              $lte: endDate.toISOString().split('T')[0]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalIncome: {
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
            totalExpenses: {
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
            },
            count: { $sum: 1 }
          }
        }
      ]).toArray()

      const summary = result[0] || { totalIncome: 0, totalExpenses: 0, count: 0 }
      return successResponse({
        income: summary.totalIncome,
        expenses: summary.totalExpenses,
        balance: summary.totalIncome - summary.totalExpenses,
        transactionCount: summary.count,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
    }
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/finance/summary')
  }
}

