/**
 * Habit Templates Library
 * Pre-built templates for common habits
 */

import type { Habit } from '@/types'

export interface HabitTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: 'morning' | 'evening' | 'health' | 'productivity' | 'mindfulness' | 'fitness' | 'learning' | 'other'
  frequency: Habit['frequency']
  targetDays: number[] // 1 = Monday, 7 = Sunday
  reminderEnabled: boolean
  reminderTime?: string // Format: "HH:mm"
  xpReward: number
  targetCountPerDay?: number
}

export interface HabitBundle {
  id: string
  name: string
  description: string
  icon: string
  category: string
  habits: HabitTemplate[]
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // Morning Routines
  {
    id: 'morning-meditation',
    name: 'Morning Meditation',
    description: 'Start your day with 10 minutes of mindfulness',
    icon: '🧘',
    color: 'bg-purple-500',
    category: 'morning',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '07:00',
    xpReward: 30,
  },
  {
    id: 'morning-journal',
    name: 'Morning Journal',
    description: 'Write down your thoughts and goals for the day',
    icon: '📝',
    color: 'bg-yellow-500',
    category: 'morning',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '07:30',
    xpReward: 25,
  },
  {
    id: 'morning-exercise',
    name: 'Morning Exercise',
    description: 'Get your body moving first thing in the morning',
    icon: '🏃',
    color: 'bg-green-500',
    category: 'morning',
    frequency: 'weekly',
    targetDays: [1, 3, 5], // Mon, Wed, Fri
    reminderEnabled: true,
    reminderTime: '06:30',
    xpReward: 50,
  },
  {
    id: 'make-bed',
    name: 'Make Your Bed',
    description: 'Start the day with a small accomplishment',
    icon: '🛏️',
    color: 'bg-blue-500',
    category: 'morning',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '08:00',
    xpReward: 15,
  },
  {
    id: 'drink-water-morning',
    name: 'Drink Water (Morning)',
    description: 'Hydrate first thing in the morning',
    icon: '💧',
    color: 'bg-cyan-500',
    category: 'morning',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '07:00',
    xpReward: 10,
    targetCountPerDay: 1,
  },

