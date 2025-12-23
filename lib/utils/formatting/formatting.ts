/**
 * Common formatting utilities used across the application
 */

// Re-export date utilities from unified date-utils
export {
  formatDate,
  formatDisplayDate,
  formatDateTime,
  normalizeDate,
  parseTransactionDate,
} from './date-utils'

/**
 * Format currency amount in EUR (Estonian locale)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

