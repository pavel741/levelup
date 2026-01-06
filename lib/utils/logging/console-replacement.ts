/**
 * Console Replacement Utilities
 * Provides drop-in replacements for console.log/error/warn that use the logging service
 */

import { logger } from './logger'
import type { LogContext } from './logger'

/**
 * Drop-in replacement for console.log
 * Use this instead of console.log for better logging control
 */
export function log(...args: unknown[]): void {
  const message = args
    .map((arg) => {
      if (arg instanceof Error) {
        return arg.message
      }
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2)
      }
      return String(arg)
    })
    .join(' ')

  logger.debug(message)
}

/**
 * Drop-in replacement for console.error
 * Use this instead of console.error for better error logging
 */
export function logError(message: string, error?: Error, context?: LogContext, data?: unknown): void {
  logger.error(message, context, error, data)
}

/**
 * Drop-in replacement for console.warn
 * Use this instead of console.warn for better warning logging
 */
export function logWarn(message: string, context?: LogContext, error?: Error, data?: unknown): void {
  logger.warn(message, context, error, data)
}

/**
 * Drop-in replacement for console.info
 * Use this instead of console.info for better info logging
 */
export function logInfo(message: string, context?: LogContext, data?: unknown): void {
  logger.info(message, context, data)
}

