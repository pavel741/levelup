/**
 * Body Measurements API Routes
 */

import {
  getBodyMeasurements,
  addBodyMeasurement,
} from '@/lib/bodyMeasurementsMongo'
import { createGetHandler, createPostHandler } from '@/lib/utils/api/api-route-helpers'
import { errorResponse } from '@/lib/utils/api/api-helpers'
import type { BodyMeasurement } from '@/types/bodyMeasurements'

export const GET = createGetHandler<BodyMeasurement[]>(
  {
    fetchData: async (userId) => {
      return await getBodyMeasurements(userId)
    },
  },
  {
    requireAuth: true,
    allowQueryParam: false, // Require token-based auth
    validateOwnership: true,
  }
)

export const POST = createPostHandler<
  { id: string },
  Omit<BodyMeasurement, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { userId?: string }
>(
  {
    parseBody: async (request) => {
      const body = await request.json()
      const { userId: _bodyUserId, ...measurementData } = body
      return measurementData
    },
    validateBody: (body, userId) => {
      // Ensure userId matches authenticated user
      if (body.userId && body.userId !== userId) {
        return errorResponse('User ID mismatch', 403)
      }
      return null
    },
    saveData: async (body, userId) => {
      const { userId: _bodyUserId, ...measurementData } = body
      const measurementId = await addBodyMeasurement(userId, measurementData)
      return { id: measurementId }
    },
  },
  {
    requireAuth: true,
    allowQueryParam: false,
    validateOwnership: true,
  }
)

