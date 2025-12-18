import { create } from 'zustand'
import { User, Habit, Challenge, Achievement, DistractionBlock, DailyStats } from '@/types'
import { format } from 'date-fns'
import {
  subscribeToHabits,
  saveHabit,
  updateHabit as updateHabitFirestore,
  deleteHabit as deleteHabitFirestore,
  subscribeToChallenges,
  updateChallenge,
  subscribeToBlockedSites,
  saveBlockedSite,
  deleteBlockedSite as deleteBlockedSiteFirestore,
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
  deleteHabit: (id: string) => Promise<void>
  
  // Challenges
  challenges: Challenge[]
  activeChallenges: Challenge[]
  joinChallenge: (challengeId: string) => Promise<void>
  completeChallenge: (challengeId: string) => Promise<void>
  
  // Distractions
  blockedSites: DistractionBlock[]
  blockSite: (site: string) => Promise<void>
  unblockSite: (id: string) => Promise<void>
  
  // Stats
  dailyStats: DailyStats[]
  updateDailyStats: (stats: Partial<DailyStats>) => Promise<void>
  
  // XP and Leveling
  addXP: (amount: number) => Promise<void>
  checkLevelUp: () => boolean
  
  // Cleanup
  unsubscribe: () => void
}

const calculateXPForNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level))
}

let unsubscribeHabits: (() => void) | null = null
let unsubscribeChallenges: (() => void) | null = null
let unsubscribeBlockedSites: (() => void) | null = null
let unsubscribeAuth: (() => void) | null = null

export const useFirestoreStore = create<AppState>((set, get) => ({
  user: null,
  isLoading: true,
  
  setUser: (user) => {
    set({ user, isLoading: false })
    if (user) {
      get().syncUser(user.id)
    }
  },

  syncUser: async (userId: string) => {
    const userData = await getUserData(userId)
    if (userData) {
      set({ user: userData })
    }

    // Subscribe to real-time updates
    if (unsubscribeHabits) unsubscribeHabits()
    if (unsubscribeChallenges) unsubscribeChallenges()
    if (unsubscribeBlockedSites) unsubscribeBlockedSites()

    unsubscribeHabits = subscribeToHabits(userId, (habits) => {
      set({ habits })
    })

    unsubscribeChallenges = subscribeToChallenges((challenges) => {
      const user = get().user
      if (!user) return

      const active = challenges.filter((c) => c.participants.includes(user.id))
      set({ challenges, activeChallenges: active })
    })

    unsubscribeBlockedSites = subscribeToBlockedSites(userId, (blockedSites) => {
      set({ blockedSites })
    })
  },

  habits: [],
  addHabit: async (habit) => {
    await saveHabit(habit)
    // Firestore subscription will update the state
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
      await get().syncUser(user.id)
    }
  },
  deleteHabit: async (id) => {
    await deleteHabitFirestore(id)
    // Firestore subscription will update the state
  },

  challenges: [],
  activeChallenges: [],
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

  blockedSites: [],
  blockSite: async (site) => {
    const user = get().user
    if (!user) return

    const block: DistractionBlock = {
      id: Date.now().toString(),
      userId: user.id,
      site,
      isBlocked: true,
      createdAt: new Date(),
    }
    await saveBlockedSite(block)
    // Firestore subscription will update the state
  },
  unblockSite: async (id) => {
    await deleteBlockedSiteFirestore(id)
    // Firestore subscription will update the state
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

    await get().syncUser(user.id)
  },
  checkLevelUp: () => {
    const user = get().user!
    return user.xpToNextLevel <= 0
  },

  unsubscribe: () => {
    if (unsubscribeHabits) unsubscribeHabits()
    if (unsubscribeChallenges) unsubscribeChallenges()
    if (unsubscribeBlockedSites) unsubscribeBlockedSites()
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

