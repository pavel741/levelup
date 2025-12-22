import { NextRequest, NextResponse } from 'next/server'
import { getRecipesByUserId, saveRecipe } from '@/lib/mealMongo'
import type { Recipe } from '@/types/nutrition'
import { getUserIdFromRequest, successResponse, handleApiError } from '@/lib/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request) // Optional - if not provided, returns public recipes

    const recipes = await getRecipesByUserId(userId || undefined)
    return successResponse(recipes)
  } catch (error: any) {
    return handleApiError(error, 'GET /api/meals/recipes')
  }
}

export async function POST(request: NextRequest) {
  try {
    const recipe: Recipe = await request.json()

    await saveRecipe(recipe)
    return successResponse()
  } catch (error: any) {
    return handleApiError(error, 'POST /api/meals/recipes')
  }
}

