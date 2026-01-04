import { NextRequest } from 'next/server'
import {
  markAsRead,
  deleteNotification,
} from '@/lib/notificationsMongo'
import { getUserIdFromRequest, validateUserId, successResponse, handleApiError } from '@/lib/utils'

// PUT - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    await markAsRead(userId!, params.id)
    return successResponse({ success: true })
  } catch (error: unknown) {
    return handleApiError(error, 'PUT /api/notifications/[id]')
  }
}

// DELETE - Delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    await deleteNotification(userId!, params.id)
    return successResponse({ success: true })
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/notifications/[id]')
  }
}

