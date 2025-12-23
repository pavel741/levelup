/**
 * Server-Sent Events (SSE) API Route
 * Provides real-time updates for finance data
 * Replaces polling with push-based updates
 */

import { NextRequest } from 'next/server'
import { getUserIdFromRequest, validateUserIdForApi } from '@/lib/utils'
import { getDatabase } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  const validationError = validateUserIdForApi(userId, 401)
  if (validationError) return validationError

  const { searchParams } = new URL(request.url)
  const dataType = searchParams.get('type') || 'transactions' // 'transactions' | 'categories' | 'settings'

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const connectionId = `${userId}-${dataType}-${Date.now()}`
      connections.set(connectionId, controller)

      // Send initial connection message
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', dataType })}\n\n`))

      // Set up periodic updates (simulates real-time changes)
      // In production, this would be triggered by database change streams or events
      const intervalId = setInterval(async () => {
        try {
          const db = await getDatabase()
          let data: any

          switch (dataType) {
            case 'transactions':
              const transactionsCollection = db.collection('finance_transactions')
              const transactions = await transactionsCollection
                .find({ userId: userId! })
                .sort({ date: -1 })
                .limit(100)
                .toArray()
              data = transactions.map((doc) => ({
                id: doc._id.toString(),
                ...doc,
                _id: undefined,
              }))
              break

            case 'categories':
              const categoriesCollection = db.collection('finance_categories')
              const categoryDoc = await categoriesCollection.findOne({ userId: userId! })
              data = categoryDoc?.categories || {}
              break

            case 'settings':
              const settingsCollection = db.collection('finance_settings')
              const settingsDoc = await settingsCollection.findOne({ userId: userId! })
              data = settingsDoc?.settings || null
              break

            default:
              return
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'update', dataType, data })}\n\n`)
          )
        } catch (error) {
          console.error('SSE error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Failed to fetch data' })}\n\n`)
          )
        }
      }, 5000) // Check for updates every 5 seconds

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId)
        connections.delete(connectionId)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  })
}

