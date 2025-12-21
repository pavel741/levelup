import { NextRequest, NextResponse } from 'next/server'
import { generateRoutine } from '@/lib/routineGenerator'
import type { Routine } from '@/types/workout'

export async function POST(request: NextRequest) {
  try {
    const { weight, height, goal, experience, daysPerWeek, equipment } = await request.json()

    // Validate inputs
    if (!weight || !height) {
      return NextResponse.json(
        { error: 'Weight and height are required' },
        { status: 400 }
      )
    }

    if (!goal || !experience || !daysPerWeek) {
      return NextResponse.json(
        { error: 'Goal, experience, and days per week are required' },
        { status: 400 }
      )
    }

    // Validate days per week
    if (daysPerWeek < 2 || daysPerWeek > 6) {
      return NextResponse.json(
        { error: 'Days per week must be between 2 and 6' },
        { status: 400 }
      )
    }

    // Generate routine using rule-based algorithm
    const routine = generateRoutine({
      weight: parseFloat(weight),
      height: parseFloat(height),
      goal: goal as any,
      experience: experience as any,
      daysPerWeek: parseInt(daysPerWeek),
      equipment: equipment || [],
    })

    // Validate generated routine
    if (!routine.sessions || routine.sessions.length === 0) {
      console.error('Generated routine has no sessions')
      throw new Error('Generated routine has no sessions')
    }

    const hasExercises = routine.sessions.some((s) => s.exercises && s.exercises.length > 0)
    if (!hasExercises) {
      console.error('Generated routine has no exercises. Sessions:', routine.sessions.map(s => ({
        name: s.name,
        exerciseCount: s.exercises.length,
        exercises: s.exercises.map(e => e.exerciseId)
      })))
      throw new Error('Generated routine has no exercises. Please try selecting different equipment or adjusting your preferences.')
    }

    return NextResponse.json({ routine })
  } catch (error: any) {
    console.error('Error generating routine:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate routine' },
      { status: 500 }
    )
  }
}