  // Evening Routines
  {
    id: 'evening-reflection',
    name: 'Evening Reflection',
    description: 'Reflect on your day and what you learned',
    icon: '🌙',
    color: 'bg-indigo-500',
    category: 'evening',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '21:00',
    xpReward: 25,
  },
  {
    id: 'no-phone-before-bed',
    name: 'No Phone Before Bed',
    description: 'Put your phone away 1 hour before sleep',
    icon: '📱',
    color: 'bg-gray-500',
    category: 'evening',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '22:00',
    xpReward: 20,
  },
  {
    id: 'evening-stretch',
    name: 'Evening Stretch',
    description: 'Relax your body before sleep',
    icon: '🤸',
    color: 'bg-pink-500',
    category: 'evening',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '21:30',
    xpReward: 20,
  },
  {
    id: 'prepare-tomorrow',
    name: 'Prepare for Tomorrow',
    description: 'Plan your next day the night before',
    icon: '📋',
    color: 'bg-orange-500',
    category: 'evening',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5], // Weekdays only
    reminderEnabled: true,
    reminderTime: '20:00',
    xpReward: 25,
  },

  // Health Habits
  {
    id: 'drink-water',
    name: 'Drink 8 Glasses of Water',
    description: 'Stay hydrated throughout the day',
    icon: '💧',
    color: 'bg-blue-500',
    category: 'health',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '09:00',
    xpReward: 30,
    targetCountPerDay: 8,
  },
  {
    id: 'eat-vegetables',
    name: 'Eat Vegetables',
    description: 'Include vegetables in every meal',
    icon: '🥗',
    color: 'bg-green-500',
    category: 'health',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: false,
    xpReward: 25,
  },
  {
    id: 'take-vitamins',
    name: 'Take Vitamins',
    description: 'Remember your daily vitamins',
    icon: '💊',
    color: 'bg-red-500',
    category: 'health',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '08:00',
    xpReward: 15,
  },
  {
    id: 'walk-10000-steps',
    name: 'Walk 10,000 Steps',
    description: 'Get your daily steps in',
    icon: '🚶',
    color: 'bg-emerald-500',
    category: 'health',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: false,
    xpReward: 40,
  },
  {
    id: 'floss-teeth',
    name: 'Floss Teeth',
    description: 'Take care of your dental health',
    icon: '🦷',
    color: 'bg-white',
    category: 'health',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '22:00',
    xpReward: 15,
  },

  // Productivity Habits
  {
    id: 'read-30-min',
    name: 'Read 30 Minutes',
    description: 'Read books to expand your knowledge',
    icon: '📚',
    color: 'bg-amber-500',
    category: 'productivity',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '20:00',
    xpReward: 35,
  },
  {
    id: 'learn-new-skill',
    name: 'Learn New Skill',
    description: 'Spend time learning something new',
    icon: '🎓',
    color: 'bg-violet-500',
    category: 'productivity',
    frequency: 'weekly',
    targetDays: [1, 3, 5], // Mon, Wed, Fri
    reminderEnabled: true,
    reminderTime: '19:00',
    xpReward: 50,
  },
  {
    id: 'no-social-media',
    name: 'No Social Media',
    description: 'Avoid social media during work hours',
    icon: '🚫',
    color: 'bg-gray-600',
    category: 'productivity',
    frequency: 'weekly',
    targetDays: [1, 2, 3, 4, 5], // Weekdays
    reminderEnabled: false,
    xpReward: 30,
  },
  {
    id: 'deep-work-session',
    name: 'Deep Work Session',
    description: 'Focus on important work without distractions',
    icon: '🎯',
    color: 'bg-blue-600',
    category: 'productivity',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5], // Weekdays
    reminderEnabled: true,
    reminderTime: '09:00',
    xpReward: 40,
  },
  {
    id: 'review-goals',
    name: 'Review Goals',
    description: 'Check progress on your goals',
    icon: '✅',
    color: 'bg-green-600',
    category: 'productivity',
    frequency: 'weekly',
    targetDays: [7], // Sunday
    reminderEnabled: true,
    reminderTime: '10:00',
    xpReward: 25,
  },

  // Mindfulness Habits
  {
    id: 'gratitude-journal',
    name: 'Gratitude Journal',
    description: 'Write down 3 things you\'re grateful for',
    icon: '🙏',
    color: 'bg-yellow-400',
    category: 'mindfulness',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '21:00',
    xpReward: 25,
  },
  {
    id: 'breathing-exercise',
    name: 'Breathing Exercise',
    description: 'Practice deep breathing for 5 minutes',
    icon: '🌬️',
    color: 'bg-teal-500',
    category: 'mindfulness',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '12:00',
    xpReward: 20,
  },
  {
    id: 'nature-walk',
    name: 'Nature Walk',
    description: 'Spend time in nature to recharge',
    icon: '🌳',
    color: 'bg-green-600',
    category: 'mindfulness',
    frequency: 'weekly',
    targetDays: [6, 7], // Weekend
    reminderEnabled: true,
    reminderTime: '10:00',
    xpReward: 40,
  },
  {
    id: 'digital-detox',
    name: 'Digital Detox',
    description: 'Take a break from screens',
    icon: '📵',
    color: 'bg-slate-500',
    category: 'mindfulness',
    frequency: 'weekly',
    targetDays: [7], // Sunday
    reminderEnabled: true,
    reminderTime: '09:00',
    xpReward: 50,
  },

  // Fitness Habits
  {
    id: 'workout',
    name: 'Workout',
    description: 'Exercise to stay fit and healthy',
    icon: '💪',
    color: 'bg-red-600',
    category: 'fitness',
    frequency: 'weekly',
    targetDays: [1, 3, 5], // Mon, Wed, Fri
    reminderEnabled: true,
    reminderTime: '18:00',
    xpReward: 60,
  },
  {
    id: 'yoga',
    name: 'Yoga Practice',
    description: 'Improve flexibility and mindfulness',
    icon: '🧘‍♀️',
    color: 'bg-purple-600',
    category: 'fitness',
    frequency: 'weekly',
    targetDays: [2, 4, 6], // Tue, Thu, Sat
    reminderEnabled: true,
    reminderTime: '07:00',
    xpReward: 40,
  },
  {
    id: 'stretch-daily',
    name: 'Daily Stretch',
    description: 'Keep your body flexible',
    icon: '🤸',
    color: 'bg-pink-500',
    category: 'fitness',
    frequency: 'daily',
    targetDays: [1, 2, 3, 4, 5, 6, 7],
    reminderEnabled: true,
    reminderTime: '19:00',
    xpReward: 20,
  },
]

