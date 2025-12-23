/**
 * Request Validation Schema System
 * Provides type-safe validation for API request bodies and query parameters
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiErrorResponse } from '@/types/api'
import { errorResponse } from '../api/api-helpers'
import { sanitizeString, validateEmail, validateUserIdInput, validateNumber, validateDateString } from './input-validation'

export type Validator<T> = (value: unknown) => T | null

export type ValidationSchema<T> = {
  [K in keyof T]: Validator<T[K]>
}

export type ValidationResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: NextResponse<ApiErrorResponse>
}

/**
 * Validate request body against a schema
 */
export function validateBody<T extends Record<string, unknown>>(
  request: NextRequest,
  schema: ValidationSchema<T>
): Promise<ValidationResult<T>> {
  return request.json()
    .then((body: unknown) => {
      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return {
          success: false as const,
          error: errorResponse('Invalid request body', 400, 'Body must be an object', 'VALIDATION_ERROR')
        }
      }

      const result = {} as T
      const bodyObj = body as Record<string, unknown>

      for (const key in schema) {
        const value = bodyObj[key]
        const validator = schema[key]
        const validated = validator(value)

        if (validated === null) {
          return {
            success: false as const,
            error: errorResponse(
              `Invalid value for field: ${String(key)}`,
              400,
              `Field '${String(key)}' failed validation`,
              'VALIDATION_ERROR'
            )
          }
        }

        result[key] = validated
      }

      return { success: true as const, data: result }
    })
    .catch(() => {
      return {
        success: false as const,
        error: errorResponse('Invalid JSON in request body', 400, undefined, 'VALIDATION_ERROR')
      }
    })
}

/**
 * Validate query parameters against a schema
 */
export function validateQuery<T extends Record<string, unknown>>(
  request: NextRequest,
  schema: ValidationSchema<T>
): ValidationResult<T> {
  const searchParams = request.nextUrl.searchParams
  const result = {} as T

  for (const key in schema) {
    const value = searchParams.get(String(key))
    const validator = schema[key]
    const validated = validator(value)

    if (validated === null) {
      return {
        success: false as const,
        error: errorResponse(
          `Invalid or missing query parameter: ${String(key)}`,
          400,
          `Query parameter '${String(key)}' failed validation`,
          'VALIDATION_ERROR'
        )
      }
    }

    result[key] = validated
  }

  return { success: true as const, data: result }
}

/**
 * Common validators for reuse
 */
export const validators = {
  string: (maxLength?: number): Validator<string> => (value) => {
    if (typeof value !== 'string') return null
    const sanitized = sanitizeString(value, maxLength)
    return sanitized || null
  },

  optionalString: (maxLength?: number): Validator<string | undefined> => (value) => {
    if (value === undefined || value === null) return undefined
    if (typeof value !== 'string') return null
    const sanitized = sanitizeString(value, maxLength)
    return sanitized || undefined
  },

  email: (): Validator<string> => (value) => validateEmail(value),

  userId: (): Validator<string> => (value) => validateUserIdInput(value),

  number: (options?: { min?: number; max?: number; integer?: boolean }): Validator<number> => 
    (value) => validateNumber(value, options),

  optionalNumber: (options?: { min?: number; max?: number; integer?: boolean }): Validator<number | undefined> => 
    (value) => {
      if (value === undefined || value === null) return undefined
      return validateNumber(value, options) ?? undefined
    },

  date: (): Validator<string> => (value) => validateDateString(value),

  optionalDate: (): Validator<string | undefined> => (value) => {
    if (value === undefined || value === null) return undefined
    return validateDateString(value) ?? undefined
  },

  boolean: (): Validator<boolean> => (value) => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      if (value === 'true') return true
      if (value === 'false') return false
    }
    return null
  },

  optionalBoolean: (): Validator<boolean | undefined> => (value) => {
    if (value === undefined || value === null) return undefined
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      if (value === 'true') return true
      if (value === 'false') return false
    }
    return undefined
  },

  array: <T>(itemValidator: Validator<T>): Validator<T[]> => (value) => {
    if (!Array.isArray(value)) return null
    const result: T[] = []
    for (const item of value) {
      const validated = itemValidator(item)
      if (validated === null) return null
      result.push(validated)
    }
    return result
  },

  optionalArray: <T>(itemValidator: Validator<T>): Validator<T[] | undefined> => (value) => {
    if (value === undefined || value === null) return undefined
    if (!Array.isArray(value)) return null
    const result: T[] = []
    for (const item of value) {
      const validated = itemValidator(item)
      if (validated === null) return null
      result.push(validated)
    }
    return result
  },

  object: <T extends Record<string, unknown>>(schema: ValidationSchema<T>): Validator<T> => (value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
    const result = {} as T
    const obj = value as Record<string, unknown>
    for (const key in schema) {
      const validated = schema[key](obj[key])
      if (validated === null) return null
      result[key] = validated
    }
    return result
  },

  optionalObject: <T extends Record<string, unknown>>(schema: ValidationSchema<T>): Validator<T | undefined> => (value) => {
    if (value === undefined || value === null) return undefined
    if (typeof value !== 'object' || Array.isArray(value)) return null
    const result = {} as T
    const obj = value as Record<string, unknown>
    for (const key in schema) {
      const validated = schema[key](obj[key])
      if (validated === null) return null
      result[key] = validated
    }
    return result
  },
}

