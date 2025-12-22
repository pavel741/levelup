import { NextRequest, NextResponse } from 'next/server'
import { saveWorkoutLog, getWorkoutLogsByUserId } from '@/lib/workoutMongo'
import type { WorkoutLog } from '@/types/workout'
import { getUserIdFromRequest, validateUserId, successResponse, handleApiError } from '@/lib/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId)
    if (validationError) return validationError

    const logs = await getWorkoutLogsByUserId(userId!)
    return successResponse(logs)
  } catch (error: any) {
    return handleApiError(error, 'GET /api/workouts/logs')
  }
}

export async function POST(request: NextRequest) {
  try {
    const log: WorkoutLog = await request.json()

    const validationError = validateUserId(log.userId)
    if (validationError) return validationError

    await saveWorkoutLog(log)
    return successResponse()
  } catch (error: any) {
    return handleApiError(error, 'POST /api/workouts/logs')
  }
}

