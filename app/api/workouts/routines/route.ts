import { NextRequest, NextResponse } from 'next/server'
import { saveRoutine, getRoutinesByUserId } from '@/lib/workoutMongo'
import type { Routine } from '@/types/workout'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const routines = await getRoutinesByUserId(userId)
    return NextResponse.json(routines)
  } catch (error: any) {
    console.error('Error fetching routines:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch routines' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const routine: Routine = await request.json()

    if (!routine.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    await saveRoutine(routine)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving routine:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save routine' },
      { status: 500 }
    )
  }
}

