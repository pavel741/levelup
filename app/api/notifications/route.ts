import { NextRequest } from 'next/server'
import {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAllAsRead,
  deleteAllRead,
} from '@/lib/notificationsMongo'
import { getUserIdFromRequest, validateUserId, successResponse, handleApiError } from '@/lib/utils'

// GET - Get all notifications for a user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const notifications = await getNotifications(userId!, { unreadOnly, limit })
    const unreadCount = await getUnreadCount(userId!)
    
    return successResponse({ notifications, unreadCount })
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/notifications')
  }
}

// POST - Create a notification
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    const body = await request.json()
    const { userId: _ignoreUserId, ...notification } = body

    const newNotification = await createNotification(userId!, notification)
    return successResponse({ notification: newNotification })
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/notifications')
  }
}

// PUT - Mark all as read
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    await markAllAsRead(userId!)
    return successResponse({ success: true })
  } catch (error: unknown) {
    return handleApiError(error, 'PUT /api/notifications')
  }
}

// DELETE - Delete all read notifications
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId, 401)
    if (validationError) return validationError

    await deleteAllRead(userId!)
    return successResponse({ success: true })
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/notifications')
  }
}

