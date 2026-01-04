/**
 * Client-side API wrapper for goal operations
 * All MongoDB operations go through API routes
 */

import type { Goal } from '@/types'

const API_BASE = '/api/goals'

/**
 * Get all goals for a user
 */
export async function getGoals(
  userId: string,
  filters?: { status?: Goal['status'] }
): Promise<Goal[]> {
  const params = new URLSearchParams({ userId })
  if (filters?.status) {
    params.append('status', filters.status)
  }

  const response = await fetch(`${API_BASE}?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch goals: ${response.statusText}`)
  }

  const data = await response.json()
  const goals = data.data?.goals || data.goals || []
  
  // Convert date strings to Date objects
  return goals.map((goal: Goal) => ({
    ...goal,
    deadline: goal.deadline ? new Date(goal.deadline) : goal.deadline,
    startDate: goal.startDate ? new Date(goal.startDate) : goal.startDate,
    completedAt: goal.completedAt ? new Date(goal.completedAt) : goal.completedAt,
    createdAt: goal.createdAt ? new Date(goal.createdAt) : goal.createdAt,
    updatedAt: goal.updatedAt ? new Date(goal.updatedAt) : goal.updatedAt,
    milestones: goal.milestones?.map(m => ({
      ...m,
      completedAt: m.completedAt ? new Date(m.completedAt) : m.completedAt,
    })) || [],
  }))
}

/**
 * Get a single goal by ID
 */
export async function getGoalById(userId: string, goalId: string): Promise<Goal | null> {
  const response = await fetch(`${API_BASE}/${goalId}?userId=${userId}`)
  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`Failed to fetch goal: ${response.statusText}`)
  }

  const data = await response.json()
  const goal = data.data?.goal || data.goal
  if (!goal) return null

  // Convert date strings to Date objects
  return {
    ...goal,
    deadline: goal.deadline ? new Date(goal.deadline) : goal.deadline,
    startDate: goal.startDate ? new Date(goal.startDate) : goal.startDate,
    completedAt: goal.completedAt ? new Date(goal.completedAt) : goal.completedAt,
    createdAt: goal.createdAt ? new Date(goal.createdAt) : goal.createdAt,
    updatedAt: goal.updatedAt ? new Date(goal.updatedAt) : goal.updatedAt,
    milestones: goal.milestones?.map((m: any) => ({
      ...m,
      completedAt: m.completedAt ? new Date(m.completedAt) : m.completedAt,
    })) || [],
  }
}

/**
 * Add a new goal
 */
export async function addGoal(
  userId: string,
  goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'progressPercentage'>
): Promise<Goal> {
  const response = await fetch(`${API_BASE}?userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...goal,
      userId,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to add goal: ${response.statusText}`)
  }

  const data = await response.json()
  const newGoal = data.data?.goal || data.goal

  // Convert date strings to Date objects
  return {
    ...newGoal,
    deadline: newGoal.deadline ? new Date(newGoal.deadline) : newGoal.deadline,
    startDate: newGoal.startDate ? new Date(newGoal.startDate) : newGoal.startDate,
    createdAt: newGoal.createdAt ? new Date(newGoal.createdAt) : newGoal.createdAt,
    updatedAt: newGoal.updatedAt ? new Date(newGoal.updatedAt) : newGoal.updatedAt,
    milestones: newGoal.milestones?.map((m: any) => ({
      ...m,
      completedAt: m.completedAt ? new Date(m.completedAt) : m.completedAt,
    })) || [],
  }
}

/**
 * Update a goal
 */
export async function updateGoal(
  userId: string,
  goalId: string,
  updates: Partial<Goal>
): Promise<Goal> {
  const response = await fetch(`${API_BASE}/${goalId}?userId=${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    throw new Error(`Failed to update goal: ${response.statusText}`)
  }

  const data = await response.json()
  const updatedGoal = data.data?.goal || data.goal

  // Convert date strings to Date objects
  return {
    ...updatedGoal,
    deadline: updatedGoal.deadline ? new Date(updatedGoal.deadline) : updatedGoal.deadline,
    startDate: updatedGoal.startDate ? new Date(updatedGoal.startDate) : updatedGoal.startDate,
    completedAt: updatedGoal.completedAt ? new Date(updatedGoal.completedAt) : updatedGoal.completedAt,
    createdAt: updatedGoal.createdAt ? new Date(updatedGoal.createdAt) : updatedGoal.createdAt,
    updatedAt: updatedGoal.updatedAt ? new Date(updatedGoal.updatedAt) : updatedGoal.updatedAt,
    milestones: updatedGoal.milestones?.map((m: any) => ({
      ...m,
      completedAt: m.completedAt ? new Date(m.completedAt) : m.completedAt,
    })) || [],
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${goalId}?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete goal: ${response.statusText}`)
  }
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(
  userId: string,
  goalId: string,
  currentValue: number,
  note?: string
): Promise<Goal> {
  const response = await fetch(`${API_BASE}/${goalId}/progress?userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentValue, note }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update goal progress: ${response.statusText}`)
  }

  const data = await response.json()
  const updatedGoal = data.data?.goal || data.goal

  // Convert date strings to Date objects
  return {
    ...updatedGoal,
    deadline: updatedGoal.deadline ? new Date(updatedGoal.deadline) : updatedGoal.deadline,
    startDate: updatedGoal.startDate ? new Date(updatedGoal.startDate) : updatedGoal.startDate,
    completedAt: updatedGoal.completedAt ? new Date(updatedGoal.completedAt) : updatedGoal.completedAt,
    createdAt: updatedGoal.createdAt ? new Date(updatedGoal.createdAt) : updatedGoal.createdAt,
    updatedAt: updatedGoal.updatedAt ? new Date(updatedGoal.updatedAt) : updatedGoal.updatedAt,
    milestones: updatedGoal.milestones?.map((m: any) => ({
      ...m,
      completedAt: m.completedAt ? new Date(m.completedAt) : m.completedAt,
    })) || [],
  }
}

