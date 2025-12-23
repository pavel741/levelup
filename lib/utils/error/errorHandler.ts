/**
 * Centralized Error Handling Service
 * Provides consistent error handling across the application
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, unknown>
}

export interface HandledError {
  message: string
  severity: ErrorSeverity
  code?: string
  context?: ErrorContext
  originalError?: unknown
  timestamp: Date
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'An unexpected error occurred'
}

/**
 * Extract error code from unknown error type
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object') {
    if ('code' in error && typeof error.code === 'string') {
      return error.code
    }
    if ('name' in error && typeof error.name === 'string') {
      return error.name
    }
  }
  return undefined
}

/**
 * Determine error severity based on error type
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  const message = getErrorMessage(error).toLowerCase()
  const code = getErrorCode(error)?.toLowerCase()

  // Critical errors
  if (
    message.includes('auth') ||
    message.includes('permission') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    code === 'permission-denied' ||
    code === 'unauthenticated'
  ) {
    return ErrorSeverity.CRITICAL
  }

  // High severity errors
  if (
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('database') ||
    code === 'timeout' ||
    code === 'network-error'
  ) {
    return ErrorSeverity.HIGH
  }

  // Medium severity errors
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('missing') ||
    code === 'validation-error'
  ) {
    return ErrorSeverity.MEDIUM
  }

  // Default to low severity
  return ErrorSeverity.LOW
}

/**
 * Handle and format error for display/logging
 */
export function handleError(
  error: unknown,
  context?: ErrorContext
): HandledError {
  const handled: HandledError = {
    message: getErrorMessage(error),
    severity: getErrorSeverity(error),
    code: getErrorCode(error),
    context,
    originalError: error,
    timestamp: new Date(),
  }

  // Log using centralized logger (dynamic import to avoid circular dependencies)
  import('../logging/logger').then(({ logger }) => {
    const logLevel = handled.severity === ErrorSeverity.CRITICAL || handled.severity === ErrorSeverity.HIGH
      ? 'error' as const
      : 'warn' as const

    // Convert ErrorContext to LogContext (they're compatible)
    const logContext = handled.context ? {
      component: handled.context.component,
      action: handled.context.action,
      userId: handled.context.userId,
      metadata: handled.context.metadata,
    } : undefined

    logger[logLevel](`[${handled.severity.toUpperCase()}] ${handled.message}`, logContext, handled.originalError as Error | undefined, {
      code: handled.code,
    })
  }).catch(() => {
    // Fallback to console if logger fails to load
    const logMethod = handled.severity === ErrorSeverity.CRITICAL || handled.severity === ErrorSeverity.HIGH
      ? console.error
      : console.warn
    logMethod(`[${handled.severity.toUpperCase()}] ${handled.message}`, {
      code: handled.code,
      context: handled.context,
      error: handled.originalError,
    })
  })

  // Store critical/high errors in localStorage for ErrorDisplay component
  if (handled.severity === ErrorSeverity.CRITICAL || handled.severity === ErrorSeverity.HIGH) {
    try {
      localStorage.setItem('app_error', JSON.stringify({
        message: handled.message,
        code: handled.code,
        severity: handled.severity,
        context: handled.context,
        timestamp: handled.timestamp.toISOString(),
      }))
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  return handled
}

/**
 * Create a user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const message = getErrorMessage(error)

  // Provide user-friendly messages for common errors
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return 'The request took too long. Please check your connection and try again.'
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.'
  }

  if (message.includes('permission') || message.includes('unauthorized')) {
    return 'You don\'t have permission to perform this action. Please sign in again.'
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return 'Invalid input. Please check your data and try again.'
  }

  if (message.includes('database') || message.includes('mongodb') || message.includes('firestore')) {
    return 'Database error. Please try again in a moment.'
  }

  // Return original message if no specific mapping
  return message || 'Something went wrong. Please try again.'
}

