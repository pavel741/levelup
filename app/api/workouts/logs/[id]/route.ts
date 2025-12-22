import { NextRequest, NextResponse } from 'next/server'
import { updateWorkoutLog, deleteWorkoutLog } from '@/lib/workoutMongo'
import { validateUserId, successResponse, handleApiError } from '@/lib/utils/api-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, updates } = await request.json()

    const validationError = validateUserId(userId)
    if (validationError) return validationError

    await updateWorkoutLog(params.id, userId!, updates)
    return successResponse()
  } catch (error: any) {
    return handleApiError(error, 'PATCH /api/workouts/logs/[id]')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const validationError = validateUserId(userId)
    if (validationError) return validationError

    await deleteWorkoutLog(params.id, userId!)
    return successResponse()
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/workouts/logs/[id]')
  }
}

