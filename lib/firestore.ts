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
import { Routine, WorkoutLog } from '@/types/workout'
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
    // Remove undefined values - Firestore doesn't accept undefined
    const challengeData: any = {
      ...challenge,
      startDate: Timestamp.fromDate(challenge.startDate),
      endDate: Timestamp.fromDate(challenge.endDate),
    }
    
    // Remove undefined fields
    Object.keys(challengeData).forEach(key => {
      if (challengeData[key] === undefined) {
        delete challengeData[key]
      }
    })
    
    await setDoc(doc(db, 'challenges', challenge.id), challengeData)
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
    const updateData: any = { ...updates }
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

// Workout operations
export const getRoutinesByUserId = async (userId: string): Promise<Routine[]> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const routinesRef = collection(db, 'routines')
    const q = query(routinesRef, where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    }) as Routine[]
  } catch (error) {
    console.error('Error getting routines from Firestore:', error)
    return []
  }
}

export const subscribeToRoutines = (
  userId: string,
  callback: (routines: Routine[]) => void
): (() => void) => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  const routinesRef = collection(db, 'routines')
  const q = query(routinesRef, where('userId', '==', userId))
  
  return onSnapshot(
    q,
    (snapshot) => {
      const routines = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        }
      }) as Routine[]
      callback(routines)
    },
    (error) => {
      console.error('Error in routines subscription:', error)
      callback([])
    }
  )
}

export const saveRoutine = async (routine: Routine): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const routineData: any = {
      ...routine,
      createdAt: Timestamp.fromDate(routine.createdAt),
      updatedAt: Timestamp.fromDate(routine.updatedAt),
    }
    
    // Remove undefined fields
    Object.keys(routineData).forEach(key => {
      if (routineData[key] === undefined) {
        delete routineData[key]
      }
    })
    
    await setDoc(doc(db, 'routines', routine.id), routineData)
  } catch (error) {
    console.error('Error saving routine:', error)
    throw error
  }
}

export const updateRoutine = async (routineId: string, updates: Partial<Routine>): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const updateData: any = { ...updates }
    if (updates.createdAt) {
      updateData.createdAt = Timestamp.fromDate(updates.createdAt)
    }
    if (updates.updatedAt) {
      updateData.updatedAt = Timestamp.fromDate(updates.updatedAt)
    }
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })
    
    const routineRef = doc(db, 'routines', routineId)
    await updateDoc(routineRef, updateData)
  } catch (error) {
    console.error('Error updating routine:', error)
    throw error
  }
}

export const deleteRoutine = async (routineId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    await deleteDoc(doc(db, 'routines', routineId))
  } catch (error) {
    console.error('Error deleting routine:', error)
    throw error
  }
}

export const getWorkoutLogsByUserId = async (userId: string): Promise<WorkoutLog[]> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const logsRef = collection(db, 'workoutLogs')
    const q = query(logsRef, where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    
    const logs = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || undefined,
      }
    }) as WorkoutLog[]
    
    // Sort by date descending (most recent first)
    logs.sort((a, b) => b.date.getTime() - a.date.getTime())
    return logs
  } catch (error) {
    console.error('Error getting workout logs from Firestore:', error)
    return []
  }
}

export const subscribeToWorkoutLogs = (
  userId: string,
  callback: (logs: WorkoutLog[]) => void
): (() => void) => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  const logsRef = collection(db, 'workoutLogs')
  const q = query(logsRef, where('userId', '==', userId))
  
  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate() || undefined,
        }
      }) as WorkoutLog[]
      // Sort by date descending (most recent first)
      logs.sort((a, b) => b.date.getTime() - a.date.getTime())
      callback(logs)
    },
    (error) => {
      console.error('Error in workout logs subscription:', error)
      callback([])
    }
  )
}

export const saveWorkoutLog = async (log: WorkoutLog): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const logData: any = {
      ...log,
      date: Timestamp.fromDate(log.date),
      startTime: Timestamp.fromDate(log.startTime),
    }
    
    if (log.endTime) {
      logData.endTime = Timestamp.fromDate(log.endTime)
    }
    
    // Remove undefined fields
    Object.keys(logData).forEach(key => {
      if (logData[key] === undefined) {
        delete logData[key]
      }
    })
    
    await setDoc(doc(db, 'workoutLogs', log.id), logData)
  } catch (error) {
    console.error('Error saving workout log:', error)
    throw error
  }
}

export const updateWorkoutLog = async (logId: string, updates: Partial<WorkoutLog>): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    const updateData: any = { ...updates }
    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date)
    }
    if (updates.startTime) {
      updateData.startTime = Timestamp.fromDate(updates.startTime)
    }
    if (updates.endTime) {
      updateData.endTime = Timestamp.fromDate(updates.endTime)
    }
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })
    
    const logRef = doc(db, 'workoutLogs', logId)
    await updateDoc(logRef, updateData)
  } catch (error) {
    console.error('Error updating workout log:', error)
    throw error
  }
}

export const deleteWorkoutLog = async (logId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  
  try {
    await deleteDoc(doc(db, 'workoutLogs', logId))
  } catch (error) {
    console.error('Error deleting workout log:', error)
    throw error
  }
}

