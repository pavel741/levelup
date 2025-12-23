import { NextRequest } from 'next/server'
import { getMealPlanById, updateMealPlan, deleteMealPlan } from '@/lib/mealMongo'
import { getUserIdFromRequest, validateUserId, successResponse, errorResponse, handleApiError } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId)
    if (validationError) return validationError

    const mealPlan = await getMealPlanById(params.id, userId!)
    if (!mealPlan) {
      return errorResponse('Meal plan not found', 404)
    }
    return successResponse(mealPlan)
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/meals/plans/[id]')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, updates } = await request.json()

    const validationError = validateUserId(userId)
    if (validationError) return validationError

    await updateMealPlan(params.id, userId!, updates)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'PATCH /api/meals/plans/[id]')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId)
    if (validationError) return validationError

    await deleteMealPlan(params.id, userId!)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/meals/plans/[id]')
  }
}

