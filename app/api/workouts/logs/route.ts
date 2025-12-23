import { NextRequest } from 'next/server'
import { saveWorkoutLog, getWorkoutLogsByUserId } from '@/lib/workoutMongo'
import { getWorkoutLogsByUserId as getWorkoutLogsByUserIdFirestore } from '@/lib/firestore'
import type { WorkoutLog } from '@/types/workout'
import { getUserIdFromRequest, validateUserId, successResponse, handleApiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const validationError = validateUserId(userId)
    if (validationError) return validationError

    // Try Firestore first (faster, no network dependency)
    const firestoreLogs = await getWorkoutLogsByUserIdFirestore(userId!)
    if (firestoreLogs.length > 0) {
      return successResponse(firestoreLogs)
    }

    // Fallback to MongoDB if Firestore is empty
    const logs = await getWorkoutLogsByUserId(userId!)
    return successResponse(logs)
  } catch (error: unknown) {
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
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/workouts/logs')
  }
}

