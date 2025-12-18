import { create } from 'zustand'
import { User, Habit, Challenge, Achievement, DailyStats } from '@/types'
import { format } from 'date-fns'
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
  saveDailyStats,
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
  deleteHabit: (id: string) => Promise<void>
  
  // Challenges
  challenges: Challenge[]
  activeChallenges: Challenge[]
  addChallenge: (challenge: Challenge) => Promise<void>
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

  // Cleanup
  unsubscribe: () => void
}

const calculateXPForNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level))
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
    const userData = await getUserData(userId)
    if (userData) {
      console.log('User data loaded:', userData.id, userData.email)
      set({ user: userData })
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

    const alreadyCompleted = habit.completedDates.includes(today)
    if (alreadyCompleted) return

    const updatedDates = [...habit.completedDates, today]
    await updateHabitFirestore(id, { completedDates: updatedDates })

    // Add XP
    const user = get().user
    if (user) {
      await get().addXP(habit.xpReward)
    }

    // Update streak
    if (user) {
      const newStreak = user.streak + 1
      await updateUserData(user.id, {
        streak: newStreak,
        longestStreak: Math.max(user.longestStreak, newStreak),
      })
      
      // Check for achievements after streak update
      await get().checkAchievements()
      
      await get().syncUser(user.id)
    }
  },
  uncompleteHabit: async (id) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return

    const isCompleted = habit.completedDates.includes(today)
    if (!isCompleted) return

    // Remove today's date from completedDates
    const updatedDates = habit.completedDates.filter((date) => date !== today)
    await updateHabitFirestore(id, { completedDates: updatedDates })

    // Deduct XP and recalculate level
    const user = get().user
    if (user) {
      const newXP = Math.max(0, user.xp - habit.xpReward)
      const newLevel = Math.floor(newXP / 100) + 1
      const xpToNextLevel = calculateXPForNextLevel(newLevel) - newXP

      await updateUserData(user.id, {
        xp: newXP,
        level: newLevel,
        xpToNextLevel: Math.max(0, xpToNextLevel),
      })
      await get().syncUser(user.id)
    }
  },
  markHabitMissed: async (id, date, reason) => {
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return

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
    newAchievements.forEach((a) => {
      const existing = achievementMap.get(a.id)
      if (existing && existing.unlockedAt) {
        // Keep existing unlocked achievement
        achievementMap.set(a.id, existing)
      } else {
        // Update or add new achievement
        achievementMap.set(a.id, a)
      }
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

  unsubscribe: () => {
    if (unsubscribeHabits) unsubscribeHabits()
    if (unsubscribeChallenges) unsubscribeChallenges()
    if (unsubscribeAuth) unsubscribeAuth()
  },
}))

// Initialize auth listener (only in browser, after store is created)
if (typeof window !== 'undefined') {
  unsubscribeAuth = onAuthChange(async (firebaseUser) => {
    const store = useFirestoreStore.getState()
    if (firebaseUser) {
      await store.syncUser(firebaseUser.uid)
    } else {
      store.setUser(null as any)
      store.unsubscribe()
    }
  })
}

