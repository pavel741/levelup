'use client'

import { useMemo, useState } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { detectDuplicates } from '@/lib/duplicateDetection'
import { AlertTriangle, X, CheckCircle } from 'lucide-react'
import { parseTransactionDate } from '@/lib/financeDateUtils'
import { format } from 'date-fns'

interface DuplicateDetectionProps {
  transactions: FinanceTransaction[]
}

export default function DuplicateDetection({ transactions }: DuplicateDetectionProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [similarityThreshold, setSimilarityThreshold] = useState(150)

  const detectionResult = useMemo(() => {
    return detectDuplicates(transactions, similarityThreshold)
  }, [transactions, similarityThreshold])

  const activeAlerts = detectionResult.alerts.filter(
    (alert) => !dismissedAlerts.has(alert.transaction.id)
  )

  if (activeAlerts.length === 0 && detectionResult.alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Duplicate Detection
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No duplicate transactions detected. Your transactions look clean! ✅
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Duplicate Detection
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 dark:text-gray-400">Sensitivity:</label>
          <input
            type="range"
            min="100"
            max="200"
            value={similarityThreshold}
            onChange={(e) => setSimilarityThreshold(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 w-12">
            {similarityThreshold}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Found {detectionResult.totalDuplicates} potential duplicate{detectionResult.totalDuplicates !== 1 ? 's' : ''} across {activeAlerts.length} transaction{activeAlerts.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activeAlerts.map((alert) => (
          <div
            key={alert.transaction.id}
            className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Potential Duplicate
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({Math.round(alert.similarityScore)}% similarity)
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {alert.reason}
                </p>
              </div>
              <button
                onClick={() => {
                  setDismissedAlerts((prev) => new Set(prev).add(alert.transaction.id))
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Transaction */}
            <div className="bg-white dark:bg-gray-900 rounded p-2 mb-2 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {alert.transaction.description || 'No description'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format(parseTransactionDate(alert.transaction.date), 'MMM d, yyyy')}
                    {alert.transaction.recipientName && ` • ${alert.transaction.recipientName}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('et-EE', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(Math.abs(Number(alert.transaction.amount) || 0))}
                  </div>
                  {alert.transaction.category && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {alert.transaction.category}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Similar Transactions */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Similar transactions ({alert.similarTransactions.length}):
              </div>
              {alert.similarTransactions.slice(0, 3).map((tx, idx) => (
                <div
                  key={tx.id}
                  className="bg-white/60 dark:bg-gray-900/60 rounded p-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {tx.description || 'No description'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500 ml-2">
                        {format(parseTransactionDate(tx.date), 'MMM d')}
                      </span>
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {new Intl.NumberFormat('et-EE', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(Math.abs(Number(tx.amount) || 0))}
                    </span>
                  </div>
                </div>
              ))}
              {alert.similarTransactions.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                  +{alert.similarTransactions.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

