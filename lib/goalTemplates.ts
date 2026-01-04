/**
 * Goal Templates Library
 * Pre-built templates for common goals
 */

import type { Goal } from '@/types'
import { addMonths, addWeeks, addDays } from 'date-fns'

export interface GoalTemplate {
  id: string
  title: string
  description: string
  category: Goal['category']
  icon: string
  specific: string
  measurable: string
  achievable: string
  relevant: string
  defaultTargetValue: number
  defaultUnit: string
  defaultDuration: 'days' | 'weeks' | 'months'
  milestones: Array<{ title: string; targetValue: number; order: number }>
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  // Health & Fitness
  {
    id: 'lose-weight',
    title: 'Lose Weight',
    description: 'Achieve your target weight through healthy habits',
    category: 'health',
    icon: '⚖️',
    specific: 'Lose weight through a combination of diet and exercise',
    measurable: 'Track weight weekly and body measurements monthly',
    achievable: 'Set realistic weekly weight loss goals (0.5-1kg per week)',
    relevant: 'Improve overall health, energy levels, and confidence',
    defaultTargetValue: 10,
    defaultUnit: 'kg',
    defaultDuration: 'months',
    milestones: [
      { title: 'First 25%', targetValue: 2.5, order: 1 },
      { title: 'Halfway there', targetValue: 5, order: 2 },
      { title: '75% complete', targetValue: 7.5, order: 3 },
    ],
  },
  {
    id: 'build-muscle',
    title: 'Build Muscle',
    description: 'Gain strength and muscle mass',
    category: 'fitness',
    icon: '💪',
    specific: 'Increase muscle mass through strength training',
    measurable: 'Track weight lifted, body measurements, and body weight',
    achievable: 'Follow a structured workout plan with progressive overload',
    relevant: 'Improve strength, metabolism, and overall fitness',
    defaultTargetValue: 5,
    defaultUnit: 'kg',
    defaultDuration: 'months',
    milestones: [
      { title: 'First gains', targetValue: 1.25, order: 1 },
      { title: 'Halfway', targetValue: 2.5, order: 2 },
      { title: 'Almost there', targetValue: 3.75, order: 3 },
    ],
  },
  {
    id: 'run-distance',
    title: 'Run Distance Goal',
    description: 'Build endurance and running capacity',
    category: 'fitness',
    icon: '🏃',
    specific: 'Increase running distance and endurance',
    measurable: 'Track weekly running distance and longest run',
    achievable: 'Follow a gradual training plan with rest days',
    relevant: 'Improve cardiovascular health and mental well-being',
    defaultTargetValue: 10,
    defaultUnit: 'km',
    defaultDuration: 'months',
    milestones: [
      { title: 'First milestone', targetValue: 2.5, order: 1 },
      { title: 'Halfway point', targetValue: 5, order: 2 },
      { title: 'Final push', targetValue: 7.5, order: 3 },
    ],
  },
  {
    id: 'drink-water',
    title: 'Drink More Water',
    description: 'Stay hydrated throughout the day',
    category: 'health',
    icon: '💧',
    specific: 'Drink recommended daily water intake',
    measurable: 'Track daily water consumption',
    achievable: 'Set reminders and carry a water bottle',
    relevant: 'Improve energy, skin health, and overall well-being',
    defaultTargetValue: 2,
    defaultUnit: 'liters',
    defaultDuration: 'weeks',
    milestones: [
      { title: 'First week', targetValue: 0.5, order: 1 },
      { title: 'Halfway', targetValue: 1, order: 2 },
      { title: 'Habit formed', targetValue: 1.5, order: 3 },
    ],
  },

  // Finance
  {
    id: 'save-money',
    title: 'Save Money',
    description: 'Build your savings fund',
    category: 'finance',
    icon: '💰',
    specific: 'Save a specific amount of money',
    measurable: 'Track monthly savings and total saved',
    achievable: 'Set up automatic transfers and reduce unnecessary expenses',
    relevant: 'Build financial security and achieve financial goals',
    defaultTargetValue: 1000,
    defaultUnit: 'EUR',
    defaultDuration: 'months',
    milestones: [
      { title: 'First 25%', targetValue: 250, order: 1 },
      { title: 'Halfway', targetValue: 500, order: 2 },
      { title: 'Almost there', targetValue: 750, order: 3 },
    ],
  },
  {
    id: 'pay-debt',
    title: 'Pay Off Debt',
    description: 'Reduce and eliminate debt',
    category: 'finance',
    icon: '💳',
    specific: 'Pay off a specific amount of debt',
    measurable: 'Track debt balance and monthly payments',
    achievable: 'Create a payment plan and stick to it',
    relevant: 'Reduce financial stress and improve credit score',
    defaultTargetValue: 5000,
    defaultUnit: 'EUR',
    defaultDuration: 'months',
    milestones: [
      { title: 'First payment', targetValue: 1250, order: 1 },
      { title: 'Halfway', targetValue: 2500, order: 2 },
      { title: 'Final stretch', targetValue: 3750, order: 3 },
    ],
  },

