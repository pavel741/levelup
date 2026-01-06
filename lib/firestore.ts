import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { User, Habit, Challenge, DailyStats } from '@/types'

/**
 * Helper function to clean data for Firestore (remove undefined values)
 */
function cleanFirestoreData<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = value
    }
  }
  return cleaned
}

// User operations
export const getUserData = async (userId: string): Promise<User | null> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      const data = userDoc.data()
      return {
        ...data,
        joinedAt: data.joinedAt?.toDate() || new Date(),
      } as User
    }
    return null
  } catch (error) {
    console.error('Error getting user data:', error)
    return null
  }
}

export const createUserData = async (user: User): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    await setDoc(doc(db, 'users', user.id), {
      ...user,
      joinedAt: Timestamp.fromDate(user.joinedAt),
    })
    
    // Initialize default finance categories for new users
    try {
      const { getCategories, saveCategories } = await import('./financeMongo')
      // Check if categories already exist (don't overwrite existing ones)
      const existingCategories = await getCategories(user.id)
      if (!existingCategories || Object.keys(existingCategories).length === 0) {
        const defaultCategories = {
          income: ['Salary', 'Freelance', 'Investment', 'Rental Income', 'Business', 'Gift', 'Other'],
          expense: ['Food & Dining', 'Groceries', 'Transport', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Health & Fitness', 'Education', 'Travel', 'Subscriptions', 'Home & Garden', 'Personal Care', 'Insurance', 'Taxes', 'Other'],
        }
        await saveCategories(user.id, defaultCategories)
        console.log(`✅ Initialized default categories for user: ${user.id}`)
      }
    } catch (categoryError) {
      // Don't fail user creation if category initialization fails
      console.warn('Failed to initialize default categories:', categoryError)
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = (error as { code?: string })?.code
    console.error('Error creating user data:', error)
    console.error('Error code:', errorCode)
    console.error('Error message:', errorMessage)
    // Re-throw the error so callers know it failed
    throw new Error(`Failed to create user data: ${errorMessage}`)
  }
}

export const updateUserData = async (userId: string, updates: Partial<User>): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const userRef = doc(db, 'users', userId)
    // Firestore updateDoc requires Partial<User> but we need to convert dates
    const firestoreUpdates: Record<string, unknown> = { ...updates }
    await updateDoc(userRef, firestoreUpdates)
  } catch (error) {
    console.error('Error updating user data:', error)
  }
}

// Habit operations
export const getUserHabits = async (userId: string): Promise<Habit[]> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const habitsRef = collection(db, 'habits')
    const q = query(habitsRef, where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        startDate: data.startDate?.toDate() || undefined,
      }
    }) as Habit[]
  } catch (error) {
    console.error('Error getting habits:', error)
    return []
  }
}

export const subscribeToHabits = (
  userId: string,
  callback: (habits: Habit[]) => void
): (() => void) => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  const habitsRef = collection(db, 'habits')
  const q = query(habitsRef, where('userId', '==', userId))
  
  return onSnapshot(
    q,
    (snapshot) => {
      const habits = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          startDate: data.startDate?.toDate() || undefined,
        }
      }) as Habit[]
      callback(habits)
    },
    (error) => {
      console.error('❌ ERROR in habits subscription:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', JSON.stringify(error, null, 2))
      // Store error in localStorage so it persists
      try {
        localStorage.setItem('firebase_error', JSON.stringify({
          code: error.code,
          message: error.message,
          timestamp: new Date().toISOString(),
          userId: userId,
        }))
      } catch (e) {
        // Ignore localStorage errors
      }
      // Still call callback with empty array on error
      callback([])
    }
  )
}

export const saveHabit = async (habit: Habit): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    // Remove undefined values - Firestore doesn't accept undefined
    const habitData: Record<string, unknown> = {
      ...habit,
      createdAt: Timestamp.fromDate(habit.createdAt),
    }
    
    // Convert startDate to Timestamp if it exists
    if (habit.startDate) {
      const startDate = habit.startDate instanceof Date 
        ? habit.startDate 
        : new Date(habit.startDate)
      habitData.startDate = Timestamp.fromDate(startDate)
    }
    
    await setDoc(doc(db, 'habits', habit.id), cleanFirestoreData(habitData))
  } catch (error) {
    console.error('Error saving habit:', error)
    throw error
  }
}

