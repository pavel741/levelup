import { NextRequest, NextResponse } from 'next/server'
import { deleteTransactionsByDateRange } from '@/lib/financeMongo'

// DELETE - Delete transactions before a specific date
export async function DELETE(request: NextRequest) {
  try {
    const { userId, beforeDate } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }
    if (!beforeDate) {
      return NextResponse.json({ error: 'Before date is required' }, { status: 400 })
    }

    const beforeDateObj = new Date(beforeDate)
    if (isNaN(beforeDateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const deletedCount = await deleteTransactionsByDateRange(userId, beforeDateObj)
    return NextResponse.json({ success: true, deletedCount })
  } catch (error: any) {
    console.error('Error in DELETE /api/finance/transactions/delete-by-date:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

