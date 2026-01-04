/**
 * Body Measurements MongoDB Operations
 */

import { ObjectId } from 'mongodb'
import type { BodyMeasurement } from '@/types/bodyMeasurements'
import { getDatabase } from './mongodb'

interface MongoBodyMeasurement extends Omit<BodyMeasurement, 'id'> {
  _id: ObjectId
}

async function getBodyMeasurementsCollection() {
  const db = await getDatabase()
  return db.collection<MongoBodyMeasurement>('bodyMeasurements')
}

function convertMongoData(doc: MongoBodyMeasurement): BodyMeasurement {
  const { _id, ...rest } = doc
  return {
    ...rest,
    id: _id.toString(),
    date: doc.date instanceof Date ? doc.date : new Date(doc.date),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
  } as BodyMeasurement
}

export const getBodyMeasurements = async (userId: string): Promise<BodyMeasurement[]> => {
  try {
    const collection = await getBodyMeasurementsCollection()
    const docs = await collection.find({ userId }).sort({ date: -1 }).toArray()
    return docs.map(convertMongoData)
  } catch (error) {
    console.error('Error fetching body measurements:', error)
    throw error
  }
}

export const addBodyMeasurement = async (
  userId: string,
  measurement: Omit<BodyMeasurement, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const collection = await getBodyMeasurementsCollection()
    const now = new Date()
    const doc: Omit<MongoBodyMeasurement, '_id'> = {
      ...measurement,
      userId,
      createdAt: now,
      updatedAt: now,
      date: measurement.date instanceof Date ? measurement.date : new Date(measurement.date),
    }
    const result = await collection.insertOne(doc as MongoBodyMeasurement)
    return result.insertedId.toString()
  } catch (error) {
    console.error('Error adding body measurement:', error)
    throw error
  }
}

export const updateBodyMeasurement = async (
  userId: string,
  measurementId: string,
  updates: Partial<Omit<BodyMeasurement, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  try {
    const collection = await getBodyMeasurementsCollection()
    const updateData: Partial<MongoBodyMeasurement> = {
      ...updates,
      updatedAt: new Date(),
    }
    
    // Handle date conversion
    if (updates.date) {
      updateData.date = updates.date instanceof Date ? updates.date : new Date(updates.date)
    }
    
    // Remove id from updates if present (shouldn't be updated)
    delete (updateData as Partial<BodyMeasurement>).id
    
    await collection.updateOne(
      { _id: new ObjectId(measurementId), userId },
      { $set: updateData }
    )
  } catch (error) {
    console.error('Error updating body measurement:', error)
    throw error
  }
}

export const deleteBodyMeasurement = async (userId: string, measurementId: string): Promise<void> => {
  try {
    const collection = await getBodyMeasurementsCollection()
    await collection.deleteOne({ _id: new ObjectId(measurementId), userId })
  } catch (error) {
    console.error('Error deleting body measurement:', error)
    throw error
  }
}

