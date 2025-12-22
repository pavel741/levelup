import { NextRequest, NextResponse } from 'next/server'
import { getRecipeById, deleteRecipe } from '@/lib/mealMongo'
import { getUserIdFromRequest, validateUserId, successResponse, errorResponse, handleApiError } from '@/lib/utils/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await getRecipeById(params.id)
    if (!recipe) {
      return errorResponse('Recipe not found', 404)
    }
    return successResponse(recipe)
  } catch (error: any) {
    return handleApiError(error, 'GET /api/meals/recipes/[id]')
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

    await deleteRecipe(params.id, userId!)
    return successResponse()
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/meals/recipes/[id]')
  }
}

