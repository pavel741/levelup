/**
 * Reusable API Route Helpers
 * Common patterns for API routes to reduce duplication
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiErrorResponse } from '@/types/api'
import { getSecureUserIdFromRequest, successResponse, errorResponse, handleApiError, getUserIdFromRequest as getUserIdFromRequestHelper } from './api-helpers'
import { withRateLimit } from '../security/rate-limit'

export interface ApiRouteConfig {
  requireAuth?: boolean
  allowQueryParam?: boolean
  validateOwnership?: boolean
  rateLimit?: {
    windowMs: number
    maxRequests: number
  }
}

export interface GetHandlerOptions<T> {
  fetchData: (userId: string, request: NextRequest) => Promise<T>
  firestoreFallback?: (userId: string) => Promise<T>
  transformResponse?: (data: T) => unknown
}

export interface PostHandlerOptions<TData, TBody> {
  parseBody: (request: NextRequest) => Promise<TBody>
  validateBody?: (body: TBody, userId: string) => NextResponse<ApiErrorResponse> | null
  saveData: (body: TBody, userId: string) => Promise<TData>
  transformResponse?: (data: TData) => unknown
}

export interface PutHandlerOptions<TData, TBody> {
  parseBody: (request: NextRequest) => Promise<TBody>
  validateBody?: (body: TBody, userId: string) => NextResponse<ApiErrorResponse> | null
  updateData: (body: TBody, userId: string) => Promise<TData>
  transformResponse?: (data: TData) => unknown
}

export interface PatchHandlerOptions<TData, TBody> {
  parseBody: (request: NextRequest) => Promise<TBody>
  validateBody?: (body: TBody, userId: string) => NextResponse<ApiErrorResponse> | null
  updateData: (body: TBody, userId: string) => Promise<TData>
  transformResponse?: (data: TData) => unknown
}

export interface DeleteHandlerOptions {
  parseParams?: (request: NextRequest) => Promise<{ id: string } | { error: NextResponse<ApiErrorResponse> }>
  deleteData: (id: string, userId: string) => Promise<void>
}

/**
 * Create a GET handler with common patterns
 */
export function createGetHandler<T>(
  options: GetHandlerOptions<T>,
  config: ApiRouteConfig = {}
) {
  const handler = async (request: NextRequest) => {
    try {
      // Authentication
      const userIdResult = config.requireAuth !== false
        ? await getSecureUserIdFromRequest(request, {
            allowQueryParam: config.allowQueryParam ?? true,
            validateOwnership: config.validateOwnership ?? true,
          })
        : { userId: getUserIdFromRequestHelper(request) || undefined }

      // Check for error first (type narrowing)
      if ('error' in userIdResult) {
        return userIdResult.error
      }

      // Check if userId exists
      if (!userIdResult.userId) {
        return errorResponse('User ID is required', 400)
      }

      const { userId } = userIdResult

      // Try Firestore fallback first if available
      if (options.firestoreFallback) {
        const firestoreData = await options.firestoreFallback(userId)
        if (firestoreData && (Array.isArray(firestoreData) ? firestoreData.length > 0 : true)) {
          const transformed = options.transformResponse
            ? options.transformResponse(firestoreData)
            : firestoreData
          return successResponse(transformed)
        }
      }

      // Fetch data
      const data = await options.fetchData(userId, request)
      const transformed = options.transformResponse ? options.transformResponse(data) : data
      return successResponse(transformed)
    } catch (error: unknown) {
      return handleApiError(error, 'GET handler')
    }
  }

  // Apply rate limiting if configured
  if (config.rateLimit) {
    return withRateLimit(handler, config.rateLimit)
  }

  return handler
}

/**
 * Create a POST handler with common patterns
 */
export function createPostHandler<TData, TBody>(
  options: PostHandlerOptions<TData, TBody>,
  config: ApiRouteConfig = {}
) {
  const handler = async (request: NextRequest) => {
    try {
      // Authentication
      const userIdResult = config.requireAuth !== false
        ? await getSecureUserIdFromRequest(request, {
            allowQueryParam: config.allowQueryParam ?? true,
            validateOwnership: config.validateOwnership ?? true,
          })
        : { userId: getUserIdFromRequestHelper(request) || undefined }

      // Check for error first (type narrowing)
      if ('error' in userIdResult) {
        return userIdResult.error
      }

      // Check if userId exists
      if (!userIdResult.userId) {
        return errorResponse('User ID is required', 400)
      }

      const { userId } = userIdResult

      // Parse and validate body
      const body = await options.parseBody(request)
      if (options.validateBody) {
        const validationError = options.validateBody(body, userId)
        if (validationError) {
          return validationError
        }
      }

      // Save data
      const data = await options.saveData(body, userId)
      const transformed = options.transformResponse ? options.transformResponse(data) : data
      return successResponse(transformed)
    } catch (error: unknown) {
      return handleApiError(error, 'POST handler')
    }
  }

  // Apply rate limiting if configured
  if (config.rateLimit) {
    return withRateLimit(handler, config.rateLimit)
  }

  return handler
}

