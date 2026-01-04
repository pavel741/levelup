'use client'

import type { Todo } from '@/types'
import { cache, createCacheKey } from '@/lib/utils/cache'

// GET - Get all todos
export const getTodos = async (userId: string): Promise<Todo[]> => {
  const cacheKey = createCacheKey('todos', userId)
  return cache.get(cacheKey, () => _getTodos(userId), { staleTime: 30 * 1000, cacheTime: 5 * 60 * 1000 })
}

const _getTodos = async (userId: string): Promise<Todo[]> => {
  const params = new URLSearchParams({ userId })
  const response = await fetch(`/api/todos?${params}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get todos')
  }
  const result = await response.json()
  // successResponse wraps data in { data: ... }, so we need data.data.todos
  return result.data?.todos || result.todos || []
}

// POST - Add a todo
export const addTodo = async (
  userId: string,
  todo: Omit<Todo, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isCompleted'>
): Promise<string> => {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...todo }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add todo')
  }
  const data = await response.json()
  cache.invalidatePattern(new RegExp(`^todos:${userId}`))
  return data.id
}

// PUT - Update a todo
export const updateTodo = async (
  userId: string,
  todoId: string,
  updates: Partial<Todo>
): Promise<void> => {
  const response = await fetch('/api/todos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, id: todoId, ...updates }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update todo')
  }
  cache.invalidatePattern(new RegExp(`^todos:${userId}`))
}

// DELETE - Delete a todo
export const deleteTodo = async (
  userId: string,
  todoId: string
): Promise<void> => {
  const params = new URLSearchParams({ id: todoId, userId })
  const response = await fetch(`/api/todos?${params}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete todo')
  }
  cache.invalidatePattern(new RegExp(`^todos:${userId}`))
}

// POST - Complete a todo
export const completeTodo = async (
  userId: string,
  todoId: string
): Promise<void> => {
  const params = new URLSearchParams({ userId })
  const response = await fetch(`/api/todos/${todoId}/complete?${params}`, {
    method: 'POST',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to complete todo')
  }
  cache.invalidatePattern(new RegExp(`^todos:${userId}`))
}

