import { Achievement } from '@/types'
import { User, Habit } from '@/types'
import type { FinanceTransaction } from '@/types/finance'
import type { WorkoutLog } from '@/types/workout'
import { Timestamp } from 'firebase/firestore'

// Helper function to convert date to Date object
function toDate(date: string | Date | Timestamp): Date {
  if (date instanceof Date) return date
  if (date instanceof Timestamp) return date.toDate()
  return new Date(date)
}

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  checkProgress: (
    user: User,
    habits: Habit[],
    transactions?: FinanceTransaction[],
    workoutLogs?: WorkoutLog[]
  ) => { progress: number; target: number; completed: boolean }
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_habit',
    name: 'Getting Started',
    description: 'Complete your first habit',
    icon: '🎯',
    rarity: 'common',
    checkProgress: (_user, habits) => {
      const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0)
      return { progress: Math.min(totalCompletions, 1), target: 1, completed: totalCompletions >= 1 }
    },
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    rarity: 'common',
    checkProgress: (user) => {
      return { progress: Math.min(user.streak, 7), target: 7, completed: user.streak >= 7 }
    },
  },
  {
    id: 'streak_30',
    name: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '💪',
    rarity: 'rare',
    checkProgress: (user) => {
      return { progress: Math.min(user.streak, 30), target: 30, completed: user.streak >= 30 }
    },
  },
  {
    id: 'streak_100',
    name: 'Century Streak',
    description: 'Maintain a 100-day streak',
    icon: '👑',
    rarity: 'legendary',
    checkProgress: (user) => {
      return { progress: Math.min(user.streak, 100), target: 100, completed: user.streak >= 100 }
    },
  },
  {
    id: 'habits_10',
    name: 'Habit Collector',
    description: 'Complete 10 habits',
    icon: '📚',
    rarity: 'common',
    checkProgress: (_user, habits) => {
      const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0)
      return { progress: Math.min(totalCompletions, 10), target: 10, completed: totalCompletions >= 10 }
    },
  },
  {
    id: 'habits_100',
    name: 'Centurion',
    description: 'Complete 100 habits',
    icon: '🏆',
    rarity: 'rare',
    checkProgress: (_user, habits) => {
      const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0)
      return { progress: Math.min(totalCompletions, 100), target: 100, completed: totalCompletions >= 100 }
    },
  },
  {
    id: 'habits_1000',
    name: 'Thousand Club',
    description: 'Complete 1000 habits',
    icon: '🌟',
    rarity: 'epic',
    checkProgress: (_user, habits) => {
      const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0)
      return { progress: Math.min(totalCompletions, 1000), target: 1000, completed: totalCompletions >= 1000 }
    },
  },
  {
    id: 'level_5',
    name: 'Level Up',
    description: 'Reach level 5',
    icon: '⭐',
    rarity: 'common',
    checkProgress: (user) => {
      return { progress: Math.min(user.level, 5), target: 5, completed: user.level >= 5 }
    },
  },
  {
    id: 'level_10',
    name: 'Double Digits',
    description: 'Reach level 10',
    icon: '💫',
    rarity: 'rare',
    checkProgress: (user) => {
      return { progress: Math.min(user.level, 10), target: 10, completed: user.level >= 10 }
    },
  },
  {
    id: 'level_25',
    name: 'Quarter Century',
    description: 'Reach level 25',
    icon: '🎖️',
    rarity: 'epic',
    checkProgress: (user) => {
      return { progress: Math.min(user.level, 25), target: 25, completed: user.level >= 25 }
    },
  },
  {
    id: 'xp_1000',
    name: 'XP Master',
    description: 'Earn 1000 XP',
    icon: '💎',
    rarity: 'common',
    checkProgress: (user) => {
      return { progress: Math.min(user.xp, 1000), target: 1000, completed: user.xp >= 1000 }
    },
  },
  {
    id: 'xp_10000',
    name: 'XP Legend',
    description: 'Earn 10000 XP',
    icon: '💠',
    rarity: 'epic',
    checkProgress: (user) => {
      return { progress: Math.min(user.xp, 10000), target: 10000, completed: user.xp >= 10000 }
    },
  },
  {
    id: 'habits_5_active',
    name: 'Multi-Tasker',
    description: 'Have 5 active habits',
    icon: '🎪',
    rarity: 'common',
    checkProgress: (_user, habits) => {
      const activeHabits = habits.filter((h) => h.isActive).length
      return { progress: Math.min(activeHabits, 5), target: 5, completed: activeHabits >= 5 }
    },
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Complete all habits every day for a week',
    icon: '✨',
    rarity: 'rare',
    checkProgress: (_user, habits) => {
      const activeHabits = habits.filter((h) => h.isActive)
      if (activeHabits.length === 0) return { progress: 0, target: 7, completed: false }
      
      const today = new Date()
      let perfectDays = 0
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]
        const allCompleted = activeHabits.every((h) => h.completedDates.includes(dateStr))
        if (allCompleted) perfectDays++
      }
      return { progress: Math.min(perfectDays, 7), target: 7, completed: perfectDays >= 7 }
    },
  },
  
  // ---------- Finance Achievements ----------
  {
    id: 'first_transaction',
    name: 'First Transaction',
    description: 'Record your first transaction',
    icon: '💰',
    rarity: 'common',
    checkProgress: (_user, _habits, transactions) => {
      const count = transactions?.length || 0
      return { progress: Math.min(count, 1), target: 1, completed: count >= 1 }
    },
  },
  {
    id: 'transactions_10',
    name: 'Transaction Tracker',
    description: 'Record 10 transactions',
    icon: '📊',
    rarity: 'common',
    checkProgress: (_user, _habits, transactions) => {
      const count = transactions?.length || 0
      return { progress: Math.min(count, 10), target: 10, completed: count >= 10 }
    },
  },
  {
    id: 'transactions_100',
    name: 'Finance Master',
    description: 'Record 100 transactions',
    icon: '💳',
    rarity: 'rare',
    checkProgress: (_user, _habits, transactions) => {
      const count = transactions?.length || 0
      return { progress: Math.min(count, 100), target: 100, completed: count >= 100 }
    },
  },
  {
    id: 'savings_1000',
    name: 'Thousand Saver',
    description: 'Save €1,000',
    icon: '💵',
    rarity: 'rare',
    checkProgress: (_user, _habits, transactions) => {
      if (!transactions || transactions.length === 0) return { progress: 0, target: 1000, completed: false }
      
      let income = 0
      let expenses = 0
      transactions.forEach((tx) => {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        if (type === 'income' || amount > 0) {
          income += Math.abs(amount)
        } else {
          expenses += Math.abs(amount)
        }
      })
      
      const savings = income - expenses
      return { progress: Math.min(savings, 1000), target: 1000, completed: savings >= 1000 }
    },
  },
  {
    id: 'savings_5000',
    name: 'Five Grand',
    description: 'Save €5,000',
    icon: '💸',
    rarity: 'epic',
    checkProgress: (_user, _habits, transactions) => {
      if (!transactions || transactions.length === 0) return { progress: 0, target: 5000, completed: false }
      
      let income = 0
      let expenses = 0
      transactions.forEach((tx) => {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        if (type === 'income' || amount > 0) {
          income += Math.abs(amount)
        } else {
          expenses += Math.abs(amount)
        }
      })
      
      const savings = income - expenses
      return { progress: Math.min(savings, 5000), target: 5000, completed: savings >= 5000 }
    },
  },
  {
    id: 'savings_10000',
    name: 'Ten Thousand Club',
    description: 'Save €10,000',
    icon: '🏦',
    rarity: 'legendary',
    checkProgress: (_user, _habits, transactions) => {
      if (!transactions || transactions.length === 0) return { progress: 0, target: 10000, completed: false }
      
      let income = 0
      let expenses = 0
      transactions.forEach((tx) => {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        if (type === 'income' || amount > 0) {
          income += Math.abs(amount)
        } else {
          expenses += Math.abs(amount)
        }
      })
      
      const savings = income - expenses
      return { progress: Math.min(savings, 10000), target: 10000, completed: savings >= 10000 }
    },
  },
  {
    id: 'no_spend_week',
    name: 'No Spend Week',
    description: 'Go 7 days without any expenses',
    icon: '🚫',
    rarity: 'rare',
    checkProgress: (_user, _habits, transactions) => {
      if (!transactions || transactions.length === 0) return { progress: 0, target: 7, completed: false }
      
      const today = new Date()
      const expenses = transactions.filter((tx) => {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        const isExpense = type === 'expense' || amount < 0
        if (!isExpense) return false
        
        const txDate = toDate(tx.date)
        const daysDiff = Math.floor((today.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff <= 7
      })
      
      const expenseDates = new Set(expenses.map((tx) => toDate(tx.date).toISOString().split('T')[0]))
      const noSpendDays = 7 - expenseDates.size
      return { progress: Math.min(noSpendDays, 7), target: 7, completed: noSpendDays >= 7 }
    },
  },
  {
    id: 'monthly_budget',
    name: 'Budget Master',
    description: 'Track expenses for a full month',
    icon: '📈',
    rarity: 'common',
    checkProgress: (_user, _habits, transactions) => {
      if (!transactions || transactions.length === 0) return { progress: 0, target: 30, completed: false }
      
      const today = new Date()
      const monthAgo = new Date(today)
      monthAgo.setDate(monthAgo.getDate() - 30)
      
      const recentTransactions = transactions.filter((tx) => {
        const txDate = toDate(tx.date)
        return txDate >= monthAgo && txDate <= today
      })
      
      const transactionDates = new Set(recentTransactions.map((tx) => toDate(tx.date).toISOString().split('T')[0]))
      return { progress: Math.min(transactionDates.size, 30), target: 30, completed: transactionDates.size >= 30 }
    },
  },
  {
    id: 'savings_streak_3',
    name: '3-Month Saver',
    description: 'Save money for 3 consecutive months',
    icon: '🔥',
    rarity: 'rare',
    checkProgress: (_user, _habits, transactions) => {
      if (!transactions || transactions.length === 0) return { progress: 0, target: 3, completed: false }
      
      // Import calculateSavingsStreak
      const { calculateSavingsStreak } = require('@/lib/savingsStreaks')
      const streak = calculateSavingsStreak(transactions)
      return { progress: Math.min(streak.currentStreak, 3), target: 3, completed: streak.currentStreak >= 3 }
    },
  },
  {
    id: 'savings_streak_6',
    name: '6-Month Saver',
    description: 'Save money for 6 consecutive months',
    icon: '💎',
    rarity: 'epic',
    checkProgress: (_user, _habits, transactions) => {
      if (!transactions || transactions.length === 0) return { progress: 0, target: 6, completed: false }
      
      const { calculateSavingsStreak } = require('@/lib/savingsStreaks')
      const streak = calculateSavingsStreak(transactions)
      return { progress: Math.min(streak.currentStreak, 6), target: 6, completed: streak.currentStreak >= 6 }
    },
  },
  {
    id: 'savings_streak_12',
    name: 'Year Saver',
    description: 'Save money for 12 consecutive months',
    icon: '👑',
    rarity: 'legendary',
    checkProgress: (_user, _habits, transactions) => {
      if (!transactions || transactions.length === 0) return { progress: 0, target: 12, completed: false }
      
      const { calculateSavingsStreak } = require('@/lib/savingsStreaks')
      const streak = calculateSavingsStreak(transactions)
      return { progress: Math.min(streak.currentStreak, 12), target: 12, completed: streak.currentStreak >= 12 }
    },
  },
  {
    id: 'budget_adherence',
    name: 'Budget Adherent',
    description: 'Stay within budget for a full month',
    icon: '✅',
    rarity: 'rare',
    checkProgress: (_user, _habits, _transactions) => {
      // This would need budget data - simplified for now
      return { progress: 0, target: 1, completed: false }
    },
  },
  {
    id: 'savings_rate_20',
    name: '20% Saver',
    description: 'Achieve 20% savings rate',
    icon: '💹',
    rarity: 'rare',
    checkProgress: (_user, _habits, transactions) => {
      if (!transactions || transactions.length === 0) return { progress: 0, target: 20, completed: false }
      
      let income = 0
      let expenses = 0
      transactions.forEach((tx) => {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        if (type === 'income' || amount > 0) {
          income += Math.abs(amount)
        } else {
          expenses += Math.abs(amount)
        }
      })
      
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
      return { progress: Math.min(savingsRate, 20), target: 20, completed: savingsRate >= 20 }
    },
  },
  {
    id: 'savings_rate_30',
    name: '30% Saver',
    description: 'Achieve 30% savings rate',
    icon: '🚀',
    rarity: 'epic',
    checkProgress: (_user, _habits, transactions) => {
      if (!transactions || transactions.length === 0) return { progress: 0, target: 30, completed: false }
      
      let income = 0
      let expenses = 0
      transactions.forEach((tx) => {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        if (type === 'income' || amount > 0) {
          income += Math.abs(amount)
        } else {
          expenses += Math.abs(amount)
        }
      })
      
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
      return { progress: Math.min(savingsRate, 30), target: 30, completed: savingsRate >= 30 }
    },
  },
  {
    id: 'no_impulse_30',
    name: '30 Days No Impulse',
    description: 'Go 30 days without impulse purchases',
    icon: '🛡️',
    rarity: 'epic',
    checkProgress: (_user, _habits, transactions) => {
      if (!transactions || transactions.length === 0) return { progress: 0, target: 30, completed: false }
      
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentExpenses = transactions.filter((tx) => {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        const isExpense = type === 'expense' || amount < 0
        if (!isExpense) return false
        
        const txDate = toDate(tx.date)
        return txDate >= thirtyDaysAgo && txDate <= today
      })
      
      // Count days with expenses
      const expenseDates = new Set(recentExpenses.map((tx) => toDate(tx.date).toISOString().split('T')[0]))
      const noSpendDays = 30 - expenseDates.size
      return { progress: Math.min(noSpendDays, 30), target: 30, completed: noSpendDays >= 30 }
    },
  },
  
  // ---------- Workout Achievements ----------
  {
    id: 'first_workout',
    name: 'First Rep',
    description: 'Complete your first workout',
    icon: '💪',
    rarity: 'common',
    checkProgress: (_user, _habits, _transactions, workoutLogs) => {
      const completedWorkouts = workoutLogs?.filter((log) => log.completed) || []
      const count = completedWorkouts.length
      return { progress: Math.min(count, 1), target: 1, completed: count >= 1 }
    },
  },
  {
    id: 'workouts_10',
    name: 'Regular Exerciser',
    description: 'Complete 10 workouts',
    icon: '🏋️',
    rarity: 'common',
    checkProgress: (_user, _habits, _transactions, workoutLogs) => {
      const completedWorkouts = workoutLogs?.filter((log) => log.completed) || []
      const count = completedWorkouts.length
      return { progress: Math.min(count, 10), target: 10, completed: count >= 10 }
    },
  },
  {
    id: 'workouts_50',
    name: 'Fitness Enthusiast',
    description: 'Complete 50 workouts',
    icon: '🔥',
    rarity: 'rare',
    checkProgress: (_user, _habits, _transactions, workoutLogs) => {
      const completedWorkouts = workoutLogs?.filter((log) => log.completed) || []
      const count = completedWorkouts.length
      return { progress: Math.min(count, 50), target: 50, completed: count >= 50 }
    },
  },
  {
    id: 'workouts_100',
    name: 'Century Club',
    description: 'Complete 100 workouts',
    icon: '👑',
    rarity: 'epic',
    checkProgress: (_user, _habits, _transactions, workoutLogs) => {
      const completedWorkouts = workoutLogs?.filter((log) => log.completed) || []
      const count = completedWorkouts.length
      return { progress: Math.min(count, 100), target: 100, completed: count >= 100 }
    },
  },
  {
    id: 'workout_streak_7',
    name: 'Weekly Warrior',
    description: 'Workout 7 days in a row',
    icon: '⚡',
    rarity: 'rare',
    checkProgress: (_user, _habits, _transactions, workoutLogs) => {
      const completedWorkouts = workoutLogs?.filter((log) => log.completed) || []
      if (completedWorkouts.length === 0) return { progress: 0, target: 7, completed: false }
      
      const workoutDates = new Set(
        completedWorkouts.map((log) => new Date(log.date).toISOString().split('T')[0])
      )
      const sortedDates = Array.from(workoutDates).sort().reverse()
      
      let streak = 0
      const today = new Date().toISOString().split('T')[0]
      let checkDate = today
      
      for (let i = 0; i < 7; i++) {
        if (sortedDates.includes(checkDate)) {
          streak++
          const date = new Date(checkDate)
          date.setDate(date.getDate() - 1)
          checkDate = date.toISOString().split('T')[0]
        } else {
          break
        }
      }
      
      return { progress: Math.min(streak, 7), target: 7, completed: streak >= 7 }
    },
  },
  {
    id: 'workout_streak_30',
    name: 'Monthly Grind',
    description: 'Workout 30 days in a row',
    icon: '💎',
    rarity: 'epic',
    checkProgress: (_user, _habits, _transactions, workoutLogs) => {
      const completedWorkouts = workoutLogs?.filter((log) => log.completed) || []
      if (completedWorkouts.length === 0) return { progress: 0, target: 30, completed: false }
      
      const workoutDates = new Set(
        completedWorkouts.map((log) => new Date(log.date).toISOString().split('T')[0])
      )
      const sortedDates = Array.from(workoutDates).sort().reverse()
      
      let streak = 0
      const today = new Date().toISOString().split('T')[0]
      let checkDate = today
      
      for (let i = 0; i < 30; i++) {
        if (sortedDates.includes(checkDate)) {
          streak++
          const date = new Date(checkDate)
          date.setDate(date.getDate() - 1)
          checkDate = date.toISOString().split('T')[0]
        } else {
          break
        }
      }
      
      return { progress: Math.min(streak, 30), target: 30, completed: streak >= 30 }
    },
  },
  {
    id: 'volume_1000',
    name: 'Ton of Iron',
    description: 'Lift 1,000 kg total volume',
    icon: '🏋️‍♂️',
    rarity: 'rare',
    checkProgress: (_user, _habits, _transactions, workoutLogs) => {
      const completedWorkouts = workoutLogs?.filter((log) => log.completed) || []
      const totalVolume = completedWorkouts.reduce((sum, log) => sum + (log.totalVolume || 0), 0)
      return { progress: Math.min(totalVolume, 1000), target: 1000, completed: totalVolume >= 1000 }
    },
  },
  {
    id: 'volume_10000',
    name: 'Volume King',
    description: 'Lift 10,000 kg total volume',
    icon: '💪',
    rarity: 'epic',
    checkProgress: (_user, _habits, _transactions, workoutLogs) => {
      const completedWorkouts = workoutLogs?.filter((log) => log.completed) || []
      const totalVolume = completedWorkouts.reduce((sum, log) => sum + (log.totalVolume || 0), 0)
      return { progress: Math.min(totalVolume, 10000), target: 10000, completed: totalVolume >= 10000 }
    },
  },
  {
    id: 'volume_50000',
    name: 'Volume Legend',
    description: 'Lift 50,000 kg total volume',
    icon: '👑',
    rarity: 'legendary',
    checkProgress: (_user, _habits, _transactions, workoutLogs) => {
      const completedWorkouts = workoutLogs?.filter((log) => log.completed) || []
      const totalVolume = completedWorkouts.reduce((sum, log) => sum + (log.totalVolume || 0), 0)
      return { progress: Math.min(totalVolume, 50000), target: 50000, completed: totalVolume >= 50000 }
    },
  },
  {
    id: 'workout_week',
    name: 'Weekly Routine',
    description: 'Workout 7 times in a week',
    icon: '📅',
    rarity: 'rare',
    checkProgress: (_user, _habits, _transactions, workoutLogs) => {
      const completedWorkouts = workoutLogs?.filter((log) => log.completed) || []
      if (completedWorkouts.length === 0) return { progress: 0, target: 7, completed: false }
      
      const today = new Date()
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const weeklyWorkouts = completedWorkouts.filter((log) => {
        const logDate = new Date(log.date)
        return logDate >= weekAgo && logDate <= today
      })
      
      return { progress: Math.min(weeklyWorkouts.length, 7), target: 7, completed: weeklyWorkouts.length >= 7 }
    },
  },
]

export const checkAndUnlockAchievements = (
  user: User,
  habits: Habit[],
  existingAchievements: Achievement[],
  transactions?: FinanceTransaction[],
  workoutLogs?: WorkoutLog[]
): Achievement[] => {
  const unlocked: Achievement[] = []

  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    const { progress, target, completed } = definition.checkProgress(user, habits, transactions, workoutLogs)
    const existing = existingAchievements.find((a) => a.id === definition.id)
    
    // If achievement is completed
    if (completed) {
      // If it was already unlocked, keep it unlocked but update progress
      if (existing && existing.unlockedAt) {
        unlocked.push({
          ...existing,
          progress: target,
          target: target,
        })
      } else {
        // Unlock it now (either new or was incorrectly marked as not unlocked)
        unlocked.push({
          id: definition.id,
          name: definition.name,
          description: definition.description,
          icon: definition.icon,
          rarity: definition.rarity,
          progress: target,
          target: target,
          unlockedAt: existing?.unlockedAt || new Date(), // Keep existing unlock date if it exists
        })
      }
      } else {
        // Achievement is NOT completed
        // If it was incorrectly marked as unlocked, remove the unlock status
        if (existing) {
          // Update progress and remove unlock status if it was incorrectly unlocked
          const achievement: Achievement = {
            id: existing.id,
            name: existing.name,
            description: existing.description,
            icon: existing.icon,
            rarity: existing.rarity,
            progress: progress,
            target: target,
            // Don't include unlockedAt if achievement is not completed
          }
          unlocked.push(achievement)
      } else {
        // Track progress (not unlocked, new achievement)
        unlocked.push({
          id: definition.id,
          name: definition.name,
          description: definition.description,
          icon: definition.icon,
          rarity: definition.rarity,
          progress: progress,
          target: target,
        })
      }
    }
  }

  return unlocked
}

