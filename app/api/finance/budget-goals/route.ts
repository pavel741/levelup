import { NextRequest, NextResponse } from 'next/server'
import { getBudgetGoals, saveBudgetGoals } from '@/lib/financeMongo'

// GET - Get budget goals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    const goals = await getBudgetGoals(userId)
    return NextResponse.json({ goals })
  } catch (error: any) {
    console.error('Error in GET /api/finance/budget-goals:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Save budget goals
export async function POST(request: NextRequest) {
  try {
    const { userId, goals } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    await saveBudgetGoals(userId, goals)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in POST /api/finance/budget-goals:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

