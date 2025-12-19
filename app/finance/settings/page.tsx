'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
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
} from '@/lib/financeFirestore'
import type {
  FinanceCategories,
  FinanceBudgetGoals,
  FinanceSettings,
  FinanceRecurringTransaction,
  FinanceReconciliationRecord,
} from '@/types/finance'
import { Settings, Repeat, History } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function FinanceSettingsPage() {
  const { user } = useFirestoreStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [categoriesText, setCategoriesText] = useState('')
  const [goalsText, setGoalsText] = useState('')
  const [appSettingsText, setAppSettingsText] = useState('')

  const [isSavingCategories, setIsSavingCategories] = useState(false)
  const [isSavingGoals, setIsSavingGoals] = useState(false)
  const [isSavingAppSettings, setIsSavingAppSettings] = useState(false)

  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [goalsError, setGoalsError] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  const [recurring, setRecurring] = useState<FinanceRecurringTransaction[]>([])
  const [recurringLoading, setRecurringLoading] = useState(true)

  const [newRecurringName, setNewRecurringName] = useState('')
  const [newRecurringAmount, setNewRecurringAmount] = useState('')
  const [newRecurringCategory, setNewRecurringCategory] = useState('')
  const [newRecurringInterval, setNewRecurringInterval] = useState('monthly')

  const [reconciliationHistory, setReconciliationHistory] = useState<FinanceReconciliationRecord[]>([])
  const [lastReconciliation, setLastReconciliation] = useState<FinanceReconciliationRecord | null>(null)
  const [isSavingReconciliation, setIsSavingReconciliation] = useState(false)
  
  // Period settings
  const [usePaydayPeriod, setUsePaydayPeriod] = useState(false)
  const [periodStartDay, setPeriodStartDay] = useState(1)
  const [periodEndDay, setPeriodEndDay] = useState<number | null>(null)
  const [isSavingPeriod, setIsSavingPeriod] = useState(false)

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

        setCategoriesText(
          JSON.stringify(cats ?? {}, null, 2) ||
            '{\n  "Groceries": { "color": "#22c55e" },\n  "Rent": { "color": "#6366f1" }\n}'
        )
        setGoalsText(JSON.stringify(goals ?? {}, null, 2) || '{\n  "monthlySavingsTarget": 500\n}')
        setAppSettingsText(JSON.stringify(settings ?? {}, null, 2) || '{\n  "currency": "EUR"\n}')
        
        // Load period settings
        if (settings) {
          setUsePaydayPeriod(settings.usePaydayPeriod || false)
          setPeriodStartDay(settings.periodStartDay ?? 1)
          setPeriodEndDay(settings.periodEndDay ?? null)
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
    setCategoriesError(null)
    setIsSavingCategories(true)
    try {
      const parsed = JSON.parse(categoriesText) as FinanceCategories
      await saveCategories(user.id, parsed)
    } catch (e: any) {
      console.error('Error saving finance categories:', e)
      setCategoriesError('Invalid JSON. Please fix and try again.')
    } finally {
      setIsSavingCategories(false)
    }
  }

  const handleSaveGoals = async () => {
    if (!user?.id) return
    setGoalsError(null)
    setIsSavingGoals(true)
    try {
      const parsed = JSON.parse(goalsText) as FinanceBudgetGoals
      await saveBudgetGoals(user.id, parsed)
    } catch (e: any) {
      console.error('Error saving budget goals:', e)
      setGoalsError('Invalid JSON. Please fix and try again.')
    } finally {
      setIsSavingGoals(false)
    }
  }

  const handleSaveAppSettings = async () => {
    if (!user?.id) return
    setSettingsError(null)
    setIsSavingAppSettings(true)
    try {
      const parsed = JSON.parse(appSettingsText) as FinanceSettings
      await saveFinanceSettings(user.id, parsed)
    } catch (e: any) {
      console.error('Error saving finance app settings:', e)
      setSettingsError('Invalid JSON. Please fix and try again.')
    } finally {
      setIsSavingAppSettings(false)
    }
  }

  const handleSavePeriodSettings = async () => {
    if (!user?.id) return
    setIsSavingPeriod(true)
    try {
      let currentSettings: FinanceSettings = {}
      try {
        currentSettings = JSON.parse(appSettingsText) as FinanceSettings
      } catch {
        // If parsing fails, start with empty object
        currentSettings = {}
      }
      const updatedSettings: FinanceSettings = {
        ...currentSettings,
        usePaydayPeriod,
        periodStartDay,
        periodEndDay,
      }
      await saveFinanceSettings(user.id, updatedSettings)
      setAppSettingsText(JSON.stringify(updatedSettings, null, 2))
      // Reload settings to ensure consistency
      const reloaded = await getFinanceSettings(user.id)
      if (reloaded) {
        setUsePaydayPeriod(reloaded.usePaydayPeriod || false)
        setPeriodStartDay(reloaded.periodStartDay ?? 1)
        setPeriodEndDay(reloaded.periodEndDay ?? null)
      }
    } catch (e: any) {
      console.error('Error saving period settings:', e)
    } finally {
      setIsSavingPeriod(false)
    }
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

  const formatDateTime = (value: any) => {
    if (!value) return ''
    try {
      const d = (value.toDate ? value.toDate() : value) as Date
      return d.toLocaleString()
    } catch {
      return String(value)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="mb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance settings</h1>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Configure categories, budget goals, recurring transactions, and reconciliation snapshots for your
                    finance data.
                  </p>
                </div>

                {/* Categories & Goals */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Categories</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      This JSON is stored under <code className="font-mono text-[0.7rem]">settings/categories</code> in
                      Firestore for your user. You can define whatever structure you need (colors, limits, groups, etc.).
                    </p>
                    <textarea
                      value={categoriesText}
                      onChange={(e) => setCategoriesText(e.target.value)}
                      className="w-full h-52 font-mono text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    {categoriesError && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">{categoriesError}</p>
                    )}
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleSaveCategories}
                        disabled={isSavingCategories || !user}
                        className="px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSavingCategories ? 'Saving…' : 'Save categories'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Budget goals</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      This JSON is stored under <code className="font-mono text-[0.7rem]">settings/budgetGoals</code>.
                      Use it for monthly limits, savings targets, emergency fund goals, etc.
                    </p>
                    <textarea
                      value={goalsText}
                      onChange={(e) => setGoalsText(e.target.value)}
                      className="w-full h-52 font-mono text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    {goalsError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{goalsError}</p>}
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleSaveGoals}
                        disabled={isSavingGoals || !user}
                        className="px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSavingGoals ? 'Saving…' : 'Save goals'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Period Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Period Settings</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Configure how monthly periods are calculated for your budget and analytics.
                  </p>
                  
                  {/* Payday Period Option */}
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePaydayPeriod}
                        onChange={(e) => {
                          setUsePaydayPeriod(e.target.checked)
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Use Payday Period (Last Working Day)
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                      Use payday-to-payday periods (last working day of previous month to last working day of current month) instead of custom period.
                    </p>
                  </div>
                  
                  {/* Custom Period Settings */}
                  <div className={`space-y-4 ${usePaydayPeriod ? 'opacity-50 pointer-events-none' : ''}`}>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Set the start and end day of your monthly period. Default is from the 1st to the end of the month.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="periodStartDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Start Day:
                        </label>
                        <input
                          type="number"
                          id="periodStartDay"
                          min="1"
                          max="31"
                          value={periodStartDay}
                          onChange={(e) => setPeriodStartDay(parseInt(e.target.value) || 1)}
                          disabled={usePaydayPeriod}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label htmlFor="periodEndDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          End Day:
                        </label>
                        <input
                          type="number"
                          id="periodEndDay"
                          min="1"
                          max="31"
                          value={periodEndDay || ''}
                          onChange={(e) => setPeriodEndDay(e.target.value ? parseInt(e.target.value) : null)}
                          disabled={usePaydayPeriod}
                          placeholder="End of month"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Leave empty for end of month
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleSavePeriodSettings}
                      disabled={isSavingPeriod || !user}
                      className="px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingPeriod ? 'Saving…' : 'Save Period Settings'}
                    </button>
                  </div>
                </div>

                {/* App settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Finance app settings</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Raw JSON stored in <code className="font-mono text-[0.7rem]">settings/appSettings</code> (currency,
                    default filters, feature flags, etc.).
                  </p>
                  <textarea
                    value={appSettingsText}
                    onChange={(e) => setAppSettingsText(e.target.value)}
                    className="w-full h-40 font-mono text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                  {settingsError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{settingsError}</p>}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleSaveAppSettings}
                      disabled={isSavingAppSettings || !user}
                      className="px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingAppSettings ? 'Saving…' : 'Save app settings'}
                    </button>
                  </div>
                </div>

                {/* Recurring & reconciliation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recurring */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Repeat className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recurring transactions</h2>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      These are stored in <code className="font-mono text-[0.7rem]">recurringTransactions</code> and can
                      be used by automation or reminders.
                    </p>

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
                        className="mt-1 inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Add recurring transaction
                      </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                      {recurringLoading ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Loading recurring transactions…</p>
                      ) : recurring.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No recurring transactions yet. Add your first one above.
                        </p>
                      ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
                          {recurring.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/40"
                            >
                              <div className="min-w-0">
                                <p className="text-gray-900 dark:text-white truncate">
                                  {item.name || 'Untitled'}{' '}
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    ({item.interval || 'interval'})
                                  </span>
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.category || 'Uncategorized'} · {item.amount}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleRecurringActive(item)}
                                  className="text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900/60"
                                >
                                  {((item as any).isActive ?? true) ? 'Active' : 'Paused'}
                                </button>
                                <button
                                  onClick={() => handleDeleteRecurring(item)}
                                  className="text-xs px-2 py-1 rounded-full border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40"
                                >
                                  Delete
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
                    <div className="flex items-center gap-2 mb-2">
                      <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Reconciliation snapshots
                      </h2>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      These records live under{' '}
                      <code className="font-mono text-[0.7rem]">reconciliationHistory</code> and{' '}
                      <code className="font-mono text-[0.7rem]">settings/lastReconciliation</code>. They can be used to
                      store account balance snapshots or reconciliation notes.
                    </p>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last reconciliation:</p>
                      {lastReconciliation ? (
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDateTime(lastReconciliation.timestamp)}{' '}
                          {(lastReconciliation as any).note && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              – {(lastReconciliation as any).note}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No last reconciliation saved yet.
                        </p>
                      )}
                      <button
                        onClick={handleSaveReconciliationSnapshot}
                        disabled={isSavingReconciliation || !user}
                        className="mt-2 px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSavingReconciliation ? 'Saving…' : 'Save manual snapshot'}
                      </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 max-h-64 overflow-y-auto text-sm">
                      {reconciliationHistory.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No reconciliation history yet. When you store records (e.g. from imports or automation), they
                          will show up here.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {reconciliationHistory.map((rec) => (
                            <li key={rec.id} className="px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/40">
                              <p className="text-gray-900 dark:text-white">
                                {formatDateTime(rec.timestamp)}{' '}
                                {(rec as any).note && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    – {(rec as any).note}
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


