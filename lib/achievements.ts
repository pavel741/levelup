import { Achievement } from '@/types'
import { User, Habit } from '@/types'

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  checkProgress: (user: User, habits: Habit[]) => { progress: number; target: number; completed: boolean }
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_habit',
    name: 'Getting Started',
    description: 'Complete your first habit',
    icon: '🎯',
    rarity: 'common',
    checkProgress: (user, habits) => {
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
    checkProgress: (user, habits) => {
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
    checkProgress: (user, habits) => {
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
    checkProgress: (user, habits) => {
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
    checkProgress: (user, habits) => {
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
    checkProgress: (user, habits) => {
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
]

export const checkAndUnlockAchievements = (
  user: User,
  habits: Habit[],
  existingAchievements: Achievement[]
): Achievement[] => {
  const unlocked: Achievement[] = []

  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    const { progress, target, completed } = definition.checkProgress(user, habits)
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
        unlocked.push({
          ...existing,
          progress: progress,
          target: target,
          // Remove unlockAt if achievement is not actually completed
          unlockedAt: undefined as any, // Remove unlock date - achievement was incorrectly marked
        })
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

