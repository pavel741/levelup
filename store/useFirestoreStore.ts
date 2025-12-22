import { create } from 'zustand'
import { User, Habit, Challenge, Achievement, DailyStats } from '@/types'
import { format, parseISO } from 'date-fns'
import { checkAndUnlockAchievements } from '@/lib/achievements'
import { validateMissedReason } from '@/lib/missedHabitValidation'
import {
  subscribeToHabits,
  saveHabit,
  updateHabit as updateHabitFirestore,
  deleteHabit as deleteHabitFirestore,
  subscribeToChallenges,
  saveChallenge,
  updateChallenge,
  deleteChallenge,
  getChallenges,
  saveDailyStats,
  getUserDailyStats,
  getAllUserDailyStats,
  getUserData,
  updateUserData,
} from '@/lib/firestore'
import { onAuthChange } from '@/lib/auth'

interface AppState {
  // User state
  user: User | null
  isLoading: boolean
  setUser: (user: User) => void
  syncUser: (userId: string) => Promise<void>
  
  // Habits
  habits: Habit[]
  addHabit: (habit: Habit) => Promise<void>
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>
  completeHabit: (id: string) => Promise<void>
  uncompleteHabit: (id: string) => Promise<void>
  markHabitMissed: (id: string, date: string, reason: string) => Promise<void>
  updateMissedReasonValidity: (habitId: string, date: string, valid: boolean) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  
  // Challenges
  challenges: Challenge[]
  activeChallenges: Challenge[]
  addChallenge: (challenge: Challenge) => Promise<void>
  updateChallenge: (id: string, updates: Partial<Challenge>) => Promise<void>
  deleteChallenge: (id: string) => Promise<void>
  joinChallenge: (challengeId: string) => Promise<void>
  completeChallenge: (challengeId: string) => Promise<void>
  
  // Stats
  dailyStats: DailyStats[]
  updateDailyStats: (stats: Partial<DailyStats>) => Promise<void>
  
  // XP and Leveling
  addXP: (amount: number) => Promise<void>
  checkLevelUp: () => boolean

  // Achievements
  checkAchievements: () => Promise<void>
  showAchievementCelebration: (achievements: Achievement[]) => void
  newAchievements: Achievement[]

  // User preferences
  updateUserPreference: (key: string, value: any) => Promise<void>

  // Reset progress
  resetProgress: () => Promise<void>

  // Cleanup
  unsubscribe: () => void
}

const calculateXPForNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level))
}

// Calculate streak based on consecutive days of habit completion
const calculateUserStreak = (habits: Habit[]): number => {
  if (habits.length === 0) return 0

  // Get all unique completed dates from all habits
  const allCompletedDates = new Set<string>()
  habits.forEach(habit => {
    habit.completedDates.forEach(date => allCompletedDates.add(date))
  })

  if (allCompletedDates.size === 0) return 0

  // Sort dates descending (most recent first)
  const sortedDates = Array.from(allCompletedDates).sort().reverse()
  
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check consecutive days starting from today
  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)
    const expectedDateStr = format(expectedDate, 'yyyy-MM-dd')

    if (sortedDates.includes(expectedDateStr)) {
      streak++
    } else {
      break // Streak broken
    }
  }

  return streak
}

let unsubscribeHabits: (() => void) | null = null
let unsubscribeChallenges: (() => void) | null = null
let unsubscribeAuth: (() => void) | null = null

