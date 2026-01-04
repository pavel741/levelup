'use client'

import { useState, useEffect } from 'react'
export const dynamic = 'force-dynamic'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import HabitCard from '@/components/HabitCard'
import { Plus, Target, CheckCircle2, BarChart3, Calendar, Sparkles, Download, Upload, X } from 'lucide-react'
import { Habit } from '@/types'
import { format } from 'date-fns'
import { showWarning, showSuccess, showError } from '@/lib/utils'
import { HABIT_TEMPLATES, HABIT_BUNDLES, createHabitFromTemplate, exportHabits, importHabits } from '@/lib/habitTemplates'

export default function HabitsPage() {
  const { habits, addHabit, updateHabit, user } = useFirestoreStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showBundleModal, setShowBundleModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  
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
    frequency: 'daily' as 'daily' | 'weekly' | 'custom',
    targetDays: [1, 2, 3, 4, 5, 6, 7], // 1 = Monday, 7 = Sunday
    reminderEnabled: false,
    reminderTime: '09:00',
    startDate: '', // Format: "yyyy-MM-dd"
    targetCountPerDay: 1,
  })

  const handleAddHabit = () => {
    if (!newHabit.name.trim() || !user) return
    
    // Validate that weekly/custom habits have at least one day selected
    if ((newHabit.frequency === 'weekly' || newHabit.frequency === 'custom') && (!newHabit.targetDays || newHabit.targetDays.length === 0)) {
      showWarning('Please select at least one day for weekly or custom habits')
      return
    }

    // Validate XP reward
    const xpReward = newHabit.xpReward && newHabit.xpReward >= 10 ? newHabit.xpReward : 30

    addHabit({
      id: Date.now().toString(),
      userId: user.id,
      name: newHabit.name,
      description: newHabit.description,
      icon: newHabit.icon,
      color: newHabit.color,
      frequency: newHabit.frequency,
      targetDays: newHabit.targetDays,
      xpReward: xpReward,
      completedDates: [],
      createdAt: new Date(),
      startDate: newHabit.startDate ? new Date(newHabit.startDate) : undefined,
      isActive: true,
      reminderEnabled: newHabit.reminderEnabled,
      reminderTime: newHabit.reminderEnabled ? newHabit.reminderTime : undefined,
      targetCountPerDay: newHabit.targetCountPerDay || 1,
      completionsPerDay: {},
    })

    setNewHabit({
      name: '',
      description: '',
      icon: '🎯',
      color: 'bg-blue-500',
      xpReward: 30,
      frequency: 'daily',
      targetDays: [1, 2, 3, 4, 5, 6, 7],
      reminderEnabled: false,
      reminderTime: '09:00',
      startDate: '',
      targetCountPerDay: 1,
    })
    setShowAddModal(false)
  }

  const handleUseTemplate = (templateId: string) => {
    const template = HABIT_TEMPLATES.find(t => t.id === templateId)
    if (!template || !user) return

    const habitData = createHabitFromTemplate(template, user.id)
    
    addHabit({
      id: Date.now().toString(),
      userId: user.id,
      ...habitData,
      completedDates: [],
      createdAt: new Date(),
      completionsPerDay: {},
    })

    showSuccess(`Added "${template.name}" habit`)
    setShowTemplateModal(false)
  }

  const handleUseBundle = (bundleId: string) => {
    const bundle = HABIT_BUNDLES.find(b => b.id === bundleId)
    if (!bundle || !user) return

    let addedCount = 0
    bundle.habits.forEach(template => {
      const habitData = createHabitFromTemplate(template, user.id)
      addHabit({
        id: `${Date.now()}-${addedCount}`,
        userId: user.id,
        ...habitData,
        completedDates: [],
        createdAt: new Date(),
        completionsPerDay: {},
      })
      addedCount++
    })

    showSuccess(`Added ${addedCount} habits from "${bundle.name}"`)
    setShowBundleModal(false)
  }

  const handleExportHabits = () => {
    try {
      const json = exportHabits(habits.filter(h => h.isActive))
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `habits-export-${format(new Date(), 'yyyy-MM-dd')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showSuccess('Habits exported successfully')
    } catch (error) {
      showError(error, { component: 'HabitsPage', action: 'exportHabits' })
    }
  }

  const handleImportHabits = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string
          const importedHabits = importHabits(jsonString)
          
          if (!user) return

          importedHabits.forEach((habitData, index) => {
            addHabit({
              id: `${Date.now()}-${index}`,
              userId: user.id,
              name: habitData.name || 'Imported Habit',
              description: habitData.description || '',
              icon: habitData.icon || '🎯',
              color: habitData.color || 'bg-blue-500',
              frequency: habitData.frequency || 'daily',
              targetDays: habitData.targetDays || [1, 2, 3, 4, 5, 6, 7],
              xpReward: habitData.xpReward || 30,
              completedDates: [],
              createdAt: new Date(),
              isActive: true,
              reminderEnabled: habitData.reminderEnabled,
              reminderTime: habitData.reminderTime,
              targetCountPerDay: habitData.targetCountPerDay || 1,
              completionsPerDay: {},
            })
          })

          showSuccess(`Imported ${importedHabits.length} habit(s)`)
        } catch (error) {
          showError(error, { component: 'HabitsPage', action: 'importHabits' })
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit)
    const startDate = habit.startDate 
      ? (habit.startDate instanceof Date 
          ? format(habit.startDate, 'yyyy-MM-dd')
          : format(new Date(habit.startDate), 'yyyy-MM-dd'))
      : ''
    setNewHabit({
      name: habit.name,
      description: habit.description,
      icon: habit.icon,
      color: habit.color,
      xpReward: habit.xpReward,
      frequency: habit.frequency || 'daily',
      targetDays: habit.targetDays || [1, 2, 3, 4, 5, 6, 7],
      reminderEnabled: habit.reminderEnabled || false,
      reminderTime: habit.reminderTime || '09:00',
      startDate: startDate,
      targetCountPerDay: habit.targetCountPerDay || 1,
    })
    setShowEditModal(true)
  }

  const handleUpdateHabit = () => {
    if (!editingHabit || !newHabit.name.trim()) return
    
    // Validate that weekly/custom habits have at least one day selected
    if ((newHabit.frequency === 'weekly' || newHabit.frequency === 'custom') && (!newHabit.targetDays || newHabit.targetDays.length === 0)) {
      showWarning('Please select at least one day for weekly or custom habits')
      return
    }

    // Validate XP reward
    const xpReward = newHabit.xpReward && newHabit.xpReward >= 10 ? newHabit.xpReward : 30

    updateHabit(editingHabit.id, {
      name: newHabit.name,
      description: newHabit.description,
      icon: newHabit.icon,
      color: newHabit.color,
      xpReward: xpReward,
      frequency: newHabit.frequency,
      targetDays: newHabit.targetDays,
      startDate: newHabit.startDate ? new Date(newHabit.startDate) : undefined,
      reminderEnabled: newHabit.reminderEnabled,
      reminderTime: newHabit.reminderEnabled ? newHabit.reminderTime : undefined,
      targetCountPerDay: newHabit.targetCountPerDay || 1,
    })

    setNewHabit({
      name: '',
      description: '',
      icon: '🎯',
      color: 'bg-blue-500',
      xpReward: 30,
      frequency: 'daily',
      targetDays: [1, 2, 3, 4, 5, 6, 7],
      reminderEnabled: false,
      reminderTime: '09:00',
      startDate: '',
      targetCountPerDay: 1,
    })
    setShowEditModal(false)
    setEditingHabit(null)
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const activeHabits = habits.filter((h) => h.isActive)
  const completedForDate = activeHabits.filter((h) => {
    const targetCount = h.targetCountPerDay || 1
    const currentCount = h.completionsPerDay?.[selectedDate] || 0
    return h.completedDates.includes(selectedDate) && currentCount >= targetCount
  })
  const incompleteForDate = activeHabits.filter((h) => {
    const targetCount = h.targetCountPerDay || 1
    const currentCount = h.completionsPerDay?.[selectedDate] || 0
    return !h.completedDates.includes(selectedDate) || currentCount < targetCount
  })
  
  // Helper to format date display
  const getDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    const selectedDateObj = new Date(dateStr)
    selectedDateObj.setHours(0, 0, 0, 0)
    
    if (selectedDateObj.getTime() === todayDate.getTime()) {
      return 'Today'
    }
    const yesterday = new Date(todayDate)
    yesterday.setDate(yesterday.getDate() - 1)
    if (selectedDateObj.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    }
    return format(date, 'MMM d, yyyy')
  }
  const archivedHabits = habits.filter((h) => !h.isActive)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">My Habits</h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Track your daily habits and build consistency</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                      {getDateDisplay(selectedDate)}
                    </span>
                  </div>
                  <a
                    href="/habits/statistics"
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Statistics
                  </a>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline">Templates</span>
                    </button>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg text-sm sm:text-base"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Add Habit</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>
                </div>
              </div>

              {incompleteForDate.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    To Complete {selectedDate === today ? 'Today' : `on ${getDateDisplay(selectedDate)}`}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {incompleteForDate.map((habit) => (
                      <HabitCard key={habit.id} habit={habit} onEdit={handleEditHabit} selectedDate={selectedDate} />
                    ))}
                  </div>
                </div>
              )}

              {completedForDate.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Completed {selectedDate === today ? 'Today' : `on ${getDateDisplay(selectedDate)}`} ({completedForDate.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-90">
                    {completedForDate.map((habit) => (
                      <HabitCard key={habit.id} habit={habit} onEdit={handleEditHabit} selectedDate={selectedDate} />
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-xl my-auto max-h-[90vh] flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex-shrink-0">Create New Habit</h2>
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-2 -mr-2">
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
                <div className="mb-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-4xl">{newHabit.icon || '🎯'}</span>
                </div>
                <div className="grid grid-cols-8 gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 max-h-48 overflow-y-auto overscroll-contain">
                  {[
                    '🎯', '💪', '🏃', '🧘', '📚', '💧', '🍎', '😴',
                    '🧠', '📝', '🎨', '🎵', '🌱', '☀️', '🌙', '⭐',
                    '🔥', '💎', '🏆', '🎪', '🚀', '💼', '📱', '💻',
                    '🏋️', '🚴', '🧗', '🏊', '⚽', '🏀', '🎾', '🏓',
                    '🧹', '🍳', '🛁', '🛏️', '👕', '👔', '💇', '💅',
                    '📖', '✍️', '🎭', '🎬', '🎮', '🧩', '🎲', '🃏',
                    '🌍', '🗺️', '🏔️', '🌊', '🌳', '🌸', '🌻', '🌺',
                    '🐕', '🐈', '🐦', '🐠', '🦋', '🐝', '🦄', '🐉'
                  ].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewHabit({ ...newHabit, icon })}
                      className={`text-2xl p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors ${
                        newHabit.icon === icon ? 'bg-blue-200 dark:bg-blue-800 ring-2 ring-blue-500' : ''
                      }`}
                      title={`Select ${icon}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Click an icon above to select it, or type a custom emoji below</p>
                <input
                  type="text"
                  value={newHabit.icon}
                  onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Or type a custom emoji"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewHabit({ ...newHabit, frequency: 'daily', targetDays: [1, 2, 3, 4, 5, 6, 7] })
                    }}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      newHabit.frequency === 'daily'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewHabit({ ...newHabit, frequency: 'weekly', targetDays: [1] })
                    }}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      newHabit.frequency === 'weekly'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewHabit({ ...newHabit, frequency: 'custom' })
                    }}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      newHabit.frequency === 'custom'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {(newHabit.frequency === 'weekly' || newHabit.frequency === 'custom') && (
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Select Days</label>
                    <div className="grid grid-cols-7 gap-2">
                      {[
                        { day: 'Mon', value: 1, full: 'Monday' },
                        { day: 'Tue', value: 2, full: 'Tuesday' },
                        { day: 'Wed', value: 3, full: 'Wednesday' },
                        { day: 'Thu', value: 4, full: 'Thursday' },
                        { day: 'Fri', value: 5, full: 'Friday' },
                        { day: 'Sat', value: 6, full: 'Saturday' },
                        { day: 'Sun', value: 7, full: 'Sunday' },
                      ].map(({ day, value, full }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            const currentDays = newHabit.targetDays || []
                            const newDays = currentDays.includes(value)
                              ? currentDays.filter(d => d !== value)
                              : [...currentDays, value].sort()
                            setNewHabit({ ...newHabit, targetDays: newDays })
                          }}
                          className={`px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                            newHabit.targetDays?.includes(value)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                          title={full}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    {newHabit.frequency === 'weekly' && newHabit.targetDays.length === 0 && (
                      <p className="mt-2 text-xs text-red-500 dark:text-red-400">Please select at least one day</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">XP Reward</label>
                <input
                  type="number"
                  value={newHabit.xpReward === 0 ? '' : newHabit.xpReward}
                  onChange={(e) => {
                    const value = e.target.value
                    // Allow empty string, or parse the number
                    if (value === '') {
                      setNewHabit({ ...newHabit, xpReward: 0 })
                    } else {
                      const numValue = parseInt(value)
                      if (!isNaN(numValue)) {
                        setNewHabit({ ...newHabit, xpReward: numValue })
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value)
                    if (!value || value < 10) {
                      setNewHabit({ ...newHabit, xpReward: 30 })
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="10"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Count Per Day <span className="text-xs text-gray-500 dark:text-gray-400">(optional)</span>
                </label>
                <input
                  type="number"
                  value={newHabit.targetCountPerDay === 1 ? '' : newHabit.targetCountPerDay}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setNewHabit({ ...newHabit, targetCountPerDay: 1 })
                    } else {
                      const numValue = parseInt(value)
                      if (!isNaN(numValue) && numValue >= 1) {
                        setNewHabit({ ...newHabit, targetCountPerDay: numValue })
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value)
                    if (!value || value < 1) {
                      setNewHabit({ ...newHabit, targetCountPerDay: 1 })
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="20"
                  placeholder="1 (default)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  How many times should this habit be completed per day? (e.g., 3 meals, 2 dog walks). Leave empty or set to 1 for single completion.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date <span className="text-xs text-gray-500 dark:text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={newHabit.startDate}
                  onChange={(e) => setNewHabit({ ...newHabit, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Habit tracking will begin on this date. Leave empty to start today. You can set a future date.
                </p>
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
            </div>
            <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHabit}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Habit Templates</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportHabits}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
                  title="Export habits"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={handleImportHabits}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
                  title="Import habits"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowTemplateModal(false)
                    setShowBundleModal(true)
                  }}
                  className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                >
                  View Bundles
                </button>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              {['morning', 'evening', 'health', 'productivity', 'mindfulness', 'fitness'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HABIT_TEMPLATES.filter(t => selectedCategory === 'all' || t.category === selectedCategory).map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleUseTemplate(template.id)}
                  className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{template.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                        <span className="capitalize">{template.frequency}</span>
                        <span>•</span>
                        <span>{template.xpReward} XP</span>
                        {template.reminderEnabled && (
                          <>
                            <span>•</span>
                            <span>⏰ {template.reminderTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bundle Selection Modal */}
      {showBundleModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Habit Bundles</h2>
              <button
                onClick={() => {
                  setShowBundleModal(false)
                  setShowTemplateModal(true)
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                View Templates
              </button>
              <button
                onClick={() => setShowBundleModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add multiple related habits at once with these curated bundles.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HABIT_BUNDLES.map((bundle) => (
                <button
                  key={bundle.id}
                  onClick={() => handleUseBundle(bundle.id)}
                  className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{bundle.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{bundle.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{bundle.description}</p>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {bundle.habits.length} habits included
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowBundleModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Habit Modal */}
      {showEditModal && editingHabit && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-xl my-auto max-h-[90vh] flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex-shrink-0">Edit Habit</h2>
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-2 -mr-2">
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
                <div className="mb-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-4xl">{newHabit.icon || '🎯'}</span>
                </div>
                <div className="grid grid-cols-8 gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 max-h-48 overflow-y-auto overscroll-contain">
                  {[
                    '🎯', '💪', '🏃', '🧘', '📚', '💧', '🍎', '😴',
                    '🧠', '📝', '🎨', '🎵', '🌱', '☀️', '🌙', '⭐',
                    '🔥', '💎', '🏆', '🎪', '🚀', '💼', '📱', '💻',
                    '🏋️', '🚴', '🧗', '🏊', '⚽', '🏀', '🎾', '🏓',
                    '🧹', '🍳', '🛁', '🛏️', '👕', '👔', '💇', '💅',
                    '📖', '✍️', '🎭', '🎬', '🎮', '🧩', '🎲', '🃏',
                    '🌍', '🗺️', '🏔️', '🌊', '🌳', '🌸', '🌻', '🌺',
                    '🐕', '🐈', '🐦', '🐠', '🦋', '🐝', '🦄', '🐉'
                  ].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewHabit({ ...newHabit, icon })}
                      className={`text-2xl p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors ${
                        newHabit.icon === icon ? 'bg-blue-200 dark:bg-blue-800 ring-2 ring-blue-500' : ''
                      }`}
                      title={`Select ${icon}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Click an icon above to select it, or type a custom emoji below</p>
                <input
                  type="text"
                  value={newHabit.icon}
                  onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Or type a custom emoji"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewHabit({ ...newHabit, frequency: 'daily', targetDays: [1, 2, 3, 4, 5, 6, 7] })
                    }}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      newHabit.frequency === 'daily'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewHabit({ ...newHabit, frequency: 'weekly', targetDays: [1] })
                    }}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      newHabit.frequency === 'weekly'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewHabit({ ...newHabit, frequency: 'custom' })
                    }}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      newHabit.frequency === 'custom'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {(newHabit.frequency === 'weekly' || newHabit.frequency === 'custom') && (
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Select Days</label>
                    <div className="grid grid-cols-7 gap-2">
                      {[
                        { day: 'Mon', value: 1, full: 'Monday' },
                        { day: 'Tue', value: 2, full: 'Tuesday' },
                        { day: 'Wed', value: 3, full: 'Wednesday' },
                        { day: 'Thu', value: 4, full: 'Thursday' },
                        { day: 'Fri', value: 5, full: 'Friday' },
                        { day: 'Sat', value: 6, full: 'Saturday' },
                        { day: 'Sun', value: 7, full: 'Sunday' },
                      ].map(({ day, value, full }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            const currentDays = newHabit.targetDays || []
                            const newDays = currentDays.includes(value)
                              ? currentDays.filter(d => d !== value)
                              : [...currentDays, value].sort()
                            setNewHabit({ ...newHabit, targetDays: newDays })
                          }}
                          className={`px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                            newHabit.targetDays?.includes(value)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                          title={full}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    {newHabit.frequency === 'weekly' && newHabit.targetDays.length === 0 && (
                      <p className="mt-2 text-xs text-red-500 dark:text-red-400">Please select at least one day</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">XP Reward</label>
                <input
                  type="number"
                  value={newHabit.xpReward === 0 ? '' : newHabit.xpReward}
                  onChange={(e) => {
                    const value = e.target.value
                    // Allow empty string, or parse the number
                    if (value === '') {
                      setNewHabit({ ...newHabit, xpReward: 0 })
                    } else {
                      const numValue = parseInt(value)
                      if (!isNaN(numValue)) {
                        setNewHabit({ ...newHabit, xpReward: numValue })
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value)
                    if (!value || value < 10) {
                      setNewHabit({ ...newHabit, xpReward: 30 })
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="10"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Count Per Day <span className="text-xs text-gray-500 dark:text-gray-400">(optional)</span>
                </label>
                <input
                  type="number"
                  value={newHabit.targetCountPerDay === 1 ? '' : newHabit.targetCountPerDay}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setNewHabit({ ...newHabit, targetCountPerDay: 1 })
                    } else {
                      const numValue = parseInt(value)
                      if (!isNaN(numValue) && numValue >= 1) {
                        setNewHabit({ ...newHabit, targetCountPerDay: numValue })
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value)
                    if (!value || value < 1) {
                      setNewHabit({ ...newHabit, targetCountPerDay: 1 })
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="20"
                  placeholder="1 (default)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  How many times should this habit be completed per day? (e.g., 3 meals, 2 dog walks). Leave empty or set to 1 for single completion.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date <span className="text-xs text-gray-500 dark:text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={newHabit.startDate}
                  onChange={(e) => setNewHabit({ ...newHabit, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Habit tracking will begin on this date. Leave empty to start today. You can set a future date.
                </p>
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
            </div>
            <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
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
                    frequency: 'daily',
                    targetDays: [1, 2, 3, 4, 5, 6, 7],
                    reminderEnabled: false,
                    reminderTime: '09:00',
                    startDate: '',
                    targetCountPerDay: 1,
                  })
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateHabit}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AuthGuard>
  )
}

