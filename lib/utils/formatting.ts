/**
 * Common formatting utilities used across the application
 */

/**
 * Format currency amount in EUR (Estonian locale)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Format date to YYYY-MM-DD string
 * Handles Date objects, Firestore Timestamps, and strings
 */
export function formatDate(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  
  try {
    const d = (value.toDate ? value.toDate() : value) as Date
    return d.toISOString().split('T')[0]
  } catch {
    return String(value)
  }
}

/**
 * Format date for display (Estonian locale: DD.MM.YYYY)
 */
export function formatDisplayDate(value: any): string {
  const dateStr = formatDate(value)
  if (!dateStr) return ''
  
  const d = new Date(dateStr)
  return d.toLocaleDateString('et-EE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
}

/**
 * Format date and time for display
 */
export function formatDateTime(value: any): string {
  const dateStr = formatDate(value)
  if (!dateStr) return ''
  
  const d = new Date(dateStr)
  return d.toLocaleString('et-EE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

