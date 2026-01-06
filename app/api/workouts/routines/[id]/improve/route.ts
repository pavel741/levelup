/**
 * API Route: Improve Routine
 * Automatically applies improvements to a routine based on analysis
 */

import { NextRequest } from 'next/server'
import { getRoutinesByUserId, saveRoutine } from '@/lib/workoutMongo'
import { improveRoutine } from '@/scripts/improveRoutine'
import { getSecureUserIdFromRequest, successResponse, handleApiError, errorResponse } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult
    const routineId = params.id

    // Get the routine from MongoDB (single source of truth)
    const mongoRoutines = await getRoutinesByUserId(userId)
    const routine = mongoRoutines.find(r => r.id === routineId)

    if (!routine) {
      return errorResponse('Routine not found', 404)
    }

    // Apply improvements
    const improvementResult = improveRoutine(routine)

    // Save the improved routine to MongoDB
    await saveRoutine(improvementResult.routine)

    return successResponse({
      routine: improvementResult.routine,
      changes: improvementResult.changes,
      summary: improvementResult.summary
    })
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/workouts/routines/[id]/improve')
  }
}

