import { NextRequest } from 'next/server'
import { getFocusStats } from '@/lib/focusMongo'
import { getSecureUserIdFromRequest, successResponse, handleApiError } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET - Get focus statistics
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
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    const stats = await getFocusStats(userId, startDate, endDate)
    return successResponse(stats)
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/focus/stats')
  }
}

