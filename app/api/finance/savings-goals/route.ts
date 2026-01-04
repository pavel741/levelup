import { NextRequest } from 'next/server'
import {
  getSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from '@/lib/savingsGoalsMongo'
import { getSecureUserIdFromRequest, successResponse, errorResponse, handleApiError } from '@/lib/utils'
import type { SavingsGoal } from '@/types/finance'

export const dynamic = 'force-dynamic'

// GET - Get all savings goals
export async function GET(request: NextRequest) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult
    const goals = await getSavingsGoals(userId)
    return successResponse({ goals })
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/finance/savings-goals')
  }
}

// POST - Add a savings goal
export async function POST(request: NextRequest) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult
    const body = await request.json()
    const { ...goal } = body

    // Validate goal data
    if (!goal.name || !goal.targetAmount) {
      return errorResponse('Name and target amount are required', 400)
    }

    const goalData: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount || 0,
      targetDate: goal.targetDate,
      category: goal.category,
      icon: goal.icon,
      color: goal.color || '#6366f1',
    }

    const goalId = await addSavingsGoal(userId, goalData)
    return successResponse({ id: goalId })
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/finance/savings-goals')
  }
}

// PUT - Update a savings goal
export async function PUT(request: NextRequest) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult
    const { id, ...updates } = await request.json()

    if (!id) {
      return errorResponse('Goal ID is required', 400)
    }

    await updateSavingsGoal(userId, id, updates)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'PUT /api/finance/savings-goals')
  }
}

// DELETE - Delete a savings goal
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('Goal ID is required', 400)
    }

    await deleteSavingsGoal(userId, id)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/finance/savings-goals')
  }
}

