import { NextRequest, NextResponse } from 'next/server'
import {
  getRecurringTransactions,
  addRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '@/lib/financeMongo'

// GET - Get recurring transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    const transactions = await getRecurringTransactions(userId)
    return NextResponse.json({ transactions })
  } catch (error: any) {
    console.error('Error in GET /api/finance/recurring:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Add recurring transaction
export async function POST(request: NextRequest) {
  try {
    const { userId, ...transaction } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    const id = await addRecurringTransaction(userId, transaction)
    return NextResponse.json({ id })
  } catch (error: any) {
    console.error('Error in POST /api/finance/recurring:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update recurring transaction
export async function PUT(request: NextRequest) {
  try {
    const { userId, id, ...updates } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }
    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    await updateRecurringTransaction(userId, id, updates)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in PUT /api/finance/recurring:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete recurring transaction
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const id = searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }
    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    await deleteRecurringTransaction(userId, id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/finance/recurring:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

