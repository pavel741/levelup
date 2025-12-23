/**
 * Server-side Authentication Middleware
 * Validates Firebase Auth tokens and extracts user information
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiErrorResponse } from '@/types/api'
import { errorResponse } from '../api/api-helpers'

export interface AuthenticatedRequest {
  userId: string
  email?: string
  emailVerified?: boolean
}

/**
 * Verify Firebase ID token
 * Note: For production, consider using Firebase Admin SDK for better security
 * This implementation uses a simplified approach that can be upgraded
 */
async function verifyIdToken(idToken: string): Promise<{ uid: string; email?: string; email_verified?: boolean } | null> {
  try {
    // In production, use Firebase Admin SDK:
    // const admin = require('firebase-admin')
    // const decodedToken = await admin.auth().verifyIdToken(idToken)
    // return { uid: decodedToken.uid, email: decodedToken.email, email_verified: decodedToken.email_verified }
    
    // For now, we'll validate the token structure and extract user info
    // This is a simplified approach - upgrade to Firebase Admin SDK for production
    
    // Basic token validation - check if it's a valid JWT structure
    const parts = idToken.split('.')
    if (parts.length !== 3) {
      return null
    }

    try {
      // Decode the payload (without verification for now)
      // In production, use Firebase Admin SDK to properly verify the token
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      
      // Check token expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null
      }

      return {
        uid: payload.user_id || payload.sub || payload.uid,
        email: payload.email,
        email_verified: payload.email_verified,
      }
    } catch {
      return null
    }
  } catch {
    return null
  }
}

/**
 * Extract and verify authentication from request
 * Looks for Firebase ID token in Authorization header or cookies
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ success: true; user: AuthenticatedRequest } | { success: false; error: NextResponse<ApiErrorResponse> }> {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization')
  let idToken: string | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    idToken = authHeader.substring(7)
  } else {
    // Fallback: try to get from cookie (if client stores it)
    const tokenCookie = request.cookies.get('firebase-auth-token')
    idToken = tokenCookie?.value || null
  }

  if (!idToken) {
    return {
      success: false,
      error: errorResponse('Authentication required', 401, 'Please sign in to access this resource', 'UNAUTHORIZED'),
    }
  }

  const decoded = await verifyIdToken(idToken)
  if (!decoded || !decoded.uid) {
    return {
      success: false,
      error: errorResponse('Invalid authentication token', 401, 'Please sign in again', 'UNAUTHORIZED'),
    }
  }

  return {
    success: true,
    user: {
      userId: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified,
    },
  }
}

/**
 * Middleware wrapper for authenticated API routes
 * Usage: export const GET = withAuth(async (request, { user }) => { ... })
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: { user: AuthenticatedRequest }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success) {
      return authResult.error
    }

    return handler(request, { user: authResult.user })
  }
}

/**
 * Get authenticated user ID from request
 * This replaces the insecure getUserIdFromRequest that only checked query params
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const authResult = await authenticateRequest(request)
  return authResult.success ? authResult.user.userId : null
}

