/**
 * API Route: Analyze Routines
 * Returns analysis and suggestions for user's routines
 * 
 * GET /api/routines/analyze
 * - Authentication: Required
 * - Rate Limit: 20 requests per 15 minutes
 */

import { NextRequest } from 'next/server'
import { getRoutinesByUserId, getWorkoutLogsByUserId } from '@/lib/workoutMongo'
import { analyzeRoutines, generateReport } from '@/scripts/analyzeRoutine'
import { analyzeWorkoutHistory } from '@/scripts/analyzeWorkoutHistory'
import { createGetHandler } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const GET = createGetHandler(
  {
    fetchData: async (userId) => {
      // Get user's routines and workout logs
      const [routines, workoutLogs] = await Promise.all([
        getRoutinesByUserId(userId),
        getWorkoutLogsByUserId(userId)
      ])

      // Analyze routines
      const analyses = routines.length > 0 ? analyzeRoutines(routines) : []

      // Analyze workout history for deeper insights
      const historyInsights = analyzeWorkoutHistory(workoutLogs)

      // Generate reports
      const reports = analyses.map(analysis => ({
        ...analysis,
        report: generateReport(analysis)
      }))

      return {
        analyses: reports,
        historyInsights,
        summary: {
          totalRoutines: routines.length,
          routinesNeedingBiceps: analyses.filter(
            a => a.bicepsAnalysis.recommendation === 'add'
          ).length,
          totalWorkouts: workoutLogs.length
        }
      }
    }
  },
  {
    requireAuth: true,
    validateOwnership: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 20 // Analysis is computationally expensive
    }
  }
)