export const HABIT_BUNDLES: HabitBundle[] = [
  {
    id: 'morning-routine-pack',
    name: 'Morning Routine Pack',
    description: 'Start your day right with these morning habits',
    icon: '🌅',
    category: 'morning',
    habits: HABIT_TEMPLATES.filter(t => t.category === 'morning'),
  },
  {
    id: 'evening-routine-pack',
    name: 'Evening Routine Pack',
    description: 'Wind down and prepare for restful sleep',
    icon: '🌙',
    category: 'evening',
    habits: HABIT_TEMPLATES.filter(t => t.category === 'evening'),
  },
  {
    id: 'health-pack',
    name: 'Health Pack',
    description: 'Essential habits for a healthy lifestyle',
    icon: '💚',
    category: 'health',
    habits: HABIT_TEMPLATES.filter(t => t.category === 'health'),
  },
  {
    id: 'productivity-pack',
    name: 'Productivity Pack',
    description: 'Boost your productivity and focus',
    icon: '⚡',
    category: 'productivity',
    habits: HABIT_TEMPLATES.filter(t => t.category === 'productivity'),
  },
  {
    id: 'mindfulness-pack',
    name: 'Mindfulness Pack',
    description: 'Cultivate peace and awareness',
    icon: '🧘',
    category: 'mindfulness',
    habits: HABIT_TEMPLATES.filter(t => t.category === 'mindfulness'),
  },
  {
    id: 'fitness-pack',
    name: 'Fitness Pack',
    description: 'Build strength and stay active',
    icon: '💪',
    category: 'fitness',
    habits: HABIT_TEMPLATES.filter(t => t.category === 'fitness'),
  },
]

/**
 * Create a habit from a template
 */
export function createHabitFromTemplate(
  template: HabitTemplate,
  userId: string,
  customizations?: {
    reminderTime?: string
    targetDays?: number[]
    reminderEnabled?: boolean
  }
): Omit<Habit, 'id' | 'userId' | 'createdAt' | 'completedDates' | 'missedDates' | 'completionsPerDay'> {
  return {
    name: template.name,
    description: template.description,
    icon: template.icon,
    color: template.color,
    frequency: template.frequency,
    targetDays: customizations?.targetDays || template.targetDays,
    xpReward: template.xpReward,
    isActive: true,
    reminderEnabled: customizations?.reminderEnabled !== undefined 
      ? customizations.reminderEnabled 
      : template.reminderEnabled,
    reminderTime: customizations?.reminderTime || template.reminderTime,
    targetCountPerDay: template.targetCountPerDay || 1,
    startDate: new Date(),
  }
}

/**
 * Export habits to JSON
 */
export function exportHabits(habits: Habit[]): string {
  const exportData = habits.map(habit => ({
    name: habit.name,
    description: habit.description,
    icon: habit.icon,
    color: habit.color,
    frequency: habit.frequency,
    targetDays: habit.targetDays,
    reminderEnabled: habit.reminderEnabled,
    reminderTime: habit.reminderTime,
    xpReward: habit.xpReward,
    targetCountPerDay: habit.targetCountPerDay,
  }))
  return JSON.stringify(exportData, null, 2)
}

/**
 * Import habits from JSON
 */
export function importHabits(jsonString: string): Partial<Habit>[] {
  try {
    const data = JSON.parse(jsonString)
    if (!Array.isArray(data)) {
      throw new Error('Invalid format: expected an array')
    }
    return data.map((item: any) => ({
      name: item.name,
      description: item.description || '',
      icon: item.icon || '🎯',
      color: item.color || 'bg-blue-500',
      frequency: item.frequency || 'daily',
      targetDays: item.targetDays || [1, 2, 3, 4, 5, 6, 7],
      reminderEnabled: item.reminderEnabled || false,
      reminderTime: item.reminderTime,
      xpReward: item.xpReward || 30,
      targetCountPerDay: item.targetCountPerDay || 1,
    }))
  } catch (error) {
    throw new Error('Failed to parse JSON: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

