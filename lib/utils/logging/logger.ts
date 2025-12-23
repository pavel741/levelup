/**
 * Centralized Logging Service
 * Provides structured logging with environment-based log levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4, // Disable all logging
}

export interface LogContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  timestamp: Date
  error?: Error
  data?: unknown
}

class Logger {
  private logLevel: LogLevel
  private isDevelopment: boolean
  private logs: LogEntry[] = []
  private maxLogs = 100 // Keep last 100 logs in memory

  constructor() {
    // Determine environment
    this.isDevelopment =
      typeof window !== 'undefined'
        ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        : process.env.NODE_ENV === 'development'

    // Set log level based on environment
    const envLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.LOG_LEVEL
    if (envLogLevel) {
      this.logLevel = this.parseLogLevel(envLogLevel)
    } else {
      // Default: DEBUG in development, WARN in production
      this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN
    }
  }

  private parseLogLevel(level: string): LogLevel {
    const upper = level.toUpperCase()
    switch (upper) {
      case 'DEBUG':
        return LogLevel.DEBUG
      case 'INFO':
        return LogLevel.INFO
      case 'WARN':
        return LogLevel.WARN
      case 'ERROR':
        return LogLevel.ERROR
      case 'NONE':
        return LogLevel.NONE
      default:
        return this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel && this.logLevel !== LogLevel.NONE
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error, data?: unknown): string {
    const levelName = LogLevel[level]
    const contextStr = context ? ` [${JSON.stringify(context)}]` : ''
    const errorStr = error ? ` Error: ${error.message}` : ''
    const dataStr = data ? ` Data: ${JSON.stringify(data)}` : ''
    return `[${levelName}]${contextStr} ${message}${errorStr}${dataStr}`
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      error,
      data,
    }

    // Store in memory (limited size)
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Format and output
    const formattedMessage = this.formatMessage(level, message, context, error, data)

    // Use appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage)
        break
      case LogLevel.INFO:
        console.info(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.ERROR:
        console.error(formattedMessage, error || '')
        break
    }

    // In production, you might want to send errors to a logging service
    if (level === LogLevel.ERROR && !this.isDevelopment) {
      this.sendToLoggingService(entry).catch(() => {
        // Silently fail if logging service is unavailable
      })
    }
  }

  /**
   * Send error logs to external logging service (e.g., Sentry, LogRocket)
   * Override this method to integrate with your logging service
   */
  private async sendToLoggingService(_entry: LogEntry): Promise<void> {
    // Placeholder for external logging service integration
    // Example: await fetch('/api/logs', { method: 'POST', body: JSON.stringify(_entry) })
  }

  /**
   * Debug level logging (only in development)
   */
  debug(message: string, context?: LogContext, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, undefined, data)
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext, data?: unknown): void {
    this.log(LogLevel.INFO, message, context, undefined, data)
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext, error?: Error, data?: unknown): void {
    this.log(LogLevel.WARN, message, context, error, data)
  }

  /**
   * Error level logging
   */
  error(message: string, context?: LogContext, error?: Error, data?: unknown): void {
    this.log(LogLevel.ERROR, message, context, error, data)
  }

  /**
   * Get recent logs (useful for debugging)
   */
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logs
    if (level !== undefined) {
      filtered = filtered.filter((entry) => entry.level >= level)
    }
    if (limit !== undefined) {
      return filtered.slice(-limit)
    }
    return filtered
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Set log level dynamically
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel
  }
}

// Create singleton instance
export const logger = new Logger()

/**
 * Convenience functions for common logging patterns
 */

/**
 * Log API request/response
 */
export function logApiCall(
  method: string,
  endpoint: string,
  status?: number,
  duration?: number,
  error?: Error
): void {
  const context: LogContext = {
    component: 'API',
    action: method,
    endpoint,
    status,
    duration,
  }

  if (error) {
    logger.error(`API ${method} ${endpoint} failed`, context, error)
  } else {
    logger.debug(`API ${method} ${endpoint}`, context, { status, duration })
  }
}

/**
 * Log database operation
 */
export function logDbOperation(
  operation: string,
  collection: string,
  success: boolean,
  duration?: number,
  error?: Error
): void {
  const context: LogContext = {
    component: 'Database',
    action: operation,
    collection,
    duration,
  }

  if (error || !success) {
    logger.error(`DB ${operation} on ${collection} failed`, context, error)
  } else {
    logger.debug(`DB ${operation} on ${collection}`, context, { duration })
  }
}

/**
 * Log user action
 */
export function logUserAction(action: string, userId: string, data?: unknown): void {
  logger.info(`User action: ${action}`, { component: 'User', action, userId }, data)
}

/**
 * Log component lifecycle
 */
export function logComponentLifecycle(component: string, lifecycle: 'mount' | 'unmount' | 'update', props?: unknown): void {
  logger.debug(`Component ${lifecycle}: ${component}`, { component, action: lifecycle }, props)
}

