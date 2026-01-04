import { ObjectId } from 'mongodb'
import { getDatabase } from './mongodb'
import type { FocusSession } from '@/types'
import { queryCache, createQueryCacheKey } from './utils/queryCache'

type WithId<T> = T & { id: string }

// Convert MongoDB ObjectId to string and handle dates
const convertMongoData = <T = unknown>(data: unknown): T | null | undefined => {
  if (data === null || data === undefined) return data as T | null | undefined

  if (data instanceof ObjectId) {
    return data.toString() as T
  }

  if (data instanceof Date) {
    return data.toISOString().split('T')[0] as T
  }

  if (Array.isArray(data)) {
    return data.map((item) => convertMongoData(item)) as T
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const converted: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (key === '_id' && value instanceof ObjectId) {
        converted.id = value.toString()
      } else {
        converted[key] = convertMongoData(value)
      }
    }
    return converted as T
  }

  return data as T
}

const getFocusSessionsCollection = async () => {
  const db = await getDatabase()
  return db.collection('focus_sessions')
}

// Get all focus sessions for a user
export const getFocusSessions = async (userId: string, limit?: number): Promise<WithId<FocusSession>[]> => {
  const cacheKey = createQueryCacheKey('focus_sessions', userId, limit || 'all')
  
  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const collection = await getFocusSessionsCollection()
        let query = collection.find({ userId }).sort({ startedAt: -1 })
        
        if (limit && limit > 0) {
          query = query.limit(limit)
        }
        
        const docs = await query.toArray()
        
        return docs.map((doc) => {
          const converted = convertMongoData(doc) as FocusSession
          return {
            ...converted,
            id: converted.id || doc._id.toString(),
            startedAt: converted.startedAt instanceof Date ? converted.startedAt : new Date(converted.startedAt),
            completedAt: converted.completedAt ? (converted.completedAt instanceof Date ? converted.completedAt : new Date(converted.completedAt)) : undefined,
            createdAt: converted.createdAt instanceof Date ? converted.createdAt : new Date(converted.createdAt),
          } as WithId<FocusSession>
        })
      } catch (error) {
        console.error('Error loading focus sessions from MongoDB:', error)
        return []
      }
    },
    { ttl: 30 * 1000 } // 30 seconds cache
  )
}

// Add a focus session
export const addFocusSession = async (
  userId: string,
  session: Omit<FocusSession, 'id' | 'userId' | 'createdAt'>
): Promise<string> => {
  try {
    const collection = await getFocusSessionsCollection()
    
    const sessionData = {
      ...session,
      userId,
      startedAt: session.startedAt instanceof Date ? session.startedAt : new Date(session.startedAt),
      completedAt: session.completedAt ? (session.completedAt instanceof Date ? session.completedAt : new Date(session.completedAt)) : undefined,
      createdAt: new Date(),
    }
    
    const result = await collection.insertOne(sessionData)
    
    // Invalidate cache
    queryCache.invalidatePattern(new RegExp(`^focus_sessions:.*:${userId}`))
    
    return result.insertedId.toString()
  } catch (error) {
    console.error('Error adding focus session to MongoDB:', error)
    throw error
  }
}

// Update a focus session
export const updateFocusSession = async (
  userId: string,
  sessionId: string,
  updates: Partial<FocusSession>
): Promise<void> => {
  try {
    const collection = await getFocusSessionsCollection()
    
    const updateData: any = { ...updates }
    if (updates.startedAt) {
      updateData.startedAt = updates.startedAt instanceof Date ? updates.startedAt : new Date(updates.startedAt)
    }
    if (updates.completedAt) {
      updateData.completedAt = updates.completedAt instanceof Date ? updates.completedAt : new Date(updates.completedAt)
    }
    updateData.updatedAt = new Date()
    
    await collection.updateOne(
      { _id: new ObjectId(sessionId), userId },
      { $set: updateData }
    )
    
    // Invalidate cache
    queryCache.invalidatePattern(new RegExp(`^focus_sessions:.*:${userId}`))
  } catch (error) {
    console.error('Error updating focus session in MongoDB:', error)
    throw error
  }
}

// Delete a focus session
export const deleteFocusSession = async (userId: string, sessionId: string): Promise<void> => {
  try {
    const collection = await getFocusSessionsCollection()
    
    await collection.deleteOne({ _id: new ObjectId(sessionId), userId })
    
    // Invalidate cache
    queryCache.invalidatePattern(new RegExp(`^focus_sessions:.*:${userId}`))
  } catch (error) {
    console.error('Error deleting focus session from MongoDB:', error)
    throw error
  }
}

// Get focus statistics for a user
export const getFocusStats = async (userId: string, startDate?: Date, endDate?: Date) => {
  try {
    const collection = await getFocusSessionsCollection()
    
    const match: any = { userId, isCompleted: true }
    if (startDate || endDate) {
      match.startedAt = {}
      if (startDate) {
        match.startedAt.$gte = startDate
      }
      if (endDate) {
        match.startedAt.$lte = endDate
      }
    }
    
    const stats = await collection.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalFocusTime: { $sum: '$completedDuration' },
          totalDistractions: { $sum: { $ifNull: ['$distractions', 0] } },
          averageSessionDuration: { $avg: '$completedDuration' },
        }
      }
    ]).toArray()
    
    return stats[0] || {
      totalSessions: 0,
      totalFocusTime: 0,
      totalDistractions: 0,
      averageSessionDuration: 0,
    }
  } catch (error) {
    console.error('Error getting focus stats from MongoDB:', error)
    return {
      totalSessions: 0,
      totalFocusTime: 0,
      totalDistractions: 0,
      averageSessionDuration: 0,
    }
  }
}

