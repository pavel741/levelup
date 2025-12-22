import { NextRequest, NextResponse } from 'next/server'
import { updateRoutine, deleteRoutine } from '@/lib/workoutMongo'
import { validateUserId, successResponse, handleApiError } from '@/lib/utils/api-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, updates } = await request.json()

    const validationError = validateUserId(userId)
    if (validationError) return validationError

    await updateRoutine(params.id, userId!, updates)
    return successResponse()
  } catch (error: any) {
    return handleApiError(error, 'PATCH /api/workouts/routines/[id]')
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

    await deleteRoutine(params.id, userId!)
    return successResponse()
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/workouts/routines/[id]')
  }
}

