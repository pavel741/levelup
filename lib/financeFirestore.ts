import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  Timestamp,
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

// Convert Firestore Timestamp and nested objects into plain JS values,
// turning Timestamps into "yyyy-MM-dd" strings when possible.
export const convertFirestoreData = (data: any): any => {
  if (data === null || data === undefined) return data

  // Handle Timestamp or Timestamp-like
  if (
    data instanceof Timestamp ||
    (typeof data === 'object' &&
      data !== null &&
      typeof (data as any).toDate === 'function' &&
      (typeof (data as any).seconds === 'number' ||
        typeof (data as any).nanoseconds === 'number'))
  ) {
    try {
      const date = (data as Timestamp).toDate()
      return date.toISOString().split('T')[0]
    } catch (e) {
      console.warn('Error converting Timestamp to Date in financeFirestore:', e)
      return data
    }
  }

  if (Array.isArray(data)) {
    return data.map((item) => convertFirestoreData(item))
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const converted: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertFirestoreData(value)
    }
    return converted
  }

  return data
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
    } catch (error: any) {
      lastError = error

      const code = error?.code
      const isRetryable =
        code === 'unavailable' ||
        code === 'deadline-exceeded' ||
        code === 'resource-exhausted' ||
        code === 'aborted' ||
        code === 'cancelled' ||
        error?.message?.includes('network') ||
        error?.message?.includes('timeout')

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
  let lastDoc: any = null
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
      const converted = convertFirestoreData(data) as FinanceTransaction
      const { id: _ignoreId, ...rest } = converted as any
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
  lastDoc: any,
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
  const batchSize = 500
  let successCount = 0
  let errorCount = 0
  const total = transactions.length

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
      })

      successCount += chunk.length
      progressCallback?.(Math.min(i + chunk.length, total), total)
    } catch (error) {
      console.error('Error in finance batchAddTransactions chunk:', error)
      errorCount += chunk.length
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


