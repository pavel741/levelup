import { ObjectId, Binary } from 'mongodb'
import { getDatabase } from './mongodb'
import clientPromise from './mongodb'
import {
  FinanceTransaction,
  FinanceCategories,
  FinanceBudgetGoals,
  FinanceSettings,
  FinanceReconciliationRecord,
  FinanceRecurringTransaction,
} from '@/types/finance'
import { queryCache, createQueryCacheKey } from './utils/queryCache'
import {
  encryptObjectFields,
  decryptObjectFields,
} from './utils/encryption/csfle-explicit'

// Fields to encrypt/decrypt for finance transactions
const FINANCE_TRANSACTION_ENCRYPTED_FIELDS = [
  'description',
  'account',
  'recipientName',
  'selgitus',
] as const

// Fields to encrypt/decrypt for recurring transactions
const RECURRING_TRANSACTION_ENCRYPTED_FIELDS = [
  'name',
  'description',
] as const

// ---------- Helpers ----------

type WithId<T> = T & { id: string }

interface TransactionSubscribeMeta {
  hasMore: boolean
  lastDoc: ObjectId | string | null
}

type TransactionSubscribeCallback = (
  transactions: WithId<FinanceTransaction>[],
  meta: TransactionSubscribeMeta
) => void

// Convert MongoDB ObjectId to string and handle dates
// Note: Binary objects (encrypted data) are preserved for decryption
const convertMongoData = <T = unknown>(data: unknown): T | null | undefined => {
  if (data === null || data === undefined) return data as T | null | undefined

  // Handle ObjectId
  if (data instanceof ObjectId) {
    return data.toString() as T
  }

  // Handle Date
  if (data instanceof Date) {
    return data.toISOString().split('T')[0] as T
  }

  // Handle Binary (encrypted data) - preserve as Binary for decryption
  // We'll decrypt it later in decryptObjectFields
  if (data instanceof Binary) {
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

// Ensure all Binary objects are converted to strings before JSON serialization
// This is a safety net in case decryption fails or Binary objects slip through
const ensureJsonSerializable = <T = unknown>(data: unknown): T => {
  if (data === null || data === undefined) return data as T

  // Convert Binary objects to base64 strings (shouldn't happen after decryption, but safety net)
  if (data instanceof Binary) {
    // Binary object found - shouldn't happen after decryption, but convert to base64 as fallback
    return data.toString('base64') as T
  }

  if (Array.isArray(data)) {
    return data.map((item) => ensureJsonSerializable(item)) as T
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const converted: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      converted[key] = ensureJsonSerializable(value)
    }
    return converted as T
  }

  return data as T
}

// ---------- Collection helpers ----------

const getTransactionsCollection = async (_userId: string) => {
  const db = await getDatabase()
  // Use nested collection: finance_transactions collection with userId as part of document
  // This allows better querying and indexing
  return db.collection('finance_transactions')
}

const getCategoriesCollection = async (_userId: string) => {
  const db = await getDatabase()
  return db.collection('finance_categories')
}

const getSettingsCollection = async (_userId: string) => {
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
      
      // Decrypt sensitive fields
      const client = await clientPromise
      const transactions = await Promise.all(
        docs.map(async (doc) => {
          const converted = convertMongoData(doc) as FinanceTransaction
          const transaction = {
            ...converted,
            id: converted.id || doc._id.toString(),
          } as WithId<FinanceTransaction>
          
            // Decrypt sensitive fields
            try {
              const decrypted = await decryptObjectFields(
                client,
                userId,
                transaction,
                [...FINANCE_TRANSACTION_ENCRYPTED_FIELDS]
              ) as WithId<FinanceTransaction>
              
              // Ensure all Binary objects are converted to strings (safety net)
              // This prevents Binary objects from being sent through JSON
              return ensureJsonSerializable(decrypted) as WithId<FinanceTransaction>
            } catch (error) {
              console.warn(`Failed to decrypt transaction ${transaction.id} fields:`, error instanceof Error ? error.message : error)
              // Even if decryption fails, ensure Binary objects are converted
              return ensureJsonSerializable(transaction) as WithId<FinanceTransaction>
            }
        })
      )

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
      console.error('Error loading transactions from MongoDB:', error)
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
  userId: string,
  limit?: number
): Promise<WithId<FinanceTransaction>[]> => {
  const cacheKey = createQueryCacheKey('transactions', 'summary', userId, limit || 'all')
  
  return queryCache.get(
    cacheKey,
    async () => {
      try {
        const collection = await getTransactionsCollection(userId)
        let query = collection.find({ userId }).sort({ date: -1 })
        
        // Apply limit if provided for better performance
        if (limit && limit > 0) {
          query = query.limit(limit)
        }
        
        const docs = await query.toArray()
        const client = await clientPromise
        
        // Decrypt sensitive fields
        return await Promise.all(
          docs.map(async (doc) => {
            const converted = convertMongoData(doc) as FinanceTransaction
            const transaction = {
              ...converted,
              id: converted.id || doc._id.toString(),
            } as WithId<FinanceTransaction>
            
            // Decrypt sensitive fields
            try {
              const decrypted = await decryptObjectFields(
                client,
                userId,
                transaction,
                [...FINANCE_TRANSACTION_ENCRYPTED_FIELDS]
              ) as WithId<FinanceTransaction>
              
              // Ensure all Binary objects are converted to strings (safety net)
              return ensureJsonSerializable(decrypted) as WithId<FinanceTransaction>
            } catch (error) {
              console.warn('Failed to decrypt transaction fields:', error instanceof Error ? error.message : error)
              // Even if decryption fails, ensure Binary objects are converted
              return ensureJsonSerializable(transaction) as WithId<FinanceTransaction>
            }
          })
        )
      } catch (error) {
        console.error('Error loading all transactions from MongoDB:', error)
        return []
      }
    },
    {
      ttl: 30 * 1000, // 30 seconds cache (transactions change frequently)
    }
  )
}

export const addTransaction = async (
  userId: string,
  transaction: Omit<FinanceTransaction, 'id'>
): Promise<string> => {
  try {
    const collection = await getTransactionsCollection(userId)
    const client = await clientPromise
    
    // Convert date string to Date object and add userId
    let txData = {
      ...transaction,
      userId, // Add userId to document for filtering
      date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
      createdAt: new Date(),
    }
    
    // Encrypt sensitive fields before saving
    try {
      txData = await encryptObjectFields(
        client,
        userId,
        txData as any,
        [...FINANCE_TRANSACTION_ENCRYPTED_FIELDS]
      ) as typeof txData
    } catch (error) {
      console.error('Failed to encrypt transaction fields:', error instanceof Error ? error.message : String(error))
      // Don't save unencrypted sensitive data - throw error
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    const result = await collection.insertOne(txData)
    
    // Invalidate transaction cache
    queryCache.invalidatePattern(new RegExp(`^transactions:.*:${userId}`))
    
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
    const client = await clientPromise
    
    // Convert date if present and create updateData without date first
    const { date, ...updatesWithoutDate } = updates
    let updateData: Partial<FinanceTransaction> & { date?: Date } = { ...updatesWithoutDate }
    if (date) {
      // Handle different date types: string, Date, or Timestamp
      if (date instanceof Date) {
        updateData.date = date
      } else if (typeof date === 'string') {
        updateData.date = new Date(date)
      } else if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as { toDate: () => Date }).toDate === 'function') {
        // Firestore Timestamp
        updateData.date = (date as { toDate: () => Date }).toDate()
      } else {
        updateData.date = new Date(String(date))
      }
    }
    updateData.updatedAt = new Date()
    
    // Encrypt sensitive fields in updates before saving
    try {
      // Only encrypt fields that are being updated and are in the encrypted fields list
      const fieldsToEncrypt = FINANCE_TRANSACTION_ENCRYPTED_FIELDS.filter(
        field => field in updateData && updateData[field as keyof typeof updateData] != null
      )
      if (fieldsToEncrypt.length > 0) {
        updateData = await encryptObjectFields(
          client,
          userId,
          updateData,
          [...fieldsToEncrypt]
        ) as Partial<FinanceTransaction> & { date?: Date }
      }
    } catch (error) {
      console.error('Failed to encrypt transaction update fields:', error instanceof Error ? error.message : String(error))
      // Don't save unencrypted sensitive data - throw error
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Ensure userId matches (security check)
    await collection.updateOne(
      { _id: new ObjectId(transactionId), userId },
      { $set: updateData }
    )
    
    // Invalidate transaction cache
    queryCache.invalidatePattern(new RegExp(`^transactions:.*:${userId}`))
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
    
    // Invalidate transaction cache
    queryCache.invalidatePattern(new RegExp(`^transactions:.*:${userId}`))
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
        const client = await clientPromise
        
        // Convert dates and prepare documents with userId
        let docs = chunk.map((tx) => ({
          ...tx,
          userId, // Add userId to each document
          date: tx.date instanceof Date ? tx.date : new Date(tx.date),
          createdAt: new Date(),
        }))
        
        // Encrypt sensitive fields before saving
        try {
          docs = await Promise.all(
            docs.map(async (doc) => {
              return await encryptObjectFields(
                client,
                userId,
                doc,
                [...FINANCE_TRANSACTION_ENCRYPTED_FIELDS]
              ) as typeof doc
            })
          )
        } catch (error) {
          console.error('Failed to encrypt batch transaction fields:', error)
          // Continue without encryption for backward compatibility
        }

        await collection.insertMany(docs, { ordered: false }) // Continue on errors
        successCount += chunk.length
        progressCallback?.(Math.min(i + chunk.length, total), total)
        
        // Small delay between batches to avoid overwhelming the connection (optional)
        if (i + batchSize < transactions.length) {
          await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
        }
      } catch (error: unknown) {
        console.error('Error in MongoDB batch insert:', error)
        
        // MongoDB insertMany with ordered: false continues on errors
        // Count successful inserts
        if (error && typeof error === 'object' && 'writeErrors' in error && Array.isArray(error.writeErrors)) {
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

export const deleteTransactionsByDateRange = async (
  userId: string,
  beforeDate: Date
): Promise<number> => {
  try {
    const collection = await getTransactionsCollection(userId)
    
    // Delete all transactions before the specified date
    const result = await collection.deleteMany({
      userId,
      date: { $lt: beforeDate }
    })
    
    return result.deletedCount || 0
  } catch (error) {
    console.error('Error in deleteTransactionsByDateRange MongoDB:', error)
    throw error
  }
}

export const deleteAllTransactions = async (
  userId: string
): Promise<number> => {
  try {
    const collection = await getTransactionsCollection(userId)
    
    // Delete all transactions for this user
    const result = await collection.deleteMany({ userId })
    
    return result.deletedCount || 0
  } catch (error) {
    console.error('Error in deleteAllTransactions MongoDB:', error)
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
  const cacheKey = createQueryCacheKey('categories', userId)
  
  return queryCache.get(
    cacheKey,
    async () => {
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
    },
    {
      ttl: 10 * 60 * 1000, // 10 minutes cache (categories change rarely)
    }
  )
}

export const saveCategories = async (
  userId: string,
  categories: FinanceCategories
): Promise<void> => {
  try {
    const collection = await getCategoriesCollection(userId)
    // MongoDB allows custom _id values, but TypeScript types are strict - use type assertion
    // Try to match by _id first (in case document exists without userId field)
    // Then update with userId to ensure consistency
    const filter = { _id: 'categories' as any }
    const update = { 
      $set: { 
        _id: 'categories' as any,
        userId, 
        ...categories, 
        updatedAt: new Date() 
      } 
    }
    
    const result = await collection.updateOne(filter, update, { upsert: true })
    
    // If upsert created a new document but we got a duplicate key error,
    // it means another request created it simultaneously - just update it
    if (result.upsertedCount === 0 && result.matchedCount === 0) {
      // Document might have been created by another request, try update again
      await collection.updateOne(filter, update)
    }
    
    // Invalidate categories cache
    const cacheKey = createQueryCacheKey('categories', userId)
    queryCache.invalidate(cacheKey)
  } catch (error: any) {
    // Handle duplicate key errors gracefully (race condition)
    if (error.code === 11000 || error.message?.includes('duplicate key')) {
      // Document was created by another request, just update it
      try {
        const collection = await getCategoriesCollection(userId)
        await collection.updateOne(
          { _id: 'categories' as any },
          { $set: { userId, ...categories, updatedAt: new Date() } }
        )
        const cacheKey = createQueryCacheKey('categories', userId)
        queryCache.invalidate(cacheKey)
        return
      } catch (retryError) {
        console.error('Error retrying saveCategories after duplicate key:', retryError)
        throw retryError
      }
    }
    console.error('Error saving categories to MongoDB:', error)
    throw error
  }
}

// ---------- Settings ----------

export const getFinanceSettings = async (userId: string): Promise<FinanceSettings | null> => {
  const cacheKey = createQueryCacheKey('financeSettings', userId)
  
  return queryCache.get(
    cacheKey,
    async () => {
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
    },
    {
      ttl: 10 * 60 * 1000, // 10 minutes cache (settings change rarely)
    }
  )
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
    
    // Invalidate settings cache
    const cacheKey = createQueryCacheKey('financeSettings', userId)
    queryCache.invalidate(cacheKey)
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

const getReconciliationCollection = async (_userId: string) => {
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

const getRecurringTransactionsCollection = async (_userId: string) => {
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
      const client = await clientPromise
      const docs = await collection.find({ userId }).sort({ name: 1 }).toArray()
      
      // Decrypt sensitive fields
      const transactions = await Promise.all(
        docs.map(async (doc) => {
          const converted = convertMongoData(doc) as FinanceRecurringTransaction
          const transaction = {
            ...converted,
            id: converted.id || doc._id.toString(),
          } as FinanceRecurringTransaction
          
          // Decrypt sensitive fields
          try {
            const decrypted = await decryptObjectFields(
              client,
              userId,
              transaction,
              [...RECURRING_TRANSACTION_ENCRYPTED_FIELDS]
            ) as FinanceRecurringTransaction
            
            // Ensure all Binary objects are converted to strings (safety net)
            return ensureJsonSerializable(decrypted) as FinanceRecurringTransaction
          } catch (error) {
            console.warn('Failed to decrypt recurring transaction fields:', error instanceof Error ? error.message : error)
            // Even if decryption fails, ensure Binary objects are converted
            return ensureJsonSerializable(transaction) as FinanceRecurringTransaction
          }
        })
      )

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
    const client = await clientPromise
    const docs = await collection.find({ userId }).sort({ name: 1 }).toArray()
    
    // Decrypt sensitive fields
    return await Promise.all(
      docs.map(async (doc) => {
        const converted = convertMongoData(doc) as FinanceRecurringTransaction
        const transaction = {
          ...converted,
          id: converted.id || doc._id.toString(),
        } as FinanceRecurringTransaction
        
        // Decrypt sensitive fields
        try {
          const decrypted = await decryptObjectFields(
            client,
            userId,
            transaction,
            [...RECURRING_TRANSACTION_ENCRYPTED_FIELDS]
          ) as FinanceRecurringTransaction
          
          // Ensure all Binary objects are converted to strings (safety net)
          return ensureJsonSerializable(decrypted) as FinanceRecurringTransaction
        } catch (error) {
          console.warn('Failed to decrypt recurring transaction fields (backward compatibility):', error)
          // Even if decryption fails, ensure Binary objects are converted
          return ensureJsonSerializable(transaction) as FinanceRecurringTransaction
        }
      })
    )
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
    const client = await clientPromise
    
    const convertDate = (date: any): Date | undefined => {
      if (!date) return undefined
      if (date instanceof Date) return date
      if (typeof date === 'string') return new Date(date)
      return new Date(String(date))
    }
    
    let txData = {
      ...transaction,
      userId,
      nextDate: convertDate(transaction.nextDate) || new Date(),
      dueDate: convertDate(transaction.dueDate),
      lastPaidDate: convertDate(transaction.lastPaidDate),
      isPaid: transaction.isPaid || false,
      reminderDaysBefore: transaction.reminderDaysBefore || 3,
      paymentHistory: transaction.paymentHistory?.map((p: any) => ({
        ...p,
        date: convertDate(p.date) || new Date(),
      })) || [],
      createdAt: new Date(),
    }
    
    // Encrypt sensitive fields before saving
    try {
      txData = await encryptObjectFields(
        client,
        userId,
        txData,
        [...RECURRING_TRANSACTION_ENCRYPTED_FIELDS]
      ) as typeof txData
    } catch (error) {
      console.error('Failed to encrypt recurring transaction fields:', error instanceof Error ? error.message : String(error))
      // Don't save unencrypted sensitive data - throw error
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`)
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
    // Convert dates if present
    const { nextDate, dueDate, lastPaidDate, ...updatesWithoutDates } = updates
    let updateData: Partial<FinanceRecurringTransaction> & { nextDate?: Date; dueDate?: Date; lastPaidDate?: Date } = { ...updatesWithoutDates }
    
    const convertDate = (date: any): Date | undefined => {
      if (!date) return undefined
      if (date instanceof Date) return date
      if (typeof date === 'string') return new Date(date)
      if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as { toDate: () => Date }).toDate === 'function') {
        return (date as { toDate: () => Date }).toDate()
      }
      return new Date(String(date))
    }
    
    if (nextDate) updateData.nextDate = convertDate(nextDate)
    if (dueDate) updateData.dueDate = convertDate(dueDate)
    if (lastPaidDate) updateData.lastPaidDate = convertDate(lastPaidDate)
    
    // Handle payment history updates
    if (updates.paymentHistory) {
      updateData.paymentHistory = updates.paymentHistory.map((payment: any) => ({
        ...payment,
        date: convertDate(payment.date) || new Date(),
      }))
    }
    
    updateData.updatedAt = new Date()
    
    // Encrypt sensitive fields in updates before saving
    const client = await clientPromise
    try {
      // Only encrypt fields that are being updated and are in the encrypted fields list
      const fieldsToEncrypt = RECURRING_TRANSACTION_ENCRYPTED_FIELDS.filter(
        field => field in updateData && updateData[field as keyof typeof updateData] != null
      )
      if (fieldsToEncrypt.length > 0) {
        updateData = await encryptObjectFields(
          client,
          userId,
          updateData,
          [...fieldsToEncrypt]
        ) as Partial<FinanceRecurringTransaction> & { nextDate?: Date; dueDate?: Date; lastPaidDate?: Date }
      }
    } catch (error) {
      console.error('Failed to encrypt recurring transaction update fields:', error instanceof Error ? error.message : String(error))
      // Don't save unencrypted sensitive data - throw error
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`)
    }

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

