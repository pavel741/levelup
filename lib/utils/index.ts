/**
 * Centralized utility exports
 * Re-exports from organized subdirectories for backward compatibility
 */

// API utilities
export * from './api/api-client'
export * from './api/api-route-helpers'
// Export api-helpers with specific exports to avoid conflicts
export {
  getUserIdFromRequest,
  getSecureUserIdFromRequest,
  errorResponse,
  successResponse,
  validateUserIdForApi,
  validateUserId, // Keep for backward compatibility
  handleApiError,
} from './api/api-helpers'

// Auth utilities
export * from './auth/auth-middleware'

// Formatting utilities
export * from './formatting/formatting'
export * from './formatting/date-utils'

// Validation utilities
export {
  sanitizeString,
  validateEmail,
  validateUserIdInput,
  validateNumber,
  validateDateString,
  validateUserOwnership,
} from './validation/input-validation'
export * from './validation/request-validation'

// Error handling utilities
export * from './error/errorHandler'
export * from './error/showError'

// Logging utilities
export * from './logging/logger'
export * from './logging/console-replacement'

// Security utilities
export * from './security/rate-limit'

// General utilities
export * from './utils/data-conversion'
export * from './utils/debounce'
