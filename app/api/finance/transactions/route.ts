import { NextRequest, NextResponse } from 'next/server'
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getAllTransactionsForSummary,
} from '@/lib/financeMongo'

// GET - Get all transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 0
    const forSummary = searchParams.get('forSummary') === 'true'

    // Always get all transactions from MongoDB (no quota limits!)
    const transactions = await getAllTransactionsForSummary(userId)
    
    // Only apply limit if explicitly requested and > 0
    const limited = limit > 0 ? transactions.slice(0, limit) : transactions
    
    return NextResponse.json({ transactions: limited })
  } catch (error: any) {
    console.error('Error in GET /api/finance/transactions:', error)
    
    // Provide helpful error messages
    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      return NextResponse.json({ 
        error: 'Database connection timeout. Using Firestore fallback.',
        details: 'If MongoDB is unavailable, the app will use Firestore automatically.'
      }, { status: 503 })
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...transaction } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    const transactionId = await addTransaction(userId, transaction)
    
    return NextResponse.json({ id: transactionId })
  } catch (error: any) {
    console.error('Error in POST /api/finance/transactions:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a transaction
export async function PUT(request: NextRequest) {
  try {
    const { userId, id, ...updates } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }
    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    await updateTransaction(userId, id, updates)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in PUT /api/finance/transactions:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a transaction
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }
    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    await deleteTransaction(userId, id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/finance/transactions:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

