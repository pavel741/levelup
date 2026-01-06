'use client'

import { useState, useEffect, useMemo } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { subscribeToRecurringTransactions, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction } from '@/lib/financeApi'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Bell, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Calendar, Clock, X, ArrowLeft } from 'lucide-react'
import type { FinanceRecurringTransaction } from '@/types/finance'
import { formatCurrency, parseTransactionDate } from '@/lib/utils'
import { format, addDays, differenceInDays, isPast, isToday } from 'date-fns'
import { useRouter } from 'next/navigation'

export default function BillsPage() {
  const { user } = useFirestoreStore()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [bills, setBills] = useState<FinanceRecurringTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingBill, setEditingBill] = useState<FinanceRecurringTransaction | null>(null)
  const [payingBill, setPayingBill] = useState<FinanceRecurringTransaction | null>(null)
  
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    category: '',
    description: '',
    interval: 'monthly',
    dueDate: '',
    reminderDaysBefore: '3',
  })

  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToRecurringTransactions(user.id, (billsList) => {
      setBills(billsList)
      setIsLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [user?.id])

  // Categorize bills by status
  const categorizedBills = useMemo(() => {
    const now = new Date()
    const overdue: FinanceRecurringTransaction[] = []
    const dueSoon: FinanceRecurringTransaction[] = []
    const upcoming: FinanceRecurringTransaction[] = []
    const paid: FinanceRecurringTransaction[] = []

    bills.forEach((bill) => {
      const dueDate = bill.dueDate 
        ? parseTransactionDate(bill.dueDate)
        : parseTransactionDate(bill.nextDate || new Date())
      
      if (bill.isPaid) {
        paid.push(bill)
      } else if (isPast(dueDate) && !isToday(dueDate)) {
        overdue.push(bill)
      } else {
        const daysUntilDue = differenceInDays(dueDate, now)
        const reminderDays = bill.reminderDaysBefore || 3
        if (daysUntilDue <= reminderDays && daysUntilDue >= 0) {
          dueSoon.push(bill)
        } else {
          upcoming.push(bill)
        }
      }
    })

    return { overdue, dueSoon, upcoming, paid }
  }, [bills])

  const handleAddBill = async () => {
    if (!newBill.name.trim() || !newBill.amount || !user?.id) return

    try {
      const billId = await addRecurringTransaction(user.id, {
        name: newBill.name.trim(),
        amount: parseFloat(newBill.amount),
        category: newBill.category || undefined,
        description: newBill.description || undefined,
        interval: newBill.interval,
        dueDate: newBill.dueDate ? parseTransactionDate(newBill.dueDate) : undefined,
        nextDate: newBill.dueDate ? parseTransactionDate(newBill.dueDate) : new Date(),
        reminderDaysBefore: parseInt(newBill.reminderDaysBefore) || 3,
        isPaid: false,
        paymentHistory: [],
      })

      // Optimistically add the bill to the list
      const newBillData: FinanceRecurringTransaction = {
        id: billId,
        name: newBill.name.trim(),
        amount: parseFloat(newBill.amount),
        category: newBill.category || undefined,
        description: newBill.description || undefined,
        interval: newBill.interval,
        dueDate: newBill.dueDate ? parseTransactionDate(newBill.dueDate) : undefined,
        nextDate: newBill.dueDate ? parseTransactionDate(newBill.dueDate) : new Date(),
        reminderDaysBefore: parseInt(newBill.reminderDaysBefore) || 3,
        isPaid: false,
        paymentHistory: [],
      }
      setBills(prev => [...prev, newBillData])

      // Manually refetch to ensure we have the latest data
      const { getRecurringTransactions } = await import('@/lib/financeApi')
      getRecurringTransactions(user.id).then(updatedBills => {
        setBills(updatedBills)
      }).catch(err => {
        console.error('Error refetching bills:', err)
      })

      setShowAddModal(false)
      setNewBill({
        name: '',
        amount: '',
        category: '',
        description: '',
        interval: 'monthly',
        dueDate: '',
        reminderDaysBefore: '3',
      })
    } catch (error) {
      console.error('Failed to add bill:', error)
    }
  }

  const handleMarkPaid = async () => {
    if (!payingBill || !user?.id) return

    const amount = parseFloat(paymentAmount) || payingBill.amount
    const paymentDate = new Date()

    try {
      const paymentHistory = [
        ...(payingBill.paymentHistory || []),
        {
          date: paymentDate,
          amount,
          notes: paymentNotes.trim() || undefined,
        },
      ]

      // Calculate next due date based on interval
      let nextDueDate = parseTransactionDate(payingBill.dueDate || payingBill.nextDate || paymentDate)
      if (payingBill.interval === 'monthly') {
        nextDueDate = addDays(nextDueDate, 30)
      } else if (payingBill.interval === 'weekly') {
        nextDueDate = addDays(nextDueDate, 7)
      } else if (payingBill.interval === 'yearly') {
        nextDueDate = addDays(nextDueDate, 365)
      }

      // Optimistically update the local state immediately
      setBills(prevBills => 
        prevBills.map(bill => 
          bill.id === payingBill.id
            ? {
                ...bill,
                isPaid: true,
                lastPaidDate: paymentDate,
                paymentHistory,
                dueDate: nextDueDate,
                nextDate: nextDueDate,
              }
            : bill
        )
      )

      await updateRecurringTransaction(user.id, payingBill.id, {
        isPaid: true,
        lastPaidDate: paymentDate,
        paymentHistory,
        dueDate: nextDueDate,
        nextDate: nextDueDate,
      })

      setShowPaymentModal(false)
      setPayingBill(null)
      setPaymentAmount('')
      setPaymentNotes('')
    } catch (error) {
      console.error('Failed to mark bill as paid:', error)
      // Revert optimistic update on error
      setBills(prevBills => 
        prevBills.map(bill => 
          bill.id === payingBill.id ? payingBill : bill
        )
      )
    }
  }

  const handleDeleteBill = async (billId: string) => {
    if (!user?.id || !confirm('Are you sure you want to delete this bill?')) return

    try {
      await deleteRecurringTransaction(user.id, billId)
    } catch (error) {
      console.error('Failed to delete bill:', error)
    }
  }

  const getBillStatus = (bill: FinanceRecurringTransaction): { label: string; color: string; icon: any } => {
    if (bill.isPaid) {
      return { label: 'Paid', color: 'text-green-600 dark:text-green-400', icon: CheckCircle2 }
    }

    const dueDate = bill.dueDate 
      ? parseTransactionDate(bill.dueDate)
      : parseTransactionDate(bill.nextDate || new Date())
    
    const daysUntilDue = differenceInDays(dueDate, new Date())
    
    if (daysUntilDue < 0) {
      return { label: 'Overdue', color: 'text-red-600 dark:text-red-400', icon: AlertCircle }
    } else if (daysUntilDue <= (bill.reminderDaysBefore || 3)) {
      return { label: 'Due Soon', color: 'text-orange-600 dark:text-orange-400', icon: Clock }
    } else {
      return { label: 'Upcoming', color: 'text-blue-600 dark:text-blue-400', icon: Calendar }
    }
  }

  const BillCard = ({ bill }: { bill: FinanceRecurringTransaction }) => {
    const status = getBillStatus(bill)
    const StatusIcon = status.icon
    const dueDate = bill.dueDate 
      ? parseTransactionDate(bill.dueDate)
      : parseTransactionDate(bill.nextDate || new Date())
    const daysUntilDue = differenceInDays(dueDate, new Date())

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {bill.name || 'Untitled Bill'}
              </h3>
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
            </div>
            {bill.category && (
              <span className="text-sm text-gray-600 dark:text-gray-400">{bill.category}</span>
            )}
            {bill.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{bill.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {!bill.isPaid && (
              <button
                onClick={() => {
                  setPayingBill(bill)
                  setPaymentAmount(bill.amount.toString())
                  setShowPaymentModal(true)
                }}
                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Mark as paid"
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => {
                setEditingBill(bill)
                setShowEditModal(true)
              }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteBill(bill.id)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Amount:</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(bill.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Due Date:
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {format(dueDate, 'MMM d, yyyy')}
            </span>
          </div>
          {!bill.isPaid && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Days until due:</span>
              <span className={`font-semibold ${daysUntilDue < 0 ? 'text-red-600 dark:text-red-400' : daysUntilDue <= 3 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
              </span>
            </div>
          )}
          {bill.isPaid && bill.lastPaidDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last paid:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {format(parseTransactionDate(bill.lastPaidDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          {bill.paymentHistory && bill.paymentHistory.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Payment History:</div>
              <div className="space-y-1">
                {bill.paymentHistory.slice(-3).reverse().map((payment: any, idx: number) => (
                  <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                    {format(payment.date instanceof Date ? payment.date : new Date(payment.date), 'MMM d, yyyy')}: {formatCurrency(payment.amount)}
                    {payment.notes && ` - ${payment.notes}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                  <button
                    onClick={() => router.back()}
                    className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                  </button>
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Bell className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        Bill Reminders
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400">
                        Track recurring bills and never miss a payment
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Bill
                    </button>
                  </div>
                </div>

                {/* Overdue Bills */}
                {categorizedBills.overdue.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-6 h-6" />
                      Overdue ({categorizedBills.overdue.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorizedBills.overdue.map((bill) => (
                        <BillCard key={bill.id} bill={bill} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Due Soon */}
                {categorizedBills.dueSoon.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                      <Clock className="w-6 h-6" />
                      Due Soon ({categorizedBills.dueSoon.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorizedBills.dueSoon.map((bill) => (
                        <BillCard key={bill.id} bill={bill} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Bills */}
                {categorizedBills.upcoming.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                      <Calendar className="w-6 h-6" />
                      Upcoming ({categorizedBills.upcoming.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorizedBills.upcoming.map((bill) => (
                        <BillCard key={bill.id} bill={bill} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Paid Bills */}
                {categorizedBills.paid.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6" />
                      Paid ({categorizedBills.paid.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorizedBills.paid.map((bill) => (
                        <BillCard key={bill.id} bill={bill} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && bills.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                    <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No Bills Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Add your recurring bills to track due dates and never miss a payment
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                      Add Bill
                    </button>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>

        {/* Add Bill Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Bill</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bill Name
                  </label>
                  <input
                    type="text"
                    value={newBill.name}
                    onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                    placeholder="e.g., Rent, Internet, Phone"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={newBill.amount}
                      onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Interval
                    </label>
                    <select
                      value={newBill.interval}
                      onChange={(e) => setNewBill({ ...newBill, interval: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newBill.dueDate}
                    onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reminder Days Before
                  </label>
                  <input
                    type="number"
                    value={newBill.reminderDaysBefore}
                    onChange={(e) => setNewBill({ ...newBill, reminderDaysBefore: e.target.value })}
                    min="1"
                    max="30"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category (Optional)
                  </label>
                  <input
                    type="text"
                    value={newBill.category}
                    onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}
                    placeholder="e.g., Utilities, Rent"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newBill.description}
                    onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddBill}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Add Bill
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && payingBill && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Mark as Paid</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPayingBill(null)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bill: {payingBill.name}
                  </label>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Due: {format(parseTransactionDate(payingBill.dueDate || payingBill.nextDate || new Date()), 'MMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={payingBill.amount.toString()}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={2}
                    placeholder="Payment method, reference number, etc."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleMarkPaid}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Mark as Paid
                  </button>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false)
                      setPayingBill(null)
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Bill Modal - Similar to Add but with editingBill state */}
        {showEditModal && editingBill && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Bill</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingBill(null)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bill Name
                  </label>
                  <input
                    type="text"
                    value={editingBill.name || ''}
                    onChange={(e) => setEditingBill({ ...editingBill, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={editingBill.amount}
                      onChange={(e) => setEditingBill({ ...editingBill, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Interval
                    </label>
                    <select
                      value={editingBill.interval || 'monthly'}
                      onChange={(e) => setEditingBill({ ...editingBill, interval: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editingBill.dueDate ? format(parseTransactionDate(editingBill.dueDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditingBill({ ...editingBill, dueDate: e.target.value ? new Date(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reminder Days Before
                  </label>
                  <input
                    type="number"
                    value={editingBill.reminderDaysBefore || 3}
                    onChange={(e) => setEditingBill({ ...editingBill, reminderDaysBefore: parseInt(e.target.value) || 3 })}
                    min="1"
                    max="30"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!user?.id || !editingBill) return
                      try {
                        await updateRecurringTransaction(user.id, editingBill.id, editingBill)
                        setShowEditModal(false)
                        setEditingBill(null)
                      } catch (error) {
                        console.error('Failed to update bill:', error)
                      }
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingBill(null)
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
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

