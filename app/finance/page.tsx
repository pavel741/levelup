'use client'

import { useEffect, useMemo, useState } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import {
  subscribeToTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  subscribeToCategories,
  getCategories,
} from '@/lib/financeFirestore'
import type { FinanceTransaction, FinanceCategories } from '@/types/finance'

export const dynamic = 'force-dynamic'

export default function FinancePage() {
  const { user } = useFirestoreStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [categories, setCategories] = useState<FinanceCategories | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Dashboard state
  const [summaryView, setSummaryView] = useState<'monthly' | 'alltime'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  // Transaction form state
  const [formType, setFormType] = useState<'income' | 'expense'>('expense')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDate, setFormDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Transaction list filters
  const [currentFilter, setCurrentFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [dateRange, setDateRange] = useState<'month' | 'today' | 'week' | 'year' | 'all' | 'custom'>('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [showCustomDateRange, setShowCustomDateRange] = useState(false)
  
  // Load transactions
  useEffect(() => {
    if (!user?.id) return

    setIsLoading(true)
    const unsubscribe = subscribeToTransactions(
      user.id,
      (txs) => {
        setTransactions(txs)
        setIsLoading(false)
      },
      { limitCount: 500 }
    )

    return () => unsubscribe()
  }, [user?.id])

  // Load categories
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToCategories(user.id, (cats) => {
      setCategories(cats)
    })

    return () => unsubscribe()
  }, [user?.id])

  // Initialize categories if they don't exist
  useEffect(() => {
    if (!user?.id || categories !== null) return

    const initCategories = async () => {
      const existing = await getCategories(user.id)
      if (!existing) {
        // Initialize with default categories - match budget app structure
        const defaultCategories: FinanceCategories = {
          income: ['Salary', 'Freelance', 'Investment', 'Other'],
          expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Arved', 'Other'],
        }
        // Save to Firestore
        const { saveCategories } = await import('@/lib/financeFirestore')
        await saveCategories(user.id, defaultCategories)
        setCategories(defaultCategories)
      }
    }

    initCategories()
  }, [user?.id, categories])

  // Get available categories for dropdown
  const availableCategories = useMemo(() => {
    if (!categories) return []
    // Categories can be stored as { income: [...], expense: [...] } or as flat object
    if (Array.isArray(categories[formType])) {
      return categories[formType] as string[]
    }
    // Fallback for flat structure
    const typeCategories = categories[formType] || {}
    return Object.keys(typeCategories)
  }, [categories, formType])

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Filter by type
    if (currentFilter !== 'all') {
      filtered = filtered.filter((tx) => (tx.type || '').toLowerCase() === currentFilter)
    }

    // Filter by date range
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = null

    if (dateRange === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    } else if (dateRange === 'week') {
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      startDate = new Date(now.getFullYear(), now.getMonth(), diff)
      endDate = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59)
    } else if (dateRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    } else if (dateRange === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    } else if (dateRange === 'custom' && customDateFrom && customDateTo) {
      startDate = new Date(customDateFrom)
      endDate = new Date(customDateTo)
      endDate.setHours(23, 59, 59)
    }

    if (startDate && endDate) {
      filtered = filtered.filter((tx) => {
        const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as any)?.toDate?.() || new Date(tx.date)
        return txDate >= startDate! && txDate <= endDate!
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (tx) =>
          (tx.description || '').toLowerCase().includes(query) ||
          (tx.category || '').toLowerCase().includes(query) ||
          String(tx.amount || '').includes(query)
      )
    }

    // Sort by date descending
    filtered.sort((a, b) => {
      const dateA = typeof a.date === 'string' ? new Date(a.date) : (a.date as any)?.toDate?.() || new Date(a.date)
      const dateB = typeof b.date === 'string' ? new Date(b.date) : (b.date as any)?.toDate?.() || new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })

    return filtered
  }, [transactions, currentFilter, dateRange, searchQuery, customDateFrom, customDateTo])

  // Calculate summary for selected month
  const monthlySummary = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    let income = 0
    let expenses = 0

    transactions.forEach((tx) => {
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as any)?.toDate?.() || new Date(tx.date)
      if (txDate >= startDate && txDate <= endDate) {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        if (type === 'income') {
          income += amount
        } else if (type === 'expense') {
          expenses += amount
        } else {
          if (amount < 0) expenses += Math.abs(amount)
          else income += amount
        }
      }
    })

    return { income, expenses, balance: income - expenses }
  }, [transactions, selectedMonth])

  // Calculate all-time summary
  const allTimeSummary = useMemo(() => {
    let income = 0
    let expenses = 0

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      if (type === 'income') {
        income += amount
      } else if (type === 'expense') {
        expenses += amount
      } else {
        if (amount < 0) expenses += Math.abs(amount)
        else income += amount
      }
    })

    return { income, expenses, balance: income - expenses }
  }, [transactions])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)

  const formatDate = (value: any) => {
    if (!value) return ''
    if (typeof value === 'string') return value
    try {
      const d = (value.toDate ? value.toDate() : value) as Date
      return d.toISOString().split('T')[0]
    } catch {
      return String(value)
    }
  }

  const formatDisplayDate = (value: any) => {
    const dateStr = formatDate(value)
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !formDescription || !formAmount || !formCategory) return

    setIsSubmitting(true)
    try {
      const transaction: Omit<FinanceTransaction, 'id'> = {
        type: formType,
        description: formDescription,
        amount: Number(formAmount),
        category: formCategory,
        date: formDate,
      }

      if (editingTransactionId) {
        await updateTransaction(user.id, editingTransactionId, transaction)
        setEditingTransactionId(null)
      } else {
        await addTransaction(user.id, transaction)
      }

      // Reset form
      setFormDescription('')
      setFormAmount('')
      setFormCategory('')
      setFormDate(new Date().toISOString().split('T')[0])
    } catch (error) {
      console.error('Error saving transaction:', error)
      alert('Error saving transaction. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit transaction
  const handleEdit = (tx: FinanceTransaction & { id: string }) => {
    setEditingTransactionId(tx.id)
    setFormType((tx.type || 'expense') as 'income' | 'expense')
    setFormDescription(tx.description || '')
    setFormAmount(String(tx.amount || ''))
    setFormCategory(tx.category || '')
    setFormDate(formatDate(tx.date))
  }

  // Handle delete transaction
  const handleDelete = async (id: string) => {
    if (!user?.id || !confirm('Are you sure you want to delete this transaction?')) return
    try {
      await deleteTransaction(user.id, id)
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Error deleting transaction. Please try again.')
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingTransactionId(null)
    setFormDescription('')
    setFormAmount('')
    setFormCategory('')
    setFormDate(new Date().toISOString().split('T')[0])
  }

  // Quick date buttons
  const setQuickDate = (type: 'today' | 'yesterday' | 'week') => {
    const today = new Date()
    if (type === 'today') {
      setFormDate(today.toISOString().split('T')[0])
    } else if (type === 'yesterday') {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      setFormDate(yesterday.toISOString().split('T')[0])
    } else if (type === 'week') {
      // Set to start of current week
      const dayOfWeek = today.getDay()
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const weekStart = new Date(today.getFullYear(), today.getMonth(), diff)
      setFormDate(weekStart.toISOString().split('T')[0])
    }
  }

  // Navigate month
  const navigateMonth = (direction: -1 | 1) => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const date = new Date(year, month - 1 + direction, 1)
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  const setCurrentMonth = () => {
    const now = new Date()
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  }

  // Get Estonian month name
  const getEstonianMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number)
    const monthNames = [
      'Jaanuar',
      'Veebruar',
      'Märts',
      'Aprill',
      'Mai',
      'Juuni',
      'Juuli',
      'August',
      'September',
      'Oktoober',
      'November',
      'Detsember',
    ]
    return `${monthNames[month - 1]} ${year}`
  }

  const summary = summaryView === 'monthly' ? monthlySummary : allTimeSummary

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-[#0f172a] dark:text-[#f1f5f9]">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-5">
              <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <header className="mb-8">
                  <div className="flex justify-between items-center flex-wrap gap-5">
                  <div>
                      <h1 className="text-[2.5rem] font-extrabold mb-1">💰 Budget Tracker</h1>
                      <p className="text-[#475569] dark:text-[#cbd5e1] text-lg">Take control of your finances</p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <a
                        href="/finance/analytics"
                        className="px-4 py-2 bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg text-sm font-semibold hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] transition-colors"
                      >
                        Analytics
                      </a>
                      <a
                        href="/finance/settings"
                        className="px-4 py-2 bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg text-sm font-semibold hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] transition-colors"
                      >
                        Settings
                      </a>
                    </div>
                  </div>
                </header>

                {/* Dashboard */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold m-0">Summary</h2>
                    <div className="flex gap-2 bg-[#f8fafc] dark:bg-[#0f172a] rounded-lg p-1 border-2 border-[#e2e8f0] dark:border-[#334155]">
                      <button
                        type="button"
                        onClick={() => setSummaryView('monthly')}
                        className={`px-5 py-2.5 border-none rounded-md font-semibold text-sm cursor-pointer transition-all min-h-[44px] ${
                          summaryView === 'monthly'
                            ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-sm'
                            : 'bg-transparent text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummaryView('alltime')}
                        className={`px-5 py-2.5 border-none rounded-md font-semibold text-sm cursor-pointer transition-all min-h-[44px] ${
                          summaryView === 'alltime'
                            ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-sm'
                            : 'bg-transparent text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]'
                        }`}
                      >
                        All Time
                      </button>
                    </div>
                  </div>

                  {/* Monthly View */}
                  {summaryView === 'monthly' && (
                    <div className="mb-5">
                      <div className="mb-5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigateMonth(-1)}
                            className="w-11 h-11 bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg flex items-center justify-center cursor-pointer text-2xl text-[#0f172a] dark:text-[#f1f5f9] transition-all hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] hover:border-[#6366f1] hover:scale-105 active:scale-95 shadow-sm"
                            title="Previous period"
                          >
                            ‹
                          </button>
                          <div className="relative inline-block">
                            <input
                              type="month"
                              value={selectedMonth}
                              onChange={(e) => setSelectedMonth(e.target.value)}
                              className="px-3 py-2 border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg text-base bg-white dark:bg-[#1e293b] text-transparent cursor-pointer transition-colors focus:outline-none focus:border-[#6366f1] relative"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0f172a] dark:text-[#f1f5f9] text-sm bg-white dark:bg-[#1e293b] px-1 whitespace-nowrap z-10">
                              {getEstonianMonth(selectedMonth)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigateMonth(1)}
                            className="w-11 h-11 bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg flex items-center justify-center cursor-pointer text-2xl text-[#0f172a] dark:text-[#f1f5f9] transition-all hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] hover:border-[#6366f1] hover:scale-105 active:scale-95 shadow-sm"
                            title="Next period"
                          >
                            ›
                          </button>
                          <button
                            type="button"
                            onClick={setCurrentMonth}
                            className="px-4 py-2 bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg text-sm font-semibold hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] transition-colors ml-2.5"
                          >
                            Current Period
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
                        <div className="bg-white dark:bg-[#1e293b] p-7 rounded-xl shadow-sm border border-[#f1f5f9] dark:border-[#334155] relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg group">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <h3 className="text-sm text-[#475569] dark:text-[#cbd5e1] mb-2.5 uppercase tracking-wide">Monthly Balance</h3>
                          <div className="text-[2rem] font-bold text-[#6366f1] font-mono tabular-nums">
                            {formatCurrency(summary.balance)}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-[#1e293b] p-7 rounded-xl shadow-sm border border-[#f1f5f9] dark:border-[#334155] relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg group">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10b981] to-[#34d399] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <h3 className="text-sm text-[#475569] dark:text-[#cbd5e1] mb-2.5 uppercase tracking-wide">Monthly Income</h3>
                          <div className="text-[2rem] font-bold text-[#10b981] font-mono tabular-nums">
                            {formatCurrency(summary.income)}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-[#1e293b] p-7 rounded-xl shadow-sm border border-[#f1f5f9] dark:border-[#334155] relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg group">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ef4444] to-[#f87171] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <h3 className="text-sm text-[#475569] dark:text-[#cbd5e1] mb-2.5 uppercase tracking-wide">Monthly Expenses</h3>
                          <div className="text-[2rem] font-bold text-[#ef4444] font-mono tabular-nums">
                            {formatCurrency(summary.expenses)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Time View */}
                  {summaryView === 'alltime' && (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
                      <div className="bg-white dark:bg-[#1e293b] p-7 rounded-xl shadow-sm border border-[#f1f5f9] dark:border-[#334155] relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-sm text-[#475569] dark:text-[#cbd5e1] mb-2.5 uppercase tracking-wide">Total Balance</h3>
                        <div className="text-[2rem] font-bold text-[#6366f1] font-mono tabular-nums">
                          {formatCurrency(summary.balance)}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-[#1e293b] p-7 rounded-xl shadow-sm border border-[#f1f5f9] dark:border-[#334155] relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10b981] to-[#34d399] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-sm text-[#475569] dark:text-[#cbd5e1] mb-2.5 uppercase tracking-wide">Total Income</h3>
                        <div className="text-[2rem] font-bold text-[#10b981] font-mono tabular-nums">
                          {formatCurrency(summary.income)}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-[#1e293b] p-7 rounded-xl shadow-sm border border-[#f1f5f9] dark:border-[#334155] relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ef4444] to-[#f87171] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-sm text-[#475569] dark:text-[#cbd5e1] mb-2.5 uppercase tracking-wide">Total Expenses</h3>
                        <div className="text-[2rem] font-bold text-[#ef4444] font-mono tabular-nums">
                          {formatCurrency(summary.expenses)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main View */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start w-full max-w-full overflow-x-hidden">
                  {/* Left Panel - Add Transaction Form */}
                  <div className="flex flex-col gap-5 w-full max-w-full min-w-0 overflow-x-hidden">
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-sm border border-[#e2e8f0] dark:border-[#334155]">
                      <h2 className="text-xl font-bold mb-5">{editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}</h2>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium mb-2">
                            Type
                          </label>
                          <select
                            id="type"
                            value={formType}
                            onChange={(e) => {
                              setFormType(e.target.value as 'income' | 'expense')
                              setFormCategory('') // Reset category when type changes
                            }}
                            required
                            className="w-full px-4 py-2 border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
                          >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            id="description"
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="e.g. Salary, Groceries"
                            required
                            className="w-full px-4 py-2 border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
                          />
                        </div>
                        <div>
                          <label htmlFor="amount" className="block text-sm font-medium mb-2">
                            Amount
                          </label>
                          <input
                            type="number"
                            id="amount"
                            value={formAmount}
                            onChange={(e) => setFormAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
                            className="w-full px-4 py-2 border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
                          />
                        </div>
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium mb-2">
                            Category
                          </label>
                          <select
                            id="category"
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            required
                            className="w-full px-4 py-2 border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
                          >
                            <option value="">Select category</option>
                            {availableCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="date" className="block text-sm font-medium mb-2">
                            Date
                          </label>
                          <input
                            type="date"
                            id="date"
                            value={formDate}
                            onChange={(e) => setFormDate(e.target.value)}
                            required
                            className="w-full px-4 py-2 border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1]"
                          />
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setQuickDate('today')}
                              className="px-3 py-1.5 text-xs bg-[#f1f5f9] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-md hover:bg-[#e2e8f0] dark:hover:bg-[#334155] transition-colors"
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickDate('yesterday')}
                              className="px-3 py-1.5 text-xs bg-[#f1f5f9] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-md hover:bg-[#e2e8f0] dark:hover:bg-[#334155] transition-colors"
                            >
                              Yesterday
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickDate('week')}
                              className="px-3 py-1.5 text-xs bg-[#f1f5f9] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-md hover:bg-[#e2e8f0] dark:hover:bg-[#334155] transition-colors"
                            >
                              This Week
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Saving...' : editingTransactionId ? 'Update Transaction' : 'Add Transaction'}
                          </button>
                          {editingTransactionId && (
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg font-semibold hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Right Panel - Transaction List */}
                  <div className="flex flex-col gap-5 w-full max-w-full min-w-0 overflow-x-hidden">
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-sm border border-[#e2e8f0] dark:border-[#334155]">
                      <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-bold m-0">Recent Transactions</h2>
                      </div>

                      {/* Date Range Filter */}
                      <div className="mb-5">
                        <label className="block text-sm font-medium mb-2">Date Range:</label>
                        <div className="flex gap-2 flex-wrap mb-3">
                          {(['month', 'today', 'week', 'year', 'all'] as const).map((range) => (
                            <button
                              key={range}
                              type="button"
                              onClick={() => {
                                setDateRange(range)
                                setShowCustomDateRange(false)
                              }}
                              className={`px-3 py-1.5 text-sm rounded-md border-2 transition-colors ${
                                dateRange === range && !showCustomDateRange
                                  ? 'bg-[#6366f1] text-white border-[#6366f1]'
                                  : 'bg-white dark:bg-[#1e293b] border-[#e2e8f0] dark:border-[#334155] text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]'
                              }`}
                            >
                              {range === 'month' ? 'This Month' : range === 'today' ? 'Today' : range === 'week' ? 'This Week' : range === 'year' ? 'This Year' : 'All Time'}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setDateRange('custom')
                              setShowCustomDateRange(true)
                            }}
                            className={`px-3 py-1.5 text-sm rounded-md border-2 transition-colors ${
                              dateRange === 'custom' && showCustomDateRange
                                ? 'bg-[#6366f1] text-white border-[#6366f1]'
                                : 'bg-white dark:bg-[#1e293b] border-[#e2e8f0] dark:border-[#334155] text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]'
                            }`}
                          >
                            Custom
                          </button>
                        </div>
                        {showCustomDateRange && (
                          <div className="flex gap-2 items-end flex-wrap p-4 bg-[#f1f5f9] dark:bg-[#1e293b] rounded-lg">
                            <div>
                              <label className="block text-xs mb-1">From:</label>
                              <input
                                type="date"
                                value={customDateFrom}
                                onChange={(e) => setCustomDateFrom(e.target.value)}
                                className="px-3 py-1.5 border-2 border-[#e2e8f0] dark:border-[#334155] rounded-md bg-white dark:bg-[#1e293b] text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs mb-1">To:</label>
                              <input
                                type="date"
                                value={customDateTo}
                                onChange={(e) => setCustomDateTo(e.target.value)}
                                className="px-3 py-1.5 border-2 border-[#e2e8f0] dark:border-[#334155] rounded-md bg-white dark:bg-[#1e293b] text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (customDateFrom && customDateTo) {
                                    setDateRange('custom')
                                  }
                                }}
                                className="px-3 py-1.5 bg-[#6366f1] text-white rounded-md text-sm font-semibold hover:bg-[#4f46e5] transition-colors"
                              >
                                Apply
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCustomDateRange(false)
                                  setDateRange('month')
                                }}
                                className="px-3 py-1.5 bg-white dark:bg-[#1e293b] border-2 border-[#e2e8f0] dark:border-[#334155] rounded-md text-sm font-semibold hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Search */}
                      <div className="mb-5">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search transactions..."
                          className="w-full px-4 py-2 border-2 border-[#e2e8f0] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:border-[#6366f1] text-sm"
                        />
                      </div>

                      {/* Filter Buttons */}
                      <div className="flex gap-2 mb-5">
                        {(['all', 'income', 'expense'] as const).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setCurrentFilter(filter)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                              currentFilter === filter
                                ? 'bg-[#6366f1] text-white'
                                : 'bg-[#f1f5f9] dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#e2e8f0] dark:hover:bg-[#334155]'
                            }`}
                          >
                            {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Transaction List */}
                      <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {isLoading ? (
                          <div className="text-center py-10 text-[#475569] dark:text-[#cbd5e1]">Loading...</div>
                        ) : filteredTransactions.length === 0 ? (
                          <div className="text-center py-10">
                            <div className="text-4xl mb-3">📊</div>
                            <h3 className="text-lg font-semibold mb-2">Start tracking your expenses</h3>
                            <p className="text-sm text-[#475569] dark:text-[#cbd5e1] mb-4">
                              Add your first transaction to start managing your finances.
                            </p>
                  </div>
                ) : (
                          filteredTransactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between p-4 bg-[#f8fafc] dark:bg-[#0f172a] rounded-lg border border-[#e2e8f0] dark:border-[#334155] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="font-semibold text-[#0f172a] dark:text-[#f1f5f9] truncate">
                                    {tx.description || '—'}
                                  </span>
                                  <span className="text-xs text-[#475569] dark:text-[#cbd5e1] bg-[#e2e8f0] dark:bg-[#334155] px-2 py-0.5 rounded">
                                    {tx.category || 'Uncategorized'}
                                  </span>
                                </div>
                                <div className="text-xs text-[#475569] dark:text-[#cbd5e1]">
                                  {formatDisplayDate(tx.date)}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <span
                                  className={`font-semibold font-mono tabular-nums ${
                                    (tx.type || '').toLowerCase() === 'income' || (Number(tx.amount) || 0) > 0
                                      ? 'text-[#10b981]'
                                      : 'text-[#ef4444]'
                                  }`}
                                >
                                  {formatCurrency(Number(tx.amount) || 0)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(tx as FinanceTransaction & { id: string })}
                                  className="px-2 py-1 text-xs bg-[#6366f1] text-white rounded hover:bg-[#4f46e5] transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(tx.id!)}
                                  className="px-2 py-1 text-xs bg-[#ef4444] text-white rounded hover:bg-[#dc2626] transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
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
