/**
 * Todos Feature Store
 * Manages todo/task-related state
 */

import { create } from 'zustand'
import type { Todo } from '@/types'
import {
  getTodos as fetchTodos,
  addTodo as addTodoApi,
  updateTodo as updateTodoApi,
  deleteTodo as deleteTodoApi,
  completeTodo as completeTodoApi,
} from '@/lib/todosApi'
import { showError } from '@/lib/utils'
import { createSmartPoll } from '@/lib/utils/smart-polling'

interface TodosState {
  // Todos
  todos: Todo[]
  isLoadingTodos: boolean
  
  // Actions
  setTodos: (todos: Todo[]) => void
  loadTodos: (userId: string) => Promise<void>
  subscribeTodos: (userId: string) => () => void
  addTodo: (userId: string, todo: Omit<Todo, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isCompleted'>) => Promise<void>
  updateTodo: (userId: string, todoId: string, updates: Partial<Todo>) => Promise<void>
  deleteTodo: (userId: string, todoId: string) => Promise<void>
  completeTodo: (userId: string, todoId: string) => Promise<void>
  
  // Cleanup
  unsubscribe: () => void
}

let unsubscribeTodos: (() => void) | null = null

export const useTodosStore = create<TodosState>((set, get) => ({
  // Initial state
  todos: [],
  isLoadingTodos: true,

  setTodos: (todos) => {
    set({ todos, isLoadingTodos: false })
  },

  loadTodos: async (userId: string) => {
    try {
      set({ isLoadingTodos: true })
      const todos = await fetchTodos(userId)
      set({ todos, isLoadingTodos: false })
    } catch (error) {
      console.error('Error loading todos:', error)
      showError('Failed to load todos')
      set({ isLoadingTodos: false })
    }
  },

  subscribeTodos: (userId: string) => {
    // Clean up existing subscription
    if (unsubscribeTodos) {
      unsubscribeTodos()
    }

    set({ isLoadingTodos: true })

    const hashData = (todos: Todo[]): string => {
      if (todos.length === 0) return 'empty'
      return `${todos.length}-${todos[0]?.id || ''}-${todos[todos.length - 1]?.id || ''}`
    }

    const fetchTodosFn = async (): Promise<Todo[]> => {
      return fetchTodos(userId)
    }

    // Subscribe with smart polling
    unsubscribeTodos = createSmartPoll(
      fetchTodosFn,
      (todos) => {
        get().setTodos(todos)
      },
      {
        activeInterval: 30000, // 30 seconds when active
        idleInterval: 120000, // 2 minutes when idle
        hiddenInterval: 300000, // 5 minutes when tab hidden
        idleThreshold: 60000, // 1 minute idle threshold
        hashFn: hashData,
        initialData: [],
      }
    )

    return () => {
      if (unsubscribeTodos) {
        unsubscribeTodos()
        unsubscribeTodos = null
      }
    }
  },

  addTodo: async (userId: string, todo: Omit<Todo, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isCompleted'>) => {
    try {
      await addTodoApi(userId, todo)
      // Reload todos to get the new one
      await get().loadTodos(userId)
    } catch (error) {
      console.error('Error adding todo:', error)
      showError('Failed to add todo')
      throw error
    }
  },

  updateTodo: async (userId: string, todoId: string, updates: Partial<Todo>) => {
    try {
      await updateTodoApi(userId, todoId, updates)
      // Reload todos to get updated data
      await get().loadTodos(userId)
    } catch (error) {
      console.error('Error updating todo:', error)
      showError('Failed to update todo')
      throw error
    }
  },

  deleteTodo: async (userId: string, todoId: string) => {
    try {
      await deleteTodoApi(userId, todoId)
      // Reload todos to reflect deletion
      await get().loadTodos(userId)
    } catch (error) {
      console.error('Error deleting todo:', error)
      showError('Failed to delete todo')
      throw error
    }
  },

  completeTodo: async (userId: string, todoId: string) => {
    try {
      await completeTodoApi(userId, todoId)
      // Reload todos to reflect completion
      await get().loadTodos(userId)
    } catch (error) {
      console.error('Error completing todo:', error)
      showError('Failed to complete todo')
      throw error
    }
  },

  unsubscribe: () => {
    if (unsubscribeTodos) {
      unsubscribeTodos()
      unsubscribeTodos = null
    }
  },
}))

