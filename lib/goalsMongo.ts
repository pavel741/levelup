import { ObjectId, WithId } from 'mongodb'
import { getDatabase } from './mongodb'
import type { Goal } from '@/types'
import { queryCache, createQueryCacheKey } from './utils/queryCache'

// Convert MongoDB document to Goal type
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

// Get goals collection
const getGoalsCollection = async () => {
  const db = await getDatabase()
  return db.collection('goals')
}

// Get all goals for a user
export const getGoals = async (userId: string, filters?: { status?: Goal['status'] }): Promise<WithId<Goal>[]> => {
  const cacheKey = createQueryCacheKey('goals', userId, filters?.status)
  
  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const collection = await getGoalsCollection()
        const query: any = { userId }
        
        if (filters?.status) {
          query.status = filters.status
        }
        
        const docs = await collection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray()

        return docs.map((doc) => {
          const converted = convertMongoData(doc) as Goal
          return {
            ...converted,
            id: converted.id || doc._id.toString(),
          } as WithId<Goal>
        })
      } catch (error) {
        console.error('Error loading goals from MongoDB:', error)
        return []
      }
    },
    { ttl: 30 * 1000 } // Cache for 30 seconds
  )
}

// Get a single goal by ID
export const getGoalById = async (userId: string, goalId: string): Promise<WithId<Goal> | null> => {
  try {
    const collection = await getGoalsCollection()
    const doc = await collection.findOne({ _id: new ObjectId(goalId), userId })
    
    if (!doc) return null
    
    const converted = convertMongoData(doc) as Goal
    return {
      ...converted,
      id: converted.id || doc._id.toString(),
    } as WithId<Goal>
  } catch (error) {
    console.error('Error getting goal from MongoDB:', error)
    return null
  }
}

// Add a new goal
export const addGoal = async (
  userId: string,
  goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'progressPercentage'>
): Promise<WithId<Goal>> => {
  try {
    const collection = await getGoalsCollection()
    
    // Calculate initial progress percentage
    const progressPercentage = goal.targetValue > 0 
      ? Math.min(100, Math.max(0, (goal.currentValue / goal.targetValue) * 100))
      : 0
    
    const now = new Date()
    const goalData = {
      ...goal,
      userId,
      progressPercentage,
      createdAt: now,
      updatedAt: now,
    }
    
    const result = await collection.insertOne(goalData)
    const inserted = await collection.findOne({ _id: result.insertedId })
    
    if (!inserted) {
      throw new Error('Failed to retrieve inserted goal')
    }
    
    const converted = convertMongoData(inserted) as Goal
    const goalWithId = {
      ...converted,
      id: converted.id || result.insertedId.toString(),
    } as WithId<Goal>
    
    // Invalidate cache
    queryCache.invalidate(createQueryCacheKey('goals', userId))
    
    return goalWithId
  } catch (error) {
    console.error('Error adding goal to MongoDB:', error)
    throw error
  }
}

// Update a goal
export const updateGoal = async (
  userId: string,
  goalId: string,
  updates: Partial<Goal>
): Promise<WithId<Goal>> => {
  try {
    const collection = await getGoalsCollection()
    
    // Recalculate progress percentage if currentValue or targetValue changed
    if (updates.currentValue !== undefined || updates.targetValue !== undefined) {
      const existing = await collection.findOne({ _id: new ObjectId(goalId), userId })
      if (existing) {
        const currentValue = updates.currentValue !== undefined ? updates.currentValue : existing.currentValue
        const targetValue = updates.targetValue !== undefined ? updates.targetValue : existing.targetValue
        updates.progressPercentage = targetValue > 0 
          ? Math.min(100, Math.max(0, (currentValue / targetValue) * 100))
          : 0
        
        // Auto-complete if progress reaches 100%
        if (updates.progressPercentage >= 100 && existing.status !== 'completed') {
          updates.status = 'completed'
          updates.completedAt = new Date()
        }
      }
    }
    
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    }
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })
    
    await collection.updateOne(
      { _id: new ObjectId(goalId), userId },
      { $set: updateData }
    )
    
    const updated = await collection.findOne({ _id: new ObjectId(goalId) })
    if (!updated) {
      throw new Error('Goal not found after update')
    }
    
    const converted = convertMongoData(updated) as Goal
    const goalWithId = {
      ...converted,
      id: converted.id || goalId,
    } as WithId<Goal>
    
    // Invalidate cache
    queryCache.invalidate(createQueryCacheKey('goals', userId))
    
    return goalWithId
  } catch (error) {
    console.error('Error updating goal in MongoDB:', error)
    throw error
  }
}

// Delete a goal
export const deleteGoal = async (userId: string, goalId: string): Promise<void> => {
  try {
    const collection = await getGoalsCollection()
    await collection.deleteOne({ _id: new ObjectId(goalId), userId })
    
    // Invalidate cache
    queryCache.invalidate(createQueryCacheKey('goals', userId))
  } catch (error) {
    console.error('Error deleting goal from MongoDB:', error)
    throw error
  }
}

// Update goal progress
export const updateGoalProgress = async (
  userId: string,
  goalId: string,
  currentValue: number,
  note?: string
): Promise<WithId<Goal>> => {
  try {
    const collection = await getGoalsCollection()
    const existing = await collection.findOne({ _id: new ObjectId(goalId), userId })
    
    if (!existing) {
      throw new Error('Goal not found')
    }
    
    const progressPercentage = existing.targetValue > 0 
      ? Math.min(100, Math.max(0, (currentValue / existing.targetValue) * 100))
      : 0
    
    const updateData: any = {
      currentValue,
      progressPercentage,
      updatedAt: new Date(),
    }
    
    // Auto-complete if progress reaches 100%
    if (progressPercentage >= 100 && existing.status !== 'completed') {
      updateData.status = 'completed'
      updateData.completedAt = new Date()
    }
    
    // Add note if provided
    if (note) {
      const notes = existing.notes || []
      notes.push(`${new Date().toISOString()}: ${note}`)
      updateData.notes = notes
    }
    
    // Check and complete milestones
    const milestones = existing.milestones || []
    const updatedMilestones = milestones.map((milestone: any) => {
      if (!milestone.isCompleted && currentValue >= milestone.targetValue) {
        return {
          ...milestone,
          isCompleted: true,
          completedAt: new Date(),
          currentValue: Math.min(currentValue, milestone.targetValue),
        }
      }
      return milestone
    })
    updateData.milestones = updatedMilestones
    
    await collection.updateOne(
      { _id: new ObjectId(goalId), userId },
      { $set: updateData }
    )
    
    const updated = await collection.findOne({ _id: new ObjectId(goalId) })
    if (!updated) {
      throw new Error('Goal not found after update')
    }
    
    const converted = convertMongoData(updated) as Goal
    const goalWithId = {
      ...converted,
      id: converted.id || goalId,
    } as WithId<Goal>
    
    // Invalidate cache
    queryCache.invalidate(createQueryCacheKey('goals', userId))
    
    return goalWithId
  } catch (error) {
    console.error('Error updating goal progress in MongoDB:', error)
    throw error
  }
}

