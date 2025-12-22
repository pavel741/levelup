import { NextRequest, NextResponse } from 'next/server'
import { getMealPlansByUserId, saveMealPlan } from '@/lib/mealMongo'
import type { MealPlan } from '@/types/nutrition'
import { getUserIdFromRequest, validateUserId, successResponse, handleApiError } from '@/lib/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId)
    if (validationError) return validationError

    const mealPlans = await getMealPlansByUserId(userId!)
    return successResponse(mealPlans)
  } catch (error: any) {
    return handleApiError(error, 'GET /api/meals/plans')
  }
}

export async function POST(request: NextRequest) {
  try {
    const mealPlan: MealPlan = await request.json()

    const validationError = validateUserId(mealPlan.userId)
    if (validationError) return validationError

    await saveMealPlan(mealPlan)
    return successResponse()
  } catch (error: any) {
    return handleApiError(error, 'POST /api/meals/plans')
  }
}

