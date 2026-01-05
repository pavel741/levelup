import { NextRequest } from 'next/server'
import { saveWorkoutLog, getWorkoutLogsByUserId } from '@/lib/workoutMongo'
import { getWorkoutLogsByUserId as getWorkoutLogsByUserIdFirestore } from '@/lib/firestore'
import type { WorkoutLog } from '@/types/workout'
import { getSecureUserIdFromRequest, validateUserId, successResponse, handleApiError, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    // Use secure token-based authentication
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false, // Require token-based auth
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult

    // Try Firestore first (faster, no network dependency)
    const firestoreLogs = await getWorkoutLogsByUserIdFirestore(userId)
    if (firestoreLogs.length > 0) {
      return successResponse(firestoreLogs)
    }

    // Fallback to MongoDB if Firestore is empty
    const logs = await getWorkoutLogsByUserId(userId)
    return successResponse(logs)
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/workouts/logs')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use secure token-based authentication
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false, // Require token-based auth
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId: authenticatedUserId } = userIdResult
    const log: WorkoutLog = await request.json()

    // Validate log userId matches authenticated user
    if (!log.userId || log.userId !== authenticatedUserId) {
      return errorResponse(
        'Forbidden',
        403,
        'You can only create workout logs for yourself',
        'FORBIDDEN'
      )
    }

    const validationError = validateUserId(log.userId)
    if (validationError) return validationError

    await saveWorkoutLog(log)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/workouts/logs')
  }
}

