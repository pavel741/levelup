import { NextRequest } from 'next/server'
import { deleteAllWorkoutLogs } from '@/lib/workoutMongo'
import { getSecureUserIdFromRequest, successResponse, handleApiError } from '@/lib/utils'

export async function DELETE(request: NextRequest) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult

    // Use MongoDB as single source of truth for workout logs
    const deletedCount = await deleteAllWorkoutLogs(userId)

    return successResponse({ deletedCount })
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/workouts/logs/delete-all')
  }
}

