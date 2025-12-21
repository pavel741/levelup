import { NextRequest, NextResponse } from 'next/server'
import { updateRoutine, deleteRoutine } from '@/lib/workoutMongo'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, updates } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    await updateRoutine(params.id, userId, updates)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating routine:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update routine' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    await deleteRoutine(params.id, userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting routine:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete routine' },
      { status: 500 }
    )
  }
}

