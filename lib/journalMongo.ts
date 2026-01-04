import { ObjectId, WithId } from 'mongodb'
import { getDatabase } from './mongodb'
import type { JournalEntry } from '@/types'
import { queryCache, createQueryCacheKey } from './utils/queryCache'

// Convert MongoDB document to JournalEntry type
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

// Get journal collection
const getJournalCollection = async () => {
  const db = await getDatabase()
  return db.collection('journal_entries')
}

// Get all journal entries for a user
export const getJournalEntries = async (
  userId: string,
  filters?: {
    type?: JournalEntry['type']
    dateFrom?: string
    dateTo?: string
    search?: string
  }
): Promise<WithId<JournalEntry>[]> => {
  const cacheKey = createQueryCacheKey('journal', userId, JSON.stringify(filters))
  
  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const collection = await getJournalCollection()
        const query: any = { userId }
        
        if (filters?.type) {
          query.type = filters.type
        }
        
        if (filters?.dateFrom || filters?.dateTo) {
          query.date = {}
          if (filters.dateFrom) {
            query.date.$gte = filters.dateFrom
          }
          if (filters.dateTo) {
            query.date.$lte = filters.dateTo
          }
        }
        
        if (filters?.search) {
          query.$or = [
            { title: { $regex: filters.search, $options: 'i' } },
            { content: { $regex: filters.search, $options: 'i' } },
            { tags: { $in: [new RegExp(filters.search, 'i')] } },
          ]
        }
        
        const docs = await collection
          .find(query)
          .sort({ date: -1, createdAt: -1 })
          .toArray()

        return docs.map((doc) => {
          const converted = convertMongoData(doc) as JournalEntry
          return {
            ...converted,
            id: converted.id || doc._id.toString(),
          } as WithId<JournalEntry>
        })
      } catch (error) {
        console.error('Error loading journal entries from MongoDB:', error)
        return []
      }
    },
    { ttl: 30 * 1000 } // Cache for 30 seconds
  )
}

// Get a single journal entry by ID
export const getJournalEntryById = async (userId: string, entryId: string): Promise<WithId<JournalEntry> | null> => {
  try {
    const collection = await getJournalCollection()
    const doc = await collection.findOne({ _id: new ObjectId(entryId), userId })
    
    if (!doc) return null
    
    const converted = convertMongoData(doc) as JournalEntry
    return {
      ...converted,
      id: converted.id || doc._id.toString(),
    } as WithId<JournalEntry>
  } catch (error) {
    console.error('Error getting journal entry from MongoDB:', error)
    return null
  }
}

// Get journal entry for a specific date
export const getJournalEntryByDate = async (
  userId: string,
  date: string,
  type?: JournalEntry['type']
): Promise<WithId<JournalEntry> | null> => {
  try {
    const collection = await getJournalCollection()
    const query: any = { userId, date }
    if (type) {
      query.type = type
    }
    
    const doc = await collection.findOne(query)
    
    if (!doc) return null
    
    const converted = convertMongoData(doc) as JournalEntry
    return {
      ...converted,
      id: converted.id || doc._id.toString(),
    } as WithId<JournalEntry>
  } catch (error) {
    console.error('Error getting journal entry by date from MongoDB:', error)
    return null
  }
}

// Add a new journal entry
export const addJournalEntry = async (
  userId: string,
  entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const collection = await getJournalCollection()
    const entryData = {
      ...entry,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await collection.insertOne(entryData)
    queryCache.invalidatePattern(new RegExp(`^journal:${userId}`))
    
    return result.insertedId.toString()
  } catch (error) {
    console.error('Error adding journal entry to MongoDB:', error)
    throw error
  }
}

// Update a journal entry
export const updateJournalEntry = async (
  userId: string,
  entryId: string,
  updates: Partial<JournalEntry>
): Promise<void> => {
  try {
    const collection = await getJournalCollection()
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }
    
    await collection.updateOne(
      { _id: new ObjectId(entryId), userId },
      { $set: updateData }
    )
    
    queryCache.invalidatePattern(new RegExp(`^journal:${userId}`))
  } catch (error) {
    console.error('Error updating journal entry in MongoDB:', error)
    throw error
  }
}

// Delete a journal entry
export const deleteJournalEntry = async (
  userId: string,
  entryId: string
): Promise<void> => {
  try {
    const collection = await getJournalCollection()
    await collection.deleteOne({ _id: new ObjectId(entryId), userId })
    queryCache.invalidatePattern(new RegExp(`^journal:${userId}`))
  } catch (error) {
    console.error('Error deleting journal entry from MongoDB:', error)
    throw error
  }
}

// Get mood statistics
export const getMoodStatistics = async (
  userId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{
  moodCounts: Record<string, number>
  averageMoodRating: number
  moodTrend: Array<{ date: string; moodRating: number }>
}> => {
  try {
    const collection = await getJournalCollection()
    const query: any = { userId, moodRating: { $exists: true, $ne: null } }
    
    if (dateFrom || dateTo) {
      query.date = {}
      if (dateFrom) {
        query.date.$gte = dateFrom
      }
      if (dateTo) {
        query.date.$lte = dateTo
      }
    }
    
    const entries = await collection
      .find(query)
      .sort({ date: 1 })
      .toArray()
    
    const moodCounts: Record<string, number> = {}
    let totalRating = 0
    let ratingCount = 0
    const moodTrend: Array<{ date: string; moodRating: number }> = []
    
    entries.forEach((entry: any) => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1
      }
      
      if (entry.moodRating) {
        totalRating += entry.moodRating
        ratingCount++
        moodTrend.push({
          date: entry.date,
          moodRating: entry.moodRating,
        })
      }
    })
    
    return {
      moodCounts,
      averageMoodRating: ratingCount > 0 ? totalRating / ratingCount : 0,
      moodTrend,
    }
  } catch (error) {
    console.error('Error getting mood statistics from MongoDB:', error)
    return {
      moodCounts: {},
      averageMoodRating: 0,
      moodTrend: [],
    }
  }
}

// Export journal entries (for CSV/JSON export)
export const exportJournalEntries = async (
  userId: string,
  format: 'json' | 'csv' = 'json'
): Promise<string> => {
  try {
    const entries = await getJournalEntries(userId)
    
    if (format === 'json') {
      return JSON.stringify(entries, null, 2)
    } else {
      // CSV format
      const headers = ['Date', 'Type', 'Title', 'Content', 'Mood', 'Mood Rating', 'Tags', 'Created At']
      const rows = entries.map((entry) => [
        entry.date,
        entry.type,
        entry.title || '',
        entry.content.replace(/"/g, '""'), // Escape quotes
        entry.mood || '',
        entry.moodRating?.toString() || '',
        entry.tags?.join('; ') || '',
        entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
      ])
      
      const csvRows = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ]
      
      return csvRows.join('\n')
    }
  } catch (error) {
    console.error('Error exporting journal entries:', error)
    throw error
  }
}

