import { NextRequest } from 'next/server'
import { saveRoutine, getRoutinesByUserId } from '@/lib/workoutMongo'
import type { Routine } from '@/types/workout'
import { getSecureUserIdFromRequest, successResponse, handleApiError, validateUserId, errorResponse } from '@/lib/utils'
import { withRateLimit } from '@/lib/utils'

// Rate limit: 100 requests per 15 minutes per IP
const rateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
}

async function getRoutinesHandler(request: NextRequest) {
  try {
    // Use secure token-based authentication
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false, // Require token-based auth
      validateOwnership: true, // Ensure user can only access their own data
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult

    // Use MongoDB as single source of truth for routines
    const routines = await getRoutinesByUserId(userId)
    return successResponse(routines)
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/workouts/routines')
  }
}

async function postRoutineHandler(request: NextRequest) {
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

    const routine: Routine = await request.json()

    // Validate routine userId matches authenticated user
    if (!routine.userId || routine.userId !== authenticatedUserId) {
      return errorResponse(
        'Forbidden',
        403,
        'You can only create routines for yourself',
        'FORBIDDEN'
      )
    }

    const validationError = validateUserId(routine.userId)
    if (validationError) return validationError

    await saveRoutine(routine)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/workouts/routines')
  }
}

// Apply rate limiting to handlers
export const GET = withRateLimit(getRoutinesHandler, rateLimitOptions)
export const POST = withRateLimit(postRoutineHandler, rateLimitOptions)

