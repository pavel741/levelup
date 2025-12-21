export interface User {
  id: string
  name: string
  email: string
  level: number
  xp: number
  xpToNextLevel: number
  streak: number
  longestStreak: number
  avatar?: string
  achievements: Achievement[]
  joinedAt: Date
  emailSummaryEnabled?: boolean
}

export interface MissedDate {
  date: string // Format: "yyyy-MM-dd"
  reason: string
  valid: boolean // true for valid excuses (sick, emergency), false for invalid (hangover, lazy)
}

export interface Habit {
  id: string
  userId: string
  name: string
  description: string
  icon: string
  color: string
  frequency: 'daily' | 'weekly' | 'custom'
  targetDays: number[]
  xpReward: number
  completedDates: string[]
  missedDates?: MissedDate[] // Dates when habit was missed with explanations
  createdAt: Date
  startDate?: Date | string // When the habit tracking should start (defaults to createdAt)
  isActive: boolean
  reminderEnabled?: boolean
  reminderTime?: string // Format: "HH:mm" (e.g., "09:00")
  lastReminderDate?: string // Format: "yyyy-MM-dd"
}

export interface Challenge {
  id: string
  title: string
  description: string
  type: 'habit' | 'distraction' | 'goal' | 'community' | 'finance'
  difficulty: 'easy' | 'medium' | 'hard'
  xpReward: number
  duration: number // days
  requirements: string[]
  participants: string[]
  habitIds?: string[] // Habit IDs linked to this challenge - when these habits are completed, challenge progress updates
  progress?: { [userId: string]: number } // Track progress per user (days completed or percentage for finance)
  completedDates?: { [userId: string]: string[] } // Track which dates each user completed
  startDate: Date
  endDate: Date
  isActive: boolean
  // Finance-specific fields
  financeGoalType?: 'savings_rate' | 'spending_limit' | 'savings_amount' | 'no_spend_days' // Type of finance challenge
  financeTarget?: number // Target amount (for savings_amount or spending_limit)
  financeTargetPercentage?: number // Target percentage (for savings_rate, e.g., 15 for 15%)
  financePeriod?: 'daily' | 'weekly' | 'monthly' | 'challenge_duration' // Period for finance tracking
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: Date
  progress: number
  target: number
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  avatar?: string
  level: number
  xp: number
  streak: number
  rank: number
}

export interface DailyStats {
  date: string
  habitsCompleted: number
  xpEarned: number
  challengesCompleted: number
  distractionsBlocked: number
}

