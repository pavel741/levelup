import { NextRequest, NextResponse } from 'next/server'
import { checkExistingArchiveIds } from '@/lib/financeMongo'

// POST - Check for duplicate archiveIds
export async function POST(request: NextRequest) {
  try {
    const { userId, archiveIds } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }
    if (!Array.isArray(archiveIds)) {
      return NextResponse.json({ error: 'ArchiveIds must be an array' }, { status: 400 })
    }

    const existingArchiveIdsSet = await checkExistingArchiveIds(userId, archiveIds)
    const existingArchiveIds = Array.from(existingArchiveIdsSet)
    
    return NextResponse.json({ existingArchiveIds })
  } catch (error: any) {
    console.error('Error in POST /api/finance/transactions/check-duplicates:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

