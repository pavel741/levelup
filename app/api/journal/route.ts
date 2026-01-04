import { NextRequest } from 'next/server'
import {
  getJournalEntries,
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalEntryById,
  getJournalEntryByDate,
  getMoodStatistics,
  exportJournalEntries,
} from '@/lib/journalMongo'
import { getUserIdFromRequest, validateUserIdForApi, successResponse, errorResponse, handleApiError } from '@/lib/utils'
import type { JournalEntry } from '@/types'

export const dynamic = 'force-dynamic'

// GET - Get journal entries with optional filters
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserIdForApi(userId, 401)
    if (validationError) return validationError

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as JournalEntry['type'] | null
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined
    const search = searchParams.get('search') || undefined
    const date = searchParams.get('date') || undefined
    const entryId = searchParams.get('id') || undefined
    const exportFormat = searchParams.get('export') as 'json' | 'csv' | null

    // Export functionality
    if (exportFormat) {
      const exported = await exportJournalEntries(userId!, exportFormat)
      return new Response(exported, {
        headers: {
          'Content-Type': exportFormat === 'json' ? 'application/json' : 'text/csv',
          'Content-Disposition': `attachment; filename="journal-entries.${exportFormat}"`,
        },
      })
    }

    // Get single entry by ID
    if (entryId) {
      const entry = await getJournalEntryById(userId!, entryId)
      if (!entry) {
        return errorResponse('Journal entry not found', 404)
      }
      return successResponse({ entry })
    }

    // Get entry by date
    if (date) {
      const entry = await getJournalEntryByDate(userId!, date, type || undefined)
      return successResponse({ entry })
    }

    // Get mood statistics
    if (searchParams.get('stats') === 'mood') {
      const stats = await getMoodStatistics(userId!, dateFrom, dateTo)
      return successResponse({ stats })
    }

    // Get all entries with filters
    const entries = await getJournalEntries(userId!, {
      type: type || undefined,
      dateFrom,
      dateTo,
      search,
    })

    return successResponse({ entries })
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/journal')
  }
}

// POST - Add a new journal entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...entry } = body
    
    const validationError = validateUserIdForApi(userId, 401)
    if (validationError) return validationError

    if (!entry.date || !entry.type || !entry.content) {
      return errorResponse('Date, type, and content are required', 400)
    }

    const entryId = await addJournalEntry(userId!, entry)
    return successResponse({ id: entryId })
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/journal')
  }
}

// PUT - Update a journal entry
export async function PUT(request: NextRequest) {
  try {
    const { userId, id, ...updates } = await request.json()
    
    const validationError = validateUserIdForApi(userId, 401)
    if (validationError) return validationError
    
    if (!id) {
      return errorResponse('Journal entry ID is required', 400)
    }

    await updateJournalEntry(userId!, id, updates)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'PUT /api/journal')
  }
}

// DELETE - Delete a journal entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = getUserIdFromRequest(request)
    
    const validationError = validateUserIdForApi(userId, 401)
    if (validationError) return validationError
    
    if (!id) {
      return errorResponse('Journal entry ID is required', 400)
    }

    await deleteJournalEntry(userId!, id)
    return successResponse()
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/journal')
  }
}

