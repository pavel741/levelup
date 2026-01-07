import { NextRequest, NextResponse } from 'next/server'
import { getCategories, saveCategories } from '@/lib/financeMongo'
import { getUserIdFromRequest, validateUserId, errorResponse, handleApiError } from '@/lib/utils'

// GET - Get categories
export async function GET(request: NextRequest) {
  try {
    // Get userId from authenticated request (validates user is logged in)
    const userId = getUserIdFromRequest(request)
    
    if (!userId) {
      return errorResponse('Unauthorized', 401, 'User ID is required. Please log in.')
    }

    const validationError = validateUserId(userId)
    if (validationError) return validationError

    const categories = await getCategories(userId)
    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Error in GET /api/finance/categories:', error)
    
    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      return NextResponse.json({ 
        error: 'MongoDB connection timeout. Please check your IP whitelist in MongoDB Atlas.',
        details: 'Go to MongoDB Atlas → Network Access → Add your IP address'
      }, { status: 503 })
    }
    
    return handleApiError(error, 'GET /api/finance/categories')
  }
}

// POST - Save categories
export async function POST(request: NextRequest) {
  try {
    // Get userId from authenticated request (validates user is logged in)
    const authenticatedUserId = getUserIdFromRequest(request)
    
    if (!authenticatedUserId) {
      return errorResponse('Unauthorized', 401, 'User ID is required. Please log in.')
    }

    const validationError = validateUserId(authenticatedUserId)
    if (validationError) return validationError

    const { userId, categories } = await request.json()
    
    // CRITICAL: Ensure userId in body matches authenticated user
    // This prevents users from modifying other users' categories
    if (!userId || userId !== authenticatedUserId) {
      return errorResponse(
        'Forbidden',
        403,
        'You can only modify your own categories',
        'FORBIDDEN'
      )
    }

    await saveCategories(userId, categories)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in POST /api/finance/categories:', error)
    return handleApiError(error, 'POST /api/finance/categories')
  }
}

