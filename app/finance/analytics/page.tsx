'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { FinanceCategoryChart } from '@/components/FinanceCategoryChart'
import { subscribeToTransactions } from '@/lib/financeFirestore'
import type { FinanceTransaction } from '@/types/finance'
import { BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function FinanceAnalyticsPage() {
  const { user } = useFirestoreStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    setIsLoading(true)

    const unsubscribe = subscribeToTransactions(
      user.id,
      (txs) => {
        setTransactions(txs)
        setIsLoading(false)
      },
      { limitCount: 1000 }
    )

    return () => unsubscribe()
  }, [user?.id])

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
                      <BarChart3 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance Analytics</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      See where your money goes by category. More advanced charts coming next.
                    </p>
                  </div>
                  {isLoading && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Loading analytics…</span>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Spending by category
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Based on your expense transactions. Income and transfers are ignored here.
                    </p>
                    <FinanceCategoryChart transactions={transactions} />
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex items-center justify-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                      Additional analytics from your original budget app (month-over-month, year-over-year, trends,
                      heatmaps) can be added here next. For now, you get a live category breakdown powered by your
                      finance data.
                    </p>
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


