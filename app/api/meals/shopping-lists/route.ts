/**
 * API Route: Shopping Lists
 * 
 * GET /api/meals/shopping-lists
 * - Authentication: Required
 * - Returns: Array of shopping lists for the authenticated user
 * 
 * POST /api/meals/shopping-lists
 * - Authentication: Required
 * - Body: ShoppingList object
 * - Returns: Success response
 */

import { NextRequest } from 'next/server'
import { getShoppingListsByUserId, saveShoppingList } from '@/lib/mealMongo'
import type { ShoppingList } from '@/types/nutrition'
import { createGetHandler, createPostHandler } from '@/lib/utils'
import { errorResponse } from '@/lib/utils'

export const GET = createGetHandler(
  {
    fetchData: async (userId) => {
      return await getShoppingListsByUserId(userId)
    }
  },
  {
    requireAuth: true,
    validateOwnership: true
  }
)

export const POST = createPostHandler(
  {
    parseBody: async (request) => {
      // Parse the shopping list body - let saveShoppingList handle detailed validation
      const body = await request.json() as ShoppingList
      return body
    },
    validateBody: (body, userId) => {
      // Ensure userId in body matches authenticated user
      if (!body.userId || body.userId !== userId) {
        return errorResponse('User ID mismatch', 403, 'You can only create shopping lists for yourself', 'FORBIDDEN')
      }
      // Basic validation
      if (!body.items || !Array.isArray(body.items)) {
        return errorResponse('Invalid shopping list', 400, 'Items must be an array', 'VALIDATION_ERROR')
      }
      return null
    },
    saveData: async (body) => {
      await saveShoppingList(body)
      return { success: true }
    }
  },
  {
    requireAuth: true,
    validateOwnership: true
  }
)