export const useFirestoreStore = create<AppState>((set, get) => ({
  user: null,
  isLoading: true,
  newAchievements: [],
  
  setUser: (user) => {
    set({ user, isLoading: false })
    if (user) {
      get().syncUser(user.id)
      // Check achievements when user is set
      setTimeout(() => {
        get().checkAchievements()
      }, 1000)
    }
  },

  syncUser: async (userId: string) => {
    console.log('syncUser called with userId:', userId)
    
    // Wait for Firestore to be initialized before proceeding
    try {
      const { waitForFirebaseInit } = await import('@/lib/firebase')
      await waitForFirebaseInit()
    } catch (error) {
      console.error('Failed to wait for Firebase initialization:', error)
      // Continue anyway - getUserData will throw if db is not initialized
    }
    
    const userData = await getUserData(userId)
    if (userData) {
      console.log('User data loaded:', userData.id, userData.email)
      
      // Recalculate streak based on current habits to fix any incorrect values
      const currentHabits = get().habits
      if (currentHabits.length > 0) {
        const calculatedStreak = calculateUserStreak(currentHabits)
        if (calculatedStreak !== userData.streak) {
          console.log(`Recalculating streak: ${userData.streak} -> ${calculatedStreak}`)
          await updateUserData(userId, {
            streak: calculatedStreak,
            longestStreak: Math.max(userData.longestStreak || 0, calculatedStreak),
          })
          userData.streak = calculatedStreak
          userData.longestStreak = Math.max(userData.longestStreak || 0, calculatedStreak)
        }
      }
      
      set({ user: userData })
      
      // Load today's daily stats
      const today = format(new Date(), 'yyyy-MM-dd')
      const todayStats = await getUserDailyStats(userId, today)
      if (todayStats) {
        set((state) => {
          const existing = state.dailyStats.find((s) => s.date === today)
          if (existing) {
            return {
              dailyStats: state.dailyStats.map((s) =>
                s.date === today ? todayStats : s
              ),
            }
          }
          return { dailyStats: [...state.dailyStats, todayStats] }
        })
      }
    } else {
      console.warn('No user data found for userId:', userId)
    }

    // Subscribe to real-time updates
    if (unsubscribeHabits) {
      console.log('Unsubscribing from previous habits subscription')
      unsubscribeHabits()
    }
    if (unsubscribeChallenges) unsubscribeChallenges()

    console.log('Setting up habits subscription for userId:', userId)
    unsubscribeHabits = subscribeToHabits(userId, (habits) => {
      console.log('✅ Habits callback received:', habits.length, 'habits')
      console.log('Habit IDs:', habits.map(h => h.id))
      console.log('Habit userIds:', habits.map(h => h.userId))
      console.log('Habit names:', habits.map(h => h.name))
      
      // Check for userId mismatches
      const mismatched = habits.filter(h => h.userId !== userId)
      if (mismatched.length > 0) {
        console.warn('⚠️ Found habits with mismatched userId:', mismatched.map(h => ({ id: h.id, name: h.name, userId: h.userId, expectedUserId: userId })))
      }
      
      set({ habits })
      
      // Recalculate streak when habits are loaded/updated
      const user = get().user
      if (user && habits.length > 0) {
        const calculatedStreak = calculateUserStreak(habits)
        if (calculatedStreak !== user.streak) {
          console.log(`Recalculating streak from habits: ${user.streak} -> ${calculatedStreak}`)
          updateUserData(user.id, {
            streak: calculatedStreak,
            longestStreak: Math.max(user.longestStreak || 0, calculatedStreak),
          }).then(() => {
            // Update local state
            get().syncUser(user.id)
          })
        }
      }
    })

    unsubscribeChallenges = subscribeToChallenges((challenges) => {
      const user = get().user
      if (!user) return

      const active = challenges.filter((c) => c.participants.includes(user.id))
      set({ challenges, activeChallenges: active })
    })
  },

  habits: [],
  addHabit: async (habit) => {
    await saveHabit(habit)
    // Firestore subscription will update the state
    // Check achievements after adding habit
    setTimeout(() => {
      get().checkAchievements()
    }, 500)
  },
  updateHabit: async (id, updates) => {
    await updateHabitFirestore(id, updates)
    // Firestore subscription will update the state
  },
  completeHabit: async (id) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return

    // Check if habit has started (respect startDate if set)
    if (habit.startDate) {
      const startDate = habit.startDate instanceof Date 
        ? habit.startDate 
        : new Date(habit.startDate)
      const startDateStr = format(startDate, 'yyyy-MM-dd')
      if (today < startDateStr) {
        console.log(`Cannot complete habit "${habit.name}" before start date: ${startDateStr}`)
        return
      }
    }

    const targetCount = habit.targetCountPerDay || 1
    const currentCount = habit.completionsPerDay?.[today] || 0
    
    // Check if already reached target for today
    if (currentCount >= targetCount) {
      return
    }

    // Increment completion count for today
    const newCount = currentCount + 1
    const updatedCompletionsPerDay = {
      ...(habit.completionsPerDay || {}),
      [today]: newCount,
    }

    // If we've reached the target count, mark the date as completed
    const wasCompleted = habit.completedDates.includes(today)
    const updatedDates = newCount >= targetCount && !wasCompleted
      ? [...habit.completedDates, today]
      : habit.completedDates

    await updateHabitFirestore(id, { 
      completionsPerDay: updatedCompletionsPerDay,
      completedDates: updatedDates,
    })

    // Add XP only when target is reached for the first time today
    const user = get().user
    if (user && newCount >= targetCount && !wasCompleted) {
      await get().addXP(habit.xpReward)
      
      // Update daily stats - track habits completed
      const todayStats = get().dailyStats.find((s) => s.date === today)
      const currentHabitsCompleted = todayStats?.habitsCompleted || 0
      await get().updateDailyStats({
        habitsCompleted: currentHabitsCompleted + 1,
      })

      // Update streak based on actual consecutive days
      // Recalculate streak from all habits
      const allHabits = get().habits.map(h => h.id === id ? { ...h, completedDates: updatedDates } : h)
      const newStreak = calculateUserStreak(allHabits)
      const currentLongestStreak = user.longestStreak || 0
      
      await updateUserData(user.id, {
        streak: newStreak,
        longestStreak: Math.max(currentLongestStreak, newStreak),
      })
      
      // Check for achievements after streak update
      await get().checkAchievements()
      
      await get().syncUser(user.id)

      // Update linked challenges
      const activeChallenges = get().activeChallenges.filter(
        (challenge) => 
          challenge.participants.includes(user.id) && 
          challenge.habitIds?.includes(id) &&
          challenge.isActive
      )

      for (const challenge of activeChallenges) {
        // Check if user already completed this challenge today
        const userCompletedDates = challenge.completedDates?.[user.id] || []
        if (userCompletedDates.includes(today)) {
          continue // Already counted for today
        }

        // Update progress
        const currentProgress = challenge.progress?.[user.id] || 0
        const newProgress = currentProgress + 1
        const updatedProgress = {
          ...(challenge.progress || {}),
          [user.id]: newProgress,
        }
        const updatedCompletedDates = {
          ...(challenge.completedDates || {}),
          [user.id]: [...userCompletedDates, today],
        }

        // Check if challenge is completed
        if (newProgress >= challenge.duration) {
          // Challenge completed! Award XP
          await get().addXP(challenge.xpReward)
        }
        
        // Update progress (whether completed or not)
        const cleanUpdates: any = {
          progress: updatedProgress,
          completedDates: updatedCompletedDates,
        }
        
        // Remove undefined fields
        Object.keys(cleanUpdates).forEach(key => {
          if (cleanUpdates[key] === undefined) {
            delete cleanUpdates[key]
          }
        })
        
        await updateChallenge(challenge.id, cleanUpdates)
      }
    }
  },
  uncompleteHabit: async (id) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return

    const targetCount = habit.targetCountPerDay || 1
    const currentCount = habit.completionsPerDay?.[today] || 0
    
    // Can't uncomplete if count is already 0
    if (currentCount <= 0) return

    // Decrement completion count for today
    const newCount = currentCount - 1
    const updatedCompletionsPerDay = {
      ...(habit.completionsPerDay || {}),
      [today]: newCount,
    }

    // If count drops below target, remove from completedDates
    const wasCompleted = habit.completedDates.includes(today)
    const updatedDates = newCount < targetCount && wasCompleted
      ? habit.completedDates.filter((date) => date !== today)
      : habit.completedDates

    await updateHabitFirestore(id, { 
      completionsPerDay: updatedCompletionsPerDay,
      completedDates: updatedDates,
    })

    // Deduct XP and recalculate level only if we're removing the completion status
    const user = get().user
    if (user && newCount < targetCount && wasCompleted) {
      const newXP = Math.max(0, user.xp - habit.xpReward)
      const newLevel = Math.floor(newXP / 100) + 1
      const xpToNextLevel = calculateXPForNextLevel(newLevel) - newXP

      // Update daily stats - decrement habits completed and XP earned
      const todayStats = get().dailyStats.find((s) => s.date === today)
      const currentHabitsCompleted = todayStats?.habitsCompleted || 0
      const currentXpEarned = todayStats?.xpEarned || 0
      await get().updateDailyStats({
        habitsCompleted: Math.max(0, currentHabitsCompleted - 1),
        xpEarned: Math.max(0, currentXpEarned - habit.xpReward),
      })

      // Recalculate streak after uncompleting
      const allHabits = get().habits.map(h => h.id === id ? { ...h, completedDates: updatedDates } : h)
      const newStreak = calculateUserStreak(allHabits)

      await updateUserData(user.id, {
        xp: newXP,
        level: newLevel,
        xpToNextLevel: Math.max(0, xpToNextLevel),
        streak: newStreak,
      })

      // Update local user state immediately for better UX
      set({ user: { ...user, xp: newXP, level: newLevel, xpToNextLevel: Math.max(0, xpToNextLevel), streak: newStreak } })

      await get().syncUser(user.id)
    }
  },
  markHabitMissed: async (id, date, reason) => {
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return

    // Check if habit has started (respect startDate if set)
    if (habit.startDate) {
      const startDate = habit.startDate instanceof Date 
        ? habit.startDate 
        : new Date(habit.startDate)
      const startDateStr = format(startDate, 'yyyy-MM-dd')
      if (date < startDateStr) {
        console.log(`Cannot mark habit "${habit.name}" as missed before start date: ${startDateStr}`)
        return
      }
    }

    // Validate reason using validation function
    const validation = validateMissedReason(reason)

    const missedDate = {
      date,
      reason,
      valid: validation.valid,
    }

    const existingMissedDates = habit.missedDates || []
    // Remove if already exists for this date
    const filteredMissedDates = existingMissedDates.filter((m) => m.date !== date)
    const updatedMissedDates = [...filteredMissedDates, missedDate]

    await updateHabitFirestore(id, { missedDates: updatedMissedDates })

    // If invalid reason, break streak
    if (!validation.valid && get().user) {
      await updateUserData(get().user!.id, {
        streak: 0, // Reset streak for invalid excuses
      })
      await get().syncUser(get().user!.id)
    }
  },
  updateMissedReasonValidity: async (habitId, date, valid) => {
    const habit = get().habits.find((h) => h.id === habitId)
    if (!habit || !habit.missedDates) return

    // Find the current missed date to check if validity is changing
    const currentMissed = habit.missedDates.find((m) => m.date === date)
    const wasInvalid = currentMissed?.valid === false

    // Update the validity of the missed date
    const updatedMissedDates = habit.missedDates.map((m) =>
      m.date === date ? { ...m, valid } : m
    )

    await updateHabitFirestore(habitId, { missedDates: updatedMissedDates })

    // Recalculate streak based on new validity
    if (get().user) {
      if (!valid) {
        // Changing to invalid - reset streak
        await updateUserData(get().user!.id, {
          streak: 0,
        })
      } else if (wasInvalid && valid) {
        // Changing from invalid to valid - recalculate streak
        // The calculateUserStreak will be called in syncUser
      }
      await get().syncUser(get().user!.id)
    }
  },
  deleteHabit: async (id) => {
    await deleteHabitFirestore(id)
    // Firestore subscription will update the state
  },

  challenges: [],
  activeChallenges: [],
  addChallenge: async (challenge) => {
    await saveChallenge(challenge)
    // Firestore subscription will update the state
  },
  updateChallenge: async (id, updates) => {
    await updateChallenge(id, updates)
    // Firestore subscription will update the state
  },
  deleteChallenge: async (id) => {
    await deleteChallenge(id)
    // Firestore subscription will update the state
  },
  joinChallenge: async (challengeId) => {
    const challenge = get().challenges.find((c) => c.id === challengeId)
    const user = get().user
    if (!challenge || !user) return

    if (challenge.participants.includes(user.id)) return

    const updatedParticipants = [...challenge.participants, user.id]
    await updateChallenge(challengeId, { participants: updatedParticipants })
    // Firestore subscription will update the state
  },
  completeChallenge: async (challengeId) => {
    const challenge = get().activeChallenges.find((c) => c.id === challengeId)
    if (!challenge) return

    await get().addXP(challenge.xpReward)
    set((state) => ({
      activeChallenges: state.activeChallenges.filter((c) => c.id !== challengeId),
    }))
  },

  dailyStats: [],
  updateDailyStats: async (stats) => {
    const user = get().user
    if (!user) return

    const today = format(new Date(), 'yyyy-MM-dd')
    const existing = get().dailyStats.find((s) => s.date === today)
    const updatedStats = existing
      ? { ...existing, ...stats }
      : {
          date: today,
          habitsCompleted: 0,
          xpEarned: 0,
          challengesCompleted: 0,
          distractionsBlocked: 0,
          ...stats,
        }

    await saveDailyStats(user.id, updatedStats)
    set((state) => {
      if (existing) {
        return {
          dailyStats: state.dailyStats.map((s) =>
            s.date === today ? updatedStats : s
          ),
        }
      }
      return { dailyStats: [...state.dailyStats, updatedStats] }
    })
  },

  addXP: async (amount) => {
    const user = get().user
    if (!user) return

    const newXP = user.xp + amount
    const newLevel = Math.floor(newXP / 100) + 1
    const xpToNextLevel = calculateXPForNextLevel(newLevel) - newXP

    await updateUserData(user.id, {
      xp: newXP,
      level: newLevel,
      xpToNextLevel: Math.max(0, xpToNextLevel),
    })

    // Update daily stats with XP earned
    const today = format(new Date(), 'yyyy-MM-dd')
    const existingStats = get().dailyStats.find((s) => s.date === today)
    const currentXpEarned = existingStats?.xpEarned || 0
    await get().updateDailyStats({
      xpEarned: currentXpEarned + amount,
    })

    // Update local user state immediately for better UX
    set({ user: { ...user, xp: newXP, level: newLevel, xpToNextLevel: Math.max(0, xpToNextLevel) } })

    // Check for achievements after XP update
    await get().checkAchievements()

    await get().syncUser(user.id)
  },
  checkAchievements: async () => {
    const user = get().user
    const habits = get().habits
    if (!user) return

    const existingAchievements = user.achievements || []
    const newAchievements = checkAndUnlockAchievements(user, habits, existingAchievements)
    
    // Find newly unlocked achievements
    const existingIds = new Set(existingAchievements.map((a) => a.id))
    const newlyUnlocked = newAchievements.filter((a) => a.unlockedAt && !existingIds.has(a.id))
    
    // Merge achievements: keep existing ones, update with new progress, add newly unlocked
    const achievementMap = new Map<string, Achievement>()
    
    // Add existing achievements
    existingAchievements.forEach((a) => achievementMap.set(a.id, a))
    
    // Update with new achievements (this will update progress and add newly unlocked)
    // Always use the new achievement data to ensure correct unlock status
    newAchievements.forEach((a) => {
      achievementMap.set(a.id, a)
    })
    
    const updatedAchievements = Array.from(achievementMap.values())
    
    // Only update if there are changes
    if (updatedAchievements.length !== existingAchievements.length || newlyUnlocked.length > 0) {
      await updateUserData(user.id, { achievements: updatedAchievements })
      
      // Show celebration for newly unlocked achievements
      if (newlyUnlocked.length > 0) {
        get().showAchievementCelebration(newlyUnlocked)
      }
      
      await get().syncUser(user.id)
    }
  },
  showAchievementCelebration: (achievements: Achievement[]) => {
    // This will be handled by the UI component
    set({ newAchievements: achievements })
  },
  checkLevelUp: () => {
    const user = get().user!
    return user.xpToNextLevel <= 0
  },

  updateUserPreference: async (key: string, value: any) => {
    const user = get().user
    if (!user) return
    
    await updateUserData(user.id, { [key]: value })
    // Update local state
    set({ user: { ...user, [key]: value } })
  },

  resetProgress: async () => {
    const user = get().user
    if (!user) return

    // Reset user XP, level, streak, longestStreak
    await updateUserData(user.id, {
      xp: 0,
      level: 1,
      xpToNextLevel: 100,
      streak: 0,
      longestStreak: 0,
    })

    // Clear all habit completion data
    const habits = get().habits
    for (const habit of habits) {
      await updateHabitFirestore(habit.id, {
        completedDates: [],
        completionsPerDay: {},
        missedDates: [],
      })
    }

    // Clear challenge progress for this user
    // Get all challenges and reset progress for challenges where user is a participant
    const allChallenges = await getChallenges()
    const userChallenges = allChallenges.filter(challenge => 
      challenge.participants.includes(user.id)
    )
    
    for (const challenge of userChallenges) {
      // Remove user's progress and completedDates
      const updatedProgress = { ...(challenge.progress || {}) }
      delete updatedProgress[user.id]
      
      const updatedCompletedDates = { ...(challenge.completedDates || {}) }
      delete updatedCompletedDates[user.id]
      
      // Only update if there were changes
      if (challenge.progress?.[user.id] !== undefined || challenge.completedDates?.[user.id] !== undefined) {
        const cleanUpdates: any = {}
        
        // Only include progress if there are other users with progress, or if we're removing the last one
        if (Object.keys(updatedProgress).length > 0) {
          cleanUpdates.progress = updatedProgress
        } else if (challenge.progress) {
          // If removing the last user's progress, set to empty object
          cleanUpdates.progress = {}
        }
        
        // Same for completedDates
        if (Object.keys(updatedCompletedDates).length > 0) {
          cleanUpdates.completedDates = updatedCompletedDates
        } else if (challenge.completedDates) {
          cleanUpdates.completedDates = {}
        }
        
        // Remove undefined fields
        Object.keys(cleanUpdates).forEach(key => {
          if (cleanUpdates[key] === undefined) {
            delete cleanUpdates[key]
          }
        })
        
        if (Object.keys(cleanUpdates).length > 0) {
          await updateChallenge(challenge.id, cleanUpdates)
        }
      }
    }

    // Clear daily stats XP earned (reset all daily stats)
    // Get all daily stats from Firestore, not just the ones in current state
    const allDailyStats = await getAllUserDailyStats(user.id)
    for (const stat of allDailyStats) {
      await saveDailyStats(user.id, {
        ...stat,
        xpEarned: 0,
        habitsCompleted: 0,
        challengesCompleted: 0,
        distractionsBlocked: 0,
      })
    }

    // Update local state
    set({ 
      user: { 
        ...user, 
        xp: 0, 
        level: 1, 
        xpToNextLevel: 100, 
        streak: 0, 
        longestStreak: 0 
      },
      dailyStats: allDailyStats.map(stat => ({
        ...stat,
        xpEarned: 0,
        habitsCompleted: 0,
        challengesCompleted: 0,
        distractionsBlocked: 0,
      }))
    })

    // Sync user to refresh all data
    await get().syncUser(user.id)
  },

  unsubscribe: () => {
    if (unsubscribeHabits) unsubscribeHabits()
    if (unsubscribeChallenges) unsubscribeChallenges()
    if (unsubscribeAuth) unsubscribeAuth()
  },
}))

// Initialize auth listener (only in browser, after store is created)
if (typeof window !== 'undefined') {
  unsubscribeAuth = onAuthChange(async (firebaseUser) => {
    // Wait for Firestore to be initialized before proceeding
    try {
      const { waitForFirebaseInit } = await import('@/lib/firebase')
      await waitForFirebaseInit()
    } catch (error) {
      console.error('Auth listener: Failed to wait for Firebase initialization:', error)
      return
    }
    
    const store = useFirestoreStore.getState()
    if (firebaseUser) {
      await store.syncUser(firebaseUser.uid)
    } else {
      store.setUser(null as any)
      store.unsubscribe()
    }
  })
}

