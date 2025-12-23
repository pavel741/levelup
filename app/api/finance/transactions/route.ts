import { NextRequest } from 'next/server'
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getAllTransactionsForSummary,
} from '@/lib/financeMongo'
import { getUserIdFromRequest, validateUserId, successResponse, errorResponse, handleApiError } from '@/lib/utils'

// GET - Get all transactions
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 100 // Default to 100 for faster initial load

    // Use limit in query for better performance (avoids loading all data)
    const transactions = limit > 0 
      ? await getAllTransactionsForSummary(userId!, limit)
      : await getAllTransactionsForSummary(userId!)
    
    return successResponse({ transactions })
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/finance/transactions')
  }
}

// POST - Add a transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...transaction } = body
    
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    const transactionId = await addTransaction(userId!, transaction)
    return successResponse({ id: transactionId })
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/finance/transactions')
  }
}

// PUT - Update a transaction
export async function PUT(request: NextRequest) {
  try {
    const { userId, id, ...updates } = await request.json()
    
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError
    
    if (!id) {
      return errorResponse('Transaction ID is required', 400)
    }

    await updateTransaction(userId!, id, updates)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'PUT /api/finance/transactions')
  }
}

// DELETE - Delete a transaction
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError
    
    if (!id) {
      return errorResponse('Transaction ID is required', 400)
    }

    await deleteTransaction(userId!, id)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/finance/transactions')
  }
}

