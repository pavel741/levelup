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
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { User, Habit, Challenge, DailyStats } from '@/types'
import { format } from 'date-fns'

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
    console.log('Successfully created user data in Firestore:', user.id)
  } catch (error: any) {
    console.error('Error creating user data:', error)
    console.error('Error code:', error?.code)
    console.error('Error message:', error?.message)
    // Re-throw the error so callers know it failed
    throw new Error(`Failed to create user data: ${error?.message || 'Unknown error'}`)
  }
}

export const updateUserData = async (userId: string, updates: Partial<User>): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, updates as any)
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
  
  console.log('Subscribing to habits for userId:', userId)
  const habitsRef = collection(db, 'habits')
  const q = query(habitsRef, where('userId', '==', userId))
  
  return onSnapshot(
    q,
    (snapshot) => {
      console.log(`✅ Habits snapshot received: ${snapshot.docs.length} habits for userId: ${userId}`)
      const habits = snapshot.docs.map((doc) => {
        const data = doc.data()
        console.log('Habit document:', doc.id, 'userId:', data.userId, 'name:', data.name)
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          startDate: data.startDate?.toDate() || undefined,
        }
      }) as Habit[]
      console.log('Parsed habits:', habits.length, habits.map(h => ({ id: h.id, name: h.name, userId: h.userId })))
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
    const habitData: any = {
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
    
    // Remove undefined fields
    Object.keys(habitData).forEach(key => {
      if (habitData[key] === undefined) {
        delete habitData[key]
      }
    })
    
    await setDoc(doc(db, 'habits', habit.id), habitData)
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
    const cleanUpdates: any = { ...updates }
    
    // Convert startDate to Timestamp if it exists
    if (cleanUpdates.startDate !== undefined) {
      if (cleanUpdates.startDate === null) {
        // If explicitly set to null, remove it
        delete cleanUpdates.startDate
      } else {
        const startDate = cleanUpdates.startDate instanceof Date 
          ? cleanUpdates.startDate 
          : new Date(cleanUpdates.startDate)
        cleanUpdates.startDate = Timestamp.fromDate(startDate)
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
    await setDoc(doc(db, 'challenges', challenge.id), {
      ...challenge,
      startDate: Timestamp.fromDate(challenge.startDate),
      endDate: Timestamp.fromDate(challenge.endDate),
    })
  } catch (error) {
    console.error('Error saving challenge:', error)
  }
}

export const updateChallenge = async (challengeId: string, updates: Partial<Challenge>): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const challengeRef = doc(db, 'challenges', challengeId)
    const updateData: any = { ...updates }
    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(updates.startDate)
    }
    if (updates.endDate) {
      updateData.endDate = Timestamp.fromDate(updates.endDate)
    }
    await updateDoc(challengeRef, updateData)
  } catch (error) {
    console.error('Error updating challenge:', error)
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

