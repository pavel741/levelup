import { ObjectId } from 'mongodb'
import { getDatabase } from './mongodb'
import type { SavingsGoal } from '@/types/finance'
import { queryCache, createQueryCacheKey } from './utils/queryCache'
import { parseTransactionDate } from './financeDateUtils'

type WithId<T> = T & { id: string }

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

const getSavingsGoalsCollection = async () => {
  const db = await getDatabase()
  return db.collection('savings_goals')
}

export const getSavingsGoals = async (userId: string): Promise<WithId<SavingsGoal>[]> => {
  const cacheKey = createQueryCacheKey('savings_goals', userId)
  
  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const collection = await getSavingsGoalsCollection()
        const docs = await collection
          .find({ userId })
          .sort({ createdAt: -1 })
          .toArray()
        
        return docs.map((doc) => {
          const converted = convertMongoData(doc) as SavingsGoal
          return {
            ...converted,
            id: converted.id || doc._id.toString(),
            createdAt: converted.createdAt ? parseTransactionDate(converted.createdAt) : new Date(),
            updatedAt: converted.updatedAt ? parseTransactionDate(converted.updatedAt) : new Date(),
            targetDate: converted.targetDate ? parseTransactionDate(converted.targetDate) : undefined,
          } as WithId<SavingsGoal>
        })
      } catch (error) {
        console.error('Error loading savings goals from MongoDB:', error)
        return []
      }
    },
    { ttl: 60 * 1000 } // 1 minute cache
  )
}

export const addSavingsGoal = async (
  userId: string,
  goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const collection = await getSavingsGoalsCollection()
    
    const goalData = {
      ...goal,
      userId,
      currentAmount: goal.currentAmount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      targetDate: goal.targetDate ? parseTransactionDate(goal.targetDate) : undefined,
    }
    
    const result = await collection.insertOne(goalData)
    
    // Invalidate cache
    queryCache.invalidatePattern(new RegExp(`^savings_goals:.*:${userId}`))
    
    return result.insertedId.toString()
  } catch (error) {
    console.error('Error adding savings goal to MongoDB:', error)
    throw error
  }
}

export const updateSavingsGoal = async (
  userId: string,
  goalId: string,
  updates: Partial<SavingsGoal>
): Promise<void> => {
  try {
    const collection = await getSavingsGoalsCollection()
    
    const updateData: any = { ...updates }
    if (updates.targetDate) {
      updateData.targetDate = parseTransactionDate(updates.targetDate)
    }
    updateData.updatedAt = new Date()
    
    await collection.updateOne(
      { _id: new ObjectId(goalId), userId },
      { $set: updateData }
    )
    
    // Invalidate cache
    queryCache.invalidatePattern(new RegExp(`^savings_goals:.*:${userId}`))
  } catch (error) {
    console.error('Error updating savings goal in MongoDB:', error)
    throw error
  }
}

export const deleteSavingsGoal = async (userId: string, goalId: string): Promise<void> => {
  try {
    const collection = await getSavingsGoalsCollection()
    
    await collection.deleteOne({ _id: new ObjectId(goalId), userId })
    
    // Invalidate cache
    queryCache.invalidatePattern(new RegExp(`^savings_goals:.*:${userId}`))
  } catch (error) {
    console.error('Error deleting savings goal from MongoDB:', error)
    throw error
  }
}

