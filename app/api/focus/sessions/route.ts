import { NextRequest } from 'next/server'
import {
  getFocusSessions,
  addFocusSession,
  updateFocusSession,
  deleteFocusSession,
} from '@/lib/focusMongo'
import { getSecureUserIdFromRequest, successResponse, errorResponse, handleApiError } from '@/lib/utils'
import type { FocusSession } from '@/types'

export const dynamic = 'force-dynamic'

// GET - Get all focus sessions
export async function GET(request: NextRequest) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : undefined

    const sessions = await getFocusSessions(userId, limit)
    return successResponse({ sessions })
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/focus/sessions')
  }
}

// POST - Add a focus session
export async function POST(request: NextRequest) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult
    const body = await request.json()
    const { ...session } = body

    // Validate session data
    if (!session.type || !session.duration) {
      return errorResponse('Type and duration are required', 400)
    }

    const sessionData: Omit<FocusSession, 'id' | 'userId' | 'createdAt'> = {
      type: session.type,
      duration: session.duration,
      completedDuration: session.completedDuration || 0,
      isCompleted: session.isCompleted || false,
      distractions: session.distractions || 0,
      distractionNotes: session.distractionNotes || [],
      linkedHabitId: session.linkedHabitId,
      xpReward: session.xpReward,
      startedAt: session.startedAt || new Date(),
      completedAt: session.completedAt,
    }

    const sessionId = await addFocusSession(userId, sessionData)
    return successResponse({ id: sessionId })
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/focus/sessions')
  }
}

// PUT - Update a focus session
export async function PUT(request: NextRequest) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult
    const { id, ...updates } = await request.json()

    if (!id) {
      return errorResponse('Session ID is required', 400)
    }

    await updateFocusSession(userId, id, updates)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'PUT /api/focus/sessions')
  }
}

// DELETE - Delete a focus session
export async function DELETE(request: NextRequest) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('Session ID is required', 400)
    }

    await deleteFocusSession(userId, id)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/focus/sessions')
  }
}

