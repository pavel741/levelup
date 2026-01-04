/**
 * Body Measurements API Routes (Individual)
 */

import { NextRequest } from 'next/server'
import { getSecureUserIdFromRequest } from '@/lib/utils'
import {
  updateBodyMeasurement,
  deleteBodyMeasurement,
} from '@/lib/bodyMeasurementsMongo'
import { errorResponse, successResponse } from '@/lib/api-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult
    const body = await request.json()
    const { userId: bodyUserId, ...updates } = body

    if (bodyUserId !== userId) {
      return errorResponse('User ID mismatch', 403)
    }

    await updateBodyMeasurement(userId, params.id, updates)
    return successResponse({ success: true })
  } catch (error: unknown) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to update body measurement', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: true,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult
    await deleteBodyMeasurement(userId, params.id)
    return successResponse({ success: true })
  } catch (error: unknown) {
    return errorResponse(error instanceof Error ? error.message : 'Failed to delete body measurement', 500)
  }
}

