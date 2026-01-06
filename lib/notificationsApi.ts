/**
 * Client-side API wrapper for notification operations
 */

import type { AppNotification } from '@/lib/notificationsMongo'

const API_BASE = '/api/notifications'

/**
 * Get all notifications for a user
 */
export async function getNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const params = new URLSearchParams({ userId })
  if (options?.unreadOnly) {
    params.append('unreadOnly', 'true')
  }
  if (options?.limit) {
    params.append('limit', options.limit.toString())
  }

  const response = await fetch(`${API_BASE}?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`)
  }

  const data = await response.json()
  const result = data.data || data

  // Convert date strings to Date objects
  return {
    notifications: (result.notifications || []).map((n: AppNotification) => ({
      ...n,
      createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
      scheduledFor: n.scheduledFor ? new Date(n.scheduledFor) : undefined,
    })),
    unreadCount: result.unreadCount || 0,
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${notificationId}?userId=${userId}`, {
    method: 'PUT',
  })

  if (!response.ok) {
    throw new Error(`Failed to mark notification as read: ${response.statusText}`)
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}?userId=${userId}`, {
    method: 'PUT',
  })

  if (!response.ok) {
    throw new Error(`Failed to mark all notifications as read: ${response.statusText}`)
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${notificationId}?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete notification: ${response.statusText}`)
  }
}


