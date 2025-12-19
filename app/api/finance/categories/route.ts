import { NextRequest, NextResponse } from 'next/server'
import { getCategories, saveCategories } from '@/lib/financeMongo'

// GET - Get categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    const categories = await getCategories(userId)
    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Error in GET /api/finance/categories:', error)
    
    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      return NextResponse.json({ 
        error: 'MongoDB connection timeout. Please check your IP whitelist in MongoDB Atlas.',
        details: 'Go to MongoDB Atlas → Network Access → Add your IP address'
      }, { status: 503 })
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Save categories
export async function POST(request: NextRequest) {
  try {
    const { userId, categories } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    await saveCategories(userId, categories)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in POST /api/finance/categories:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

