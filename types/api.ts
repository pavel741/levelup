/**
 * API Response Type Definitions
 * Standardized types for all API responses
 */

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  error: string
  details?: string
  code?: string
}

/**
 * Standard API success response structure
 */
export interface ApiSuccessResponse<T = unknown> {
  data?: T
  success?: boolean
  [key: string]: unknown // Allow additional fields for flexibility
}

/**
 * Generic API response type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response: ApiResponse): response is ApiErrorResponse {
  return 'error' in response
}

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return !isErrorResponse(response)
}

/**
 * Extract data from API response with type safety
 */
export function extractApiData<T>(response: ApiResponse<T>): T | null {
  if (isSuccessResponse(response)) {
    return (response.data ?? response) as T
  }
  return null
}

/**
 * Common API error types
 */
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Typed error with code
 */
export interface TypedApiError extends Error {
  code?: ApiErrorCode | string
  statusCode?: number
}

