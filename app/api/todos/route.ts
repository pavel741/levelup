import { NextRequest } from 'next/server'
import {
  getTodos,
  addTodo,
  updateTodo,
  deleteTodo,
} from '@/lib/todosMongo'
import { getUserIdFromRequest, validateUserIdForApi, successResponse, errorResponse, handleApiError } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET - Get all todos for a user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserIdForApi(userId, 401)
    if (validationError) return validationError

    const todos = await getTodos(userId!)
    return successResponse({ todos })
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/todos')
  }
}

// POST - Add a new todo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...todo } = body
    
    const validationError = validateUserIdForApi(userId, 401)
    if (validationError) return validationError

    const todoId = await addTodo(userId!, todo)
    return successResponse({ id: todoId })
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/todos')
  }
}

// PUT - Update a todo
export async function PUT(request: NextRequest) {
  try {
    const { userId, id, ...updates } = await request.json()
    
    const validationError = validateUserIdForApi(userId, 401)
    if (validationError) return validationError
    
    if (!id) {
      return errorResponse('Todo ID is required', 400)
    }

    await updateTodo(userId!, id, updates)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'PUT /api/todos')
  }
}

// DELETE - Delete a todo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = getUserIdFromRequest(request)
    
    const validationError = validateUserIdForApi(userId, 401)
    if (validationError) return validationError
    
    if (!id) {
      return errorResponse('Todo ID is required', 400)
    }

    await deleteTodo(userId!, id)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/todos')
  }
}