  // Career & Learning
  {
    id: 'learn-skill',
    title: 'Learn a New Skill',
    description: 'Master a new professional or personal skill',
    category: 'learning',
    icon: '📚',
    specific: 'Learn and master a specific skill',
    measurable: 'Track study hours and completed courses/projects',
    achievable: 'Dedicate consistent time daily or weekly',
    relevant: 'Advance career, personal growth, or pursue interests',
    defaultTargetValue: 100,
    defaultUnit: 'hours',
    defaultDuration: 'months',
    milestones: [
      { title: 'Getting started', targetValue: 25, order: 1 },
      { title: 'Halfway', targetValue: 50, order: 2 },
      { title: 'Advanced', targetValue: 75, order: 3 },
    ],
  },
  {
    id: 'read-books',
    title: 'Read More Books',
    description: 'Develop reading habit and expand knowledge',
    category: 'learning',
    icon: '📖',
    specific: 'Read a specific number of books',
    measurable: 'Track books read and reading time',
    achievable: 'Set aside daily reading time',
    relevant: 'Expand knowledge, improve focus, and reduce stress',
    defaultTargetValue: 12,
    defaultUnit: 'books',
    defaultDuration: 'months',
    milestones: [
      { title: 'First quarter', targetValue: 3, order: 1 },
      { title: 'Halfway', targetValue: 6, order: 2 },
      { title: 'Almost done', targetValue: 9, order: 3 },
    ],
  },

  // Personal
  {
    id: 'meditation',
    title: 'Daily Meditation',
    description: 'Build a consistent meditation practice',
    category: 'personal',
    icon: '🧘',
    specific: 'Meditate daily for mental clarity and peace',
    measurable: 'Track daily meditation sessions and total minutes',
    achievable: 'Start with short sessions and gradually increase',
    relevant: 'Reduce stress, improve focus, and enhance well-being',
    defaultTargetValue: 30,
    defaultUnit: 'days',
    defaultDuration: 'months',
    milestones: [
      { title: 'First week', targetValue: 7, order: 1 },
      { title: 'Halfway', targetValue: 15, order: 2 },
      { title: 'Habit formed', targetValue: 22, order: 3 },
    ],
  },
  {
    id: 'reduce-screen-time',
    title: 'Reduce Screen Time',
    description: 'Spend less time on devices',
    category: 'personal',
    icon: '📱',
    specific: 'Reduce daily screen time',
    measurable: 'Track daily screen time hours',
    achievable: 'Set limits and use app blockers',
    relevant: 'Improve sleep, focus, and real-world connections',
    defaultTargetValue: 2,
    defaultUnit: 'hours',
    defaultDuration: 'weeks',
    milestones: [
      { title: 'First reduction', targetValue: 0.5, order: 1 },
      { title: 'Halfway', targetValue: 1, order: 2 },
      { title: 'Major improvement', targetValue: 1.5, order: 3 },
    ],
  },
]

/**
 * Create a goal from a template
 */
export function createGoalFromTemplate(
  template: GoalTemplate,
  _userId: string,
  customizations?: {
    targetValue?: number
    deadline?: Date
    startDate?: Date
  }
): Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'progressPercentage'> {
  const now = new Date()
  const startDate = customizations?.startDate || now
  
  // Calculate deadline based on template duration
  let deadline: Date
  if (customizations?.deadline) {
    deadline = customizations.deadline
  } else {
    switch (template.defaultDuration) {
      case 'days':
        deadline = addDays(startDate, template.defaultTargetValue)
        break
      case 'weeks':
        deadline = addWeeks(startDate, template.defaultTargetValue)
        break
      case 'months':
        deadline = addMonths(startDate, template.defaultTargetValue)
        break
    }
  }

  return {
    title: template.title,
    description: template.description,
    category: template.category,
    specific: template.specific,
    measurable: template.measurable,
    achievable: template.achievable,
    relevant: template.relevant,
    timeBound: deadline,
    currentValue: 0,
    targetValue: customizations?.targetValue || template.defaultTargetValue,
    unit: template.defaultUnit,
    deadline,
    startDate,
    status: 'active',
    milestones: template.milestones.map((m, idx) => ({
      id: `milestone-${Date.now()}-${idx}`,
      title: m.title,
      description: undefined,
      targetValue: m.targetValue,
      currentValue: 0,
      isCompleted: false,
      order: m.order,
    })),
  }
}

