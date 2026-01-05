'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Wallet, TrendingUp, TrendingDown, DollarSign, Target, Bell, Calendar, Clock, AlertCircle, Edit2, Trash2 } from 'lucide-react'
// Using MongoDB for finance data (no quota limits!)
// Client-side API wrapper (calls server-side MongoDB via API routes)
import {
  subscribeToTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  subscribeToCategories,
  getCategories,
  saveCategories,
  batchAddTransactions,
  deleteAllTransactions,
  getFinanceSettings,
  getTransactions,
  subscribeToRecurringTransactions,
  addRecurringTransaction,
} from '@/lib/financeApi'
import { subscribeToSavingsGoals } from '@/lib/savingsGoalsApi'
import type { SavingsGoal, FinanceRecurringTransaction } from '@/types/finance'
import { format, differenceInDays, isPast, isToday } from 'date-fns'
import type { FinanceTransaction, FinanceCategories, FinanceSettings } from '@/types/finance'
import { getPeriodDates, parseTransactionDate } from '@/lib/financeDateUtils'
import { CSVImportService } from '@/lib/csvImport'
import { ESTONIAN_BANK_PROFILES } from '@/lib/bankProfiles'
import { getSuggestedCategory } from '@/lib/transactionCategorizer'
import { formatCurrency, formatDate, formatDisplayDate, normalizeDate, showError, showSuccess } from '@/lib/utils'
import { CardSkeleton, TransactionListSkeleton } from '@/components/ui/Skeleton'
import { VirtualList } from '@/components/ui/VirtualList'
import ExpenseForecastComponent from '@/components/finance/ExpenseForecast'

export const dynamic = 'force-dynamic'

