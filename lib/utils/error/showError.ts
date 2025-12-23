/**
 * Helper function to show errors via toast notifications
 * Replaces alert() calls with proper UI notifications
 */

import { toast } from '@/components/common/Toast'
import { handleError, getUserFriendlyMessage, type ErrorContext } from './errorHandler'

/**
 * Show an error using toast notification
 * This replaces alert() calls for better UX
 */
export function showError(
  error: unknown,
  context?: ErrorContext,
  options?: {
    duration?: number
    showUserMessage?: boolean
  }
): void {
  const handled = handleError(error, context)
  const message = options?.showUserMessage !== false
    ? getUserFriendlyMessage(error)
    : handled.message

  toast.error(message, options?.duration)
}

/**
 * Show a success message
 */
export function showSuccess(message: string, duration?: number): void {
  toast.success(message, duration)
}

/**
 * Show a warning message
 */
export function showWarning(message: string, duration?: number): void {
  toast.warning(message, duration)
}

/**
 * Show an info message
 */
export function showInfo(message: string, duration?: number): void {
  toast.info(message, duration)
}

