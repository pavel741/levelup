import { NextRequest, NextResponse } from 'next/server'
import { getFinanceSettings, saveFinanceSettings } from '@/lib/financeMongo'

// GET - Get settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    const settings = await getFinanceSettings(userId)
    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('Error in GET /api/finance/settings:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Save settings
export async function POST(request: NextRequest) {
  try {
    const { userId, settings } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    await saveFinanceSettings(userId, settings)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in POST /api/finance/settings:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

