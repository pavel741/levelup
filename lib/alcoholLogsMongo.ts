/**
 * Alcohol intake logs — MongoDB (same DB as other features; admin user only via API gate)
 */

import { ObjectId } from 'mongodb'
import type { AlcoholLog } from '@/types/alcoholLog'
import { getDatabase } from './mongodb'

interface MongoAlcoholLog extends Omit<AlcoholLog, 'id'> {
  _id: ObjectId
}

async function getCollection() {
  const db = await getDatabase()
  return db.collection<MongoAlcoholLog>('alcoholLogs')
}

function toDoc(doc: MongoAlcoholLog): AlcoholLog {
  const { _id, ...rest } = doc
  return {
    ...rest,
    id: _id.toString(),
    date: typeof doc.date === 'string' ? doc.date : String(doc.date),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
  }
}

export async function getAlcoholLogs(userId: string): Promise<AlcoholLog[]> {
  const collection = await getCollection()
  const docs = await collection.find({ userId }).sort({ date: -1, createdAt: -1 }).toArray()
  return docs.map(toDoc)
}

export async function addAlcoholLog(
  userId: string,
  entry: Pick<AlcoholLog, 'date' | 'drinks' | 'notes'>
): Promise<string> {
  const collection = await getCollection()
  const now = new Date()
  const doc: Omit<MongoAlcoholLog, '_id'> = {
    userId,
    date: entry.date,
    drinks: entry.drinks,
    notes: entry.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  }
  const result = await collection.insertOne(doc as MongoAlcoholLog)
  return result.insertedId.toString()
}

export async function deleteAlcoholLog(userId: string, logId: string): Promise<void> {
  const collection = await getCollection()
  await collection.deleteOne({ _id: new ObjectId(logId), userId })
}
