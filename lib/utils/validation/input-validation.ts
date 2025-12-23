/**
 * Input Validation and Sanitization Utilities
 */

import { errorResponse } from '../api/api-helpers'
import type { ApiErrorResponse } from '@/types/api'
import { NextResponse } from 'next/server'

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export function sanitizeString(input: unknown, maxLength?: number): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Remove potentially dangerous characters
  let sanitized = input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

/**
 * Validate and sanitize email address
 */
export function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string') {
    return null
  }

  const sanitized = sanitizeString(email, 254) // RFC 5321 max email length
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(sanitized)) {
    return null
  }

  return sanitized
}

/**
 * Validate and sanitize user ID format
 * Returns the sanitized userId if valid, null otherwise
 */
export function validateUserIdInput(userId: unknown): string | null {
  if (typeof userId !== 'string') {
    return null
  }

  // Firebase UIDs are typically 28 characters, alphanumeric
  // Allow reasonable length (20-128 chars) for flexibility
  const sanitized = sanitizeString(userId, 128)
  
  if (sanitized.length < 20 || sanitized.length > 128) {
    return null
  }

  // Only allow alphanumeric, dashes, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    return null
  }
  
  return sanitized
}

/**
 * @deprecated Use validateUserIdInput instead
 * Kept for backward compatibility
 */
export function validateUserId(userId: unknown): string | null {
  return validateUserIdInput(userId)
}

/**
 * Validate numeric input
 */
export function validateNumber(
  input: unknown,
  options?: {
    min?: number
    max?: number
    integer?: boolean
  }
): number | null {
  if (typeof input === 'number') {
    if (options?.integer && !Number.isInteger(input)) {
      return null
    }
    if (options?.min !== undefined && input < options.min) {
      return null
    }
    if (options?.max !== undefined && input > options.max) {
      return null
    }
    return input
  }

  if (typeof input === 'string') {
    const num = options?.integer ? parseInt(input, 10) : parseFloat(input)
    if (isNaN(num)) {
      return null
    }
    if (options?.min !== undefined && num < options.min) {
      return null
    }
    if (options?.max !== undefined && num > options.max) {
      return null
    }
    return num
  }

  return null
}

/**
 * Validate date string (YYYY-MM-DD format)
 */
export function validateDateString(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null
  }

  const sanitized = sanitizeString(input, 10)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/

  if (!dateRegex.test(sanitized)) {
    return null
  }

  const date = new Date(sanitized)
  if (isNaN(date.getTime())) {
    return null
  }

  return sanitized
}

/**
 * Validate that a userId matches the authenticated user
 * Prevents users from accessing other users' data
 */
export function validateUserOwnership(
  requestedUserId: string | null,
  authenticatedUserId: string
): NextResponse<ApiErrorResponse> | null {
  if (!requestedUserId) {
    return errorResponse('User ID is required', 400, undefined, 'VALIDATION_ERROR')
  }

  if (requestedUserId !== authenticatedUserId) {
    return errorResponse(
      'Forbidden',
      403,
      'You can only access your own data',
      'FORBIDDEN'
    )
  }

  return null
}

/**
 * Validate object structure
 */
export function validateObject<T extends Record<string, unknown>>(
  input: unknown,
  schema: {
    [K in keyof T]: (value: unknown) => T[K] | null
  }
): T | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return null
  }

  const result = {} as T

  for (const key in schema) {
    const value = (input as Record<string, unknown>)[key]
    const validated = schema[key](value)
    
    if (validated === null) {
      return null
    }
    
    result[key] = validated
  }

  return result
}

