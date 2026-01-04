/**
 * API Route: Improve Routine
 * Automatically applies improvements to a routine based on analysis
 */

import { NextRequest } from 'next/server'
import { getRoutinesByUserId } from '@/lib/workoutMongo'
import { getRoutinesByUserId as getRoutinesByUserIdFirestore } from '@/lib/firestore'
import { saveRoutine } from '@/lib/workoutMongo'
import { saveRoutine as saveRoutineFirestore } from '@/lib/firestore'
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

    // Get the routine
    let routine = null
    
    // Try Firestore first
    const firestoreRoutines = await getRoutinesByUserIdFirestore(userId)
    routine = firestoreRoutines.find(r => r.id === routineId)
    
    // Fallback to MongoDB if not found in Firestore
    if (!routine) {
      const mongoRoutines = await getRoutinesByUserId(userId)
      routine = mongoRoutines.find(r => r.id === routineId)
    }

    if (!routine) {
      return errorResponse('Routine not found', 404)
    }

    // Apply improvements
    const improvementResult = improveRoutine(routine)

    // Save the improved routine
    // Try Firestore first, fallback to MongoDB
    try {
      await saveRoutineFirestore(improvementResult.routine)
    } catch (error) {
      console.warn('Firestore save failed, trying MongoDB:', error)
      await saveRoutine(improvementResult.routine)
    }

    return successResponse({
      routine: improvementResult.routine,
      changes: improvementResult.changes,
      summary: improvementResult.summary
    })
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/workouts/routines/[id]/improve')
  }
}

