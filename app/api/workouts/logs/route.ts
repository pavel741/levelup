import { NextRequest, NextResponse } from 'next/server'
import { saveWorkoutLog, getWorkoutLogsByUserId } from '@/lib/workoutMongo'
import type { WorkoutLog } from '@/types/workout'

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

    const logs = await getWorkoutLogsByUserId(userId)
    return NextResponse.json(logs)
  } catch (error: any) {
    console.error('Error fetching workout logs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch workout logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const log: WorkoutLog = await request.json()

    if (!log.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    await saveWorkoutLog(log)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving workout log:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save workout log' },
      { status: 500 }
    )
  }
}

