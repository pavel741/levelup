import { ObjectId, WithId } from 'mongodb'
import { getDatabase } from './mongodb'

export interface AppNotification {
  id: string
  userId: string
  type: 'habit' | 'workout' | 'bill' | 'goal' | 'streak' | 'achievement' | 'challenge' | 'system'
  title: string
  message: string
  read: boolean
  actionUrl?: string // URL to navigate to when clicked
  actionLabel?: string // Label for action button
  createdAt: Date | string
  scheduledFor?: Date | string // For scheduled notifications
  metadata?: Record<string, any> // Additional data
}

// Get notifications collection
const getNotificationsCollection = async () => {
  const db = await getDatabase()
  return db.collection('notifications')
}

// Convert MongoDB document to Notification type
const convertMongoData = <T>(data: any): T => {
  if (!data) return data as T

  if (data._id) {
    const converted = {
      ...data,
      id: data._id.toString(),
      _id: undefined,
    }
    delete converted._id
    return converted as T
  }

  return data as T
}

// Get all notifications for a user
export const getNotifications = async (
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<WithId<AppNotification>[]> => {
  try {
    const collection = await getNotificationsCollection()
    const query: any = { userId }
    
    if (options?.unreadOnly) {
      query.read = false
    }
    
    const docs = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 100)
      .toArray()

    return docs.map((doc) => {
      const converted = convertMongoData(doc) as AppNotification
      return {
        ...converted,
        id: converted.id || doc._id.toString(),
      } as WithId<AppNotification>
    })
  } catch (error) {
    console.error('Error loading notifications from MongoDB:', error)
    return []
  }
}

// Get unread notification count
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const collection = await getNotificationsCollection()
    return await collection.countDocuments({ userId, read: false })
  } catch (error) {
    console.error('Error getting unread count from MongoDB:', error)
    return 0
  }
}

// Create a notification
export const createNotification = async (
  userId: string,
  notification: Omit<AppNotification, 'id' | 'userId' | 'read' | 'createdAt'>
): Promise<WithId<AppNotification>> => {
  try {
    const collection = await getNotificationsCollection()
    
    const notificationData = {
      ...notification,
      userId,
      read: false,
      createdAt: new Date(),
    }
    
    const result = await collection.insertOne(notificationData)
    const inserted = await collection.findOne({ _id: result.insertedId })
    
    if (!inserted) {
      throw new Error('Failed to retrieve inserted notification')
    }
    
    const converted = convertMongoData(inserted) as AppNotification
    return {
      ...converted,
      id: converted.id || result.insertedId.toString(),
    } as WithId<AppNotification>
  } catch (error) {
    console.error('Error creating notification in MongoDB:', error)
    throw error
  }
}

// Mark notification as read
export const markAsRead = async (userId: string, notificationId: string): Promise<void> => {
  try {
    const collection = await getNotificationsCollection()
    await collection.updateOne(
      { _id: new ObjectId(notificationId), userId },
      { $set: { read: true } }
    )
  } catch (error) {
    console.error('Error marking notification as read in MongoDB:', error)
    throw error
  }
}

// Mark all notifications as read
export const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    const collection = await getNotificationsCollection()
    await collection.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    )
  } catch (error) {
    console.error('Error marking all notifications as read in MongoDB:', error)
    throw error
  }
}

// Delete a notification
export const deleteNotification = async (userId: string, notificationId: string): Promise<void> => {
  try {
    const collection = await getNotificationsCollection()
    await collection.deleteOne({ _id: new ObjectId(notificationId), userId })
  } catch (error) {
    console.error('Error deleting notification from MongoDB:', error)
    throw error
  }
}

// Delete all read notifications
export const deleteAllRead = async (userId: string): Promise<void> => {
  try {
    const collection = await getNotificationsCollection()
    await collection.deleteMany({ userId, read: true })
  } catch (error) {
    console.error('Error deleting read notifications from MongoDB:', error)
    throw error
  }
}

