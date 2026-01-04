import { NextRequest } from 'next/server'
import {
  getGoals,
  addGoal,
} from '@/lib/goalsMongo'
import { getUserIdFromRequest, validateUserId, successResponse, handleApiError } from '@/lib/utils'

// GET - Get all goals for a user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'active' | 'paused' | 'completed' | 'cancelled' | null

    const filters = status ? { status } : undefined
    const goals = await getGoals(userId!, filters)
    return successResponse({ goals })
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/goals')
  }
}

// POST - Add a new goal
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    const body = await request.json()
    const { userId: _ignoreUserId, ...goal } = body

    const newGoal = await addGoal(userId!, goal)
    return successResponse({ goal: newGoal })
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/goals')
  }
}

