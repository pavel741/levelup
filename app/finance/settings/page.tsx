'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import {
  getCategories,
  saveCategories,
  getBudgetGoals,
  saveBudgetGoals,
  getFinanceSettings,
  saveFinanceSettings,
  subscribeToRecurringTransactions,
  addRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  subscribeToReconciliationHistory,
  getLastReconciliation,
  saveLastReconciliation,
} from '@/lib/financeApi'
import { showWarning } from '@/lib/utils'
import type {
  FinanceCategories,
  FinanceBudgetGoals,
  FinanceSettings,
  FinanceRecurringTransaction,
  FinanceReconciliationRecord,
} from '@/types/finance'
import { Settings, Repeat, History, ArrowLeft, Plus, Trash2, Edit2, X, Save } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface CategoryItem {
  name: string
  color: string
  monthlyLimit?: number
}

export default function FinanceSettingsPage() {
  const { user } = useFirestoreStore()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Categories
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1')
  const [newCategoryLimit, setNewCategoryLimit] = useState('')
  const [, setIsSavingCategories] = useState(false)

  // Budget Goals
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState('')
  const [emergencyFundTarget, setEmergencyFundTarget] = useState('')
  const [isSavingGoals, setIsSavingGoals] = useState(false)

  // App Settings
  const [currency, setCurrency] = useState('EUR')
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Recurring
  const [recurring, setRecurring] = useState<FinanceRecurringTransaction[]>([])
  const [recurringLoading, setRecurringLoading] = useState(true)
  const [newRecurringName, setNewRecurringName] = useState('')
  const [newRecurringAmount, setNewRecurringAmount] = useState('')
  const [newRecurringCategory, setNewRecurringCategory] = useState('')
  const [newRecurringInterval, setNewRecurringInterval] = useState('monthly')

  // Reconciliation
  const [reconciliationHistory, setReconciliationHistory] = useState<FinanceReconciliationRecord[]>([])
  const [lastReconciliation, setLastReconciliation] = useState<FinanceReconciliationRecord | null>(null)
  const [isSavingReconciliation, setIsSavingReconciliation] = useState(false)
  
  // Period settings
  const [usePaydayPeriod, setUsePaydayPeriod] = useState(false)
  const [periodStartDay, setPeriodStartDay] = useState(1)
  const [periodEndDay, setPeriodEndDay] = useState<number | null>(null)
  const [paydayCutoffHour, setPaydayCutoffHour] = useState(13) // Default 1pm for end date
  const [paydayStartCutoffHour, setPaydayStartCutoffHour] = useState(14) // Default 2pm for start date
  const [capDateRangesToData, setCapDateRangesToData] = useState(true)
  const [isSavingPeriod] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    const load = async () => {
      try {
        const [cats, goals, settings, lastRec] = await Promise.all([
          getCategories(user.id),
          getBudgetGoals(user.id),
          getFinanceSettings(user.id),
          getLastReconciliation(user.id),
        ])

        // Load categories
        if (cats) {
          const categoryList: CategoryItem[] = Object.entries(cats).map(([name, data]: [string, any]) => ({
            name,
            color: data?.color || '#6366f1',
            monthlyLimit: data?.monthlyLimit || data?.limit,
          }))
          setCategories(categoryList)
        }

        // Load budget goals
        if (goals) {
          setMonthlySavingsTarget(goals.monthlySavingsTarget?.toString() || '')
          setEmergencyFundTarget(goals.emergencyFundTarget?.toString() || '')
        }

        // Load app settings
        if (settings) {
          setCurrency(settings.currency || 'EUR')
          setUsePaydayPeriod(settings.usePaydayPeriod || false)
          setPeriodStartDay(settings.periodStartDay ?? 1)
          setPeriodEndDay(settings.periodEndDay ?? null)
          setPaydayCutoffHour(settings.paydayCutoffHour ?? 13) // Default 1pm for end date
          setPaydayStartCutoffHour(settings.paydayStartCutoffHour ?? 14) // Default 2pm for start date
          setCapDateRangesToData(settings.capDateRangesToData !== false) // Default to true
        }
        
        if (lastRec) {
          setLastReconciliation(lastRec)
        }
      } catch (e) {
        console.error('Error loading finance settings:', e)
      }
    }

    load()

    setRecurringLoading(true)
    const unsubRecurring = subscribeToRecurringTransactions(user.id, (items) => {
      setRecurring(items)
      setRecurringLoading(false)
    })

    const unsubHistory = subscribeToReconciliationHistory(user.id, (items) => {
      setReconciliationHistory(items)
    })

    return () => {
      unsubRecurring()
      unsubHistory()
    }
  }, [user?.id])

  const handleSaveCategories = async () => {
    if (!user?.id) return
    setIsSavingCategories(true)
    try {
      const categoriesObj: FinanceCategories = {}
      categories.forEach((cat) => {
        categoriesObj[cat.name] = {
          color: cat.color,
          ...(cat.monthlyLimit ? { monthlyLimit: Number(cat.monthlyLimit) } : {}),
        }
      })
      await saveCategories(user.id, categoriesObj)
    } catch (e: any) {
      console.error('Error saving finance categories:', e)
    } finally {
      setIsSavingCategories(false)
    }
  }

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return
    if (categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      showWarning('Category already exists')
      return
    }
    setCategories([...categories, {
      name: newCategoryName.trim(),
      color: newCategoryColor,
      monthlyLimit: newCategoryLimit ? Number(newCategoryLimit) : undefined,
    }])
    setNewCategoryName('')
    setNewCategoryColor('#6366f1')
    setNewCategoryLimit('')
    handleSaveCategories()
  }

  const handleDeleteCategory = (name: string) => {
    if (confirm(`Delete category "${name}"?`)) {
      setCategories(categories.filter(c => c.name !== name))
      handleSaveCategories()
    }
  }

  const handleEditCategory = (category: CategoryItem) => {
    setEditingCategory(category.name)
    setNewCategoryName(category.name)
    setNewCategoryColor(category.color)
    setNewCategoryLimit(category.monthlyLimit?.toString() || '')
  }

  const handleSaveEditCategory = () => {
    if (!editingCategory || !newCategoryName.trim()) return
    const updated = categories.map(c => 
      c.name === editingCategory 
        ? { name: newCategoryName.trim(), color: newCategoryColor, monthlyLimit: newCategoryLimit ? Number(newCategoryLimit) : undefined }
        : c
    )
    setCategories(updated)
    setEditingCategory(null)
    setNewCategoryName('')
    setNewCategoryColor('#6366f1')
    setNewCategoryLimit('')
    handleSaveCategories()
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setNewCategoryName('')
    setNewCategoryColor('#6366f1')
    setNewCategoryLimit('')
  }

  const handleSaveGoals = async () => {
    if (!user?.id) return
    setIsSavingGoals(true)
    try {
      const goals: FinanceBudgetGoals = {
        ...(monthlySavingsTarget ? { monthlySavingsTarget: Number(monthlySavingsTarget) } : {}),
        ...(emergencyFundTarget ? { emergencyFundTarget: Number(emergencyFundTarget) } : {}),
      }
      await saveBudgetGoals(user.id, goals)
    } catch (e: any) {
      console.error('Error saving budget goals:', e)
    } finally {
      setIsSavingGoals(false)
    }
  }

  const handleSaveAppSettings = async () => {
    if (!user?.id) return
    setIsSavingSettings(true)
    try {
      const settings: FinanceSettings = {
        currency,
        usePaydayPeriod,
        periodStartDay,
        periodEndDay,
        paydayCutoffHour: usePaydayPeriod ? paydayCutoffHour : undefined,
        paydayStartCutoffHour: usePaydayPeriod ? paydayStartCutoffHour : undefined,
        capDateRangesToData,
      }
      await saveFinanceSettings(user.id, settings)
    } catch (e: any) {
      console.error('Error saving finance app settings:', e)
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleSavePeriodSettings = async () => {
    await handleSaveAppSettings()
  }

  const handleAddRecurring = async () => {
    if (!user?.id) return
    const amount = Number(newRecurringAmount.replace(',', '.'))
    if (!newRecurringName.trim() || isNaN(amount) || amount === 0) {
      return
    }

    const item = {
      name: newRecurringName.trim(),
      amount,
      category: newRecurringCategory.trim() || undefined,
      interval: newRecurringInterval,
    }
    try {
      await addRecurringTransaction(user.id, item)
      setNewRecurringName('')
      setNewRecurringAmount('')
      setNewRecurringCategory('')
    } catch (e) {
      console.error('Error adding recurring transaction:', e)
    }
  }

  const handleToggleRecurringActive = async (item: FinanceRecurringTransaction) => {
    if (!user?.id || !item.id) return
    const currentActive = (item as any).isActive ?? true
    try {
      await updateRecurringTransaction(user.id, item.id, { isActive: !currentActive } as any)
    } catch (e) {
      console.error('Error updating recurring transaction:', e)
    }
  }

  const handleDeleteRecurring = async (item: FinanceRecurringTransaction) => {
    if (!user?.id || !item.id) return
    try {
      await deleteRecurringTransaction(user.id, item.id)
    } catch (e) {
      console.error('Error deleting recurring transaction:', e)
    }
  }

  const handleSaveReconciliationSnapshot = async () => {
    if (!user?.id) return
    setIsSavingReconciliation(true)
    try {
      const now = new Date()
      const snapshot: Omit<FinanceReconciliationRecord, 'id'> = {
        timestamp: now,
        note: 'Manual snapshot from LevelUp finance settings',
      } as any
      await saveLastReconciliation(user.id, snapshot)
      const latest = await getLastReconciliation(user.id)
      if (latest) {
        setLastReconciliation(latest)
      }
    } catch (e) {
      console.error('Error saving reconciliation snapshot:', e)
    } finally {
      setIsSavingReconciliation(false)
    }
  }


  const categoryColors = [
    '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
    '#06b6d4', '#84cc16', '#f97316', '#14b8a6', '#a855f7', '#eab308',
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-6xl mx-auto space-y-6">
                <button
                  onClick={() => router.push('/finance')}
                  className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Finance
                </button>
                <div className="mb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance Settings</h1>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Configure categories, budget goals, recurring transactions, and more.
                  </p>
                </div>

                {/* Categories */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h2>
                  
                  {/* Add/Edit Category Form */}
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newCategoryColor}
                          onChange={(e) => setNewCategoryColor(e.target.value)}
                          className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <div className="flex gap-1 flex-wrap">
                          {categoryColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setNewCategoryColor(color)}
                              className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <input
                        type="number"
                        placeholder="Monthly limit (optional)"
                        value={newCategoryLimit}
                        onChange={(e) => setNewCategoryLimit(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                      />
                      <div className="flex gap-2">
                        {editingCategory ? (
                          <>
                            <button
                              onClick={handleSaveEditCategory}
                              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={handleAddCategory}
                            disabled={!newCategoryName.trim()}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                            Add Category
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Categories List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No categories yet. Add your first category above.
                      </p>
                    ) : (
                      categories.map((category) => (
                        <div
                          key={category.name}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                              {category.monthlyLimit && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Limit: €{category.monthlyLimit.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.name)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Budget Goals */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget Goals</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Monthly Savings Target (€)
                      </label>
                      <input
                        type="number"
                        value={monthlySavingsTarget}
                        onChange={(e) => setMonthlySavingsTarget(e.target.value)}
                        placeholder="500"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Emergency Fund Target (€)
                      </label>
                      <input
                        type="number"
                        value={emergencyFundTarget}
                        onChange={(e) => setEmergencyFundTarget(e.target.value)}
                        placeholder="3000"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveGoals}
                      disabled={isSavingGoals || !user}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingGoals ? 'Saving…' : 'Save Goals'}
                    </button>
                  </div>
                </div>

                {/* Period Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Period Settings</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Configure how monthly periods are calculated for your budget and analytics.
                  </p>
                  
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePaydayPeriod}
                        onChange={(e) => setUsePaydayPeriod(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Use Payday Period (Last Working Day)
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                      Use payday-to-payday periods instead of custom period. Transactions on the last working day are included only if before the cutoff time.
                    </p>
                  </div>
                  
                  {usePaydayPeriod && (
                    <div className="mb-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Period Start Cutoff Time (hour, 24-hour format)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={paydayStartCutoffHour}
                          onChange={(e) => setPaydayStartCutoffHour(parseInt(e.target.value) || 14)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          placeholder="14"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          On the last working day of the previous month, transactions at/after {paydayStartCutoffHour}:00 belong to this period.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Period End Cutoff Time (hour, 24-hour format)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={paydayCutoffHour}
                          onChange={(e) => setPaydayCutoffHour(parseInt(e.target.value) || 13)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          placeholder="13"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          On the last working day of the current month, transactions before {paydayCutoffHour}:00 belong to this period. Transactions at/after {paydayCutoffHour}:00 belong to the next period.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className={`space-y-4 mb-4 ${usePaydayPeriod ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Start Day
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={periodStartDay}
                          onChange={(e) => setPeriodStartDay(parseInt(e.target.value) || 1)}
                          disabled={usePaydayPeriod}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          End Day (leave empty for end of month)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={periodEndDay || ''}
                          onChange={(e) => setPeriodEndDay(e.target.value ? parseInt(e.target.value) : null)}
                          disabled={usePaydayPeriod}
                          placeholder="End of month"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Cap Date Ranges to Data Setting */}
                  <div className="mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={capDateRangesToData}
                        onChange={(e) => setCapDateRangesToData(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Cap date ranges to actual transaction data
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          When enabled, date ranges (e.g., "This Month") will be capped to the latest transaction date instead of the full calendar period. This prevents showing empty future dates in analytics.
                        </p>
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleSavePeriodSettings}
                      disabled={isSavingPeriod || !user}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingPeriod ? 'Saving…' : 'Save Period Settings'}
                    </button>
                  </div>
                </div>

                {/* App Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">App Settings</h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="SEK">SEK (kr)</option>
                      <option value="DKK">DKK (kr)</option>
                      <option value="NOK">NOK (kr)</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveAppSettings}
                      disabled={isSavingSettings || !user}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingSettings ? 'Saving…' : 'Save Settings'}
                    </button>
                  </div>
                </div>

                {/* Recurring & Reconciliation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recurring */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Repeat className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recurring Transactions</h2>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Name (e.g. Netflix, Rent)"
                          value={newRecurringName}
                          onChange={(e) => setNewRecurringName(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Amount (e.g. 9.99)"
                          value={newRecurringAmount}
                          onChange={(e) => setNewRecurringAmount(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Category (optional)"
                          value={newRecurringCategory}
                          onChange={(e) => setNewRecurringCategory(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                        />
                        <select
                          value={newRecurringInterval}
                          onChange={(e) => setNewRecurringInterval(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="weekly">Weekly</option>
                          <option value="yearly">Yearly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <button
                        onClick={handleAddRecurring}
                        disabled={!user}
                        className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Add Recurring Transaction
                      </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                      {recurringLoading ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Loading…</p>
                      ) : recurring.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                          No recurring transactions yet.
                        </p>
                      ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto">
                          {recurring.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/40 border border-gray-200 dark:border-gray-700"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.name || 'Untitled'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.category || 'Uncategorized'} · €{item.amount} · {item.interval || 'interval'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleRecurringActive(item)}
                                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                    ((item as any).isActive ?? true)
                                      ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/20'
                                  }`}
                                >
                                  {((item as any).isActive ?? true) ? 'Active' : 'Paused'}
                                </button>
                                <button
                                  onClick={() => handleDeleteRecurring(item)}
                                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Reconciliation */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reconciliation Snapshots</h2>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Last reconciliation:</p>
                      {lastReconciliation ? (
                        <p className="text-sm text-gray-900 dark:text-white mb-2">
                          {formatDateTime(lastReconciliation.timestamp)}
                          {(lastReconciliation as any).note && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                              {(lastReconciliation as any).note}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">No reconciliation saved yet.</p>
                      )}
                      <button
                        onClick={handleSaveReconciliationSnapshot}
                        disabled={isSavingReconciliation || !user}
                        className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSavingReconciliation ? 'Saving…' : 'Save Manual Snapshot'}
                      </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                      {reconciliationHistory.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                          No reconciliation history yet.
                        </p>
                      ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto">
                          {reconciliationHistory.map((rec) => (
                            <li key={rec.id} className="px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {formatDateTime(rec.timestamp)}
                                {(rec as any).note && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                                    {(rec as any).note}
                                  </span>
                                )}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
