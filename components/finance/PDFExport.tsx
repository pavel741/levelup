'use client'

import { useState, useMemo } from 'react'
import type { FinanceTransaction } from '@/types/finance'
import { generatePDFReport, prepareMonthlyReportData } from '@/lib/pdfExport'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { FileDown, Loader2 } from 'lucide-react'

interface PDFExportProps {
  transactions: FinanceTransaction[]
  periodStart?: Date
  periodEnd?: Date
  periodLabel?: string
}

export default function PDFExport({ 
  transactions, 
  periodStart = startOfMonth(new Date()),
  periodEnd = endOfMonth(new Date()),
  periodLabel
}: PDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const reportData = useMemo(() => {
    return prepareMonthlyReportData(transactions, periodStart, periodEnd)
  }, [transactions, periodStart, periodEnd])

  const handleExportPDF = () => {
    setIsGenerating(true)
    try {
      generatePDFReport(reportData)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      setTimeout(() => setIsGenerating(false), 1000)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Export Monthly Report
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate a beautiful PDF report for {periodLabel || format(periodStart, 'MMMM yyyy')}
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={isGenerating || transactions.length === 0}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              Export PDF
            </>
          )}
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No transactions to export
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transactions</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {reportData.summary.transactionCount}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Income</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {new Intl.NumberFormat('et-EE', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(reportData.summary.totalIncome)}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Expenses</div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {new Intl.NumberFormat('et-EE', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(reportData.summary.totalExpenses)}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Balance</div>
            <div className={`text-lg font-bold ${
              reportData.summary.balance >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {new Intl.NumberFormat('et-EE', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(reportData.summary.balance)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

