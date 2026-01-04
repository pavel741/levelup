import { NextRequest } from 'next/server'
import {
  getGoalById,
  updateGoal,
  deleteGoal,
} from '@/lib/goalsMongo'
import { getUserIdFromRequest, validateUserId, successResponse, errorResponse, handleApiError } from '@/lib/utils'

// GET - Get a single goal by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    const goal = await getGoalById(userId!, params.id)
    if (!goal) {
      return errorResponse('Goal not found', 404, undefined, 'NOT_FOUND')
    }
    return successResponse({ goal })
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/goals/[id]')
  }
}

// PUT - Update a goal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    const body = await request.json()
    const { userId: _ignoreUserId, id: _ignoreId, ...updates } = body

    const updatedGoal = await updateGoal(userId!, params.id, updates)
    return successResponse({ goal: updatedGoal })
  } catch (error: unknown) {
    return handleApiError(error, 'PUT /api/goals/[id]')
  }
}

// DELETE - Delete a goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    await deleteGoal(userId!, params.id)
    return successResponse({ success: true })
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/goals/[id]')
  }
}

