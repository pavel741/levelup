import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  type QuerySnapshot,
  type DocumentSnapshot,
  Timestamp,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import {
  FinanceTransaction,
  FinanceCategories,
  FinanceBudgetGoals,
  FinanceSettings,
  FinanceReconciliationRecord,
  FinanceRecurringTransaction,
} from '@/types/finance'

if (!db) {
  // This mirrors the pattern used in lib/firestore.ts
  // and will surface a clear error if Firebase is not initialised.
  console.error('❌ Firestore is not initialized. Finance features will not work.')
}

// ---------- Helpers ----------

type WithId<T> = T & { id: string }

interface TransactionPage {
  transactions: WithId<FinanceTransaction>[]
  hasMore: boolean
  lastDoc: QueryDocumentSnapshot | null
}

interface TransactionSubscribeMeta {
  hasMore: boolean
  lastDoc: QueryDocumentSnapshot | null
}

type TransactionSubscribeCallback = (
  transactions: WithId<FinanceTransaction>[],
  meta: TransactionSubscribeMeta
) => void

// Convert Firestore Timestamp and nested objects into plain JS values,
// turning Timestamps into "yyyy-MM-dd" strings when possible.
export const convertFirestoreData = <T = unknown>(data: unknown): T | null | undefined => {
  if (data === null || data === undefined) return data as T | null | undefined

  // Handle Timestamp or Timestamp-like
  const isTimestampLike = (obj: unknown): obj is { toDate: () => Date; seconds?: number; nanoseconds?: number } => {
    return typeof obj === 'object' &&
      obj !== null &&
      'toDate' in obj &&
      typeof (obj as { toDate: unknown }).toDate === 'function' &&
      (typeof (obj as { seconds?: unknown }).seconds === 'number' ||
        typeof (obj as { nanoseconds?: unknown }).nanoseconds === 'number')
  }
  
  if (data instanceof Timestamp || isTimestampLike(data)) {
    try {
      const date = (data as Timestamp).toDate()
      return date.toISOString().split('T')[0] as T
    } catch (e) {
      console.warn('Error converting Timestamp to Date in financeFirestore:', e)
      return data as T
    }
  }

  if (Array.isArray(data)) {
    return data.map((item) => convertFirestoreData(item)) as T
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const converted: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertFirestoreData(value)
    }
    return converted as T
  }

  return data as T
}

// Very small retry helper for important write operations
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  initialDelay = 500
): Promise<T> => {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: unknown) {
      lastError = error

      const code = error && typeof error === 'object' && 'code' in error ? (error as { code?: string }).code : undefined
      const message = error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string' ? (error as { message: string }).message : undefined
      const isRetryable =
        code === 'unavailable' ||
        code === 'deadline-exceeded' ||
        code === 'resource-exhausted' ||
        code === 'aborted' ||
        code === 'cancelled' ||
        (message?.includes('network') ?? false) ||
        (message?.includes('timeout') ?? false)

      if (!isRetryable || attempt === maxRetries) {
        throw error
      }

      const delay = initialDelay * Math.pow(2, attempt)
      console.warn(
        `Finance Firestore operation failed (attempt ${attempt + 1}/${
          maxRetries + 1
        }), retrying in ${delay}ms...`,
        error
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// ---------- Collection refs ----------

const getTransactionsRef = (userId: string) =>
  collection(db!, 'users', userId, 'transactions')

const getCategoriesRef = (userId: string) =>
  doc(db!, 'users', userId, 'settings', 'categories')

const getBudgetGoalsRef = (userId: string) =>
  doc(db!, 'users', userId, 'settings', 'budgetGoals')

const getSettingsRef = (userId: string) =>
  doc(db!, 'users', userId, 'settings', 'appSettings')

const getReconciliationHistoryRef = (userId: string) =>
  collection(db!, 'users', userId, 'reconciliationHistory')

const getLastReconciliationRef = (userId: string) =>
  doc(db!, 'users', userId, 'settings', 'lastReconciliation')

const getRecurringTransactionsRef = (userId: string) =>
  collection(db!, 'users', userId, 'recurringTransactions')

// ---------- Transactions ----------

export const subscribeToTransactions = (
  userId: string,
  callback: TransactionSubscribeCallback,
  options: { limitCount?: number } = {}
): (() => void) => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const transactionsRef = getTransactionsRef(userId)
  const limitCount =
    options.limitCount !== undefined && options.limitCount !== null
      ? options.limitCount
      : 500

  let q = query(transactionsRef, orderBy('date', 'desc'))
  if (limitCount > 0) {
    q = query(q, limit(limitCount))
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const transactions: WithId<FinanceTransaction>[] = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        const converted = convertFirestoreData(data) as FinanceTransaction
        const { id: _ignoreId, ...rest } = converted as any
        transactions.push({
          ...(rest as FinanceTransaction),
          id: docSnap.id,
        })
      })
      callback(transactions, {
        hasMore: limitCount > 0 && snapshot.size === limitCount,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      })
    },
    (error) => {
      console.error('❌ Error in finance transactions subscription:', error)
      callback([], { hasMore: false, lastDoc: null })
    }
  )
}

