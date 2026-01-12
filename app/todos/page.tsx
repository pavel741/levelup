'use client'

import { useState, useEffect } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { useTodosStore } from '@/store/useTodosStore'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import TodoCard from '@/components/TodoCard'
import { VirtualList } from '@/components/ui/VirtualList'
import { Plus, Circle, Filter, X } from 'lucide-react'
import { Todo } from '@/types'
import { format } from 'date-fns'
import { useLanguage } from '@/components/common/LanguageProvider'

export default function TodosPage() {
  const { user } = useFirestoreStore()
  const { t } = useLanguage()
  const {
    todos,
    isLoadingTodos,
    subscribeTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    completeTodo,
    unsubscribe,
  } = useTodosStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'important' | 'nice-to-have'>('all')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'important' as 'urgent' | 'important' | 'nice-to-have',
    category: '',
    tags: [] as string[],
    dueDate: '',
    recurring: {
      enabled: false,
      type: 'daily' as 'daily' | 'weekly' | 'monthly',
      interval: 1,
    },
    linkedHabitId: '',
    xpReward: 0,
  })

  useEffect(() => {
    if (user?.id) {
      const cleanup = subscribeTodos(user.id)
      return cleanup
    }
    return undefined
  }, [user?.id, subscribeTodos])

  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  const handleAddTodo = async () => {
    if (!newTodo.title.trim() || !user) return

    try {
      const todoData: Omit<Todo, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isCompleted'> = {
        title: newTodo.title.trim(),
        description: newTodo.description.trim() || undefined,
        priority: newTodo.priority,
        category: newTodo.category.trim() || undefined,
        tags: newTodo.tags.length > 0 ? newTodo.tags : undefined,
        dueDate: newTodo.dueDate ? new Date(newTodo.dueDate) : undefined,
        recurring: newTodo.recurring.enabled
          ? {
              type: newTodo.recurring.type,
              interval: newTodo.recurring.interval,
            }
          : undefined,
        linkedHabitId: newTodo.linkedHabitId || undefined,
        xpReward: newTodo.xpReward > 0 ? newTodo.xpReward : undefined,
      }

      await addTodo(user.id, todoData)

      setNewTodo({
        title: '',
        description: '',
        priority: 'important',
        category: '',
        tags: [],
        dueDate: '',
        recurring: {
          enabled: false,
          type: 'daily',
          interval: 1,
        },
        linkedHabitId: '',
        xpReward: 0,
      })
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding todo:', error)
    }
  }

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo)
    setNewTodo({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      category: todo.category || '',
      tags: todo.tags || [],
      dueDate: todo.dueDate ? format(new Date(todo.dueDate), 'yyyy-MM-dd') : '',
      recurring: {
        enabled: !!todo.recurring,
        type: todo.recurring?.type || 'daily',
        interval: todo.recurring?.interval || 1,
      },
      linkedHabitId: todo.linkedHabitId || '',
      xpReward: todo.xpReward || 0,
    })
    setShowEditModal(true)
  }

  const handleUpdateTodo = async () => {
    if (!editingTodo || !user) return

    try {
      const updates: Partial<Todo> = {
        title: newTodo.title.trim(),
        description: newTodo.description.trim() || undefined,
        priority: newTodo.priority,
        category: newTodo.category.trim() || undefined,
        tags: newTodo.tags.length > 0 ? newTodo.tags : undefined,
        dueDate: newTodo.dueDate ? new Date(newTodo.dueDate) : undefined,
        recurring: newTodo.recurring.enabled
          ? {
              type: newTodo.recurring.type,
              interval: newTodo.recurring.interval,
            }
          : undefined,
        linkedHabitId: newTodo.linkedHabitId || undefined,
        xpReward: newTodo.xpReward > 0 ? newTodo.xpReward : undefined,
      }

      await updateTodo(user.id, editingTodo.id, updates)
      setShowEditModal(false)
      setEditingTodo(null)
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    if (!user) return
    try {
      await deleteTodo(user.id, todoId)
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const handleCompleteTodo = async (todoId: string) => {
    if (!user) return
    try {
      await completeTodo(user.id, todoId)
    } catch (error) {
      console.error('Error completing todo:', error)
    }
  }

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active' && todo.isCompleted) return false
    if (filter === 'completed' && !todo.isCompleted) return false
    if (priorityFilter !== 'all' && todo.priority !== priorityFilter) return false
    return true
  })

  const activeTodos = todos.filter((t) => !t.isCompleted)
  const completedTodos = todos.filter((t) => t.isCompleted)

  const { habits } = useFirestoreStore()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('todos.tasksTodos')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('todos.activeCompleted', { active: activeTodos.length, completed: completedTodos.length })}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  {t('todos.addTask')}
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('todos.filter')}:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'active', 'completed'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        filter === f
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {f === 'all' ? t('common.all') : f === 'active' ? t('common.active') : t('common.completed')}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('todos.priority')}:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="all">{t('common.all')}</option>
                    <option value="urgent">{t('todos.urgent')}</option>
                    <option value="important">{t('todos.important')}</option>
                    <option value="nice-to-have">{t('todos.niceToHave')}</option>
                  </select>
                </div>
              </div>

              {/* Todos List */}
              {isLoadingTodos ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  {t('todos.loadingTodos')}
                </div>
              ) : filteredTodos.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Circle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>{t('todos.noTodosFound')}</p>
                </div>
              ) : filteredTodos.length > 50 ? (
                // Use virtual scrolling for large lists
                <VirtualList
                  items={filteredTodos}
                  itemHeight={120} // Approximate height of each todo card
                  containerHeight={600} // Fixed container height
                  overscan={5} // Render 5 extra items above/below for smooth scrolling
                  className="space-y-4"
                  renderItem={(todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onEdit={handleEditTodo}
                      onComplete={handleCompleteTodo}
                      onDelete={handleDeleteTodo}
                    />
                  )}
                />
              ) : (
                <div className="space-y-4">
                  {filteredTodos.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onEdit={handleEditTodo}
                      onComplete={handleCompleteTodo}
                      onDelete={handleDeleteTodo}
                    />
                  ))}
                </div>
              )}
              </div>
            </main>
          </div>
        </div>

        {/* Add Todo Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full shadow-xl my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('todos.addNewTask')}</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('todos.title')} *
                  </label>
                  <input
                    type="text"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('todos.enterTaskTitle')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('habits.description')}
                  </label>
                  <textarea
                    value={newTodo.description}
                    onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder={t('todos.enterTaskDescription')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('todos.priority')} *
                    </label>
                    <select
                      value={newTodo.priority}
                      onChange={(e) =>
                        setNewTodo({ ...newTodo, priority: e.target.value as any })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="urgent">{t('todos.urgent')}</option>
                      <option value="important">{t('todos.important')}</option>
                      <option value="nice-to-have">{t('todos.niceToHave')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('todos.dueDate')}
                    </label>
                    <input
                      type="date"
                      value={newTodo.dueDate}
                      onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={newTodo.category}
                      onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Work, Personal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      XP Reward
                    </label>
                    <input
                      type="number"
                      value={newTodo.xpReward}
                      onChange={(e) =>
                        setNewTodo({ ...newTodo, xpReward: parseInt(e.target.value) || 0 })
                      }
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={newTodo.recurring.enabled}
                      onChange={(e) =>
                        setNewTodo({
                          ...newTodo,
                          recurring: { ...newTodo.recurring, enabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Recurring Task
                    </span>
                  </label>
                  {newTodo.recurring.enabled && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <select
                        value={newTodo.recurring.type}
                        onChange={(e) =>
                          setNewTodo({
                            ...newTodo,
                            recurring: { ...newTodo.recurring, type: e.target.value as any },
                          })
                        }
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      <input
                        type="number"
                        value={newTodo.recurring.interval}
                        onChange={(e) =>
                          setNewTodo({
                            ...newTodo,
                            recurring: {
                              ...newTodo.recurring,
                              interval: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                        min="1"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Interval"
                      />
                    </div>
                  )}
                </div>

                {habits.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Link to Habit (Optional)
                    </label>
                    <select
                      value={newTodo.linkedHabitId}
                      onChange={(e) => setNewTodo({ ...newTodo, linkedHabitId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">None</option>
                      {habits.map((habit) => (
                        <option key={habit.id} value={habit.id}>
                          {habit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleAddTodo}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {t('todos.addTaskButton')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Todo Modal */}
        {showEditModal && editingTodo && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full shadow-xl my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('todos.editTask')}</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingTodo(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTodo.description}
                    onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority *
                    </label>
                    <select
                      value={newTodo.priority}
                      onChange={(e) =>
                        setNewTodo({ ...newTodo, priority: e.target.value as any })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="important">Important</option>
                      <option value="nice-to-have">Nice to Have</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTodo.dueDate}
                      onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={newTodo.category}
                      onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      XP Reward
                    </label>
                    <input
                      type="number"
                      value={newTodo.xpReward}
                      onChange={(e) =>
                        setNewTodo({ ...newTodo, xpReward: parseInt(e.target.value) || 0 })
                      }
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={newTodo.recurring.enabled}
                      onChange={(e) =>
                        setNewTodo({
                          ...newTodo,
                          recurring: { ...newTodo.recurring, enabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Recurring Task
                    </span>
                  </label>
                  {newTodo.recurring.enabled && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <select
                        value={newTodo.recurring.type}
                        onChange={(e) =>
                          setNewTodo({
                            ...newTodo,
                            recurring: { ...newTodo.recurring, type: e.target.value as any },
                          })
                        }
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      <input
                        type="number"
                        value={newTodo.recurring.interval}
                        onChange={(e) =>
                          setNewTodo({
                            ...newTodo,
                            recurring: {
                              ...newTodo.recurring,
                              interval: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                        min="1"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {habits.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Link to Habit (Optional)
                    </label>
                    <select
                      value={newTodo.linkedHabitId}
                      onChange={(e) => setNewTodo({ ...newTodo, linkedHabitId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">None</option>
                      {habits.map((habit) => (
                        <option key={habit.id} value={habit.id}>
                          {habit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingTodo(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateTodo}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {t('todos.updateTask')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}