/**
 * Create a PUT handler with common patterns
 */
export function createPutHandler<TData, TBody>(
  options: PutHandlerOptions<TData, TBody>,
  config: ApiRouteConfig = {}
) {
  const handler = async (request: NextRequest) => {
    try {
      // Authentication
      const userIdResult = config.requireAuth !== false
        ? await getSecureUserIdFromRequest(request, {
            allowQueryParam: config.allowQueryParam ?? true,
            validateOwnership: config.validateOwnership ?? true,
          })
        : { userId: getUserIdFromRequestHelper(request) || undefined }

      // Check for error first (type narrowing)
      if ('error' in userIdResult) {
        return userIdResult.error
      }

      // Check if userId exists
      if (!userIdResult.userId) {
        return errorResponse('User ID is required', 400)
      }

      const { userId } = userIdResult

      // Parse and validate body
      const body = await options.parseBody(request)
      if (options.validateBody) {
        const validationError = options.validateBody(body, userId)
        if (validationError) {
          return validationError
        }
      }

      // Update data
      const data = await options.updateData(body, userId)
      const transformed = options.transformResponse ? options.transformResponse(data) : data
      return successResponse(transformed)
    } catch (error: unknown) {
      return handleApiError(error, 'PUT handler')
    }
  }

  // Apply rate limiting if configured
  if (config.rateLimit) {
    return withRateLimit(handler, config.rateLimit)
  }

  return handler
}

/**
 * Create a PATCH handler with common patterns
 */
export function createPatchHandler<TData, TBody>(
  options: PatchHandlerOptions<TData, TBody>,
  config: ApiRouteConfig = {}
) {
  const handler = async (request: NextRequest) => {
    try {
      // Authentication
      const userIdResult = config.requireAuth !== false
        ? await getSecureUserIdFromRequest(request, {
            allowQueryParam: config.allowQueryParam ?? true,
            validateOwnership: config.validateOwnership ?? true,
          })
        : { userId: getUserIdFromRequestHelper(request) || undefined }

      // Check for error first (type narrowing)
      if ('error' in userIdResult) {
        return userIdResult.error
      }

      // Check if userId exists
      if (!userIdResult.userId) {
        return errorResponse('User ID is required', 400)
      }

      const { userId } = userIdResult

      // Parse and validate body
      const body = await options.parseBody(request)
      if (options.validateBody) {
        const validationError = options.validateBody(body, userId)
        if (validationError) {
          return validationError
        }
      }

      // Update data
      const data = await options.updateData(body, userId)
      const transformed = options.transformResponse ? options.transformResponse(data) : data
      return successResponse(transformed)
    } catch (error: unknown) {
      return handleApiError(error, 'PATCH handler')
    }
  }

  // Apply rate limiting if configured
  if (config.rateLimit) {
    return withRateLimit(handler, config.rateLimit)
  }

  return handler
}

/**
 * Create a DELETE handler with common patterns
 */
export function createDeleteHandler(
  options: DeleteHandlerOptions,
  config: ApiRouteConfig = {}
) {
  const handler = async (request: NextRequest) => {
    try {
      // Authentication
      const userIdResult = config.requireAuth !== false
        ? await getSecureUserIdFromRequest(request, {
            allowQueryParam: config.allowQueryParam ?? true,
            validateOwnership: config.validateOwnership ?? true,
          })
        : { userId: getUserIdFromRequestHelper(request) || undefined }

      // Check for error first (type narrowing)
      if ('error' in userIdResult) {
        return userIdResult.error
      }

      // Check if userId exists
      if (!userIdResult.userId) {
        return errorResponse('User ID is required', 400)
      }

      const { userId } = userIdResult

      // Parse params (default: get id from query params)
      let id: string
      if (options.parseParams) {
        const paramsResult = await options.parseParams(request)
        if ('error' in paramsResult) {
          return paramsResult.error
        }
        id = paramsResult.id
      } else {
        const searchParams = request.nextUrl.searchParams
        id = searchParams.get('id') || ''
        if (!id) {
          return errorResponse('ID is required', 400, 'ID must be provided in query parameters', 'VALIDATION_ERROR')
        }
      }

      // Delete data
      await options.deleteData(id, userId)
      return successResponse()
    } catch (error: unknown) {
      return handleApiError(error, 'DELETE handler')
    }
  }

  // Apply rate limiting if configured
  if (config.rateLimit) {
    return withRateLimit(handler, config.rateLimit)
  }

  return handler
}

