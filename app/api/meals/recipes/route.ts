import { NextRequest } from 'next/server'
import { getRecipesByUserId, saveRecipe } from '@/lib/mealMongo'
import type { Recipe } from '@/types/nutrition'
import { getUserIdFromRequest, successResponse, handleApiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request) // Optional - if not provided, returns public recipes

    const recipes = await getRecipesByUserId(userId || undefined)
    return successResponse(recipes)
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/meals/recipes')
  }
}

export async function POST(request: NextRequest) {
  try {
    const recipe: Recipe = await request.json()

    await saveRecipe(recipe)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/meals/recipes')
  }
}

