/**
 * Transaction List Component
 * Memoized component for displaying transactions
 */

import { memo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { formatCurrency, formatDisplayDate } from '@/lib/utils'

interface TransactionListProps {
  transactions: FinanceTransaction[]
  onEdit: (transaction: FinanceTransaction) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

function TransactionListComponent({
  transactions,
  onEdit,
  onDelete,
  isLoading = false,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No transactions found</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const amount = Number(tx.amount) || 0
        const isExpense = (tx.type || '').toLowerCase() === 'expense' || amount < 0
        const absAmount = Math.abs(amount)

        return (
          <div
            key={tx.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {tx.description || 'No description'}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      isExpense
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    }`}
                  >
                    {tx.type || (isExpense ? 'expense' : 'income')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>{formatDisplayDate(tx.date)}</span>
                  {tx.category && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {tx.category}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-lg font-bold ${
                    isExpense
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {isExpense ? '-' : '+'}
                  {formatCurrency(absAmount)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(tx)}
                    className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(tx.id!)}
                    className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
export const TransactionList = memo(TransactionListComponent)

