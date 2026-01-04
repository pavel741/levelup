import { NextRequest } from 'next/server'
import { deleteAllWorkoutLogs as deleteAllWorkoutLogsFirestore } from '@/lib/firestore'
import { deleteAllWorkoutLogs as deleteAllWorkoutLogsMongo } from '@/lib/workoutMongo'
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

    // Try Firestore first
    let deletedCount = 0
    try {
      deletedCount = await deleteAllWorkoutLogsFirestore(userId)
    } catch (error) {
      // Fallback to MongoDB if Firestore fails or is empty
      console.warn('Firestore delete failed, trying MongoDB:', error)
      deletedCount = await deleteAllWorkoutLogsMongo(userId)
    }

    return successResponse({ deletedCount })
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/workouts/logs/delete-all')
  }
}

