'use client'

import { useState } from 'react'
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react'
import type { BillMatch } from '@/lib/billMatching'
import { formatCurrency, parseTransactionDate } from '@/lib/utils'
import { format } from 'date-fns'
import type { Timestamp } from 'firebase/firestore'

interface BillMatchingPreviewProps {
  matches: BillMatch[]
  onConfirm: (matches: BillMatch[]) => void
  onCancel: () => void
  autoMatchHighConfidence?: boolean
}

export default function BillMatchingPreview({
  matches,
  onConfirm,
  onCancel,
  autoMatchHighConfidence = true,
}: BillMatchingPreviewProps) {
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(
    new Set(
      matches
        .filter(m => autoMatchHighConfidence && m.confidence === 'high')
        .map(m => `${m.bill.id}-${m.transaction.id || JSON.stringify(m.transaction)}`)
    )
  )
  const [isProcessing, setIsProcessing] = useState(false)

  const highConfidenceMatches = matches.filter(m => m.confidence === 'high')
  const mediumConfidenceMatches = matches.filter(m => m.confidence === 'medium')
  const lowConfidenceMatches = matches.filter(m => m.confidence === 'low')

  const toggleMatch = (match: BillMatch) => {
    const key = `${match.bill.id}-${match.transaction.id || JSON.stringify(match.transaction)}`
    setSelectedMatches(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleConfirm = () => {
    const confirmedMatches = matches.filter(m => {
      const key = `${m.bill.id}-${m.transaction.id || JSON.stringify(m.transaction)}`
      return selectedMatches.has(key)
    })
    setIsProcessing(true)
    onConfirm(confirmedMatches)
  }

  const formatDate = (date: string | Date | Timestamp) => {
    try {
      const dateObj = parseTransactionDate(date)
      return format(dateObj, 'MMM d, yyyy')
    } catch {
      return 'Invalid date'
    }
  }

  const getMatchKey = (match: BillMatch) => {
    return `${match.bill.id}-${match.transaction.id || JSON.stringify(match.transaction)}`
  }

  const isSelected = (match: BillMatch) => {
    return selectedMatches.has(getMatchKey(match))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📋 Bill Matching Preview
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Found {matches.length} potential bill match{matches.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isProcessing}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* High Confidence Matches */}
          {highConfidenceMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="text-green-500" size={20} />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  High Confidence Matches ({highConfidenceMatches.length})
                </h3>
              </div>
              <div className="space-y-2">
                {highConfidenceMatches.map((match, idx) => (
                  <MatchItem
                    key={idx}
                    match={match}
                    isSelected={isSelected(match)}
                    onToggle={() => toggleMatch(match)}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Medium Confidence Matches */}
          {mediumConfidenceMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="text-yellow-500" size={20} />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Medium Confidence Matches ({mediumConfidenceMatches.length})
                </h3>
              </div>
              <div className="space-y-2">
                {mediumConfidenceMatches.map((match, idx) => (
                  <MatchItem
                    key={idx}
                    match={match}
                    isSelected={isSelected(match)}
                    onToggle={() => toggleMatch(match)}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Low Confidence Matches */}
          {lowConfidenceMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info className="text-blue-500" size={20} />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Low Confidence Matches ({lowConfidenceMatches.length})
                </h3>
              </div>
              <div className="space-y-2">
                {lowConfidenceMatches.map((match, idx) => (
                  <MatchItem
                    key={idx}
                    match={match}
                    isSelected={isSelected(match)}
                    onToggle={() => toggleMatch(match)}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            </div>
          )}

          {matches.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No bill matches found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedMatches.size} of {matches.length} match{matches.length !== 1 ? 'es' : ''} selected
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing || selectedMatches.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Processing...
                  </>
                ) : (
                  `Import ${selectedMatches.size} Match${selectedMatches.size !== 1 ? 'es' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MatchItemProps {
  match: BillMatch
  isSelected: boolean
  onToggle: () => void
  formatDate: (date: string | Date | Timestamp) => string
  formatCurrency: (amount: number) => string
}

function MatchItem({ match, isSelected, onToggle, formatDate, formatCurrency }: MatchItemProps) {
  const billAmount = Math.abs(match.bill.amount)
  const transactionAmount = Math.abs(match.transaction.amount)
  const amountDiff = Math.abs(billAmount - transactionAmount)
  const amountDiffPercent = billAmount > 0 ? (amountDiff / billAmount) * 100 : 0

  const transactionDate = parseTransactionDate(match.transaction.date)

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">
                {match.bill.name || match.bill.description || 'Unnamed Bill'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Transaction: {match.transaction.description || 'No description'}
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Score: {match.score}/100</span>
                <span>Date: {formatDate(transactionDate)}</span>
                {match.bill.dueDate && (
                  <span>
                    Due: {formatDate(match.bill.dueDate)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(transactionAmount)}
              </div>
              {amountDiffPercent > 5 && (
                <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Base: {formatCurrency(billAmount)}
                  <br />
                  ({amountDiffPercent > 0 ? '+' : ''}
                  {amountDiffPercent.toFixed(1)}%)
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {match.reasons.map((reason, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

