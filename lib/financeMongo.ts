import { ObjectId, MongoClient } from 'mongodb'
import { getDatabase } from './mongodb'
import {
  FinanceTransaction,
  FinanceCategories,
  FinanceBudgetGoals,
  FinanceSettings,
  FinanceReconciliationRecord,
  FinanceRecurringTransaction,
} from '@/types/finance'

// ---------- Helpers ----------

type WithId<T> = T & { id: string }

interface TransactionPage {
  transactions: WithId<FinanceTransaction>[]
  hasMore: boolean
  lastDoc: any | null
}

interface TransactionSubscribeMeta {
  hasMore: boolean
  lastDoc: any | null
}

type TransactionSubscribeCallback = (
  transactions: WithId<FinanceTransaction>[],
  meta: TransactionSubscribeMeta
) => void

// Convert MongoDB ObjectId to string and handle dates
const convertMongoData = (data: any): any => {
  if (data === null || data === undefined) return data

  // Handle ObjectId
  if (data instanceof ObjectId) {
    return data.toString()
  }

  // Handle Date
  if (data instanceof Date) {
    return data.toISOString().split('T')[0]
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

const getTransactionsCollection = async (userId: string) => {
  const db = await getDatabase()
  // Use nested collection: finance_transactions collection with userId as part of document
  // This allows better querying and indexing
  return db.collection('finance_transactions')
}

const getCategoriesCollection = async (userId: string) => {
  const db = await getDatabase()
  return db.collection('finance_categories')
}

const getSettingsCollection = async (userId: string) => {
  const db = await getDatabase()
  return db.collection('finance_settings')
}

// ---------- Transactions ----------

export const subscribeToTransactions = (
  userId: string,
  callback: TransactionSubscribeCallback,
  options: { limitCount?: number } = {}
): (() => void) => {
  const limitCount = options.limitCount !== undefined && options.limitCount !== null ? options.limitCount : 1000

  // MongoDB doesn't have real-time subscriptions like Firestore
  // We'll use polling instead (optimized with data comparison)
  let isActive = true
  let lastDataHash: string | null = null // Track data hash to avoid unnecessary callbacks

  // Simple hash function to detect data changes
  const hashData = (transactions: WithId<FinanceTransaction>[]): string => {
    if (transactions.length === 0) return 'empty'
    // Use first and last transaction IDs + count as hash (fast comparison)
    return `${transactions.length}-${transactions[0]?.id || ''}-${transactions[transactions.length - 1]?.id || ''}`
  }

  const loadTransactions = async () => {
    if (!isActive) return

    try {
      const collection = await getTransactionsCollection(userId)
      // Filter by userId and sort by date descending
      let query = collection.find({ userId }).sort({ date: -1 })
      
      if (limitCount > 0) {
        query = query.limit(limitCount)
      }

      const docs = await query.toArray()
      const transactions = docs.map((doc) => {
        const converted = convertMongoData(doc) as FinanceTransaction
        return {
          ...converted,
          id: converted.id || doc._id.toString(),
        } as WithId<FinanceTransaction>
      })

      // Only call callback if data actually changed
      const newHash = hashData(transactions)
      if (newHash !== lastDataHash) {
        lastDataHash = newHash
        callback(transactions, {
          hasMore: limitCount > 0 && docs.length === limitCount,
          lastDoc: docs.length > 0 ? docs[docs.length - 1]._id : null,
        })
      }
    } catch (error) {
      console.error('❌ Error loading transactions from MongoDB:', error)
      callback([], { hasMore: false, lastDoc: null })
    }
  }

  // Load immediately
  loadTransactions()

  // Poll every 10-30 seconds for updates (reduced from 2s for better performance)
  // Use longer interval for unlimited queries to reduce database load
  const pollInterval = limitCount === 0 ? 30000 : 10000 // 30s for unlimited, 10s for limited
  const intervalId = setInterval(() => {
    if (isActive) {
      loadTransactions()
    }
  }, pollInterval)

  // Return unsubscribe function
  return () => {
    isActive = false
    clearInterval(intervalId)
  }
}

export const getAllTransactionsForSummary = async (
  userId: string
): Promise<WithId<FinanceTransaction>[]> => {
  try {
    const collection = await getTransactionsCollection(userId)
    const docs = await collection.find({ userId }).sort({ date: -1 }).toArray()
    
    return docs.map((doc) => {
      const converted = convertMongoData(doc) as FinanceTransaction
      return {
        ...converted,
        id: converted.id || doc._id.toString(),
      } as WithId<FinanceTransaction>
    })
  } catch (error) {
    console.error('Error loading all transactions from MongoDB:', error)
    return []
  }
}

export const loadMoreTransactions = async (
  userId: string,
  lastDoc: any,
  limitCount = 200
): Promise<TransactionPage> => {
  try {
    const collection = await getTransactionsCollection(userId)
    let query = collection.find({ userId }).sort({ date: -1 }).limit(limitCount)

    if (lastDoc) {
      query = collection.find({ userId, _id: { $lt: new ObjectId(lastDoc) } }).sort({ date: -1 }).limit(limitCount)
    }

    const docs = await query.toArray()
    const transactions = docs.map((doc) => {
      const converted = convertMongoData(doc) as FinanceTransaction
      return {
        ...converted,
        id: converted.id || doc._id.toString(),
      } as WithId<FinanceTransaction>
    })

    return {
      transactions,
      hasMore: docs.length === limitCount,
      lastDoc: docs.length > 0 ? docs[docs.length - 1]._id : null,
    }
  } catch (error) {
    console.error('Error loading more transactions from MongoDB:', error)
    return { transactions: [], hasMore: false, lastDoc: null }
  }
}

export const addTransaction = async (
  userId: string,
  transaction: Omit<FinanceTransaction, 'id'>
): Promise<string> => {
  try {
    const collection = await getTransactionsCollection(userId)
    
    // Convert date string to Date object and add userId
    const txData = {
      ...transaction,
      userId, // Add userId to document for filtering
      date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
      createdAt: new Date(),
    }
    
    // Debug logging removed

    const result = await collection.insertOne(txData)
    return result.insertedId.toString()
  } catch (error) {
    console.error('Error adding transaction to MongoDB:', error)
    throw error
  }
}

export const updateTransaction = async (
  userId: string,
  transactionId: string,
  updates: Partial<FinanceTransaction>
): Promise<void> => {
  try {
    const collection = await getTransactionsCollection(userId)
    
    // Convert date if present
    const updateData: any = { ...updates }
    if (updates.date) {
      // Handle different date types: string, Date, or Timestamp
      if (updates.date instanceof Date) {
        updateData.date = updates.date
      } else if (typeof updates.date === 'string') {
        updateData.date = new Date(updates.date)
      } else if ((updates.date as any)?.toDate) {
        // Firestore Timestamp
        updateData.date = (updates.date as any).toDate()
      } else {
        updateData.date = new Date(updates.date as any)
      }
    }
    updateData.updatedAt = new Date()

    // Ensure userId matches (security check)
    await collection.updateOne(
      { _id: new ObjectId(transactionId), userId },
      { $set: updateData }
    )
  } catch (error) {
    console.error('Error updating transaction in MongoDB:', error)
    throw error
  }
}

export const deleteTransaction = async (
  userId: string,
  transactionId: string
): Promise<void> => {
  try {
    const collection = await getTransactionsCollection(userId)
    // Ensure userId matches (security check)
    await collection.deleteOne({ _id: new ObjectId(transactionId), userId })
  } catch (error) {
    console.error('Error deleting transaction from MongoDB:', error)
    throw error
  }
}

/**
 * Check for existing transactions by archiveId
 * Returns a Set of archiveIds that already exist in the database
 * Optimized to only fetch archiveId field and batch large queries
 */
export const checkExistingArchiveIds = async (
  userId: string,
  archiveIds: string[]
): Promise<Set<string>> => {
  try {
    const collection = await getTransactionsCollection(userId)
    // Filter out empty/null archiveIds
    const validArchiveIds = archiveIds.filter(id => id && id.trim().length > 0)
    
    if (validArchiveIds.length === 0) {
      return new Set()
    }
    
    const existingArchiveIds = new Set<string>()
    
    // MongoDB $in can handle large arrays, but we'll batch for very large imports (10k+)
    // This prevents potential query size limits and improves performance
    const batchSize = 10000
    const startTime = Date.now()
    
    for (let i = 0; i < validArchiveIds.length; i += batchSize) {
      const batch = validArchiveIds.slice(i, i + batchSize)
      
      // Only fetch archiveId field (projection) - much faster than fetching full documents
      const existingDocs = await collection.find(
        {
          userId,
          archiveId: { $in: batch }
        },
        {
          projection: { archiveId: 1, _id: 0 } // Only fetch archiveId, not entire documents
        }
      ).toArray()
      
      // Add found archiveIds to the set
      existingDocs.forEach(doc => {
        if (doc.archiveId) {
          existingArchiveIds.add(doc.archiveId)
        }
      })
    }
    
    const duration = Date.now() - startTime
    if (duration > 1000) {
    }
    
    return existingArchiveIds
  } catch (error) {
    console.error('Error checking existing archiveIds:', error)
    // On error, return empty set (will import all to be safe)
    return new Set()
  }
}

export const batchAddTransactions = async (
  userId: string,
  transactions: Omit<FinanceTransaction, 'id'>[],
  progressCallback?: (current: number, total: number) => void,
  options?: { skipDuplicates?: boolean }
): Promise<{ success: number; errors: number; skipped: number }> => {
  try {
    const collection = await getTransactionsCollection(userId)
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    
    // Check for duplicates if skipDuplicates option is enabled
    let existingArchiveIds = new Set<string>()
    if (options?.skipDuplicates) {
      const archiveIds = transactions
        .map(tx => (tx as any).archiveId)
        .filter((id): id is string => Boolean(id && typeof id === 'string'))
      
      if (archiveIds.length > 0) {
        const checkStartTime = Date.now()
        existingArchiveIds = await checkExistingArchiveIds(userId, archiveIds)
        const checkDuration = Date.now() - checkStartTime
        
        // If check took more than 2 seconds, log a warning
        if (checkDuration > 2000) {
          console.warn(`⚠️ Duplicate check took ${(checkDuration / 1000).toFixed(1)}s - consider adding MongoDB index on userId + archiveId`)
        }
      }
    }
    
    // Filter out duplicates if skipDuplicates is enabled
    let transactionsToImport = transactions
    if (options?.skipDuplicates && existingArchiveIds.size > 0) {
      transactionsToImport = transactions.filter(tx => {
        const archiveId = (tx as any).archiveId
        if (archiveId && existingArchiveIds.has(archiveId)) {
          skippedCount++
          return false
        }
        return true
      })
    }
    
    const total = transactionsToImport.length

    // MongoDB can handle large batches efficiently - no quota limits!
    // Using 1000 per batch for optimal performance
    const batchSize = 1000

    for (let i = 0; i < transactionsToImport.length; i += batchSize) {
      const chunk = transactionsToImport.slice(i, i + batchSize)

      try {
        // Convert dates and prepare documents with userId
        const docs = chunk.map((tx) => ({
          ...tx,
          userId, // Add userId to each document
          date: tx.date instanceof Date ? tx.date : new Date(tx.date),
          createdAt: new Date(),
        }))
        
        // Debug: Log selgitus in first few transactions
        const docsWithSelgitus = docs.filter(d => 'selgitus' in d)
        if (docsWithSelgitus.length > 0 && i === 0) {
        }

        await collection.insertMany(docs, { ordered: false }) // Continue on errors
        successCount += chunk.length
        progressCallback?.(Math.min(i + chunk.length, total), total)
        
        // Small delay between batches to avoid overwhelming the connection (optional)
        if (i + batchSize < transactions.length) {
          await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
        }
      } catch (error: any) {
        console.error('Error in MongoDB batch insert:', error)
        
        // MongoDB insertMany with ordered: false continues on errors
        // Count successful inserts
        if (error.writeErrors) {
          errorCount += error.writeErrors.length
          successCount += chunk.length - error.writeErrors.length
        } else {
          errorCount += chunk.length
        }
      }
    }

    return { success: successCount, errors: errorCount, skipped: skippedCount }
  } catch (error) {
    console.error('Error in batchAddTransactions MongoDB:', error)
    throw error
  }
}

export const batchDeleteTransactions = async (
  userId: string,
  transactionIds: string[]
): Promise<void> => {
  try {
    const collection = await getTransactionsCollection(userId)
    const objectIds = transactionIds.map((id) => new ObjectId(id))
    
    // Ensure userId matches (security check)
    await collection.deleteMany({ _id: { $in: objectIds }, userId })
  } catch (error) {
    console.error('Error in batchDeleteTransactions MongoDB:', error)
    throw error
  }
}

// ---------- Categories ----------

export const subscribeToCategories = (
  userId: string,
  callback: (categories: FinanceCategories) => void
): (() => void) => {
  let isActive = true

  const loadCategories = async () => {
    if (!isActive) return

    try {
      const collection = await getCategoriesCollection(userId)
      // MongoDB allows custom _id values, but TypeScript types are strict - use type assertion
      const doc = await collection.findOne({ userId, _id: 'categories' as any })
      
      if (doc) {
        const categories = convertMongoData(doc) as any
        delete categories.id // Remove the _id -> id conversion
        delete categories.userId // Remove userId from categories object
        callback(categories || {})
      } else {
        callback({})
      }
    } catch (error) {
      console.error('Error loading categories from MongoDB:', error)
      callback({})
    }
  }

  loadCategories()

  // Poll every 3 seconds
  const intervalId = setInterval(() => {
    if (isActive) {
      loadCategories()
    }
  }, 3000)

  return () => {
    isActive = false
    clearInterval(intervalId)
  }
}

export const getCategories = async (userId: string): Promise<FinanceCategories> => {
  try {
    const collection = await getCategoriesCollection(userId)
    // MongoDB allows custom _id values, but TypeScript types are strict - use type assertion
    const doc = await collection.findOne({ userId, _id: 'categories' as any })
    
    if (doc) {
      const categories = convertMongoData(doc) as any
      delete categories.id
      delete categories.userId
      return categories || {}
    }
    return {}
  } catch (error) {
    console.error('Error getting categories from MongoDB:', error)
    return {}
  }
}

export const saveCategories = async (
  userId: string,
  categories: FinanceCategories
): Promise<void> => {
  try {
    const collection = await getCategoriesCollection(userId)
    // MongoDB allows custom _id values, but TypeScript types are strict - use type assertion
    await collection.updateOne(
      { userId, _id: 'categories' as any },
      { $set: { userId, ...categories, updatedAt: new Date() } },
      { upsert: true }
    )
  } catch (error) {
    console.error('Error saving categories to MongoDB:', error)
    throw error
  }
}

// ---------- Settings ----------

export const getFinanceSettings = async (userId: string): Promise<FinanceSettings | null> => {
  try {
    const collection = await getSettingsCollection(userId)
    // MongoDB allows custom _id values, but TypeScript types are strict - use type assertion
    const doc = await collection.findOne({ userId, _id: 'settings' as any })
    
    if (doc) {
      const settings = convertMongoData(doc) as any
      delete settings.id
      delete settings.userId
      return settings || null
    }
    return null
  } catch (error) {
    console.error('Error getting finance settings from MongoDB:', error)
    return null
  }
}

export const saveFinanceSettings = async (
  userId: string,
  settings: FinanceSettings
): Promise<void> => {
  try {
    const collection = await getSettingsCollection(userId)
    await collection.updateOne(
      { userId, _id: 'settings' as any },
      { $set: { userId, ...settings, updatedAt: new Date() } },
      { upsert: true }
    )
  } catch (error) {
    console.error('Error saving finance settings to MongoDB:', error)
    throw error
  }
}

// ---------- Budget Goals ----------

export const getBudgetGoals = async (userId: string): Promise<FinanceBudgetGoals | null> => {
  try {
    const collection = await getSettingsCollection(userId)
    // MongoDB allows custom _id values, but TypeScript types are strict - use type assertion
    const doc = await collection.findOne({ userId, _id: 'budgetGoals' as any })
    
    if (doc) {
      const goals = convertMongoData(doc) as any
      delete goals.id
      delete goals.userId
      return goals || null
    }
    return null
  } catch (error) {
    console.error('Error getting budget goals from MongoDB:', error)
    return null
  }
}

export const saveBudgetGoals = async (
  userId: string,
  goals: FinanceBudgetGoals
): Promise<void> => {
  try {
    const collection = await getSettingsCollection(userId)
    await collection.updateOne(
      { userId, _id: 'budgetGoals' as any },
      { $set: { userId, ...goals, updatedAt: new Date() } },
      { upsert: true }
    )
  } catch (error) {
    console.error('Error saving budget goals to MongoDB:', error)
    throw error
  }
}

// ---------- Reconciliation ----------

const getReconciliationCollection = async (userId: string) => {
  const db = await getDatabase()
  return db.collection('finance_reconciliation')
}

export const subscribeToReconciliationHistory = (
  userId: string,
  callback: (records: FinanceReconciliationRecord[]) => void
): (() => void) => {
  let isActive = true

  const loadRecords = async () => {
    if (!isActive) return

    try {
      const collection = await getReconciliationCollection(userId)
      const docs = await collection.find({ userId }).sort({ timestamp: -1 }).toArray()
      
      const records = docs.map((doc) => {
        const converted = convertMongoData(doc) as FinanceReconciliationRecord
        return {
          ...converted,
          id: converted.id || doc._id.toString(),
        } as FinanceReconciliationRecord
      })

      callback(records)
    } catch (error) {
      console.error('Error loading reconciliation records from MongoDB:', error)
      callback([])
    }
  }

  loadRecords()

  const intervalId = setInterval(() => {
    if (isActive) {
      loadRecords()
    }
  }, 3000)

  return () => {
    isActive = false
    clearInterval(intervalId)
  }
}

export const getReconciliationRecords = async (
  userId: string
): Promise<FinanceReconciliationRecord[]> => {
  try {
    const collection = await getReconciliationCollection(userId)
    const docs = await collection.find({ userId }).sort({ timestamp: -1 }).toArray()
    
    return docs.map((doc) => {
      const converted = convertMongoData(doc) as FinanceReconciliationRecord
      return {
        ...converted,
        id: converted.id || doc._id.toString(),
      } as FinanceReconciliationRecord
    })
  } catch (error) {
    console.error('Error getting reconciliation records from MongoDB:', error)
    return []
  }
}

export const addReconciliationRecord = async (
  userId: string,
  record: Omit<FinanceReconciliationRecord, 'id'>
): Promise<string> => {
  try {
    const collection = await getReconciliationCollection(userId)
    const recordData = {
      ...record,
      userId,
      timestamp: record.timestamp instanceof Date ? record.timestamp : new Date(record.timestamp),
      createdAt: new Date(),
    }
    const result = await collection.insertOne(recordData)
    return result.insertedId.toString()
  } catch (error) {
    console.error('Error adding reconciliation record to MongoDB:', error)
    throw error
  }
}

export const getLastReconciliation = async (userId: string): Promise<FinanceReconciliationRecord | null> => {
  try {
    const collection = await getReconciliationCollection(userId)
    const doc = await collection.findOne({ userId }, { sort: { timestamp: -1 } })
    
    if (doc) {
      const record = convertMongoData(doc) as FinanceReconciliationRecord
      return {
        ...record,
        id: record.id || doc._id.toString(),
      } as FinanceReconciliationRecord
    }
    return null
  } catch (error) {
    console.error('Error getting last reconciliation from MongoDB:', error)
    return null
  }
}

export const saveLastReconciliation = async (
  userId: string,
  record: FinanceReconciliationRecord
): Promise<void> => {
  try {
    const collection = await getSettingsCollection(userId)
    await collection.updateOne(
      { userId, _id: 'lastReconciliation' as any },
      { $set: { userId, ...record, updatedAt: new Date() } },
      { upsert: true }
    )
  } catch (error) {
    console.error('Error saving last reconciliation to MongoDB:', error)
    throw error
  }
}

// ---------- Recurring Transactions ----------

const getRecurringTransactionsCollection = async (userId: string) => {
  const db = await getDatabase()
  return db.collection('finance_recurring')
}

export const subscribeToRecurringTransactions = (
  userId: string,
  callback: (transactions: FinanceRecurringTransaction[]) => void
): (() => void) => {
  let isActive = true

  const loadTransactions = async () => {
    if (!isActive) return

    try {
      const collection = await getRecurringTransactionsCollection(userId)
      const docs = await collection.find({ userId }).sort({ name: 1 }).toArray()
      
      const transactions = docs.map((doc) => {
        const converted = convertMongoData(doc) as FinanceRecurringTransaction
        return {
          ...converted,
          id: converted.id || doc._id.toString(),
        } as FinanceRecurringTransaction
      })

      callback(transactions)
    } catch (error) {
      console.error('Error loading recurring transactions from MongoDB:', error)
      callback([])
    }
  }

  loadTransactions()

  // Poll every 30 seconds for recurring transactions (less frequent updates needed)
  const intervalId = setInterval(() => {
    if (isActive) {
      loadTransactions()
    }
  }, 30000)

  return () => {
    isActive = false
    clearInterval(intervalId)
  }
}

export const getRecurringTransactions = async (
  userId: string
): Promise<FinanceRecurringTransaction[]> => {
  try {
    const collection = await getRecurringTransactionsCollection(userId)
    const docs = await collection.find({ userId }).sort({ name: 1 }).toArray()
    
    return docs.map((doc) => {
      const converted = convertMongoData(doc) as FinanceRecurringTransaction
      return {
        ...converted,
        id: converted.id || doc._id.toString(),
      } as FinanceRecurringTransaction
    })
  } catch (error) {
    console.error('Error getting recurring transactions from MongoDB:', error)
    return []
  }
}

export const addRecurringTransaction = async (
  userId: string,
  transaction: Omit<FinanceRecurringTransaction, 'id'>
): Promise<string> => {
  try {
    const collection = await getRecurringTransactionsCollection(userId)
    const txData = {
      ...transaction,
      userId,
      nextDate: transaction.nextDate instanceof Date ? transaction.nextDate : (transaction.nextDate ? new Date(transaction.nextDate) : new Date()),
      createdAt: new Date(),
    }
    const result = await collection.insertOne(txData)
    return result.insertedId.toString()
  } catch (error) {
    console.error('Error adding recurring transaction to MongoDB:', error)
    throw error
  }
}

export const updateRecurringTransaction = async (
  userId: string,
  id: string,
  updates: Partial<FinanceRecurringTransaction>
): Promise<void> => {
  try {
    const collection = await getRecurringTransactionsCollection(userId)
    const updateData: any = { ...updates }
    if (updates.nextDate) {
      // Handle different date types: string, Date, or Timestamp
      if (updates.nextDate instanceof Date) {
        updateData.nextDate = updates.nextDate
      } else if (typeof updates.nextDate === 'string') {
        updateData.nextDate = new Date(updates.nextDate)
      } else if ((updates.nextDate as any)?.toDate) {
        // Firestore Timestamp
        updateData.nextDate = (updates.nextDate as any).toDate()
      } else {
        updateData.nextDate = new Date(updates.nextDate as any)
      }
    }
    updateData.updatedAt = new Date()

    await collection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: updateData }
    )
  } catch (error) {
    console.error('Error updating recurring transaction in MongoDB:', error)
    throw error
  }
}

export const deleteRecurringTransaction = async (
  userId: string,
  id: string
): Promise<void> => {
  try {
    const collection = await getRecurringTransactionsCollection(userId)
    await collection.deleteOne({ _id: new ObjectId(id), userId })
  } catch (error) {
    console.error('Error deleting recurring transaction from MongoDB:', error)
    throw error
  }
}

