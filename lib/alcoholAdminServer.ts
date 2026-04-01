import type { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/utils/api/api-helpers'

/**
 * API routes must call this after resolving the authenticated user id.
 */
export function requireAlcoholCutbackUser(userId: string): NextResponse | null {
  const allowed = process.env.NEXT_PUBLIC_ALCOHOL_CUTBACK_USER_ID
  if (!allowed || userId !== allowed) {
    return errorResponse('Forbidden', 403, 'You do not have access to this resource', 'FORBIDDEN')
  }
  return null
}
