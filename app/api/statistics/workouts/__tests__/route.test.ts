/**
 * Tests for Workout Statistics API route
 */

import { GET } from '../route'
import { NextRequest } from 'next/server'

// Mock MongoDB
jest.mock('@/lib/mongodb', () => ({
  getDatabase: jest.fn(),
}))

jest.mock('@/lib/utils', () => ({
  getUserIdFromRequest: jest.fn(),
  validateUserId: jest.fn(),
  successResponse: jest.fn((data) => new Response(JSON.stringify({ data }), { status: 200 })),
  handleApiError: jest.fn((error) => new Response(JSON.stringify({ error: error.message }), { status: 500 })),
}))

describe('/api/statistics/workouts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return workout statistics', async () => {
    const { getUserIdFromRequest, validateUserId } = require('@/lib/utils')
    const { getDatabase } = require('@/lib/mongodb')

    getUserIdFromRequest.mockReturnValue('user123')
    validateUserId.mockReturnValue(null)

    const mockCollection = {
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            count: 10,
            totalVolume: 5000,
            totalDuration: 600,
            avgVolume: 500,
          },
        ]),
      }),
    }

    getDatabase.mockResolvedValue({
      collection: jest.fn().mockReturnValue(mockCollection),
    })

    const request = new NextRequest('http://localhost/api/statistics/workouts?userId=user123&timeRange=month')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.currentCount).toBe(10)
    expect(data.data.currentVolume).toBe(5000)
  })

  it('should handle compare period', async () => {
    const { getUserIdFromRequest, validateUserId } = require('@/lib/utils')
    const { getDatabase } = require('@/lib/mongodb')

    getUserIdFromRequest.mockReturnValue('user123')
    validateUserId.mockReturnValue(null)

    const mockCollection = {
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            count: 10,
            totalVolume: 5000,
            totalDuration: 600,
            avgVolume: 500,
          },
        ]),
      }),
    }

    getDatabase.mockResolvedValue({
      collection: jest.fn().mockReturnValue(mockCollection),
    })

    const request = new NextRequest(
      'http://localhost/api/statistics/workouts?userId=user123&timeRange=month&comparePeriod=true'
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockCollection.aggregate).toHaveBeenCalledTimes(2) // Current and previous period
  })
})

