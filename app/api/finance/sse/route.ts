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
      let isClosed = false
      const intervalId = setInterval(async () => {
        // Check if controller is closed before trying to enqueue
        if (isClosed) {
          clearInterval(intervalId)
          return
        }

        try {
          const db = await getDatabase()
          let data: any

          switch (dataType) {
            case 'transactions':
              const transactionsCollection = db.collection('finance_transactions')
              // Load recent transactions for SSE (limit to last 1000 for performance)
              // All transactions are loaded separately for summary calculations
              const transactions = await transactionsCollection
                .find({ userId: userId! })
                .sort({ date: -1 })
                .limit(1000) // Limit to recent 1000 transactions for SSE performance
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

          // Check again before enqueueing (might have closed during async operation)
          if (!isClosed) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'update', dataType, data })}\n\n`)
            )
          }
        } catch (error) {
          console.error('SSE error:', error)
          // Only try to enqueue error if controller is still open
          if (!isClosed) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Failed to fetch data' })}\n\n`)
              )
            } catch (enqueueError) {
              // Controller might be closed, ignore
              isClosed = true
              clearInterval(intervalId)
            }
          }
        }
      }, 5000) // Check for updates every 5 seconds

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        isClosed = true
        clearInterval(intervalId)
        connections.delete(connectionId)
        try {
          controller.close()
        } catch (error) {
          // Controller might already be closed, ignore
        }
      })

      // Send initial data immediately (don't wait for first interval)
      try {
        const db = await getDatabase()
        let data: any

        switch (dataType) {
          case 'transactions':
            const transactionsCollection = db.collection('finance_transactions')
            const transactions = await transactionsCollection
              .find({ userId: userId! })
              .sort({ date: -1 })
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
            data = null
        }

        // Send initial data
        if (!isClosed && data !== null) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'update', dataType, data })}\n\n`)
          )
        }
      } catch (error) {
        console.error('SSE initial data error:', error)
        if (!isClosed) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Failed to fetch initial data' })}\n\n`)
            )
          } catch (enqueueError) {
            // Controller might be closed, ignore
            isClosed = true
          }
        }
      }
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

