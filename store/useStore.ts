import { create } from 'zustand'
import { User, Habit, Challenge, Achievement, DailyStats } from '@/types'
import { format } from 'date-fns'

interface AppState {
  // User state
  user: User | null
  setUser: (user: User) => void
  
  // Habits
  habits: Habit[]
  addHabit: (habit: Habit) => void
  updateHabit: (id: string, updates: Partial<Habit>) => void
  completeHabit: (id: string) => void
  deleteHabit: (id: string) => void
  
  // Challenges
  challenges: Challenge[]
  activeChallenges: Challenge[]
  joinChallenge: (challengeId: string) => void
  completeChallenge: (challengeId: string) => void
  
  // Stats
  dailyStats: DailyStats[]
  updateDailyStats: (stats: Partial<DailyStats>) => void
  
  // XP and Leveling
  addXP: (amount: number) => void
  checkLevelUp: () => boolean
}

const calculateXPForNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level))
}

const initializeUser = (): User => ({
  id: '1',
  name: 'User',
  email: 'user@example.com',
  level: 1,
  xp: 0,
  xpToNextLevel: calculateXPForNextLevel(1),
  streak: 0,
  longestStreak: 0,
  achievements: [],
  joinedAt: new Date(),
})

export const useStore = create<AppState>((set, get) => ({
  user: initializeUser(),
  setUser: (user) => set({ user }),

  habits: [],
  addHabit: (habit) => set((state) => {
    // Prevent duplicates by checking if habit with same name already exists
    const exists = state.habits.some((h) => h.name === habit.name && h.userId === habit.userId)
    if (exists) return state
    return { habits: [...state.habits, habit] }
  }),
  updateHabit: (id, updates) =>
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })),
  completeHabit: (id) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return

    const alreadyCompleted = habit.completedDates.includes(today)
    if (alreadyCompleted) return

    set((state) => {
      const updatedHabits = state.habits.map((h) =>
        h.id === id
          ? { ...h, completedDates: [...h.completedDates, today] }
          : h
      )
      
      // Add XP
      const completedHabit = updatedHabits.find((h) => h.id === id)
      if (completedHabit) {
        get().addXP(completedHabit.xpReward)
      }

      // Update streak
      const user = state.user!
      const newStreak = user.streak + 1
      const updatedUser = {
        ...user,
        streak: newStreak,
        longestStreak: Math.max(user.longestStreak, newStreak),
      }

      return { habits: updatedHabits, user: updatedUser }
    })
  },
  deleteHabit: (id) =>
    set((state) => ({ habits: state.habits.filter((h) => h.id !== id) })),

  challenges: [],
  activeChallenges: [],
  joinChallenge: (challengeId) =>
    set((state) => {
      const challenge = state.challenges.find((c) => c.id === challengeId)
      if (!challenge) return state

      const updatedChallenge = {
        ...challenge,
        participants: [...challenge.participants, state.user!.id],
      }
      const updatedChallenges = state.challenges.map((c) =>
        c.id === challengeId ? updatedChallenge : c
      )

      return {
        challenges: updatedChallenges,
        activeChallenges: [...state.activeChallenges, updatedChallenge],
      }
    }),
  completeChallenge: (challengeId) => {
    const challenge = get().activeChallenges.find((c) => c.id === challengeId)
    if (!challenge) return

    get().addXP(challenge.xpReward)
    set((state) => ({
      activeChallenges: state.activeChallenges.filter((c) => c.id !== challengeId),
    }))
  },

  dailyStats: [],
  updateDailyStats: (stats) =>
    set((state) => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const existing = state.dailyStats.find((s) => s.date === today)
      if (existing) {
        return {
          dailyStats: state.dailyStats.map((s) =>
            s.date === today ? { ...s, ...stats } : s
          ),
        }
      }
      return {
        dailyStats: [
          ...state.dailyStats,
          {
            date: today,
            habitsCompleted: 0,
            xpEarned: 0,
            challengesCompleted: 0,
            distractionsBlocked: 0,
            ...stats,
          },
        ],
      }
    }),

  addXP: (amount) =>
    set((state) => {
      const user = state.user!
      const newXP = user.xp + amount
      const newLevel = Math.floor(newXP / 100) + 1
      const xpToNextLevel = calculateXPForNextLevel(newLevel) - newXP

      return {
        user: {
          ...user,
          xp: newXP,
          level: newLevel,
          xpToNextLevel: Math.max(0, xpToNextLevel),
        },
      }
    }),
  checkLevelUp: () => {
    const user = get().user!
    return user.xpToNextLevel <= 0
  },
}))

