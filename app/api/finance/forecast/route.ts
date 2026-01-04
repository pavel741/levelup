import { NextRequest } from 'next/server'
import { getAllTransactionsForSummary } from '@/lib/financeMongo'
import { forecastExpenses } from '@/lib/expenseForecast'
import { getSecureUserIdFromRequest, successResponse, handleApiError } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET - Get expense forecast
export async function GET(request: NextRequest) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'month') as 'month' | 'quarter' | 'year'
    const monthsOfHistory = parseInt(searchParams.get('months') || '6')

    // Get all transactions
    const transactions = await getAllTransactionsForSummary(userId)

    // Calculate forecast
    const forecast = forecastExpenses(transactions, period, monthsOfHistory)

    return successResponse(forecast)
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/finance/forecast')
  }
}