export default function FinancePage() {
  const { user } = useFirestoreStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [allTransactionsForSummary, setAllTransactionsForSummary] = useState<FinanceTransaction[]>([])
  const [categories, setCategories] = useState<FinanceCategories | null>(null)
  const [financeSettings, setFinanceSettings] = useState<FinanceSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAllTransactions, setIsLoadingAllTransactions] = useState(false)
  
  // Savings Goals state
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [isLoadingGoals, setIsLoadingGoals] = useState(true)
  
  // Bill Reminders state
  const [bills, setBills] = useState<FinanceRecurringTransaction[]>([])
  const [isLoadingBills, setIsLoadingBills] = useState(true)
  
  // Dashboard state
  const [summaryView, setSummaryView] = useState<'monthly' | 'alltime'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  
  // Transaction form state
  const [formType, setFormType] = useState<'income' | 'expense'>('expense')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDate, setFormDate] = useState<string>('')
  const [formIsRecurring, setFormIsRecurring] = useState(false)
  const [formRecurringInterval, setFormRecurringInterval] = useState<'monthly' | 'weekly' | 'yearly'>('monthly')
  
  // Initialize date-dependent state on client only (prevents hydration mismatch)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const now = new Date()
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      setSelectedMonth(prev => prev || monthStr)
      setFormDate(prev => prev || now.toISOString().split('T')[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Transaction list filters
  const [currentFilter, setCurrentFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [dateRange, setDateRange] = useState<'month' | 'today' | 'week' | 'year' | 'all' | 'custom'>('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const transactionsPerPage = 50
  
  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms debounce
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery])
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [showCustomDateRange, setShowCustomDateRange] = useState(false)
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filterMinAmount, setFilterMinAmount] = useState('')
  const [filterMaxAmount, setFilterMaxAmount] = useState('')
  const [filterCategories, setFilterCategories] = useState<string[]>([])
  
  // Category suggestions
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([])
  
  // CSV Import state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvImportStatus, setCsvImportStatus] = useState<string>('')
  const [csvImportProgress, setCsvImportProgress] = useState(0)
  const [showCsvMapping, setShowCsvMapping] = useState(false)
  const [csvColumnMapping, setCsvColumnMapping] = useState<any>(null)
  const [csvParsedData, setCsvParsedData] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvSelectedBank, setCsvSelectedBank] = useState<string | null>(null)
  
  // Load transactions with optimized initial load (limit to 100 for fast initial render)
  useEffect(() => {
    if (!user?.id) return

    let unsubscribe: (() => void) | null = null
    
    const loadTransactions = async () => {
      try {
        setIsLoading(true)
        // Load all transactions immediately for seamless date filtering
        setIsLoadingAllTransactions(true)
        const { getAllTransactionsForSummary: getAllTransactionsForSummaryClient } = await import('@/lib/financeApi')
        
        // Load all transactions in parallel with initial display load
        const [initialTxs, allTxs] = await Promise.all([
          getTransactions(user.id, { limitCount: 100 }).catch(() => []),
          getAllTransactionsForSummaryClient(user.id).catch(() => [])
        ])
        
        setTransactions(initialTxs)
        setAllTransactionsForSummary(allTxs)
        setIsLoading(false)
        setIsLoadingAllTransactions(false)
        console.log('✅ Loaded all transactions for summary:', allTxs.length)
        
        // Calculate total amount for verification
        const totalAmount = allTxs.reduce((sum, tx) => {
          const amount = Math.abs(Number(tx.amount) || 0)
          return sum + amount
        }, 0)
        console.log('💰 Total transaction amount sum:', totalAmount.toFixed(2))
        
        // Then set up subscription for ongoing updates (load recent transactions for display)
        unsubscribe = subscribeToTransactions(
          user.id,
          (txs) => {
            setTransactions(txs)
            setIsLoading(false)
            // Merge new transactions into allTransactionsForSummary
            // This ensures we have the latest transactions for date filtering
            setAllTransactionsForSummary(prev => {
              // Create a map of existing transactions by ID for quick lookup
              const existingMap = new Map(prev.map(tx => [tx.id, tx]))
              // Add/update transactions from subscription
              txs.forEach(tx => {
                existingMap.set(tx.id, tx)
              })
              // Convert back to array and sort by date descending
              return Array.from(existingMap.values()).sort((a, b) => {
                const dateA = parseTransactionDate(a.date).getTime()
                const dateB = parseTransactionDate(b.date).getTime()
                return dateB - dateA
              })
            })
          },
          { limitCount: 1000 } // Load recent 1000 transactions for display
        )
      } catch (error) {
        console.error('Failed to load transactions from MongoDB:', error)
        setIsLoading(false)
      }
    }

    loadTransactions()
    
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user?.id])

  // Load categories
  useEffect(() => {
    if (!user?.id) return

    let unsubscribe: (() => void) | null = null
    
    const loadCategories = async () => {
      try {
        // MongoDB doesn't need Firebase initialization
        unsubscribe = subscribeToCategories(user.id, (cats) => {
          setCategories(cats)
        })
      } catch (error) {
        console.error('Failed to load categories from MongoDB:', error)
      }
    }

    loadCategories()
    
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user?.id])

  // Load finance settings (for period configuration)
  useEffect(() => {
    if (!user?.id) return

    const loadSettings = async () => {
      try {
        // MongoDB doesn't need Firebase initialization
        const settings = await getFinanceSettings(user.id)
        setFinanceSettings(settings)
      } catch (e) {
        console.error('Error loading finance settings from MongoDB:', e)
      }
    }

    loadSettings()
  }, [user?.id])

  // Load Savings Goals
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToSavingsGoals(user.id, (goals) => {
      setSavingsGoals(goals)
      setIsLoadingGoals(false)
    })

    return () => {
      unsubscribe()
    }
  }, [user?.id])

  // Load Bill Reminders
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToRecurringTransactions(user.id, (billsList) => {
      setBills(billsList)
      setIsLoadingBills(false)
    })

    return () => {
      unsubscribe()
    }
  }, [user?.id])

  // Load all transactions when selectedMonth changes to ensure seamless date filtering
  useEffect(() => {
    if (!user?.id || !selectedMonth) return
    
    // If we don't have all transactions loaded yet, load them
    if (allTransactionsForSummary.length === 0 && !isLoadingAllTransactions) {
      setIsLoadingAllTransactions(true)
      import('@/lib/financeApi').then(async ({ getAllTransactionsForSummary: getAllTransactionsForSummaryClient }) => {
        const allTxs: FinanceTransaction[] = await getAllTransactionsForSummaryClient(user.id)
        setAllTransactionsForSummary(allTxs)
        setIsLoadingAllTransactions(false)
      }).catch((error: unknown) => {
        console.error('Error loading all transactions for date filter:', error)
        setIsLoadingAllTransactions(false)
      })
    }
  }, [selectedMonth, user?.id, allTransactionsForSummary.length, isLoadingAllTransactions])

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
        // Save to MongoDB
        const { saveCategories } = await import('@/lib/financeApi')
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

  // Get all categories (for advanced filter)
  const allCategories = useMemo(() => {
    if (!categories) return []
    const cats: string[] = []
    if (Array.isArray(categories.income)) {
      cats.push(...categories.income)
    }
    if (Array.isArray(categories.expense)) {
      cats.push(...categories.expense)
    }
    return Array.from(new Set(cats))
  }, [categories])

  // Generate category suggestions based on description
  useEffect(() => {
    if (!formDescription) {
      setCategorySuggestions([])
      return
    }

    const suggestions: string[] = []

    // First, try smart categorization based on patterns
    const smartCategory = getSuggestedCategory(formDescription)
    if (smartCategory && availableCategories.includes(smartCategory)) {
      suggestions.push(smartCategory)
    }

    // Then, look at historical transactions for similar descriptions
    if (transactions.length > 0) {
      const descLower = formDescription.toLowerCase()
      const categoryCounts: Record<string, number> = {}

      // Count how many times each category appears with similar descriptions
      transactions.forEach((tx) => {
        if (tx.description && tx.category) {
          const txDescLower = tx.description.toLowerCase()
          // Check for word matches
          const descWords = descLower.split(/\s+/)
          const txWords = txDescLower.split(/\s+/)
          const commonWords = descWords.filter((w) => w.length > 2 && txWords.includes(w))

          if (commonWords.length > 0) {
            categoryCounts[tx.category] = (categoryCounts[tx.category] || 0) + commonWords.length
          }
        }
      })

      // Get top 3 historical suggestions (excluding the smart category if already added)
      const historicalSuggestions = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat)
        .filter((cat) => availableCategories.includes(cat) && !suggestions.includes(cat))

      suggestions.push(...historicalSuggestions)
    }

    // Auto-fill category if we have a high-confidence suggestion and no category is set
    if (suggestions.length > 0 && !formCategory) {
      const smartCategory = getSuggestedCategory(formDescription)
      if (smartCategory) {
        setFormCategory(smartCategory)
      }
    }

    setCategorySuggestions(suggestions.slice(0, 3))
  }, [formDescription, transactions, availableCategories, formCategory])

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
      // Calculate start of week (Monday) - more robust approach
      const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Days to subtract to get to Monday
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday)
      startDate.setHours(0, 0, 0, 0)
      // End date is today at end of day
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
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
        const txDate = parseTransactionDate(tx.date)
        // Normalize dates to midnight for accurate comparison
        const txDateOnly = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate())
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        return txDateOnly >= startDateOnly && txDateOnly <= endDateOnly
      })
    }

    // Filter by search query (using debounced value)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (tx) =>
          (tx.description || '').toLowerCase().includes(query) ||
          (tx.category || '').toLowerCase().includes(query) ||
          String(tx.amount || '').includes(query)
      )
    }

    // Filter by min/max amount
    if (filterMinAmount) {
      const min = parseFloat(filterMinAmount)
      if (!isNaN(min)) {
        filtered = filtered.filter((tx) => Math.abs(Number(tx.amount) || 0) >= min)
      }
    }
    if (filterMaxAmount) {
      const max = parseFloat(filterMaxAmount)
      if (!isNaN(max)) {
        filtered = filtered.filter((tx) => Math.abs(Number(tx.amount) || 0) <= max)
      }
    }

    // Filter by categories
    if (filterCategories.length > 0) {
      filtered = filtered.filter((tx) => filterCategories.includes(tx.category || ''))
    }

    // Sort by date descending (using optimized date parser)
    filtered.sort((a, b) => {
      const dateA = parseTransactionDate(a.date)
      const dateB = parseTransactionDate(b.date)
      return dateB.getTime() - dateA.getTime()
    })

    return filtered
  }, [transactions, currentFilter, dateRange, debouncedSearchQuery, customDateFrom, customDateTo, filterMinAmount, filterMaxAmount, filterCategories])
  
  // Pagination for filtered transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * transactionsPerPage
    return filteredTransactions.slice(startIndex, startIndex + transactionsPerPage)
  }, [filteredTransactions, currentPage])
  
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage)
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [currentFilter, dateRange, debouncedSearchQuery, filterMinAmount, filterMaxAmount, filterCategories])

  // Calculate summary for selected month (using all loaded transactions from MongoDB)
  const monthlySummary = useMemo(() => {
    // Return default values if selectedMonth is not set yet (prevents hydration errors)
    if (!selectedMonth) {
      const now = new Date()
      return {
        income: 0,
        expenses: 0,
        balance: 0,
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      }
    }
    
    // Use period settings if available, otherwise default to calendar month
    let startDate: Date
    let endDate: Date
    
    if (financeSettings?.usePaydayPeriod || financeSettings?.periodStartDay !== undefined) {
      const paydayCutoffHour = financeSettings.paydayCutoffHour ?? 13 // Default 1pm for end date
      const paydayStartCutoffHour = financeSettings.paydayStartCutoffHour ?? 14 // Default 2pm for start date
      const periodDates = getPeriodDates(
        selectedMonth,
        financeSettings.usePaydayPeriod || false,
        financeSettings.periodStartDay ?? 1,
        financeSettings.periodEndDay ?? null,
        paydayCutoffHour,
        paydayStartCutoffHour
      )
      startDate = periodDates.startDate
      endDate = periodDates.endDate
    } else {
      // Default to calendar month
      const [year, month] = selectedMonth.split('-').map(Number)
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59)
    }

    let income = 0
    let expenses = 0

    allTransactionsForSummary.forEach((tx) => {
      const txDate = parseTransactionDate(tx.date)
      let isInPeriod = false
      if (financeSettings?.usePaydayPeriod) {
        // Check if transaction is within the period boundaries
        // For payday periods:
        // - Start: Last working day of previous month - ALL transactions on this date belong to this period
        // - End: Last working day of current month - ALL transactions on this date belong to NEXT period
        //   Note: New transactions on the last working day are automatically moved to first of next month
        //   during creation/import, but legacy transactions on the end date are excluded from this period
        //   Since CSV imports only have dates (no time), all transactions are at midnight (00:00:00)
        
        // Get date-only components for comparison (normalize all to midnight for accurate date comparison)
        const startDateOnly = new Date(startDate)
        startDateOnly.setHours(0, 0, 0, 0)
        const endDateOnly = new Date(endDate)
        endDateOnly.setHours(0, 0, 0, 0)
        const txDateOnly = new Date(txDate)
        txDateOnly.setHours(0, 0, 0, 0)
        
        // Check if transaction is before start date (definitely not in period)
        if (txDateOnly < startDateOnly) {
          isInPeriod = false
        }
        // Check if transaction is after end date (definitely not in period)
        // Note: Transactions on last working day are moved to first of next month, so they'll be excluded here
        else if (txDateOnly > endDateOnly) {
          isInPeriod = false
        }
        // Check if transaction is on start date (last working day of previous month)
        // ALL transactions on the start date belong to this period (they were moved from previous period)
        else if (txDateOnly.getTime() === startDateOnly.getTime()) {
          // Include all transactions on the start date - they belong to this period
          isInPeriod = true
        }
        // Check if transaction is on end date (last working day of current month)
        // ALL transactions on the end date should go to the next period
        // (New transactions are moved during creation, but legacy data might still be on the end date)
        else if (txDateOnly.getTime() === endDateOnly.getTime()) {
          // Exclude all transactions on the end date - they belong to the next period
          isInPeriod = false
        }
        // Transaction is between start and end dates (not on boundary days)
        else {
          isInPeriod = true
        }
      } else {
        // Standard period check (inclusive boundaries)
        // For custom periods, compare dates properly (handle time components)
        const txDateOnly = new Date(txDate)
        txDateOnly.setHours(0, 0, 0, 0)
        const startDateOnly = new Date(startDate)
        startDateOnly.setHours(0, 0, 0, 0)
        const endDateOnly = new Date(endDate)
        endDateOnly.setHours(23, 59, 59, 999) // Include entire end date
        
        isInPeriod = txDateOnly >= startDateOnly && txDateOnly <= endDateOnly
      }
      
      if (isInPeriod) {
        const amount = Number(tx.amount) || 0
        const type = (tx.type || '').toLowerCase()
        if (type === 'income') {
          income += Math.abs(amount) // Always positive
        } else if (type === 'expense') {
          expenses += Math.abs(amount) // Always positive
        } else {
          if (amount < 0) expenses += Math.abs(amount)
          else income += Math.abs(amount)
        }
      }
    })

    return {
      income,
      expenses,
      balance: income - expenses,
      startDate,
      endDate,
    }
  }, [allTransactionsForSummary, selectedMonth, financeSettings])

  // Calculate all-time summary (using all loaded transactions from MongoDB)
  const allTimeSummary = useMemo(() => {
    let income = 0
    let expenses = 0

    allTransactionsForSummary.forEach((tx) => {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()
      
      // Skip zero or invalid amounts
      if (amount === 0 || isNaN(amount) || !isFinite(amount)) {
        return
      }
      
      if (type === 'income') {
        income += Math.abs(amount) // Always positive
      } else if (type === 'expense') {
        expenses += Math.abs(amount) // Always positive
      } else {
        // Untyped transactions: negative = expense, positive = income
        if (amount < 0) {
          expenses += Math.abs(amount)
        } else {
          income += Math.abs(amount)
        }
      }
    })

    return { income, expenses, balance: income - expenses }
  }, [allTransactionsForSummary])


  // Helper function to adjust transaction date if it's on the last working day
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !formDescription || !formAmount || !formCategory) return

    setIsSubmitting(true)
    try {
      // Check if category is new (not in available categories)
      const categoryExists = availableCategories.includes(formCategory)
      
      // If category is new, save it to categories
      if (!categoryExists && formCategory.trim()) {
        try {
          const currentCategories = await getCategories(user.id)
          const updatedCategories: FinanceCategories = {
            ...currentCategories,
            [formType]: {
              ...(currentCategories?.[formType] || {}),
              [formCategory.trim()]: {},
            },
          }
          await saveCategories(user.id, updatedCategories)
          // Reload categories to update the UI
          const updated = await getCategories(user.id)
          setCategories(updated)
        } catch (error) {
          console.error('Error saving new category:', error)
          // Continue anyway - category will still be saved with the transaction
        }
      }

      // Ensure expenses are stored as negative amounts
      const amount = Number(formAmount)
      const finalAmount = formType === 'expense' && amount > 0 ? -amount : amount
      
      // Keep original date - period calculation will handle payday period logic
      const transactionDate: string | Date = formDate
      
      const transaction: Omit<FinanceTransaction, 'id'> = {
        type: formType,
        description: formDescription,
        amount: finalAmount,
        category: formCategory.trim(),
        date: transactionDate,
      }

      if (editingTransactionId) {
        // Optimistically update the transaction in local state
        setTransactions(prev => prev.map(tx => 
          tx.id === editingTransactionId 
            ? { ...tx, ...transaction, id: editingTransactionId }
            : tx
        ))
        setAllTransactionsForSummary(prev => prev.map(tx => 
          tx.id === editingTransactionId 
            ? { ...tx, ...transaction, id: editingTransactionId }
            : tx
        ))
        
        await updateTransaction(user.id, editingTransactionId, transaction)
        
        // If marked as recurring, create a recurring transaction
        if (formIsRecurring) {
          try {
            await addRecurringTransaction(user.id, {
              name: formDescription,
              amount: Math.abs(finalAmount),
              category: formCategory.trim(),
              interval: formRecurringInterval,
              nextDate: new Date(formDate),
            })
            showSuccess('Transaction updated and added as recurring')
          } catch (error) {
            console.error('Error creating recurring transaction:', error)
            showError(error, { component: 'FinancePage', action: 'addRecurringTransaction' })
          }
        }
        
        setEditingTransactionId(null)
      } else {
        // Optimistically add the transaction to local state
        const tempId = `temp-${Date.now()}`
        const newTransaction = { ...transaction, id: tempId } as FinanceTransaction & { id: string }
        setTransactions(prev => [newTransaction, ...prev])
        setAllTransactionsForSummary(prev => [newTransaction, ...prev])
        
        const newId = await addTransaction(user.id, transaction)
        
        // Replace temp ID with real ID
        setTransactions(prev => prev.map(tx => 
          tx.id === tempId ? { ...tx, id: newId } : tx
        ))
        setAllTransactionsForSummary(prev => prev.map(tx => 
          tx.id === tempId ? { ...tx, id: newId } : tx
        ))
        
        // If marked as recurring, create a recurring transaction
        if (formIsRecurring) {
          try {
            await addRecurringTransaction(user.id, {
              name: formDescription,
              amount: Math.abs(finalAmount),
              category: formCategory.trim(),
              interval: formRecurringInterval,
              nextDate: new Date(formDate),
            })
            showSuccess('Transaction added and set as recurring')
          } catch (error) {
            console.error('Error creating recurring transaction:', error)
            showError(error, { component: 'FinancePage', action: 'addRecurringTransaction' })
          }
        }
      }

      // Reset form
      setFormDescription('')
      setFormAmount('')
      setFormCategory('')
      setFormDate(new Date().toISOString().split('T')[0])
      setFormIsRecurring(false)
      setFormRecurringInterval('monthly')
      setFormIsRecurring(false)
      setFormRecurringInterval('monthly')
    } catch (error) {
      console.error('Error saving transaction:', error)
      showError(error, { component: 'FinancePage', action: 'saveTransaction' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit transaction
  const handleEdit = (tx: FinanceTransaction & { id: string }) => {
    setEditingTransactionId(tx.id)
    const txType = (tx.type || '').toLowerCase()
    const amount = Number(tx.amount) || 0
    // Determine type: if amount is negative, it's an expense; if type is set, use that
    const inferredType = amount < 0 ? 'expense' : (txType === 'income' ? 'income' : txType === 'expense' ? 'expense' : 'expense')
    
    setFormType(inferredType as 'income' | 'expense')
    setFormDescription(tx.description || '')
    // Display absolute value in form (user enters positive numbers)
    setFormAmount(String(Math.abs(amount) || ''))
    setFormCategory(tx.category || '')
    setFormDate(formatDate(tx.date))
  }

  // Handle delete transaction
  const handleDelete = async (id: string) => {
    if (!user?.id || !confirm('Are you sure you want to delete this transaction?')) return

    // Optimistically remove the transaction from local state
    const deletedTx = transactions.find(tx => tx.id === id)
    setTransactions(prev => prev.filter(tx => tx.id !== id))
    setAllTransactionsForSummary(prev => prev.filter(tx => tx.id !== id))

    try {
      await deleteTransaction(user.id, id)
      showSuccess('Transaction deleted')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      // Revert optimistic update on error
      if (deletedTx) {
        setTransactions(prev => [...prev, deletedTx].sort((a, b) => {
          const dateA = parseTransactionDate(a.date).getTime()
          const dateB = parseTransactionDate(b.date).getTime()
          return dateB - dateA
        }))
        setAllTransactionsForSummary(prev => [...prev, deletedTx].sort((a, b) => {
          const dateA = parseTransactionDate(a.date).getTime()
          const dateB = parseTransactionDate(b.date).getTime()
          return dateB - dateA
        }))
      }
      showError(error, { component: 'FinancePage', action: 'deleteTransaction' })
    }
  }

  // Handle delete all transactions
  const handleDeleteAll = async () => {
    if (!user?.id) return
    
    const confirmed = confirm(
      `Are you sure you want to delete ALL transactions? This will delete all transactions from the database, not just the ones currently visible. This action cannot be undone.`
    )
    
    if (!confirmed) return

    setIsSubmitting(true)
    try {
      const deletedCount = await deleteAllTransactions(user.id)
      
      // Clear and reload all transactions for summary
      setAllTransactionsForSummary([])
      setTransactions([])
      
      // Reload all transactions for summary
      const { getAllTransactionsForSummary } = await import('@/lib/financeApi')
      const allTxs = await getAllTransactionsForSummary(user.id)
      setAllTransactionsForSummary(allTxs)
      
      showSuccess(`Successfully deleted ${deletedCount} transactions`)
    } catch (error) {
      console.error('Error deleting all transactions:', error)
      showError(error, { component: 'FinancePage', action: 'deleteAllTransactions' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle recategorize all transactions
  const handleRecategorizeAll = async () => {
    if (!user?.id || transactions.length === 0 || isSubmitting) return
    
    const confirmed = confirm(
      `This will recategorize all ${transactions.length} transactions based on their descriptions and patterns. This may take a moment. Continue?`
    )
    
    if (!confirmed) return

    setIsSubmitting(true)
    
    // Create a snapshot of transactions at the start to avoid processing duplicates
    // as the polling reloads transactions
    const transactionsSnapshot = [...transactions]
    const processedIds = new Set<string>() // Track processed transactions to avoid duplicates
    
    try {
      let updatedCount = 0
      
      // Process transactions in batches to avoid overwhelming the API
      const batchSize = 50
      for (let i = 0; i < transactionsSnapshot.length; i += batchSize) {
        const batch = transactionsSnapshot.slice(i, i + batchSize)
        
        for (const tx of batch) {
          if (!tx.id || processedIds.has(tx.id)) continue
          processedIds.add(tx.id)
          
          // Always check if category should be updated based on description
          const currentCategory = tx.category || ''
          const description = tx.description || ''
          // Check selgitus field (Estonian for "description") - some transactions might have description there
          const selgitus = (tx as any).selgitus || ''
          
          // Combine description and selgitus - use whichever has content
          const fullDescription = `${description} ${selgitus}`.trim() || description || selgitus
          
          // If category looks like a description (contains POS:, ATM:, loan patterns, utility patterns, or PSD2/KLIX), use it as description for categorization
          const categoryHasPos = currentCategory.includes('POS:')
          const categoryHasAtm = currentCategory.includes('ATM:')
          const categoryHasLoan = /laenu\s+\d+|kodulaen/i.test(currentCategory)
          const categoryHasUtility = /iseteenindus\.energia/i.test(currentCategory)
          const categoryHasPsd2Klix = /psd2|klix/i.test(currentCategory)
          // Combine category and description if category has POS, ATM, loan, utility, or PSD2/KLIX patterns
          const effectiveDescription = (categoryHasPos || categoryHasAtm || categoryHasLoan || categoryHasUtility || categoryHasPsd2Klix)
            ? `${currentCategory} ${fullDescription}`.trim() 
            : fullDescription
          
          // Get suggested category based on description (or category if it contains POS/ATM pattern)
          // Use effectiveDescription which includes selgitus
          const suggestedCategory = getSuggestedCategory(
            effectiveDescription,
            tx.referenceNumber,
            tx.recipientName,
            Number(tx.amount) || 0
          )
          
          // Check if category needs recategorization
          // POS: and ATM: patterns can be in description, selgitus, OR category field
          const hasPosInCategory = currentCategory.includes('POS:') || currentCategory.match(/\d{4}\s+\d{2}\*+/)
          const hasAtmInCategory = currentCategory.includes('ATM:')
          const hasPsd2KlixInCategory = /psd2|klix/i.test(currentCategory)
          
          // Check POS: and ATM: in description, selgitus, and effectiveDescription
          const hasPosInDescription = /pos\s*:/i.test(description) || /\d{4}\s+\d{2}\*+/.test(description)
          const hasPosInSelgitus = /pos\s*:/i.test(selgitus) || /\d{4}\s+\d{2}\*+/.test(selgitus)
          const hasPosInEffective = /pos\s*:/i.test(effectiveDescription) || /\d{4}\s+\d{2}\*+/.test(effectiveDescription)
          
          const hasAtmInDescription = /^atm\s*:/i.test(description) || /^atm\s+/i.test(description) || /atm\s*:/i.test(description)
          const hasAtmInSelgitus = /^atm\s*:/i.test(selgitus) || /^atm\s+/i.test(selgitus) || /atm\s*:/i.test(selgitus)
          const hasAtmInEffective = /^atm\s*:/i.test(effectiveDescription) || /^atm\s+/i.test(effectiveDescription) || /atm\s*:/i.test(effectiveDescription)
          
          // Combined check: POS: or ATM: in description, selgitus, effectiveDescription, or category
          const hasPosPattern = hasPosInDescription || hasPosInSelgitus || hasPosInEffective || hasPosInCategory
          const hasAtmPattern = hasAtmInDescription || hasAtmInSelgitus || hasAtmInEffective || hasAtmInCategory
          
          // Debug logging for first few transactions with POS:/ATM: patterns
          if (i < 5 && (hasPosPattern || hasAtmPattern)) {
            console.log('🔍 Pattern detection:', {
              description: description.substring(0, 50),
              currentCategory,
              hasPosInDescription,
              hasPosInCategory,
              hasPosPattern,
              hasAtmInDescription,
              hasAtmInCategory,
              hasAtmPattern,
              suggestedCategory
            })
          }
          const hasPsd2Klix = /psd2|klix/i.test(effectiveDescription) || hasPsd2KlixInCategory
          // Check for loan patterns in both description and category
          const hasLoanPatternInDesc = /laenu\s+\d+|kodulaen/i.test(effectiveDescription)
          const hasLoanPatternInCategory = /laenu\s+\d+|kodulaen/i.test(currentCategory)
          const hasLoanPattern = hasLoanPatternInDesc || hasLoanPatternInCategory
          
          // Check for utility patterns (iseteenindus.energia)
          const hasUtilityPattern = /iseteenindus\.energia/i.test(effectiveDescription) || /iseteenindus\.energia/i.test(currentCategory)
          
          // PSD2/KLIX should be categorized as ESTO
          const shouldBeEsto = hasPsd2Klix && currentCategory !== 'ESTO'
          
          // Loan patterns should be categorized as Kodulaen
          // If category contains loan pattern but isn't "Kodulaen", recategorize it
          const shouldBeKodulaen = hasLoanPattern && currentCategory !== 'Kodulaen'
          
          // Utility patterns should be categorized as Kommunaalid
          const shouldBeKommunaalid = hasUtilityPattern && currentCategory !== 'Kommunaalid'
          
          // ATM: prefix should be categorized as ATM Withdrawal (moved up, see combined check below)
          
          // POS: prefix should be categorized as Card Payment
          // Check both description and category fields
          const shouldBeCardPayment = hasPosPattern && currentCategory !== 'Card Payment'
          
          // ATM: prefix should be categorized as ATM Withdrawal
          // Check both description and category fields
          const shouldBeAtm = hasAtmPattern && currentCategory !== 'ATM Withdrawal'
          
          // Reference number (viitenumber) - SKIP FOR NOW
          // Focus on POS: and ATM: first, we'll add Bills logic back later
          const hasReferenceNumber = tx.referenceNumber && tx.referenceNumber.trim().length > 0
          const shouldBeBills = false // Disabled for now - focus on POS:/ATM: first
          
          // Check if category contains invalid patterns (like "POS:", "ATM:", etc.) - these should always be recategorized
          const hasInvalidCategoryPattern = hasPosInCategory || hasAtmInCategory || hasPsd2KlixInCategory
          
          // Only recategorize if:
          // 1. No category or "Other" category
          // 2. Category contains invalid patterns (POS:, ATM:, PSD2, etc.) - these are clearly wrong
          // Do NOT recategorize transactions that already have valid user-set categories
          // This preserves user's manual category assignments
          const needsRecategorization = 
            (!currentCategory || currentCategory === 'Other') || // No category or "Other"
            hasInvalidCategoryPattern || // Category contains invalid patterns like "POS:", "ATM:", etc. - always recategorize these
            // Only recategorize based on patterns if category is empty/Other or contains invalid patterns
            ((!currentCategory || currentCategory === 'Other' || hasInvalidCategoryPattern) && (
              shouldBeEsto ||
              shouldBeKodulaen ||
              shouldBeKommunaalid ||
              shouldBeAtm ||
              shouldBeCardPayment ||
              shouldBeBills || // Reference number should be Bills (but only if not POS: or ATM:)
              (hasPosPattern && !suggestedCategory) || // If has POS pattern but no category, try to categorize
              (hasAtmPattern && !suggestedCategory) || // If has ATM pattern but no category, try to categorize
              (hasLoanPattern && !suggestedCategory) || // If description has loan pattern but no category, try to categorize
              (hasUtilityPattern && !suggestedCategory) || // If description has utility pattern but no category, try to categorize
              (hasPsd2Klix && !suggestedCategory) || // If description has PSD2/KLIX but no category, try to categorize
              (hasReferenceNumber && !hasPosPattern && !hasAtmPattern && !suggestedCategory) // If has reference number but no POS/ATM and no category, try to categorize
            ))
          
          // Override suggested category based on prefix detection
          // IMPORTANT: POS: and ATM: take absolute priority
          let finalCategory = suggestedCategory
          
          // Priority 1: POS: → Card Payment (absolute priority)
          if (hasPosPattern || shouldBeCardPayment) {
            finalCategory = 'Card Payment'
            if (i < 5) {
              console.log('✅ Setting Card Payment for POS: transaction:', description.substring(0, 50))
            }
          }
          // Priority 2: ATM: → ATM Withdrawal (absolute priority)
          else if (hasAtmPattern || shouldBeAtm) {
            finalCategory = 'ATM Withdrawal'
            if (i < 5) {
              console.log('✅ Setting ATM Withdrawal for ATM: transaction:', description.substring(0, 50))
            }
          }
          // Priority 3: Other special categories
          else if (shouldBeKommunaalid) {
            finalCategory = 'Kommunaalid'
          } else if (shouldBeKodulaen) {
            finalCategory = 'Kodulaen'
          } else if (shouldBeEsto) {
            finalCategory = 'ESTO'
          }
          // Priority 4: Use suggested category from categorizer
          // (Bills logic disabled for now)
          
          // Debug: Log if we're not changing the category but should
          if (i < 5 && (hasPosPattern || hasAtmPattern)) {
            console.log('📊 Final decision:', {
              currentCategory,
              suggestedCategory,
              finalCategory,
              willUpdate: finalCategory !== currentCategory
            })
          }
          
          if (needsRecategorization && finalCategory && finalCategory !== currentCategory) {
            try {
              console.log(`Recategorizing: "${description.substring(0, 50)}..." from "${currentCategory}" to "${finalCategory}"`)
              await updateTransaction(user.id, tx.id, {
                ...tx,
                category: finalCategory,
              })
              updatedCount++
              // Small delay to avoid overwhelming the API
              if (updatedCount % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100))
              }
            } catch (error) {
              console.error(`Error updating transaction ${tx.id}:`, error)
            }
          } else if (needsRecategorization && !finalCategory) {
            // Log when we can't suggest a category
            console.log(`No suggestion for: "${description.substring(0, 50)}..." (current: "${currentCategory}")`)
          }
        }
        
        // Add a small delay between batches to avoid overwhelming the API
        if (i + batchSize < transactionsSnapshot.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      showSuccess(`Successfully recategorized ${updatedCount} of ${transactionsSnapshot.length} transactions`)
    } catch (error) {
      console.error('Error recategorizing transactions:', error)
      showError(error, { component: 'FinancePage', action: 'recategorizeTransactions' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingTransactionId(null)
    setFormIsRecurring(false)
    setFormRecurringInterval('monthly')
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

  // Verify imported dates
  const handleVerifyDates = () => {
    if (transactions.length === 0) {
      showError('No transactions to verify', { component: 'FinancePage', action: 'verifyDates' })
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const stats = {
      total: transactions.length,
      todayCount: 0,
      futureCount: 0,
      veryOldCount: 0,
      invalidCount: 0,
      suspiciousDates: [] as Array<{ description: string; date: string | Date; issue: string }>,
    }

    // Helper to normalize date to string or Date for display
    const normalizeDateForDisplay = (date: string | Date | { toDate?: () => Date }): string | Date => {
      const normalized = normalizeDate(date)
      if (normalized) {
        return normalized
      }
      // Fallback: return as string if normalization fails
      if (typeof date === 'string') {
        return date
      }
      return String(date)
    }

    transactions.forEach((tx) => {
      let txDate: Date | null = null
      try {
        // Use unified date normalization
        txDate = normalizeDate(tx.date)
        if (!txDate) {
          stats.invalidCount++
          stats.suspiciousDates.push({
            description: tx.description || 'Unknown',
            date: normalizeDateForDisplay(tx.date),
            issue: 'Invalid date format',
          })
          return
        }
        txDate.setHours(0, 0, 0, 0)

        if (isNaN(txDate.getTime())) {
          stats.invalidCount++
          stats.suspiciousDates.push({
            description: tx.description || 'Unknown',
            date: normalizeDateForDisplay(tx.date),
            issue: 'Invalid date format',
          })
          return
        }

        if (txDate.getTime() === today.getTime()) {
          stats.todayCount++
          if (stats.todayCount <= 5) {
            stats.suspiciousDates.push({
              description: tx.description || 'Unknown',
              date: normalizeDateForDisplay(tx.date),
              issue: 'Date is today (might indicate parsing failure)',
            })
          }
        } else if (txDate > today) {
          stats.futureCount++
          if (stats.futureCount <= 5) {
            stats.suspiciousDates.push({
              description: tx.description || 'Unknown',
              date: normalizeDateForDisplay(tx.date),
              issue: 'Future date',
            })
          }
        } else if (txDate < oneYearAgo) {
          stats.veryOldCount++
          if (stats.veryOldCount <= 5) {
            stats.suspiciousDates.push({
              description: tx.description || 'Unknown',
              date: normalizeDateForDisplay(tx.date),
              issue: 'Very old date (more than 1 year ago)',
            })
          }
        }
      } catch (error) {
        stats.invalidCount++
        stats.suspiciousDates.push({
          description: tx.description || 'Unknown',
          date: normalizeDateForDisplay(tx.date),
          issue: 'Error parsing date',
        })
      }
    })

    let message = `Date Verification Results:\n\n`
    message += `Total transactions: ${stats.total}\n`
    message += `Today's date: ${stats.todayCount}\n`
    message += `Future dates: ${stats.futureCount}\n`
    message += `Very old dates (>1 year): ${stats.veryOldCount}\n`
    message += `Invalid dates: ${stats.invalidCount}\n\n`

    if (stats.suspiciousDates.length > 0) {
      message += `Suspicious dates (showing first 5):\n`
      stats.suspiciousDates.slice(0, 5).forEach((item, idx) => {
        message += `${idx + 1}. ${item.description}: ${item.date} (${item.issue})\n`
      })
    } else {
      message += `All dates appear to be valid!`
    }

    // Show verification results as info message (longer duration for reading)
    showSuccess(message, 10000)
  }

  // CSV Import handlers
  const handleCsvFileSelect = async (file: File) => {
    try {
      const text = await file.text()
      console.log(`📁 File loaded: ${(text.length / 1024).toFixed(2)} KB, ${text.split('\n').length} lines`)
      
      // Reset bank selection for new file
      setCsvSelectedBank(null)
      
      const csvService = new CSVImportService()
      const result = csvService.parseCSV(text)
      
      console.log(`📊 Parsed ${result.transactions.length} transactions from CSV`)
      
      setCsvParsedData(result.transactions)
      setCsvColumnMapping(result.columnMapping)
      setCsvHeaders(result.columnMapping._allHeaders || [])
      setShowCsvMapping(true)
      setCsvImportStatus(`Found ${result.transactions.length} transactions`)
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : 'Unknown error'
      if (errorMessage.includes('parsing')) {
        setCsvImportStatus(`Error parsing CSV: ${errorMessage}`)
      } else {
        setCsvImportStatus(`Error reading file: ${errorMessage}`)
      }
      setShowCsvMapping(false)
    }
  }

  // Re-parse CSV when bank selection changes
  const handleBankSelectionChange = async (bankId: string) => {
    setCsvSelectedBank(bankId)
    if (csvFile) {
      // Re-parse with new bank profile
      try {
        const text = await csvFile.text()
        const csvService = new CSVImportService()
        const result = csvService.parseCSV(text, bankId)
        
        setCsvParsedData(result.transactions)
        setCsvColumnMapping(result.columnMapping)
        setCsvHeaders(result.columnMapping._allHeaders || [])
        setCsvImportStatus(`Re-parsed ${result.transactions.length} transactions using ${ESTONIAN_BANK_PROFILES.find(b => b.id === bankId)?.displayName || 'selected bank'} profile`)
      } catch (error: unknown) {
        const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : 'Unknown error'
        setCsvImportStatus(`Error re-parsing CSV: ${errorMessage}`)
      }
    }
  }

  const handleCsvImport = async () => {
    if (!user?.id || !csvFile || csvParsedData.length === 0) return
    
    if (!csvColumnMapping?.amount && csvColumnMapping?.amount !== 0) {
      setCsvImportStatus('Error: Amount column mapping is required')
      return
    }

    setIsSubmitting(true)
    // MongoDB has no quota limits - imports will be fast!
    const estimatedSeconds = Math.ceil(csvParsedData.length / 1000 * 0.5) // ~0.5s per 1000 transactions
    setCsvImportStatus(`Importing ${csvParsedData.length} transactions... This should take ~${estimatedSeconds} second${estimatedSeconds !== 1 ? 's' : ''} (MongoDB - no limits!).`)
    setCsvImportProgress(0)

    try {
      // Get bank name for source tracking
      const bankName = csvSelectedBank
        ? ESTONIAN_BANK_PROFILES.find(b => b.id === csvSelectedBank)?.displayName || null
        : null

      // Process transactions and adjust dates for payday period
      const transactionsToImport = await Promise.all(
        csvParsedData.map(async (tx) => {
          const txDate = tx.date || new Date().toISOString().split('T')[0]
          // Keep original date - period calculation will handle payday period logic
          
          return {
            type: tx.type || 'expense',
            description: tx.description || 'Imported transaction',
            amount: tx.amount || 0,
            category: tx.category || 'Other',
            date: txDate,
            // Include all other fields from CSV (selgitus, referenceNumber, recipientName, archiveId, etc.)
            ...(tx.referenceNumber && { referenceNumber: tx.referenceNumber }),
            ...(tx.recipientName && { recipientName: tx.recipientName }),
            ...(tx.archiveId && { archiveId: tx.archiveId }),
            ...(tx.selgitus && { selgitus: tx.selgitus }),
            // Add bank source for imported transactions
            ...(bankName && { sourceBank: bankName }),
            // Include any other fields that might be present
            ...Object.fromEntries(
              Object.entries(tx).filter(([key]) => 
                !['type', 'description', 'amount', 'category', 'date'].includes(key)
              )
            ),
          }
        })
      )

      // Check how many transactions have archiveId for duplicate detection
      const transactionsWithArchiveId = transactionsToImport.filter(tx => (tx as any).archiveId)
      const enableDuplicateCheck = transactionsWithArchiveId.length > 0
      
      let finalTransactionsToImport = transactionsToImport
      let skippedCount = 0
      
      if (enableDuplicateCheck) {
        setCsvImportStatus(`🔍 Checking for duplicates... Found ${transactionsWithArchiveId.length} transactions with archiveId`)
        setCsvImportProgress(5) // Show initial progress
        
        // Force UI update
        await new Promise(resolve => setTimeout(resolve, 50))
        
        try {
          // Call API to check for duplicates
          const archiveIds = transactionsWithArchiveId.map(tx => (tx as any).archiveId).filter(Boolean)
          setCsvImportProgress(10)
          
          const checkResponse = await fetch('/api/finance/transactions/check-duplicates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, archiveIds }),
          })
          
          if (checkResponse.ok) {
            const { existingArchiveIds } = await checkResponse.json()
            setCsvImportProgress(15)
            
            // Filter out duplicates
            finalTransactionsToImport = transactionsToImport.filter(tx => {
              const archiveId = (tx as any).archiveId
              if (archiveId && existingArchiveIds.includes(archiveId)) {
                skippedCount++
                return false
              }
              return true
            })
            
            setCsvImportProgress(20)
            setCsvImportStatus(`✅ Found ${existingArchiveIds.length} duplicates - ${finalTransactionsToImport.length} new transactions to import`)
          } else {
            console.warn('Failed to check duplicates, proceeding with import')
            setCsvImportStatus(`⚠️ Could not check duplicates, importing all transactions...`)
          }
        } catch (error) {
          console.error('Error checking duplicates:', error)
          setCsvImportStatus(`⚠️ Error checking duplicates, importing all transactions...`)
        }
      } else {
        setCsvImportStatus(`⚠️ No archiveId found - duplicate detection disabled. All transactions will be imported.`)
        setCsvImportProgress(0)
      }

      // Add a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100))

      const result = await batchAddTransactions(
        user.id,
        finalTransactionsToImport,
        (current, total) => {
          const progress = Math.round((current / total) * 100)
          // Start progress from 20% if duplicate check was done, otherwise from 0%
          const adjustedProgress = enableDuplicateCheck 
            ? 20 + Math.round((progress * 0.8)) // 20-100% range
            : progress
          setCsvImportProgress(adjustedProgress)
        },
        { skipDuplicates: false } // Already filtered duplicates, don't check again
      )
      
      // Add skipped count to result
      result.skipped = skippedCount

      const errorSuffix = result.errors > 0 ? ` (${result.errors} errors)` : ''
      let skippedSuffix = ''
      if (result.skipped > 0) {
        skippedSuffix = ` ✅ ${result.skipped} duplicates skipped (already imported)`
      }
      const successMessage = `Successfully imported ${result.success} of ${transactionsToImport.length} transactions${skippedSuffix}${errorSuffix}`
      
      // Log duplicate detection results
      if (result.skipped > 0) {
        console.log(`✅ Duplicate detection: Skipped ${result.skipped} transactions that already exist (matched by archiveId)`)
        console.log(`💡 Tip: You can safely re-import the same file - duplicates will be automatically skipped`)
      }
      
      setCsvImportProgress(100)
      
      // Warn if not all transactions were imported
      if (result.success < transactionsToImport.length - result.skipped) {
        console.warn(`⚠️ Only imported ${result.success} out of ${transactionsToImport.length - result.skipped} new transactions`)
      }
      
      // Special message if all were duplicates
      if (result.skipped === transactionsToImport.length && result.success === 0) {
        setCsvImportStatus(`✅ All ${result.skipped} transactions already exist - no duplicates imported. Safe to re-import anytime!`)
      } else {
        setCsvImportStatus(successMessage)
      }
      
      // Force a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Transactions will be reloaded automatically via the subscription
      // No need to manually reload - the subscribeToTransactions will update
      
      // Reset after 3 seconds
      setTimeout(() => {
        setShowCsvMapping(false)
        setCsvFile(null)
        setCsvColumnMapping(null)
        setCsvHeaders([])
        setCsvParsedData([])
        setCsvSelectedBank(null)
        setCsvImportStatus('')
        setCsvImportProgress(0)
      }, 3000)
    } catch (error: unknown) {
      console.error('❌ CSV Import Error:', error)
      let errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : 'Unknown error'
      
      setCsvImportProgress(0)
      // Provide user-friendly message for quota errors
      if (errorMessage.includes('quota') || errorMessage.includes('resource-exhausted')) {
        const quotaMessage = errorMessage.includes('after') 
          ? errorMessage 
          : 'Firestore free tier has daily write limits (~20k writes/day). Please wait a few minutes and try importing the remaining transactions, or upgrade to a paid plan for higher limits.'
        errorMessage = `Firestore quota exceeded. ${quotaMessage}`
      }
      
      setCsvImportStatus(`Error importing: ${errorMessage}`)
      setCsvImportProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const summary = summaryView === 'monthly' ? monthlySummary : allTimeSummary

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Finance Tracker
                      </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Track your income, expenses, and see a quick overview of your cashflow.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href="/finance/analytics"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      Analytics
                    </a>
                    <a
                      href="/finance/settings"
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Settings
                    </a>
                  </div>
                </div>

                {/* Dashboard - Show immediately with skeleton if loading */}
                {isLoading && transactions.length === 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <CardSkeleton key="summary-skeleton-1" />
                      <CardSkeleton key="summary-skeleton-2" />
                      <CardSkeleton key="summary-skeleton-3" />
                    </div>
                    <CardSkeleton key="summary-skeleton-4" />
                    <TransactionListSkeleton count={10} />
                  </div>
                ) : (
                <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Summary</h2>
                    <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => setSummaryView('monthly')}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                          summaryView === 'monthly'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummaryView('alltime')}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                          summaryView === 'alltime'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        All Time
                      </button>
                    </div>
                  </div>

                  {/* Monthly View */}
                  {summaryView === 'monthly' && (
                    <div className="mb-6">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => navigateMonth(-1)}
                            className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Previous period"
                          >
                            ‹
                          </button>
                          <div className="relative inline-block">
                            <input
                              type="month"
                              value={selectedMonth}
                              onChange={(e) => setSelectedMonth(e.target.value)}
                              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900 dark:text-white text-sm bg-white dark:bg-gray-800 px-1 whitespace-nowrap z-10">
                              {getEstonianMonth(selectedMonth)}
                            </span>
                  </div>
                          {summaryView === 'monthly' && monthlySummary.startDate && monthlySummary.endDate && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                              Period: {formatDisplayDate(monthlySummary.startDate)} - {formatDisplayDate(monthlySummary.endDate)}
                              {financeSettings?.usePaydayPeriod && (
                                <span className="ml-2 text-blue-600 dark:text-blue-400" title={`Payday period: starts at ${financeSettings.paydayStartCutoffHour ?? 14}:00 on last working day of previous month, ends at ${financeSettings.paydayCutoffHour ?? 13}:00 on last working day of current month`}>
                                  📅 Payday ({financeSettings.paydayStartCutoffHour ?? 14}:00 - {financeSettings.paydayCutoffHour ?? 13}:00)
                                </span>
                              )}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => navigateMonth(1)}
                            className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Next period"
                          >
                            ›
                          </button>
                          <button
                            type="button"
                            onClick={setCurrentMonth}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            Current Period
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-xl">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                              Monthly Balance
                    </h3>
                            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                            {formatCurrency((summaryView === 'monthly' ? monthlySummary : allTimeSummary).balance)}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-xl">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                              Monthly Income
                            </h3>
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono tabular-nums">
                            {formatCurrency((summaryView === 'monthly' ? monthlySummary : allTimeSummary).income)}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-xl">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                              Monthly Expenses
                            </h3>
                            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono tabular-nums">
                            {formatCurrency((summaryView === 'monthly' ? monthlySummary : allTimeSummary).expenses)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Time View */}
                  {summaryView === 'alltime' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Total Balance
                          </h3>
                          <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                          {formatCurrency(summary.balance)}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Total Income
                          </h3>
                          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono tabular-nums">
                          {formatCurrency(summary.income)}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Total Expenses
                    </h3>
                          <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono tabular-nums">
                          {formatCurrency(summary.expenses)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expense Forecast */}
                  {summaryView === 'monthly' && (
                    <div className="mt-6 space-y-6">
                      <ExpenseForecastComponent period="month" monthsOfHistory={6} />
                    </div>
                  )}
                </div>

                {/* Savings Goals Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      Savings Goals
                    </h2>
                    <a
                      href="/finance/savings-goals"
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      View All →
                    </a>
                  </div>
                  {isLoadingGoals ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <CardSkeleton key="goal-skeleton-1" />
                      <CardSkeleton key="goal-skeleton-2" />
                    </div>
                  ) : savingsGoals.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">No savings goals yet</p>
                      <a
                        href="/finance/savings-goals"
                        className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Create Goal
                      </a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savingsGoals.slice(0, 3).map((goal) => {
                        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
                        return (
                          <div
                            key={goal.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4"
                            style={{ borderLeftColor: goal.color || '#6366f1' }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                  {goal.name}
                                </h3>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                                </div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                              <div
                                className="h-full transition-all duration-300 rounded-full"
                                style={{
                                  width: `${Math.min(progress, 100)}%`,
                                  backgroundColor: goal.color || '#6366f1',
                                }}
                              />
                            </div>
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                              {progress.toFixed(0)}% complete
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Bill Reminders Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      Bill Reminders
                    </h2>
                    <a
                      href="/finance/bills"
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      View All →
                    </a>
                  </div>
                  {isLoadingBills ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CardSkeleton key="bill-skeleton-1" />
                      <CardSkeleton key="bill-skeleton-2" />
                    </div>
                  ) : bills.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">No bill reminders yet</p>
                      <a
                        href="/finance/bills"
                        className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Add Bill
                      </a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bills
                        .filter(bill => !bill.isPaid)
                        .sort((a, b) => {
                          const dateA = a.dueDate ? parseTransactionDate(a.dueDate) : parseTransactionDate(a.nextDate || new Date())
                          const dateB = b.dueDate ? parseTransactionDate(b.dueDate) : parseTransactionDate(b.nextDate || new Date())
                          return dateA.getTime() - dateB.getTime()
                        })
                        .slice(0, 4)
                        .map((bill) => {
                          const dueDate = bill.dueDate 
                            ? parseTransactionDate(bill.dueDate)
                            : parseTransactionDate(bill.nextDate || new Date())
                          const daysUntilDue = differenceInDays(dueDate, new Date())
                          const isOverdue = isPast(dueDate) && !isToday(dueDate)
                          const isDueSoon = daysUntilDue <= (bill.reminderDaysBefore || 3) && daysUntilDue >= 0

                          return (
                            <div
                              key={bill.id}
                              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 border-purple-500"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                      {bill.name || 'Untitled Bill'}
                                    </h3>
                                    {isOverdue && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                                    {isDueSoon && !isOverdue && <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                                  </div>
                                  <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                    {formatCurrency(bill.amount)}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Due: {format(dueDate, 'MMM d, yyyy')}
                                  </div>
                                </div>
                              </div>
                              {isOverdue && (
                                <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                                  {Math.abs(daysUntilDue)} days overdue
                                </div>
                              )}
                              {isDueSoon && !isOverdue && (
                                <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                  Due in {daysUntilDue} days
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>

                {/* Main View */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* Left Panel - Add Transaction Form */}
                  <div className="flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        {editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}
                      </h2>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            id="description"
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="e.g. Salary, Groceries"
                            required
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Category {!availableCategories.includes(formCategory) && formCategory && (
                              <span className="text-xs text-blue-600 dark:text-blue-400">(New category will be created)</span>
                            )}
                          </label>
                          <input
                            id="category"
                            type="text"
                            list="category-list"
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            required
                            placeholder="Select or type a new category"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <datalist id="category-list">
                            {availableCategories.map((cat) => (
                              <option key={cat} value={cat} />
                            ))}
                          </datalist>
                          {categorySuggestions.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Suggested categories:</div>
                              <div className="flex gap-2 flex-wrap">
                                {categorySuggestions.map((cat) => (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFormCategory(cat)}
                                    className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formIsRecurring}
                              onChange={(e) => setFormIsRecurring(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Mark as recurring transaction
                            </span>
                          </label>
                          {formIsRecurring && (
                            <select
                              value={formRecurringInterval}
                              onChange={(e) => setFormRecurringInterval(e.target.value as 'monthly' | 'weekly' | 'yearly')}
                              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          )}
                        </div>
                        <div>
                          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Date
                          </label>
                          <input
                            type="date"
                            id="date"
                            value={formDate}
                            onChange={(e) => setFormDate(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setQuickDate('today')}
                              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickDate('yesterday')}
                              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                            >
                              Yesterday
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickDate('week')}
                              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                            >
                              This Week
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Saving...' : editingTransactionId ? 'Update Transaction' : 'Add Transaction'}
                          </button>
                          {editingTransactionId && (
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                      
                      {/* CSV Import Section */}
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Import from CSV</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Upload a CSV file and select which columns to import. You can safely re-import the same file - duplicates will be automatically skipped using archiveId.
                        </p>
                        {csvParsedData.length > 1000 && (
                          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                              ✅ <strong>Large import detected ({csvParsedData.length} transactions)</strong>
                              <br />
                              Using MongoDB - no quota limits! This import will be fast (~{Math.ceil(csvParsedData.length / 1000 * 0.5)} seconds).
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 mb-4">
                          <input
                            type="file"
                            id="csvFileInput"
                            accept=".csv"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setCsvFile(file)
                                handleCsvFileSelect(file)
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="csvFileInput"
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                          >
                            Choose CSV File
                          </label>
                          {transactions.length > 0 && (
                            <button
                              type="button"
                              onClick={handleVerifyDates}
                              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              title="Verify imported dates"
                            >
                              🔍 Verify Dates
                            </button>
                          )}
                        </div>
                        
                        {csvImportStatus && (
                          <div className={`text-sm mb-2 ${csvImportStatus.includes('Error') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {csvImportStatus}
                  </div>
                )}
                        
                        {csvImportProgress > 0 && csvImportProgress < 100 && (
                          <div className="mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
                                  style={{ width: `${csvImportProgress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[40px] text-right">
                                {csvImportProgress}%
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {showCsvMapping && csvHeaders.length > 0 && (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            {/* Bank Selection */}
                            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Your Bank:
                              </label>
                              <select
                                value={csvSelectedBank || ''}
                                onChange={(e) => handleBankSelectionChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select your bank (optional)</option>
                                {ESTONIAN_BANK_PROFILES.map((bank) => (
                                  <option key={bank.id} value={bank.id}>
                                    {bank.displayName}
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Selecting your bank will automatically map columns. You can still adjust mappings below if needed.
                              </p>
                            </div>
                            
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Map CSV Fields</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                              Select which CSV column maps to each transaction field:
                            </p>
                            <div className="space-y-2 mb-4">
                              {[
                                { key: 'type', label: 'Type' },
                                { key: 'description', label: 'Description' },
                                { key: 'amount', label: 'Amount (required)' },
                                { key: 'category', label: 'Category' },
                                { key: 'date', label: 'Date' },
                              ].map((field) => (
                                <div key={field.key}>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {field.label}:
                                  </label>
                                  <select
                                    value={csvColumnMapping?.[field.key] ?? ''}
                                    onChange={(e) => {
                                      setCsvColumnMapping({
                                        ...csvColumnMapping,
                                        [field.key]: e.target.value === '' ? null : parseInt(e.target.value),
                                      })
                                    }}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">-- Select column --</option>
                                    {csvHeaders.map((header, index) => (
                                      <option key={index} value={index}>
                                        {header}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleCsvImport}
                                disabled={!csvColumnMapping?.amount && csvColumnMapping?.amount !== 0}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Import Selected Fields
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCsvMapping(false)
                                  setCsvFile(null)
                                  setCsvColumnMapping(null)
                                  setCsvHeaders([])
                                  setCsvParsedData([])
                                  setCsvSelectedBank(null)
                                  setCsvImportStatus('')
                                }}
                                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Transaction List */}
                  <div className="flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleRecategorizeAll}
                            disabled={transactions.length === 0 || isSubmitting}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                            title="Recategorize all transactions based on patterns (POS, reference numbers, etc.)"
                          >
                            <span className="hidden sm:inline">🔄 Recategorize All</span>
                            <span className="sm:hidden">🔄 Recategorize</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteAll}
                            disabled={transactions.length === 0 || isSubmitting}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                          >
                            Delete All
                          </button>
                        </div>
                      </div>

                      {/* Date Range Filter */}
                      <div className="mb-4">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range:</label>
                        <div className="grid grid-cols-3 sm:flex sm:gap-2 gap-1.5 sm:gap-2 mb-3">
                          {(['month', 'today', 'week', 'year', 'all'] as const).map((range) => (
                            <button
                              key={range}
                              type="button"
                              onClick={() => {
                                setDateRange(range)
                                setShowCustomDateRange(false)
                              }}
                              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-colors ${
                                dateRange === range && !showCustomDateRange
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md'
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                              }`}
                            >
                              {range === 'month' ? 'Month' : range === 'today' ? 'Today' : range === 'week' ? 'Week' : range === 'year' ? 'Year' : 'All'}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setDateRange('custom')
                              setShowCustomDateRange(true)
                            }}
                            className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-colors col-span-3 sm:col-span-1 ${
                              dateRange === 'custom' && showCustomDateRange
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                            }`}
                          >
                            Custom
                          </button>
                        </div>
                        {showCustomDateRange && (
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:items-end p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex-1 sm:flex-none">
                              <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">From:</label>
                              <input
                                type="date"
                                value={customDateFrom}
                                onChange={(e) => setCustomDateFrom(e.target.value)}
                                className="w-full sm:w-auto px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex-1 sm:flex-none">
                              <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">To:</label>
                              <input
                                type="date"
                                value={customDateTo}
                                onChange={(e) => setCustomDateTo(e.target.value)}
                                className="w-full sm:w-auto px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex gap-2 sm:flex-none">
                              <button
                                type="button"
                                onClick={() => {
                                  if (customDateFrom && customDateTo) {
                                    setDateRange('custom')
                                  }
                                }}
                                className="flex-1 sm:flex-none px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:shadow-md transition-all"
                              >
                                Apply
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCustomDateRange(false)
                                  setDateRange('month')
                                }}
                                className="flex-1 sm:flex-none px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Search */}
                      <div className="mb-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search transactions..."
                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Advanced Filters */}
                      <div className="mb-4">
                        <button
                          type="button"
                          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
                        </button>
                        {showAdvancedFilters && (
                          <div className="mt-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  Min Amount
                                </label>
                                <input
                                  type="number"
                                  value={filterMinAmount}
                                  onChange={(e) => setFilterMinAmount(e.target.value)}
                                  placeholder="0.00"
                                  step="0.01"
                                  min="0"
                                  className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  Max Amount
                                </label>
                                <input
                                  type="number"
                                  value={filterMaxAmount}
                                  onChange={(e) => setFilterMaxAmount(e.target.value)}
                                  placeholder="0.00"
                                  step="0.01"
                                  min="0"
                                  className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Filter by Category
                              </label>
                              <select
                                multiple
                                value={filterCategories}
                                onChange={(e) => {
                                  const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                                  setFilterCategories(selected)
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {allCategories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Hold Ctrl/Cmd to select multiple categories
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterMinAmount('')
                                  setFilterMaxAmount('')
                                  setFilterCategories([])
                                }}
                                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                Clear Filters
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Filter Buttons */}
                      <div className="flex gap-2 mb-4">
                        {(['all', 'income', 'expense'] as const).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setCurrentFilter(filter)}
                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                              currentFilter === filter
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Transaction List */}
                      <div className="space-y-2 sm:space-y-3 max-h-[600px] overflow-y-auto">
                        {isLoading ? (
                          <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading...</div>
                        ) : filteredTransactions.length === 0 ? (
                          <div className="text-center py-10">
                            <div className="text-4xl mb-3">📊</div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start tracking your expenses</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              Add your first transaction to start managing your finances.
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Pagination only for small lists (<=50 items) */}
                            {filteredTransactions.length <= 50 && filteredTransactions.length > transactionsPerPage && (
                              <div key="pagination-info" className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
                                <span className="text-sm text-blue-800 dark:text-blue-200">
                                  Showing {((currentPage - 1) * transactionsPerPage) + 1}-{Math.min(currentPage * transactionsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                                </span>
                                <div className="flex gap-2 items-center">
                                  <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    Previous
                                  </button>
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Page {currentPage} of {totalPages}
                                  </span>
                                  <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            )}
                            {/* Show virtual scrolling indicator for large lists */}
                            {filteredTransactions.length > 50 && (
                              <div key="virtual-scroll-info" className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <span className="text-sm text-green-800 dark:text-green-200">
                                  📊 Virtual scrolling enabled: Showing {filteredTransactions.length} transactions (only visible items rendered)
                                </span>
                              </div>
                            )}
                            {filteredTransactions.length > 50 ? (
                              // Use virtual scrolling for large lists
                              <VirtualList
                                key="virtual-list"
                                items={filteredTransactions}
                                itemHeight={100} // Reduced height for mobile-optimized cards
                                containerHeight={600} // Fixed container height
                                overscan={5} // Render 5 extra items above/below for smooth scrolling
                                className="space-y-3 sm:space-y-4"
                                renderItem={(tx) => {
                                  const txType = (tx.type || '').toLowerCase()
                                  const amount = Number(tx.amount) || 0
                                  
                                  // Determine if income or expense: prioritize type field, then check amount sign
                                  let isIncome: boolean
                                  if (txType === 'income') {
                                    isIncome = true
                                  } else if (txType === 'expense') {
                                    isIncome = false
                                  } else {
                                    // If type not set, use amount sign: positive = income, negative = expense
                                    isIncome = amount >= 0
                                  }
                                  
                                  // Display amount: if expense with positive amount, show as negative
                                  const displayAmount = !isIncome && amount > 0 ? -amount : amount
                                  
                                  // Clean description - remove card/account info if it's in the description
                                  let cleanDescription = tx.description || '—'
                                  if (cleanDescription.includes('POS:') || cleanDescription.match(/\d{4}\s+\d{2}\*\*/)) {
                                    // Extract merchant name if it exists after card info
                                    const parts = cleanDescription.split(',').map(p => p.trim())
                                    const merchantPart = parts.find(p => !p.includes('POS:') && !p.match(/\d{4}\s+\d{2}\*\*/))
                                    if (merchantPart) {
                                      cleanDescription = merchantPart
                                    } else {
                                      // Just use the first part that's not card info
                                      cleanDescription = parts.find(p => !p.includes('POS:') && !p.match(/\d{4}\s+\d{2}\*\*/)) || cleanDescription
                                    }
                                  }
                                  
                                  return (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-all">
                                      {/* Mobile: Stacked layout, Desktop: Side by side */}
                                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-1.5 sm:mb-1 truncate">
                                            {cleanDescription}
                                          </h3>
                                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-2 sm:mb-0">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              {formatDisplayDate(tx.date)}
                                            </span>
                                            {tx.category && (
                                              <>
                                                <span className="text-gray-400 dark:text-gray-500">•</span>
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-md">
                                                  {tx.category}
                                                </span>
                                              </>
                                            )}
                                            {(tx as any).sourceBank && (
                                              <>
                                                <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">•</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                                                  {(tx as any).sourceBank}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        {/* Amount and Actions */}
                                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-3 flex-shrink-0">
                                          <span
                                            className={`text-lg sm:text-xl font-bold font-mono tabular-nums ${
                                              isIncome
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}
                                          >
                                            {formatCurrency(displayAmount)}
                                          </span>
                                          <div className="flex gap-1.5 sm:gap-2">
                                            <button
                                              type="button"
                                              onClick={() => handleEdit(tx as FinanceTransaction & { id: string })}
                                              className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                              aria-label="Edit transaction"
                                            >
                                              <Edit2 className="w-4 h-4 sm:hidden" />
                                              <span className="hidden sm:inline">Edit</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDelete(tx.id!)}
                                              className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                                              aria-label="Delete transaction"
                                            >
                                              <Trash2 className="w-4 h-4 sm:hidden" />
                                              <span className="hidden sm:inline">Delete</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                }}
                              />
                            ) : (
                              // Use regular rendering for small lists
                              <div key="regular-transaction-list">
                              {paginatedTransactions.map((tx) => {
                                const txType = (tx.type || '').toLowerCase()
                                const amount = Number(tx.amount) || 0
                                
                                // Determine if income or expense: prioritize type field, then check amount sign
                                let isIncome: boolean
                                if (txType === 'income') {
                                  isIncome = true
                                } else if (txType === 'expense') {
                                  isIncome = false
                                } else {
                                  // If type not set, use amount sign: positive = income, negative = expense
                                  isIncome = amount >= 0
                                }
                                
                                // Display amount: if expense with positive amount, show as negative
                                const displayAmount = !isIncome && amount > 0 ? -amount : amount
                                
                                // Clean description - remove card/account info if it's in the description
                                let cleanDescription = tx.description || '—'
                                if (cleanDescription.includes('POS:') || cleanDescription.match(/\d{4}\s+\d{2}\*\*/)) {
                                  // Extract merchant name if it exists after card info
                                  const parts = cleanDescription.split(',').map(p => p.trim())
                                  const merchantPart = parts.find(p => !p.includes('POS:') && !p.match(/\d{4}\s+\d{2}\*\*/))
                                  if (merchantPart) {
                                    cleanDescription = merchantPart
                                  } else {
                                    // Just use the first part that's not card info
                                    cleanDescription = parts.find(p => !p.includes('POS:') && !p.match(/\d{4}\s+\d{2}\*\*/)) || cleanDescription
                                  }
                                }
                                
                                return (
                                  <div
                                    key={tx.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-all"
                                  >
                                    {/* Mobile: Stacked layout, Desktop: Side by side */}
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-1.5 sm:mb-1 truncate">
                                          {cleanDescription}
                                        </h3>
                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-2 sm:mb-0">
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDisplayDate(tx.date)}
                                          </span>
                                          {tx.category && (
                                            <span key="category" className="flex items-center gap-1.5 sm:gap-2">
                                              <span className="text-gray-400 dark:text-gray-500">•</span>
                                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-md">
                                                {tx.category}
                                              </span>
                                            </span>
                                          )}
                                          {(tx as any).sourceBank && (
                                            <span key="sourceBank" className="flex items-center gap-1.5 sm:gap-2">
                                              <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">•</span>
                                              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                                                {(tx as any).sourceBank}
                                              </span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {/* Amount and Actions */}
                                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-3 flex-shrink-0">
                                        <span
                                          className={`text-lg sm:text-xl font-bold font-mono tabular-nums ${
                                            isIncome
                                              ? 'text-green-600 dark:text-green-400'
                                              : 'text-red-600 dark:text-red-400'
                                          }`}
                                        >
                                          {formatCurrency(displayAmount)}
                                        </span>
                                        <div className="flex gap-1.5 sm:gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleEdit(tx as FinanceTransaction & { id: string })}
                                            className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                            aria-label="Edit transaction"
                                          >
                                            <Edit2 className="w-4 h-4 sm:hidden" />
                                            <span className="hidden sm:inline">Edit</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDelete(tx.id!)}
                                            className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                                            aria-label="Delete transaction"
                                          >
                                            <Trash2 className="w-4 h-4 sm:hidden" />
                                            <span className="hidden sm:inline">Delete</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
