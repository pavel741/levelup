import { NextRequest } from 'next/server'
import { completeTodo } from '@/lib/todosMongo'
import { getUserIdFromRequest, validateUserIdForApi, successResponse, handleApiError } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// POST - Complete a todo
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserIdForApi(userId, 401)
    if (validationError) return validationError

    const todoId = params.id
    if (!todoId) {
      return new Response(JSON.stringify({ error: 'Todo ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await completeTodo(userId!, todoId)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/todos/[id]/complete')
  }
}

