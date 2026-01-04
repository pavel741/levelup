import { ObjectId } from 'mongodb'
import { getDatabase } from './mongodb'
import type { Routine, WorkoutLog } from '@/types/workout'

type MongoValue = string | number | boolean | Date | ObjectId | null | undefined | MongoValue[] | { [key: string]: MongoValue }

// Convert MongoDB ObjectId to string and handle dates
function convertMongoData<T>(data: MongoValue): T {
  if (data === null || data === undefined) return data as T

  // Handle ObjectId
  if (data instanceof ObjectId) {
    return data.toString() as T
  }

  // Handle Date
  if (data instanceof Date) {
    return data as T
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
    console.log('[getRoutinesByUserId] Querying for userId:', userId)
    
    const routines = await collection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray()

    console.log('[getRoutinesByUserId] Found', routines.length, 'routines')
    if (routines.length === 0) {
      // Debug: Check if there are any routines with different userId formats
      const allRoutines = await collection.find({}).limit(5).toArray()
      console.log('[getRoutinesByUserId] Sample routines userIds:', allRoutines.map(r => r.userId))
    }

    return routines.map((doc) => {
      const data = convertMongoData<Record<string, unknown>>(doc) as Record<string, unknown>
      const createdAt = data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt as string | number | Date)
      const updatedAt = data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt as string | number | Date)
      return {
        ...(data as Record<string, unknown>),
        createdAt,
        updatedAt,
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
    
    const routineData: Omit<Routine, 'id'> & { _id?: ObjectId } = {
      ...routine,
      userId: routine.userId, // Ensure userId is set
      createdAt: routine.createdAt instanceof Date ? routine.createdAt : new Date(routine.createdAt),
      updatedAt: routine.updatedAt instanceof Date ? routine.updatedAt : new Date(routine.updatedAt),
    }
    
    // Remove id field for MongoDB storage
    delete (routineData as Partial<Routine>).id

    // Remove undefined fields
    const routineDataRecord = routineData as Record<string, unknown>
    Object.keys(routineDataRecord).forEach(key => {
      if (routineDataRecord[key] === undefined) {
        delete routineDataRecord[key]
      }
    })

    // Use upsert to update if exists, insert if not
    await collection.updateOne(
      { id: routine.id, userId: routine.userId },
      { $set: routineData },
      { upsert: true }
    )
  } catch (error) {
    console.error('❌ Error saving routine to MongoDB:', error)
    throw error
  }
}

export const updateRoutine = async (routineId: string, userId: string, updates: Partial<Omit<Routine, 'id' | 'userId'>>): Promise<void> => {
  try {
    const collection = await getRoutinesCollection()
    
    const updateData: Partial<Routine> = { ...updates, updatedAt: new Date() }
    
    if (updates.createdAt) {
      updateData.createdAt = updates.createdAt instanceof Date ? updates.createdAt : new Date(updates.createdAt)
    }
    if (updates.updatedAt) {
      updateData.updatedAt = updates.updatedAt instanceof Date ? updates.updatedAt : new Date(updates.updatedAt)
    }

    // Remove undefined fields
    const updateDataRecord = updateData as Record<string, unknown>
    Object.keys(updateDataRecord).forEach(key => {
      if (updateDataRecord[key] === undefined) {
        delete updateDataRecord[key]
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
      const data = convertMongoData<Record<string, unknown>>(doc) as Record<string, unknown>
      const date = data.date instanceof Date ? data.date : new Date(data.date as string | number | Date)
      const startTime = data.startTime instanceof Date ? data.startTime : new Date(data.startTime as string | number | Date)
      const endTime = data.endTime ? (data.endTime instanceof Date ? data.endTime : new Date(data.endTime as string | number | Date)) : undefined
      return {
        ...(data as Record<string, unknown>),
        date,
        startTime,
        endTime,
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
    
    const logData: Omit<WorkoutLog, 'id'> & { _id?: ObjectId } = {
      ...log,
      userId: log.userId,
      date: log.date instanceof Date ? log.date : new Date(log.date),
      startTime: log.startTime instanceof Date ? log.startTime : new Date(log.startTime),
    }
    
    // Remove id field for MongoDB storage
    delete (logData as Partial<WorkoutLog>).id

    if (log.endTime) {
      logData.endTime = log.endTime instanceof Date ? log.endTime : new Date(log.endTime)
    }

    // Remove undefined fields
    const logDataRecord = logData as Record<string, unknown>
    Object.keys(logDataRecord).forEach(key => {
      if (logDataRecord[key] === undefined) {
        delete logDataRecord[key]
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

export const updateWorkoutLog = async (logId: string, userId: string, updates: Partial<Omit<WorkoutLog, 'id' | 'userId'>>): Promise<void> => {
  try {
    const collection = await getWorkoutLogsCollection()
    
    const updateData: Partial<WorkoutLog> = { ...updates }
    
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
    const updateDataRecord = updateData as Record<string, unknown>
    Object.keys(updateDataRecord).forEach(key => {
      if (updateDataRecord[key] === undefined) {
        delete updateDataRecord[key]
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

export const deleteAllWorkoutLogs = async (userId: string): Promise<number> => {
  try {
    const collection = await getWorkoutLogsCollection()
    const result = await collection.deleteMany({ userId })
    return result.deletedCount || 0
  } catch (error) {
    console.error('Error deleting all workout logs from MongoDB:', error)
    throw error
  }
}

