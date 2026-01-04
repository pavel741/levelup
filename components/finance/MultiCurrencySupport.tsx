'use client'

import { useState, useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { detectCurrency, convertCurrency, formatCurrencyWithSymbol, normalizeToBaseCurrency } from '@/lib/currencyConverter'
import { Globe, RefreshCw } from 'lucide-react'

interface MultiCurrencySupportProps {
  transactions: FinanceTransaction[]
  baseCurrency?: string
}

export default function MultiCurrencySupport({ 
  transactions, 
  baseCurrency = 'EUR' 
}: MultiCurrencySupportProps) {
  const [showDetails, setShowDetails] = useState(false)

  const currencyAnalysis = useMemo(() => {
    const currencyTotals: Record<string, { count: number; totalAmount: number; transactions: FinanceTransaction[] }> = {}
    
    transactions.forEach((tx) => {
      const currency = detectCurrency(tx)
      const amount = Math.abs(Number(tx.amount) || 0)
      
      if (!currencyTotals[currency]) {
        currencyTotals[currency] = { count: 0, totalAmount: 0, transactions: [] }
      }
      
      currencyTotals[currency].count += 1
      currencyTotals[currency].totalAmount += amount
      currencyTotals[currency].transactions.push(tx)
    })

    // Convert all to base currency
    const normalized = normalizeToBaseCurrency(transactions, baseCurrency)
    const totalInBaseCurrency = normalized.reduce((sum, tx) => sum + Math.abs(tx.convertedAmount || tx.amount), 0)

    return {
      currencyTotals: Object.entries(currencyTotals)
        .map(([currency, data]) => ({
          currency,
          ...data,
          convertedTotal: convertCurrency(data.totalAmount, currency, baseCurrency),
        }))
        .sort((a, b) => b.count - a.count),
      totalInBaseCurrency,
      hasMultipleCurrencies: Object.keys(currencyTotals).length > 1,
    }
  }, [transactions, baseCurrency])

  if (!currencyAnalysis.hasMultipleCurrencies) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Multi-Currency Support
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All transactions are in {baseCurrency}. Multi-currency transactions will be automatically detected and converted.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Multi-Currency Analysis
          </h2>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Transactions detected in {currencyAnalysis.currencyTotals.length} different currencies
      </p>

      {/* Currency Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
        {currencyAnalysis.currencyTotals.map(({ currency, count, totalAmount, convertedTotal }) => (
          <div
            key={currency}
            className={`p-4 rounded-lg border-2 ${
              currency === baseCurrency
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {currency === baseCurrency ? 'Base Currency' : 'Foreign Currency'}
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {currency}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              {formatCurrencyWithSymbol(totalAmount, currency)}
            </div>
            {currency !== baseCurrency && (
              <div className="text-xs text-gray-500 dark:text-gray-500">
                ≈ {formatCurrencyWithSymbol(convertedTotal, baseCurrency)}
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {count} transaction{count !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Total in Base Currency */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total (converted to {baseCurrency})
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrencyWithSymbol(currencyAnalysis.totalInBaseCurrency, baseCurrency)}
            </div>
          </div>
          <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {/* Detailed Transaction List */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Transactions by Currency
          </h3>
          <div className="space-y-4">
            {currencyAnalysis.currencyTotals.map(({ currency, transactions: txs }) => (
              <div key={currency} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {currency} ({txs.length} transactions)
                  </h4>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrencyWithSymbol(
                      txs.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0),
                      currency
                    )}
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {txs.slice(0, 10).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-gray-900 dark:text-white">
                          {tx.description || 'No description'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {typeof tx.date === 'string' ? tx.date : new Date(tx.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatCurrencyWithSymbol(Math.abs(Number(tx.amount) || 0), currency)}
                        </div>
                        {currency !== baseCurrency && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            ≈ {formatCurrencyWithSymbol(
                              convertCurrency(Math.abs(Number(tx.amount) || 0), currency, baseCurrency),
                              baseCurrency
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {txs.length > 10 && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
                      +{txs.length - 10} more transactions
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

