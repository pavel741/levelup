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
      console.log('[Routine Analyze] Fetching data for userId:', userId)
      
      // Get user's routines and workout logs
      const [routines, workoutLogs] = await Promise.all([
        getRoutinesByUserId(userId),
        getWorkoutLogsByUserId(userId)
      ])

      console.log('[Routine Analyze] Found routines:', routines.length, 'workoutLogs:', workoutLogs.length)
      console.log('[Routine Analyze] Sample routine:', routines[0] ? {
        id: routines[0].id,
        name: routines[0].name,
        sessionsCount: routines[0].sessions?.length || 0,
        exercisesCount: routines[0].exercises?.length || 0
      } : 'none')

      // Analyze routines
      const analyses = routines.length > 0 ? analyzeRoutines(routines) : []
      console.log('[Routine Analyze] Analyses generated:', analyses.length)

      // Analyze workout history for deeper insights
      const historyInsights = analyzeWorkoutHistory(workoutLogs)

      // Generate reports
      const reports = analyses.map(analysis => ({
        ...analysis,
        report: generateReport(analysis)
      }))

      const averageScore = analyses.length > 0
        ? Math.round(analyses.reduce((sum, a) => sum + a.overallScore, 0) / analyses.length)
        : 0

      console.log('[Routine Analyze] Returning:', {
        analysesCount: reports.length,
        hasHistoryInsights: !!historyInsights,
        averageScore,
        summary: {
          totalRoutines: routines.length,
          averageScore,
          totalWorkouts: workoutLogs.length,
          highPriorityIssues: analyses.reduce((sum, a) => 
            sum + a.improvements.filter(imp => imp.priority === 'high').length, 0
          )
        }
      })

      return {
        analyses: reports,
        historyInsights,
        summary: {
          totalRoutines: routines.length,
          averageScore,
          totalWorkouts: workoutLogs.length,
          highPriorityIssues: analyses.reduce((sum, a) => 
            sum + a.improvements.filter(imp => imp.priority === 'high').length, 0
          )
        }
      }
    }
  },
  {
    requireAuth: true,
    allowQueryParam: false, // Enforce token-based auth only
    validateOwnership: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 20 // Analysis is computationally expensive
    }
  }
)