/**
 * Get all transactions for summary calculations (no limit)
 * This loads all transactions in batches to avoid Firestore limits
 */
export const getAllTransactionsForSummary = async (
  userId: string
): Promise<WithId<FinanceTransaction>[]> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const transactionsRef = getTransactionsRef(userId)
  const allTransactions: WithId<FinanceTransaction>[] = []
  let lastDoc: QueryDocumentSnapshot | null = null
  const batchSize = 1000 // Firestore limit per query

  while (true) {
    let q = query(transactionsRef, orderBy('date', 'desc'), limit(batchSize))
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      break
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      const converted = convertFirestoreData<FinanceTransaction & { id?: string }>(data)
      if (converted === null || converted === undefined) {
        return // Skip null/undefined conversions
      }
      const { id: _ignoreId, ...rest } = converted
      allTransactions.push({
        ...(rest as FinanceTransaction),
        id: docSnap.id,
      })
    })

    // If we got fewer than batchSize, we've reached the end
    if (snapshot.size < batchSize) {
      break
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1]
  }

  return allTransactions
}

export const loadMoreTransactions = async (
  userId: string,
  lastDoc: QueryDocumentSnapshot | null,
  limitCount = 200
): Promise<TransactionPage> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const transactionsRef = getTransactionsRef(userId)
  let q = query(transactionsRef, orderBy('date', 'desc'), limit(limitCount))

  if (lastDoc) {
    q = query(q, startAfter(lastDoc))
  }

  const snapshot = await getDocs(q)
  const transactions: WithId<FinanceTransaction>[] = []

  snapshot.forEach((docSnap) => {
    const data = docSnap.data()
    const converted = convertFirestoreData(data) as FinanceTransaction
    const { id: _ignoreId, ...rest } = converted as any
    transactions.push({
      ...(rest as FinanceTransaction),
      id: docSnap.id,
    })
  })

  return {
    transactions,
    hasMore: snapshot.size === limitCount,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  }
}

export const addTransaction = async (
  userId: string,
  transaction: Omit<FinanceTransaction, 'id'>
): Promise<string> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  return retryOperation(async () => {
    const transactionsRef = getTransactionsRef(userId)
    const docRef = await addDoc(transactionsRef, transaction as any)
    return docRef.id
  })
}

export const updateTransaction = async (
  userId: string,
  transactionId: string,
  updates: Partial<FinanceTransaction>
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  return retryOperation(async () => {
    const transactionRef = doc(getTransactionsRef(userId), transactionId)
    await updateDoc(transactionRef, updates as any)
  })
}

export const deleteTransaction = async (
  userId: string,
  transactionId: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  return retryOperation(async () => {
    const transactionRef = doc(getTransactionsRef(userId), transactionId)
    await deleteDoc(transactionRef)
  })
}

