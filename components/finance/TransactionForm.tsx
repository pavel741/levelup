/**
 * Transaction Form Component
 * Memoized form component for adding/editing transactions
 */

import { memo, useCallback } from 'react'

interface TransactionFormProps {
  formType: 'income' | 'expense'
  formDescription: string
  formAmount: string
  formCategory: string
  formDate: string
  editingTransactionId: string | null
  availableCategories: string[]
  categorySuggestions: string[]
  isSubmitting: boolean
  onTypeChange: (type: 'income' | 'expense') => void
  onDescriptionChange: (description: string) => void
  onAmountChange: (amount: string) => void
  onCategoryChange: (category: string) => void
  onDateChange: (date: string) => void
  onCategorySuggestionClick: (category: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

function TransactionFormComponent({
  formType,
  formDescription,
  formAmount,
  formCategory,
  formDate,
  editingTransactionId,
  availableCategories,
  categorySuggestions,
  isSubmitting,
  onTypeChange,
  onDescriptionChange,
  onAmountChange,
  onCategoryChange,
  onDateChange,
  onCategorySuggestionClick,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onTypeChange(e.target.value as 'income' | 'expense')
    },
    [onTypeChange]
  )

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onDescriptionChange(e.target.value)
    },
    [onDescriptionChange]
  )

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onAmountChange(e.target.value)
    },
    [onAmountChange]
  )

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onCategoryChange(e.target.value)
    },
    [onCategoryChange]
  )

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onDateChange(e.target.value)
    },
    [onDateChange]
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        {editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
          </label>
          <select
            id="type"
            value={formType}
            onChange={handleTypeChange}
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
            onChange={handleDescriptionChange}
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
            onChange={handleAmountChange}
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
            onChange={handleCategoryChange}
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
                    onClick={() => onCategorySuggestionClick(cat)}
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
            onChange={handleDateChange}
            required
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : editingTransactionId ? 'Update' : 'Add'} Transaction
          </button>
          {editingTransactionId && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
export const TransactionForm = memo(TransactionFormComponent)

