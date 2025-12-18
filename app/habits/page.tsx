'use client'

import { useState, useEffect } from 'react'
export const dynamic = 'force-dynamic'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import HabitCard from '@/components/HabitCard'
import { Plus, Target } from 'lucide-react'
import { Habit } from '@/types'

export default function HabitsPage() {
  const { habits, addHabit, updateHabit, user } = useFirestoreStore()
  const [showAddModal, setShowAddModal] = useState(false)
  
  // Debug logging
  useEffect(() => {
    console.log('HabitsPage - User ID:', user?.id)
    console.log('HabitsPage - Total habits:', habits.length)
    console.log('HabitsPage - All habits:', habits.map(h => ({ 
      id: h.id, 
      name: h.name, 
      userId: h.userId, 
      isActive: h.isActive,
      matchesCurrentUser: h.userId === user?.id
    })))
  }, [user, habits])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    icon: '🎯',
    color: 'bg-blue-500',
    xpReward: 30,
    reminderEnabled: false,
    reminderTime: '09:00',
  })

  const handleAddHabit = () => {
    if (!newHabit.name.trim() || !user) return

    addHabit({
      id: Date.now().toString(),
      userId: user.id,
      name: newHabit.name,
      description: newHabit.description,
      icon: newHabit.icon,
      color: newHabit.color,
      frequency: 'daily',
      targetDays: [1, 2, 3, 4, 5, 6, 7],
      xpReward: newHabit.xpReward,
      completedDates: [],
      createdAt: new Date(),
      isActive: true,
      reminderEnabled: newHabit.reminderEnabled,
      reminderTime: newHabit.reminderEnabled ? newHabit.reminderTime : undefined,
    })

    setNewHabit({
      name: '',
      description: '',
      icon: '🎯',
      color: 'bg-blue-500',
      xpReward: 30,
      reminderEnabled: false,
      reminderTime: '09:00',
    })
    setShowAddModal(false)
  }

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit)
    setNewHabit({
      name: habit.name,
      description: habit.description,
      icon: habit.icon,
      color: habit.color,
      xpReward: habit.xpReward,
      reminderEnabled: habit.reminderEnabled || false,
      reminderTime: habit.reminderTime || '09:00',
    })
    setShowEditModal(true)
  }

  const handleUpdateHabit = () => {
    if (!editingHabit || !newHabit.name.trim()) return

    updateHabit(editingHabit.id, {
      name: newHabit.name,
      description: newHabit.description,
      icon: newHabit.icon,
      color: newHabit.color,
      xpReward: newHabit.xpReward,
      reminderEnabled: newHabit.reminderEnabled,
      reminderTime: newHabit.reminderEnabled ? newHabit.reminderTime : undefined,
    })

    setNewHabit({
      name: '',
      description: '',
      icon: '🎯',
      color: 'bg-blue-500',
      xpReward: 30,
      reminderEnabled: false,
      reminderTime: '09:00',
    })
    setShowEditModal(false)
    setEditingHabit(null)
  }

  const activeHabits = habits.filter((h) => h.isActive)
  const archivedHabits = habits.filter((h) => !h.isActive)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Habits</h1>
                  <p className="text-gray-600 dark:text-gray-400">Track your daily habits and build consistency</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add Habit
                </button>
              </div>

              {activeHabits.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Habits</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeHabits.map((habit) => (
                      <HabitCard key={habit.id} habit={habit} onEdit={handleEditHabit} />
                    ))}
                  </div>
                </div>
              )}

              {activeHabits.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No habits yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first habit to start building consistency!</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Create Habit
                  </button>
                </div>
              )}

              {archivedHabits.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Archived Habits</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {archivedHabits.map((habit) => (
                      <HabitCard key={habit.id} habit={habit} onEdit={handleEditHabit} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create New Habit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Habit Name</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., Morning Exercise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., 30 minutes of exercise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                <input
                  type="text"
                  value={newHabit.icon}
                  onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="🎯"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">XP Reward</label>
                <input
                  type="number"
                  value={newHabit.xpReward}
                  onChange={(e) => setNewHabit({ ...newHabit, xpReward: parseInt(e.target.value) || 30 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="10"
                  max="100"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={newHabit.reminderEnabled}
                    onChange={(e) => setNewHabit({ ...newHabit, reminderEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Daily Reminder</span>
                </label>
                {newHabit.reminderEnabled && (
                  <input
                    type="time"
                    value={newHabit.reminderTime}
                    onChange={(e) => setNewHabit({ ...newHabit, reminderTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddHabit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Habit Modal */}
      {showEditModal && editingHabit && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Edit Habit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Habit Name</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., Morning Exercise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., 30 minutes of exercise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                <input
                  type="text"
                  value={newHabit.icon}
                  onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="🎯"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">XP Reward</label>
                <input
                  type="number"
                  value={newHabit.xpReward}
                  onChange={(e) => setNewHabit({ ...newHabit, xpReward: parseInt(e.target.value) || 30 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="10"
                  max="100"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={newHabit.reminderEnabled}
                    onChange={(e) => setNewHabit({ ...newHabit, reminderEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Daily Reminder</span>
                </label>
                {newHabit.reminderEnabled && (
                  <input
                    type="time"
                    value={newHabit.reminderTime}
                    onChange={(e) => setNewHabit({ ...newHabit, reminderTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingHabit(null)
                    setNewHabit({
                      name: '',
                      description: '',
                      icon: '🎯',
                      color: 'bg-blue-500',
                      xpReward: 30,
                      reminderEnabled: false,
                      reminderTime: '09:00',
                    })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateHabit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Changes
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

