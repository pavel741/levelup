'use client'

import { useEffect, useMemo, useState } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import {
  subscribeToTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  subscribeToCategories,
  getCategories,
  batchAddTransactions,
  batchDeleteTransactions,
  getFinanceSettings,
  getAllTransactionsForSummary,
} from '@/lib/financeFirestore'
import type { FinanceTransaction, FinanceCategories, FinanceSettings } from '@/types/finance'
import { getPeriodDates } from '@/lib/financeDateUtils'
import { CSVImportService } from '@/lib/csvImport'

export const dynamic = 'force-dynamic'

export default function FinancePage() {
  const { user } = useFirestoreStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [allTransactionsForSummary, setAllTransactionsForSummary] = useState<FinanceTransaction[]>([])
  const [categories, setCategories] = useState<FinanceCategories | null>(null)
  const [financeSettings, setFinanceSettings] = useState<FinanceSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  
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

  // Load finance settings (for period configuration)
  useEffect(() => {
    if (!user?.id) return

    const loadSettings = async () => {
      try {
        const settings = await getFinanceSettings(user.id)
        setFinanceSettings(settings)
      } catch (e) {
        console.error('Error loading finance settings:', e)
      }
    }

    loadSettings()
  }, [user?.id])

  // Load ALL transactions for summary calculations (no limit)
  const loadAllTransactionsForSummary = async () => {
    if (!user?.id) return
    setIsLoadingSummary(true)
    try {
      const allTxs = await getAllTransactionsForSummary(user.id)
      setAllTransactionsForSummary(allTxs)
    } catch (e) {
      console.error('Error loading all transactions for summary:', e)
    } finally {
      setIsLoadingSummary(false)
    }
  }

  useEffect(() => {
    if (!user?.id) return
    loadAllTransactionsForSummary()
  }, [user?.id])

  // Reload summary transactions when regular transactions change significantly
  useEffect(() => {
    if (!user?.id || transactions.length === 0) return
    // Debounce reload to avoid too many calls
    const timeoutId = setTimeout(() => {
      loadAllTransactionsForSummary()
    }, 2000)
    return () => clearTimeout(timeoutId)
  }, [user?.id, transactions.length])

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
    if (!formDescription || !transactions.length) {
      setCategorySuggestions([])
      return
    }

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

    // Get top 3 suggestions
    const suggestions = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat)
      .filter((cat) => availableCategories.includes(cat))

    setCategorySuggestions(suggestions)
  }, [formDescription, transactions, availableCategories])

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
        let txDate: Date
        if (typeof tx.date === 'string') {
          txDate = new Date(tx.date)
        } else if (tx.date && typeof tx.date === 'object' && 'toDate' in tx.date && typeof (tx.date as any).toDate === 'function') {
          // Firestore Timestamp
          txDate = (tx.date as any).toDate()
        } else if (tx.date instanceof Date) {
          txDate = tx.date
        } else {
          // Fallback: try to convert
          txDate = new Date(tx.date as any)
        }
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

    // Sort by date descending
    filtered.sort((a, b) => {
      const getDate = (date: string | Date | any): Date => {
        if (typeof date === 'string') {
          return new Date(date)
        } else if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
          // Firestore Timestamp
          return date.toDate()
        } else if (date instanceof Date) {
          return date
        } else {
          // Fallback: try to convert
          return new Date(date)
        }
      }
      const dateA = getDate(a.date)
      const dateB = getDate(b.date)
      return dateB.getTime() - dateA.getTime()
    })

    return filtered
  }, [transactions, currentFilter, dateRange, searchQuery, customDateFrom, customDateTo])

  // Calculate summary for selected month (using ALL transactions)
  const monthlySummary = useMemo(() => {
    // Use period settings if available, otherwise default to calendar month
    let startDate: Date
    let endDate: Date
    
    if (financeSettings?.usePaydayPeriod || financeSettings?.periodStartDay !== undefined) {
      const periodDates = getPeriodDates(
        selectedMonth,
        financeSettings.usePaydayPeriod || false,
        financeSettings.periodStartDay ?? 1,
        financeSettings.periodEndDay ?? null
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
      let txDate: Date
      if (typeof tx.date === 'string') {
        txDate = new Date(tx.date)
      } else if (tx.date && typeof tx.date === 'object' && 'toDate' in tx.date && typeof (tx.date as any).toDate === 'function') {
        // Firestore Timestamp
        txDate = (tx.date as any).toDate()
      } else if (tx.date instanceof Date) {
        txDate = tx.date
      } else {
        // Fallback: try to convert
        txDate = new Date(tx.date as any)
      }
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

    return {
      income,
      expenses,
      balance: income - expenses,
      startDate,
      endDate,
    }
  }, [allTransactionsForSummary, selectedMonth, financeSettings])

  // Calculate all-time summary (using ALL transactions)
  const allTimeSummary = useMemo(() => {
    let income = 0
    let expenses = 0

    allTransactionsForSummary.forEach((tx) => {
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
  }, [allTransactionsForSummary])

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
      // Ensure expenses are stored as negative amounts
      const amount = Number(formAmount)
      const finalAmount = formType === 'expense' && amount > 0 ? -amount : amount
      
      const transaction: Omit<FinanceTransaction, 'id'> = {
        type: formType,
        description: formDescription,
        amount: finalAmount,
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
    try {
      await deleteTransaction(user.id, id)
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Error deleting transaction. Please try again.')
    }
  }

  // Handle delete all transactions
  const handleDeleteAll = async () => {
    if (!user?.id || transactions.length === 0) return
    
    const confirmed = confirm(
      `Are you sure you want to delete ALL ${transactions.length} transactions? This action cannot be undone.`
    )
    
    if (!confirmed) return

    setIsSubmitting(true)
    try {
      const transactionIds = transactions.map((tx) => tx.id!).filter((id) => id)
      if (transactionIds.length > 0) {
        await batchDeleteTransactions(user.id, transactionIds)
        alert(`Successfully deleted ${transactionIds.length} transactions`)
      }
    } catch (error) {
      console.error('Error deleting all transactions:', error)
      alert('Error deleting transactions. Please try again.')
    } finally {
      setIsSubmitting(false)
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

  // Verify imported dates
  const handleVerifyDates = () => {
    if (transactions.length === 0) {
      alert('No transactions to verify')
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
      suspiciousDates: [] as Array<{ description: string; date: any; issue: string }>,
    }

    transactions.forEach((tx) => {
      let txDate: Date
      try {
        if (typeof tx.date === 'string') {
          txDate = new Date(tx.date + 'T00:00:00')
        } else if (tx.date && typeof tx.date === 'object' && 'toDate' in tx.date && typeof (tx.date as any).toDate === 'function') {
          txDate = (tx.date as any).toDate()
        } else if (tx.date instanceof Date) {
          txDate = tx.date
        } else {
          txDate = new Date(tx.date as any)
        }
        txDate.setHours(0, 0, 0, 0)

        if (isNaN(txDate.getTime())) {
          stats.invalidCount++
          stats.suspiciousDates.push({
            description: tx.description || 'Unknown',
            date: tx.date,
            issue: 'Invalid date format',
          })
          return
        }

        if (txDate.getTime() === today.getTime()) {
          stats.todayCount++
          if (stats.todayCount <= 5) {
            stats.suspiciousDates.push({
              description: tx.description || 'Unknown',
              date: tx.date,
              issue: 'Date is today (might indicate parsing failure)',
            })
          }
        } else if (txDate > today) {
          stats.futureCount++
          if (stats.futureCount <= 5) {
            stats.suspiciousDates.push({
              description: tx.description || 'Unknown',
              date: tx.date,
              issue: 'Future date',
            })
          }
        } else if (txDate < oneYearAgo) {
          stats.veryOldCount++
          if (stats.veryOldCount <= 5) {
            stats.suspiciousDates.push({
              description: tx.description || 'Unknown',
              date: tx.date,
              issue: 'Very old date (more than 1 year ago)',
            })
          }
        }
      } catch (error) {
        stats.invalidCount++
        stats.suspiciousDates.push({
          description: tx.description || 'Unknown',
          date: tx.date,
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

    alert(message)
  }

  // CSV Import handlers
  const handleCsvFileSelect = async (file: File) => {
    try {
      const text = await file.text()
      const csvService = new CSVImportService()
      
      try {
        const result = csvService.parseCSV(text)
        setCsvParsedData(result.transactions)
        setCsvColumnMapping(result.columnMapping)
        setCsvHeaders(result.columnMapping._allHeaders || [])
        setShowCsvMapping(true)
        setCsvImportStatus(`Found ${result.transactions.length} transactions`)
      } catch (error: any) {
        setCsvImportStatus(`Error parsing CSV: ${error.message}`)
        setShowCsvMapping(false)
      }
    } catch (error: any) {
      setCsvImportStatus(`Error reading file: ${error.message}`)
    }
  }

  const handleCsvImport = async () => {
    if (!user?.id || !csvFile || csvParsedData.length === 0) return
    
    if (!csvColumnMapping?.amount && csvColumnMapping?.amount !== 0) {
      setCsvImportStatus('Error: Amount column mapping is required')
      return
    }

    setIsSubmitting(true)
    setCsvImportStatus('Importing transactions...')
    setCsvImportProgress(0)

    try {
      const transactionsToImport = csvParsedData.map((tx) => ({
        type: tx.type || 'expense',
        description: tx.description || 'Imported transaction',
        amount: tx.amount || 0,
        category: tx.category || 'Other',
        date: tx.date || new Date().toISOString().split('T')[0],
      }))

      const result = await batchAddTransactions(
        user.id,
        transactionsToImport,
        (current, total) => {
          const progress = Math.round((current / total) * 100)
          setCsvImportProgress(progress)
        }
      )

      setCsvImportStatus(`Successfully imported ${result.success} transactions${result.errors > 0 ? ` (${result.errors} errors)` : ''}`)
      setCsvImportProgress(100)
      
      // Reload all transactions for summary calculations
      await loadAllTransactionsForSummary()
      
      // Reset after 3 seconds
      setTimeout(() => {
        setShowCsvMapping(false)
        setCsvFile(null)
        setCsvColumnMapping(null)
        setCsvHeaders([])
        setCsvParsedData([])
        setCsvImportStatus('')
        setCsvImportProgress(0)
      }, 3000)
    } catch (error: any) {
      setCsvImportStatus(`Error importing: ${error.message}`)
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
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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

                {/* Dashboard */}
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
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {monthlySummary.startDate.toLocaleDateString()} - {monthlySummary.endDate.toLocaleDateString()}
                            </div>
                          )}
                          </div>
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
                            {formatCurrency(summary.balance)}
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
                            {formatCurrency(summary.income)}
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
                            {formatCurrency(summary.expenses)}
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
                            Category
                          </label>
                          <select
                            id="category"
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select category</option>
                            {availableCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
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
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Upload a CSV file and select which columns to import
                        </p>
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
                        <button
                          type="button"
                          onClick={handleDeleteAll}
                          disabled={transactions.length === 0 || isSubmitting}
                          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete All
                        </button>
                      </div>

                      {/* Date Range Filter */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range:</label>
                        <div className="flex gap-2 flex-wrap mb-3">
                          {(['month', 'today', 'week', 'year', 'all'] as const).map((range) => (
                            <button
                              key={range}
                              type="button"
                              onClick={() => {
                                setDateRange(range)
                                setShowCustomDateRange(false)
                              }}
                              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                dateRange === range && !showCustomDateRange
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md'
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
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
                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                              dateRange === 'custom' && showCustomDateRange
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                            }`}
                          >
                            Custom
                          </button>
                        </div>
                        {/* Quick Filter Presets */}
                        <div className="flex gap-2 flex-wrap mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date()
                              const last7Days = new Date(today)
                              last7Days.setDate(last7Days.getDate() - 7)
                              setCustomDateFrom(last7Days.toISOString().split('T')[0])
                              setCustomDateTo(today.toISOString().split('T')[0])
                              setDateRange('custom')
                              setShowCustomDateRange(true)
                            }}
                            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                          >
                            Last 7 Days
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date()
                              const last30Days = new Date(today)
                              last30Days.setDate(last30Days.getDate() - 30)
                              setCustomDateFrom(last30Days.toISOString().split('T')[0])
                              setCustomDateTo(today.toISOString().split('T')[0])
                              setDateRange('custom')
                              setShowCustomDateRange(true)
                            }}
                            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                          >
                            Last 30 Days
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date()
                              const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                              const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
                              setCustomDateFrom(lastMonth.toISOString().split('T')[0])
                              setCustomDateTo(lastMonthEnd.toISOString().split('T')[0])
                              setDateRange('custom')
                              setShowCustomDateRange(true)
                            }}
                            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                          >
                            Last Month
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date()
                              const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                              setCustomDateFrom(thisMonth.toISOString().split('T')[0])
                              setCustomDateTo(today.toISOString().split('T')[0])
                              setDateRange('custom')
                              setShowCustomDateRange(true)
                            }}
                            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                          >
                            This Month
                          </button>
                        </div>
                        {showCustomDateRange && (
                          <div className="flex gap-2 items-end flex-wrap p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                              <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">From:</label>
                              <input
                                type="date"
                                value={customDateFrom}
                                onChange={(e) => setCustomDateFrom(e.target.value)}
                                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">To:</label>
                              <input
                                type="date"
                                value={customDateTo}
                                onChange={(e) => setCustomDateTo(e.target.value)}
                                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all"
                              >
                                Apply
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCustomDateRange(false)
                                  setDateRange('month')
                                }}
                                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                          <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-2 gap-4 mb-4">
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
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
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
                      <div className="space-y-0 max-h-[600px] overflow-y-auto">
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
                          filteredTransactions.map((tx, index) => (
                            <div
                              key={tx.id}
                              className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                index === filteredTransactions.length - 1 ? 'border-b-0' : ''
                              }`}
                            >
                              <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center gap-3 mb-1.5">
                                  <span className="font-semibold text-gray-900 dark:text-white truncate text-base">
                                    {tx.description || '—'}
                                  </span>
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded-md whitespace-nowrap">
                                    {tx.category || 'Uncategorized'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDisplayDate(tx.date)}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                {(() => {
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
                                  
                                  return (
                                    <span
                                      className={`text-lg font-bold font-mono tabular-nums ${
                                        isIncome
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-red-600 dark:text-red-400'
                                      }`}
                                    >
                                      {formatCurrency(displayAmount)}
                                    </span>
                                  )
                                })()}
                                <button
                                  type="button"
                                  onClick={() => handleEdit(tx as FinanceTransaction & { id: string })}
                                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(tx.id!)}
                                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
