import { ObjectId, WithId } from 'mongodb'
import { getDatabase } from './mongodb'
import type { Todo } from '@/types'
import { queryCache, createQueryCacheKey } from './utils/queryCache'

// Convert MongoDB document to Todo type
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

// Get todos collection
const getTodosCollection = async () => {
  const db = await getDatabase()
  return db.collection('todos')
}

// Get all todos for a user
export const getTodos = async (userId: string): Promise<WithId<Todo>[]> => {
  const cacheKey = createQueryCacheKey('todos', userId)
  
  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const collection = await getTodosCollection()
        const docs = await collection
          .find({ userId })
          .sort({ createdAt: -1 })
          .toArray()

        return docs.map((doc) => {
          const converted = convertMongoData(doc) as Todo
          return {
            ...converted,
            id: converted.id || doc._id.toString(),
          } as WithId<Todo>
        })
      } catch (error) {
        console.error('Error loading todos from MongoDB:', error)
        return []
      }
    },
    { ttl: 30 * 1000 } // Cache for 30 seconds
  )
}

// Add a new todo
export const addTodo = async (
  userId: string,
  todo: Omit<Todo, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const collection = await getTodosCollection()
    const todoData = {
      ...todo,
      userId,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await collection.insertOne(todoData)
    queryCache.invalidatePattern(new RegExp(`^todos:${userId}`))
    
    return result.insertedId.toString()
  } catch (error) {
    console.error('Error adding todo to MongoDB:', error)
    throw error
  }
}

// Update a todo
export const updateTodo = async (
  userId: string,
  todoId: string,
  updates: Partial<Todo>
): Promise<void> => {
  try {
    const collection = await getTodosCollection()
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }
    
    // Handle date conversions
    if (updates.dueDate) {
      updateData.dueDate = updates.dueDate instanceof Date 
        ? updates.dueDate 
        : new Date(updates.dueDate)
    }
    
    if (updates.completedAt) {
      updateData.completedAt = updates.completedAt instanceof Date
        ? updates.completedAt
        : new Date(updates.completedAt)
    }
    
    // Handle recurring nextDueDate
    if (updates.recurring?.nextDueDate) {
      updateData['recurring.nextDueDate'] = updates.recurring.nextDueDate instanceof Date
        ? updates.recurring.nextDueDate
        : new Date(updates.recurring.nextDueDate)
    }
    
    await collection.updateOne(
      { _id: new ObjectId(todoId), userId },
      { $set: updateData }
    )
    
    queryCache.invalidatePattern(new RegExp(`^todos:${userId}`))
  } catch (error) {
    console.error('Error updating todo in MongoDB:', error)
    throw error
  }
}

// Delete a todo
export const deleteTodo = async (
  userId: string,
  todoId: string
): Promise<void> => {
  try {
    const collection = await getTodosCollection()
    await collection.deleteOne({ _id: new ObjectId(todoId), userId })
    queryCache.invalidatePattern(new RegExp(`^todos:${userId}`))
  } catch (error) {
    console.error('Error deleting todo from MongoDB:', error)
    throw error
  }
}

// Complete a todo (marks as completed and handles recurring logic)
export const completeTodo = async (
  userId: string,
  todoId: string
): Promise<void> => {
  try {
    const collection = await getTodosCollection()
    const todo = await collection.findOne({ _id: new ObjectId(todoId), userId })
    
    if (!todo) {
      throw new Error('Todo not found')
    }
    
    const updateData: any = {
      isCompleted: true,
      completedAt: new Date(),
      updatedAt: new Date(),
    }
    
    // Handle recurring todos - create next instance
    if (todo.recurring && todo.recurring.type) {
      const now = new Date()
      let nextDueDate = new Date(now)
      
      switch (todo.recurring.type) {
        case 'daily':
          nextDueDate.setDate(now.getDate() + (todo.recurring.interval || 1))
          break
        case 'weekly':
          nextDueDate.setDate(now.getDate() + 7 * (todo.recurring.interval || 1))
          break
        case 'monthly':
          nextDueDate.setMonth(now.getMonth() + (todo.recurring.interval || 1))
          break
      }
      
      // Create new recurring todo instance
      const newTodoData = {
        ...todo,
        _id: undefined,
        isCompleted: false,
        completedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: nextDueDate,
        'recurring.nextDueDate': nextDueDate,
      }
      delete newTodoData._id
      
      await collection.insertOne(newTodoData)
    }
    
    await collection.updateOne(
      { _id: new ObjectId(todoId), userId },
      { $set: updateData }
    )
    
    queryCache.invalidatePattern(new RegExp(`^todos:${userId}`))
  } catch (error) {
    console.error('Error completing todo in MongoDB:', error)
    throw error
  }
}

