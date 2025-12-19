'use client'

import { useEffect, useMemo, useState } from 'react'
import { useFirestoreStore } from '@/store/useFirestoreStore'
export const dynamic = 'force-dynamic'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Wallet } from 'lucide-react'
import { subscribeToTransactions } from '@/lib/financeFirestore'
import type { FinanceTransaction } from '@/types/finance'

export default function FinancePage() {
  const { user } = useFirestoreStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

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

  const summary = useMemo(() => {
    if (!transactions.length) {
      return { income: 0, expenses: 0, net: 0 }
    }

    let income = 0
    let expenses = 0

    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0
      const type = (tx.type || '').toLowerCase()

      if (type === 'income') {
        income += amount
      } else if (type === 'expense') {
        expenses += amount
      } else {
        if (amount < 0) {
          expenses += Math.abs(amount)
        } else {
          income += amount
        }
      }
    }

    return {
      income,
      expenses,
      net: income - expenses,
    }
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance Tracker</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Track your income, expenses, and see a quick overview of your cashflow.
                    </p>
                  </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Income
                    </p>
                    <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(summary.income)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Expenses
                    </p>
                    <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(summary.expenses)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Net
                    </p>
                    <p
                      className={`text-xl font-semibold ${
                        summary.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(summary.net)}
                    </p>
                  </div>
                </div>

                {/* Transactions table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent transactions</h2>
                    {isLoading && <span className="text-xs text-gray-500 dark:text-gray-400">Loading…</span>}
                  </div>

                  {error && (
                    <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400 border-b border-gray-200 dark:border-gray-700">
                      {error}
                    </div>
                  )}

                  {transactions.length === 0 && !isLoading ? (
                    <div className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No finance transactions yet. Once you start adding data (or we wire up import), they will appear
                      here.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-300">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">Date</th>
                            <th className="px-4 py-2 text-left font-medium">Description</th>
                            <th className="px-4 py-2 text-left font-medium">Category</th>
                            <th className="px-4 py-2 text-right font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                              <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-200">
                                {formatDate(tx.date)}
                              </td>
                              <td className="px-4 py-2 text-gray-800 dark:text-gray-100">
                                {tx.description || <span className="text-gray-400">—</span>}
                              </td>
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                                {tx.category || <span className="text-gray-400">Uncategorized</span>}
                              </td>
                              <td
                                className={`px-4 py-2 text-right font-medium ${
                                  (tx.type || '').toLowerCase() === 'income' || (Number(tx.amount) || 0) > 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {formatCurrency(Number(tx.amount) || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}


