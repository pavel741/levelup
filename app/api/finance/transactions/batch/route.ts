import { NextRequest, NextResponse } from 'next/server'
import { batchAddTransactions, batchDeleteTransactions } from '@/lib/financeMongo'

// POST - Batch add transactions
export async function POST(request: NextRequest) {
  try {
    const { userId, transactions, options } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }
    if (!Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Transactions must be an array' }, { status: 400 })
    }

    // Create a progress callback that sends Server-Sent Events
    // For now, we'll just return the result
    const result = await batchAddTransactions(userId, transactions, undefined, options)
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in POST /api/finance/transactions/batch:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Batch delete transactions
export async function DELETE(request: NextRequest) {
  try {
    const { userId, ids } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'IDs must be an array' }, { status: 400 })
    }

    await batchDeleteTransactions(userId, ids)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/finance/transactions/batch:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

