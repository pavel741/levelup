import { NextRequest, NextResponse } from 'next/server'
import { updateWorkoutLog, deleteWorkoutLog } from '@/lib/workoutMongo'

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

    await updateWorkoutLog(params.id, userId, updates)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating workout log:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update workout log' },
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

    await deleteWorkoutLog(params.id, userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting workout log:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete workout log' },
      { status: 500 }
    )
  }
}

