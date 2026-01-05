/**
 * Common API route helper functions
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiErrorResponse, ApiSuccessResponse, TypedApiError, ApiErrorCode } from '@/types/api'
import { authenticateRequest } from '../auth/auth-middleware'
import { validateUserOwnership } from '../validation/input-validation'

/**
 * Extract userId from request (query params or body)
 * @deprecated Use getSecureUserIdFromRequest instead for proper authentication
 * This method is insecure as it only checks query params which can be easily spoofed
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  const { searchParams } = new URL(request.url)
  return searchParams.get('userId')
}

/**
 * Securely extract and validate userId from authenticated request
 * Validates Firebase Auth token and ensures user can only access their own data
 */
export async function getSecureUserIdFromRequest(
  request: NextRequest,
  options?: {
    allowQueryParam?: boolean // Allow fallback to query param for backward compatibility
    validateOwnership?: boolean // Validate that requested userId matches authenticated user
  }
): Promise<{ userId: string } | { error: NextResponse<ApiErrorResponse> }> {
  // Try to authenticate via token first
  const authResult = await authenticateRequest(request)
  
  if (authResult.success) {
    const authenticatedUserId = authResult.user.userId
    
    // If validateOwnership is enabled, check query param matches authenticated user
    if (options?.validateOwnership) {
      const queryUserId = getUserIdFromRequest(request)
      if (queryUserId) {
        const ownershipError = validateUserOwnership(queryUserId, authenticatedUserId)
        if (ownershipError) {
          return { error: ownershipError }
        }
      }
    }
    
    return { userId: authenticatedUserId }
  }
  
  // Fallback to query param if allowed (for backward compatibility during migration)
  // NOTE: This fallback should be removed once all clients are migrated to token-based auth
  if (options?.allowQueryParam) {
    const queryUserId = getUserIdFromRequest(request)
    if (queryUserId) {
      // Only warn in development to reduce log noise in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Using insecure userId from query params. Migrate to token-based auth.')
      }
      return { userId: queryUserId }
    }
  }
  
  return { error: authResult.error }
}

/**
 * Standard error response helper
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: string,
  code?: ApiErrorCode | string
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = { error: message }
  if (details) {
    response.details = details
  }
  if (code) {
    response.code = code
  }
  return NextResponse.json(response, { status })
}

/**
 * Standard success response helper
 */
export function successResponse<T = unknown>(data?: T): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = data !== undefined ? { data } : { success: true }
  return NextResponse.json(response)
}

/**
 * Validate userId and return error response if invalid
 * @deprecated Use validateUserIdInput from validation/input-validation for input validation
 * This function is kept for API route validation that returns error responses
 */
export function validateUserIdForApi(userId: string | null, status: number = 400): NextResponse<ApiErrorResponse> | null {
  if (!userId) {
    return errorResponse('User ID is required', status, undefined, 'VALIDATION_ERROR')
  }
  return null
}

/**
 * @deprecated Use validateUserIdForApi instead
 * Kept for backward compatibility
 */
export function validateUserId(userId: string | null, status: number = 400): NextResponse<ApiErrorResponse> | null {
  return validateUserIdForApi(userId, status)
}

/**
 * Handle API route errors consistently
 */
export function handleApiError(error: unknown, context: string): NextResponse<ApiErrorResponse> {
  // Use logger if available, fallback to console.error
  import('../logging/logger').then(({ logger }) => {
    logger.error(`Error in ${context}`, { component: 'API', action: context }, error instanceof Error ? error : undefined)
  }).catch(() => {
    // Fallback to console if logger fails to load
    console.error(`Error in ${context}:`, error)
  })
  
  // Type guard for Error objects
  const isError = (err: unknown): err is Error => {
    return err instanceof Error
  }
  
  // Type guard for TypedApiError
  const isTypedError = (err: unknown): err is TypedApiError => {
    return isError(err) && 'code' in err
  }
  
  // Handle specific error types
  if (isError(error)) {
    const message = error.message || 'Internal server error'
    
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      return errorResponse(
        'Database connection timeout',
        503,
        'Please check your network connection and try again.',
        'TIMEOUT'
      )
    }
    
    if (isTypedError(error) && error.statusCode) {
      return errorResponse(
        message,
        error.statusCode,
        undefined,
        error.code
      )
    }
    
    return errorResponse(message, 500, undefined, 'INTERNAL_ERROR')
  }
  
  // Fallback for unknown error types
  return errorResponse(
    'Internal server error',
    500,
    'An unexpected error occurred',
    'INTERNAL_ERROR'
  )
}

