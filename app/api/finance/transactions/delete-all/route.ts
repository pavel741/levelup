import { NextRequest, NextResponse } from 'next/server'
import { deleteAllTransactions } from '@/lib/financeMongo'

// DELETE - Delete all transactions for a user
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    const deletedCount = await deleteAllTransactions(userId)
    return NextResponse.json({ success: true, deletedCount })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error in DELETE /api/finance/transactions/delete-all:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

