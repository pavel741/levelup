import { ObjectId } from 'mongodb'
import { getDatabase } from './mongodb'
import type { Routine, WorkoutLog } from '@/types/workout'

// Convert MongoDB ObjectId to string and handle dates
const convertMongoData = (data: any): any => {
  if (data === null || data === undefined) return data

  // Handle ObjectId
  if (data instanceof ObjectId) {
    return data.toString()
  }

  // Handle Date
  if (data instanceof Date) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => convertMongoData(item))
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const converted: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      if (key === '_id' && value instanceof ObjectId) {
        converted.id = value.toString()
      } else {
        converted[key] = convertMongoData(value)
      }
    }
    return converted
  }

  return data
}

// ---------- Collection helpers ----------

const getRoutinesCollection = async () => {
  const db = await getDatabase()
  return db.collection('workout_routines')
}

const getWorkoutLogsCollection = async () => {
  const db = await getDatabase()
  return db.collection('workout_logs')
}

// ---------- Routines ----------

// Server-side only functions - use workoutApi.ts on client side
export const getRoutinesByUserId = async (userId: string): Promise<Routine[]> => {
  try {
    const collection = await getRoutinesCollection()
    const routines = await collection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray()

    return routines.map((doc) => {
      const data = convertMongoData(doc)
      return {
        ...data,
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt),
      } as Routine
    })
  } catch (error) {
    console.error('Error fetching routines from MongoDB:', error)
    return []
  }
}

export const saveRoutine = async (routine: Routine): Promise<void> => {
  try {
    if (!routine.userId) {
      throw new Error('Cannot save routine: userId is required')
    }

    const collection = await getRoutinesCollection()
    
    const routineData: any = {
      ...routine,
      userId: routine.userId, // Ensure userId is set
      createdAt: routine.createdAt instanceof Date ? routine.createdAt : new Date(routine.createdAt),
      updatedAt: routine.updatedAt instanceof Date ? routine.updatedAt : new Date(routine.updatedAt),
    }

    // Remove undefined fields
    Object.keys(routineData).forEach(key => {
      if (routineData[key] === undefined) {
        delete routineData[key]
      }
    })

    // Use upsert to update if exists, insert if not
    const result = await collection.updateOne(
      { id: routine.id, userId: routine.userId },
      { $set: routineData },
      { upsert: true }
    )
  } catch (error) {
    console.error('❌ Error saving routine to MongoDB:', error)
    throw error
  }
}

export const updateRoutine = async (routineId: string, userId: string, updates: Partial<Routine>): Promise<void> => {
  try {
    const collection = await getRoutinesCollection()
    
    const updateData: any = { ...updates, updatedAt: new Date() }
    
    if (updates.createdAt) {
      updateData.createdAt = updates.createdAt instanceof Date ? updates.createdAt : new Date(updates.createdAt)
    }
    if (updates.updatedAt) {
      updateData.updatedAt = updates.updatedAt instanceof Date ? updates.updatedAt : new Date(updates.updatedAt)
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    await collection.updateOne(
      { id: routineId, userId },
      { $set: updateData }
    )
  } catch (error) {
    console.error('Error updating routine in MongoDB:', error)
    throw error
  }
}

export const deleteRoutine = async (routineId: string, userId: string): Promise<void> => {
  try {
    const collection = await getRoutinesCollection()
    await collection.deleteOne({ id: routineId, userId })
  } catch (error) {
    console.error('Error deleting routine from MongoDB:', error)
    throw error
  }
}

// ---------- Workout Logs ----------

// Server-side only functions - use workoutApi.ts on client side
export const getWorkoutLogsByUserId = async (userId: string): Promise<WorkoutLog[]> => {
  try {
    const collection = await getWorkoutLogsCollection()
    const logs = await collection
      .find({ userId })
      .sort({ date: -1 })
      .toArray()

    return logs.map((doc) => {
      const data = convertMongoData(doc)
      return {
        ...data,
        date: data.date instanceof Date ? data.date : new Date(data.date),
        startTime: data.startTime instanceof Date ? data.startTime : new Date(data.startTime),
        endTime: data.endTime ? (data.endTime instanceof Date ? data.endTime : new Date(data.endTime)) : undefined,
      } as WorkoutLog
    })
  } catch (error) {
    console.error('Error fetching workout logs from MongoDB:', error)
    return []
  }
}

export const saveWorkoutLog = async (log: WorkoutLog): Promise<void> => {
  try {
    const collection = await getWorkoutLogsCollection()
    
    const logData: any = {
      ...log,
      userId: log.userId,
      date: log.date instanceof Date ? log.date : new Date(log.date),
      startTime: log.startTime instanceof Date ? log.startTime : new Date(log.startTime),
    }

    if (log.endTime) {
      logData.endTime = log.endTime instanceof Date ? log.endTime : new Date(log.endTime)
    }

    // Remove undefined fields
    Object.keys(logData).forEach(key => {
      if (logData[key] === undefined) {
        delete logData[key]
      }
    })

    await collection.updateOne(
      { id: log.id, userId: log.userId },
      { $set: logData },
      { upsert: true }
    )
  } catch (error) {
    console.error('Error saving workout log to MongoDB:', error)
    throw error
  }
}

export const updateWorkoutLog = async (logId: string, userId: string, updates: Partial<WorkoutLog>): Promise<void> => {
  try {
    const collection = await getWorkoutLogsCollection()
    
    const updateData: any = { ...updates }
    
    if (updates.date) {
      updateData.date = updates.date instanceof Date ? updates.date : new Date(updates.date)
    }
    if (updates.startTime) {
      updateData.startTime = updates.startTime instanceof Date ? updates.startTime : new Date(updates.startTime)
    }
    if (updates.endTime) {
      updateData.endTime = updates.endTime instanceof Date ? updates.endTime : new Date(updates.endTime)
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    await collection.updateOne(
      { id: logId, userId },
      { $set: updateData }
    )
  } catch (error) {
    console.error('Error updating workout log in MongoDB:', error)
    throw error
  }
}

export const deleteWorkoutLog = async (logId: string, userId: string): Promise<void> => {
  try {
    const collection = await getWorkoutLogsCollection()
    await collection.deleteOne({ id: logId, userId })
  } catch (error) {
    console.error('Error deleting workout log from MongoDB:', error)
    throw error
  }
}

