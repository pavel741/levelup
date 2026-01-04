import { NextRequest } from 'next/server'
import { updateGoalProgress } from '@/lib/goalsMongo'
import { getUserIdFromRequest, validateUserId, successResponse, errorResponse, handleApiError } from '@/lib/utils'

// POST - Update goal progress
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    const body = await request.json()
    const { currentValue, note } = body

    if (typeof currentValue !== 'number') {
      return errorResponse('currentValue is required and must be a number', 400, undefined, 'VALIDATION_ERROR')
    }

    const updatedGoal = await updateGoalProgress(userId!, params.id, currentValue, note)
    return successResponse({ goal: updatedGoal })
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/goals/[id]/progress')
  }
}

