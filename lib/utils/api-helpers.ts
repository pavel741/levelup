/**
 * Common API route helper functions
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Extract userId from request (query params or body)
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  const { searchParams } = new URL(request.url)
  return searchParams.get('userId')
}

/**
 * Standard error response helper
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: string
): NextResponse {
  const response: any = { error: message }
  if (details) {
    response.details = details
  }
  return NextResponse.json(response, { status })
}

/**
 * Standard success response helper
 */
export function successResponse(data?: any): NextResponse {
  return NextResponse.json(data || { success: true })
}

/**
 * Validate userId and return error response if invalid
 */
export function validateUserId(userId: string | null, status: number = 400): NextResponse | null {
  if (!userId) {
    return errorResponse('User ID is required', status)
  }
  return null
}

/**
 * Handle API route errors consistently
 */
export function handleApiError(error: any, context: string): NextResponse {
  console.error(`Error in ${context}:`, error)
  
  // Handle specific error types
  if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
    return errorResponse(
      'Database connection timeout',
      503,
      'Please check your network connection and try again.'
    )
  }
  
  return errorResponse(
    error.message || 'Internal server error',
    500
  )
}

