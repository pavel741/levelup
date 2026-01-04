/**
 * Tests for Goals API routes
 */

import { GET } from '../route'
import { NextRequest } from 'next/server'

// Mock MongoDB operations
jest.mock('@/lib/goalsMongo', () => ({
  getGoals: jest.fn(),
  addGoal: jest.fn(),
}))

jest.mock('@/lib/utils', () => ({
  getUserIdFromRequest: jest.fn(),
  validateUserId: jest.fn(),
  successResponse: jest.fn((data) => new Response(JSON.stringify({ data }), { status: 200 })),
  handleApiError: jest.fn((error) => new Response(JSON.stringify({ error: error.message }), { status: 500 })),
}))

describe('/api/goals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return goals for a user', async () => {
      const { getUserIdFromRequest, validateUserId } = require('@/lib/utils')
      const { getGoals } = require('@/lib/goalsMongo')

      getUserIdFromRequest.mockReturnValue('user123')
      validateUserId.mockReturnValue(null)
      getGoals.mockResolvedValue([
        {
          id: 'goal1',
          userId: 'user123',
          title: 'Test Goal',
          status: 'active',
        },
      ])

      const request = new NextRequest('http://localhost/api/goals?userId=user123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.goals).toHaveLength(1)
      expect(data.data.goals[0].title).toBe('Test Goal')
    })

    it('should filter by status when provided', async () => {
      const { getUserIdFromRequest, validateUserId } = require('@/lib/utils')
      const { getGoals } = require('@/lib/goalsMongo')

      getUserIdFromRequest.mockReturnValue('user123')
      validateUserId.mockReturnValue(null)
      getGoals.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/goals?userId=user123&status=active')
      await GET(request)

      expect(getGoals).toHaveBeenCalledWith('user123', { status: 'active' })
    })

    it('should return 401 if user not authenticated', async () => {
      const { getUserIdFromRequest, validateUserId } = require('@/lib/utils')

      getUserIdFromRequest.mockReturnValue(null)
      validateUserId.mockReturnValue(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))

      const request = new NextRequest('http://localhost/api/goals')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST', () => {
    it('should create a new goal', async () => {
      const { getUserIdFromRequest, validateUserId } = require('@/lib/utils')
      const { addGoal } = require('@/lib/goalsMongo')

      getUserIdFromRequest.mockReturnValue('user123')
      validateUserId.mockReturnValue(null)
      addGoal.mockResolvedValue({
        id: 'goal1',
        userId: 'user123',
        title: 'New Goal',
        status: 'active',
      })

      const request = new NextRequest('http://localhost/api/goals?userId=user123', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Goal',
          category: 'personal',
          targetValue: 100,
          currentValue: 0,
          unit: 'units',
          deadline: '2024-12-31',
        }),
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })
})