export const updateHabit = async (habitId: string, updates: Partial<Habit>): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    // Remove undefined values - Firestore doesn't accept undefined
    const cleanUpdates: Record<string, unknown> = { ...updates }
    
    // Convert startDate to Timestamp if it exists
    if (cleanUpdates.startDate !== undefined) {
      if (cleanUpdates.startDate === null) {
        // If explicitly set to null, remove it
        delete cleanUpdates.startDate
      } else {
        const startDateValue = cleanUpdates.startDate
        if (startDateValue instanceof Date) {
          cleanUpdates.startDate = Timestamp.fromDate(startDateValue)
        } else if (typeof startDateValue === 'string' || typeof startDateValue === 'number') {
          cleanUpdates.startDate = Timestamp.fromDate(new Date(startDateValue))
        }
      }
    }
    
    // Remove undefined fields
    Object.keys(cleanUpdates).forEach(key => {
      if (cleanUpdates[key] === undefined) {
        delete cleanUpdates[key]
      }
    })
    
    const habitRef = doc(db, 'habits', habitId)
    await updateDoc(habitRef, cleanUpdates)
  } catch (error) {
    console.error('Error updating habit:', error)
    throw error
  }
}

export const deleteHabit = async (habitId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    await deleteDoc(doc(db, 'habits', habitId))
  } catch (error) {
    console.error('Error deleting habit:', error)
  }
}

// Challenge operations
export const getChallenges = async (): Promise<Challenge[]> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const challengesRef = collection(db, 'challenges')
    const querySnapshot = await getDocs(challengesRef)
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate() || new Date(),
      endDate: doc.data().endDate?.toDate() || new Date(),
    })) as Challenge[]
  } catch (error) {
    console.error('Error getting challenges:', error)
    return []
  }
}

export const subscribeToChallenges = (
  callback: (challenges: Challenge[]) => void
): (() => void) => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  const challengesRef = collection(db, 'challenges')
  
  return onSnapshot(challengesRef, (snapshot) => {
    const challenges = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate() || new Date(),
      endDate: doc.data().endDate?.toDate() || new Date(),
    })) as Challenge[]
    callback(challenges)
  })
}

export const saveChallenge = async (challenge: Challenge): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    // Remove undefined values - Firestore doesn't accept undefined
    const challengeData: Record<string, unknown> = {
      ...challenge,
      startDate: Timestamp.fromDate(challenge.startDate),
      endDate: Timestamp.fromDate(challenge.endDate),
    }
    
    await setDoc(doc(db, 'challenges', challenge.id), cleanFirestoreData(challengeData))
  } catch (error) {
    console.error('Error saving challenge:', error)
    throw error
  }
}

export const updateChallenge = async (challengeId: string, updates: Partial<Challenge>): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const challengeRef = doc(db, 'challenges', challengeId)
    const updateData: Record<string, unknown> = { ...updates }
    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(updates.startDate)
    }
    if (updates.endDate) {
      updateData.endDate = Timestamp.fromDate(updates.endDate)
    }
    
    // Remove undefined fields - Firestore doesn't accept undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })
    
    await updateDoc(challengeRef, updateData)
  } catch (error) {
    console.error('Error updating challenge:', error)
    throw error
  }
}

export const deleteChallenge = async (challengeId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const challengeRef = doc(db, 'challenges', challengeId)
    await deleteDoc(challengeRef)
  } catch (error) {
    console.error('Error deleting challenge:', error)
    throw error
  }
}

// Daily stats
export const getUserDailyStats = async (userId: string, date: string): Promise<DailyStats | null> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const statsRef = collection(db, 'dailyStats')
    const q = query(
      statsRef, 
      where('userId', '==', userId),
      where('date', '==', date)
    )
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as DailyStats
    }
    return null
  } catch (error) {
    console.error('Error getting daily stats:', error)
    return null
  }
}

export const saveDailyStats = async (userId: string, stats: DailyStats): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    await setDoc(doc(db, 'dailyStats', `${userId}_${stats.date}`), {
      ...stats,
      userId,
    })
  } catch (error) {
    console.error('Error saving daily stats:', error)
  }
}

export const getAllUserDailyStats = async (userId: string): Promise<DailyStats[]> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const statsRef = collection(db, 'dailyStats')
    const q = query(statsRef, where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map((doc) => doc.data() as DailyStats)
  } catch (error) {
    console.error('Error getting all daily stats:', error)
    return []
  }
}

// NOTE: Workout operations (routines and workout logs) have been moved to MongoDB
// to eliminate data duplication. Use lib/workoutMongo.ts and lib/workoutApi.ts instead.

