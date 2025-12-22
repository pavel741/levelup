import { NextRequest, NextResponse } from 'next/server'
import { getShoppingListsByUserId, saveShoppingList } from '@/lib/mealMongo'
import type { ShoppingList } from '@/types/nutrition'
import { getUserIdFromRequest, validateUserId, successResponse, handleApiError } from '@/lib/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId)
    if (validationError) return validationError

    const lists = await getShoppingListsByUserId(userId!)
    return successResponse(lists)
  } catch (error: any) {
    return handleApiError(error, 'GET /api/meals/shopping-lists')
  }
}

export async function POST(request: NextRequest) {
  try {
    const shoppingList: ShoppingList = await request.json()

    const validationError = validateUserId(shoppingList.userId)
    if (validationError) return validationError

    await saveShoppingList(shoppingList)
    return successResponse()
  } catch (error: any) {
    return handleApiError(error, 'POST /api/meals/shopping-lists')
  }
}