export const batchAddTransactions = async (
  userId: string,
  transactions: Omit<FinanceTransaction, 'id'>[],
  progressCallback?: (current: number, total: number) => void
): Promise<{ success: number; errors: number }> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const dbInstance = db // Store in const so TypeScript knows it's defined
  // Very small batch size to avoid quota limits (Firestore free tier has strict limits)
  // Free tier: ~20k writes/day, ~1 write/second sustained
  // Using conservative settings: 20 transactions per batch, 3 seconds between batches
  const batchSize = 20
  let successCount = 0
  let errorCount = 0
  const total = transactions.length
  let consecutiveQuotaErrors = 0
  const maxConsecutiveQuotaErrors = 3

  for (let i = 0; i < transactions.length; i += batchSize) {
    const chunk = transactions.slice(i, i + batchSize)

    try {
      await retryOperation(async () => {
        const batch = writeBatch(dbInstance)
        const transactionsRef = getTransactionsRef(userId)

        chunk.forEach((tx) => {
          const docRef = doc(transactionsRef)
          batch.set(docRef, tx as any)
        })

        await batch.commit()
      }, 1, 2000) // Reduced retries, longer initial delay

      successCount += chunk.length
      consecutiveQuotaErrors = 0 // Reset on success
      progressCallback?.(Math.min(i + chunk.length, total), total)
      
      // Add delay between batches to avoid hitting rate limits
      // Only delay if there are more batches to process
      if (i + batchSize < transactions.length) {
        // Wait 3 seconds between batches to respect Firestore free tier limits
        // Free tier allows ~1 write/second sustained, so we need longer delays
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    } catch (error: unknown) {
      console.error('Error in finance batchAddTransactions chunk:', error)
      
      // If quota exceeded, wait longer before retrying
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code?: string }).code : undefined
      if (errorCode === 'resource-exhausted') {
        consecutiveQuotaErrors++
        
        if (consecutiveQuotaErrors >= maxConsecutiveQuotaErrors) {
          console.error(`Too many consecutive quota errors (${consecutiveQuotaErrors}). Stopping import.`)
          throw new Error(
            `Firestore quota exceeded. Import stopped after ${successCount} transactions. ` +
            `Please wait a few hours (quota resets daily) and try importing the remaining ${total - successCount} transactions. ` +
            `Free tier limit: ~20k writes/day shared across all users. ` +
            `Tip: Split your CSV into smaller files (500-1000 transactions each) and import over multiple days.`
          )
        }
        
        // Exponential backoff: wait longer with each consecutive error
        const waitTime = Math.min(5000 * Math.pow(2, consecutiveQuotaErrors - 1), 30000) // Max 30 seconds
        console.warn(`Firestore quota exceeded (${consecutiveQuotaErrors}/${maxConsecutiveQuotaErrors}). Waiting ${waitTime/1000} seconds...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        
        // Retry this chunk once more with longer delay
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)) // Extra delay before retry
          await retryOperation(async () => {
            const batch = writeBatch(dbInstance)
            const transactionsRef = getTransactionsRef(userId)

            chunk.forEach((tx) => {
              const docRef = doc(transactionsRef)
              batch.set(docRef, tx as Omit<FinanceTransaction, 'id'>)
            })

            await batch.commit()
          }, 1, 3000)
          successCount += chunk.length
          consecutiveQuotaErrors = 0 // Reset on successful retry
          progressCallback?.(Math.min(i + chunk.length, total), total)
        } catch (retryError: unknown) {
          console.error('Retry failed for chunk:', retryError)
          const retryErrorCode = retryError && typeof retryError === 'object' && 'code' in retryError ? (retryError as { code?: string }).code : undefined
          if (retryErrorCode === 'resource-exhausted') {
            // Still quota error, increment counter
            errorCount += chunk.length
          } else {
            errorCount += chunk.length
          }
        }
      } else {
        errorCount += chunk.length
        consecutiveQuotaErrors = 0 // Reset on non-quota error
      }
    }
  }

  return { success: successCount, errors: errorCount }
}

export const batchDeleteTransactions = async (
  userId: string,
  transactionIds: string[]
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const dbInstance = db // Store in const so TypeScript knows it's defined
  const batchSize = 500

  for (let i = 0; i < transactionIds.length; i += batchSize) {
    const chunk = transactionIds.slice(i, i + batchSize)

    await retryOperation(async () => {
      const batch = writeBatch(dbInstance)
      chunk.forEach((id) => {
        const ref = doc(getTransactionsRef(userId), id)
        batch.delete(ref)
      })
      await batch.commit()
    })
  }
}

export const deleteTransactionsByDateRange = async (
  userId: string,
  beforeDate: Date
): Promise<number> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const dbInstance = db
  const transactionsRef = getTransactionsRef(userId)
  const batchSize = 500
  let deletedCount = 0
  let lastDoc: QueryDocumentSnapshot | null = null

  // Query transactions before the specified date
  // Note: Firestore requires an index for queries with where + orderBy on different fields
  // We'll query by date only and filter userId in memory if needed, or use date field for both
  const beforeTimestamp = Timestamp.fromDate(beforeDate)

  while (true) {
    let transactionsQuery
    if (lastDoc) {
      transactionsQuery = query(
        transactionsRef,
        where('date', '<', beforeTimestamp),
        orderBy('date', 'desc'),
        startAfter(lastDoc),
        limit(batchSize)
      )
    } else {
      transactionsQuery = query(
        transactionsRef,
        where('date', '<', beforeTimestamp),
        orderBy('date', 'desc'),
        limit(batchSize)
      )
    }

    const snapshot: QuerySnapshot = await getDocs(transactionsQuery)
    
    if (snapshot.empty) {
      break
    }

    // Filter by userId and delete in batches
    const userDocs = snapshot.docs.filter((doc: DocumentSnapshot) => doc.data()?.userId === userId)
    
    if (userDocs.length === 0) {
      // No more matching docs
      break
    }

    // Delete in batches of 500 (Firestore batch limit)
    for (let i = 0; i < userDocs.length; i += batchSize) {
      const chunk = userDocs.slice(i, i + batchSize)
      
      await retryOperation(async () => {
        const batch = writeBatch(dbInstance)
        chunk.forEach((doc) => {
          batch.delete(doc.ref)
        })
        await batch.commit()
        deletedCount += chunk.length
      })
    }

    // Update lastDoc for pagination
    lastDoc = snapshot.docs[snapshot.docs.length - 1]

    // If we got fewer docs than batchSize, we're done
    if (snapshot.docs.length < batchSize) {
      break
    }
  }

  return deletedCount
}

export const deleteAllTransactions = async (
  userId: string
): Promise<number> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const dbInstance = db
  const transactionsRef = getTransactionsRef(userId)
  const batchSize = 500
  let deletedCount = 0
  let lastDoc: QueryDocumentSnapshot | null = null

  // Query all transactions for this user
  while (true) {
    let transactionsQuery
    if (lastDoc) {
      transactionsQuery = query(
        transactionsRef,
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        startAfter(lastDoc),
        limit(batchSize)
      )
    } else {
      transactionsQuery = query(
        transactionsRef,
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(batchSize)
      )
    }

    const snapshot: QuerySnapshot = await getDocs(transactionsQuery)
    
    if (snapshot.empty) {
      break
    }

    // Delete in batches of 500 (Firestore batch limit)
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const chunk = snapshot.docs.slice(i, i + batchSize)
      
      await retryOperation(async () => {
        const batch = writeBatch(dbInstance)
        chunk.forEach((doc: DocumentSnapshot) => {
          batch.delete(doc.ref)
        })
        await batch.commit()
        deletedCount += chunk.length
      })
    }

    // Update lastDoc for pagination
    lastDoc = snapshot.docs[snapshot.docs.length - 1]

    // If we got fewer docs than batchSize, we're done
    if (snapshot.docs.length < batchSize) {
      break
    }
  }

  return deletedCount
}

export const getTransaction = async (
  userId: string,
  transactionId: string
): Promise<WithId<FinanceTransaction> | null> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const transactionRef = doc(getTransactionsRef(userId), transactionId)
  const snap = await getDoc(transactionRef)
  if (!snap.exists()) return null

  const data = convertFirestoreData(snap.data()) as FinanceTransaction
  const { id: _ignoreId, ...rest } = data as any
  return { ...(rest as FinanceTransaction), id: snap.id }
}

// ---------- Categories ----------

export const saveCategories = async (
  userId: string,
  categories: FinanceCategories
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  return retryOperation(async () => {
    const ref = getCategoriesRef(userId)
    await updateDoc(ref, categories as any).catch(async () => {
      // If doc doesn't exist, fall back to set
      await (await import('firebase/firestore')).setDoc(ref, categories as any)
    })
  })
}

export const getCategories = async (
  userId: string
): Promise<FinanceCategories | null> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const ref = getCategoriesRef(userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null

  return convertFirestoreData(snap.data()) as FinanceCategories
}

export const subscribeToCategories = (
  userId: string,
  callback: (categories: FinanceCategories | null) => void
): (() => void) => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const ref = getCategoriesRef(userId)
  return onSnapshot(
    ref,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = convertFirestoreData(docSnap.data())
        callback(data as FinanceCategories)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error('Error subscribing to finance categories:', error)
      callback(null)
    }
  )
}

// ---------- Budget goals ----------

export const saveBudgetGoals = async (
  userId: string,
  goals: FinanceBudgetGoals
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  return retryOperation(async () => {
    const ref = getBudgetGoalsRef(userId)
    await updateDoc(ref, goals as any).catch(async () => {
      const { setDoc } = await import('firebase/firestore')
      await setDoc(ref, goals as any)
    })
  })
}

export const getBudgetGoals = async (
  userId: string
): Promise<FinanceBudgetGoals | null> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const ref = getBudgetGoalsRef(userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null

  return convertFirestoreData(snap.data()) as FinanceBudgetGoals
}

// ---------- App settings ----------

export const saveFinanceSettings = async (
  userId: string,
  settings: FinanceSettings
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  return retryOperation(async () => {
    const ref = getSettingsRef(userId)
    await updateDoc(ref, settings as any).catch(async () => {
      const { setDoc } = await import('firebase/firestore')
      await setDoc(ref, settings as any)
    })
  })
}

export const getFinanceSettings = async (
  userId: string
): Promise<FinanceSettings | null> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const ref = getSettingsRef(userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null

  return convertFirestoreData(snap.data()) as FinanceSettings
}

// ---------- Reconciliation ----------

export const subscribeToReconciliationHistory = (
  userId: string,
  callback: (history: WithId<FinanceReconciliationRecord>[]) => void
): (() => void) => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const historyRef = getReconciliationHistoryRef(userId)
  const q = query(historyRef, orderBy('timestamp', 'desc'))

  return onSnapshot(
    q,
    (snapshot) => {
      const history: WithId<FinanceReconciliationRecord>[] = []
      snapshot.forEach((docSnap) => {
        const data = convertFirestoreData(docSnap.data()) as FinanceReconciliationRecord
        const { id: _ignoreId, ...rest } = data as any
        history.push({ ...(rest as FinanceReconciliationRecord), id: docSnap.id })
      })
      callback(history)
    },
    (error) => {
      console.error('Error subscribing to reconciliation history:', error)
      callback([])
    }
  )
}

export const saveLastReconciliation = async (
  userId: string,
  reconciliation: Omit<FinanceReconciliationRecord, 'id'>
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const ref = getLastReconciliationRef(userId)
  await updateDoc(ref, reconciliation as any).catch(async () => {
    const { setDoc } = await import('firebase/firestore')
    await setDoc(ref, reconciliation as any)
  })
}

export const getLastReconciliation = async (
  userId: string
): Promise<FinanceReconciliationRecord | null> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const ref = getLastReconciliationRef(userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null

  return convertFirestoreData(snap.data()) as FinanceReconciliationRecord
}

// ---------- Recurring transactions ----------

export const subscribeToRecurringTransactions = (
  userId: string,
  callback: (items: WithId<FinanceRecurringTransaction>[]) => void
): (() => void) => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const recurringRef = getRecurringTransactionsRef(userId)

  return onSnapshot(
    recurringRef,
    (snapshot) => {
      const items: WithId<FinanceRecurringTransaction>[] = []
      snapshot.forEach((docSnap) => {
        const data = convertFirestoreData(docSnap.data()) as FinanceRecurringTransaction
        const { id: _ignoreId, ...rest } = data as any
        items.push({ ...(rest as FinanceRecurringTransaction), id: docSnap.id })
      })
      callback(items)
    },
    (error) => {
      console.error('Error subscribing to recurring transactions:', error)
      callback([])
    }
  )
}

export const addRecurringTransaction = async (
  userId: string,
  recurring: Omit<FinanceRecurringTransaction, 'id'>
): Promise<string> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const recurringRef = getRecurringTransactionsRef(userId)
  const docRef = await addDoc(recurringRef, recurring as any)
  return docRef.id
}

export const updateRecurringTransaction = async (
  userId: string,
  id: string,
  updates: Partial<FinanceRecurringTransaction>
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const recurringRef = doc(getRecurringTransactionsRef(userId), id)
  await updateDoc(recurringRef, updates as any)
}

export const deleteRecurringTransaction = async (
  userId: string,
  id: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }

  const recurringRef = doc(getRecurringTransactionsRef(userId), id)
  await deleteDoc(recurringRef)
}


