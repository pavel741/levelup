import { NextRequest } from 'next/server'
import { getAllTransactionsForSummary } from '@/lib/financeMongo'
import { getCategories } from '@/lib/financeMongo'
import { calculateBudgetAnalysis, getBudgetAlerts } from '@/lib/budgetAnalysis'
import { getSecureUserIdFromRequest, successResponse, handleApiError } from '@/lib/utils'
import type { BudgetCategoryLimit } from '@/types/finance'

export const dynamic = 'force-dynamic'

// GET - Get budget analysis
export async function GET(request: NextRequest) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })

    if ('error' in userIdResult) {
      return userIdResult.error
    }

    const { userId } = userIdResult
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'monthly') as 'monthly' | 'weekly'
    const referenceDateParam = searchParams.get('date')
    const referenceDate = referenceDateParam ? new Date(referenceDateParam) : new Date()
    const includeAlerts = searchParams.get('alerts') === 'true'

    // Get all transactions and categories
    const [transactions, categories] = await Promise.all([
      getAllTransactionsForSummary(userId),
      getCategories(userId),
    ])

    // Extract category limits from categories
    const categoryLimits: BudgetCategoryLimit[] = []
    if (categories) {
      Object.entries(categories.expense || {}).forEach(([category, data]: [string, any]) => {
        if (data?.monthlyLimit || data?.limit) {
          categoryLimits.push({
            category,
            monthlyLimit: data.monthlyLimit || data.limit,
            weeklyLimit: data.weeklyLimit,
            alertThreshold: data.alertThreshold || 80,
          })
        }
      })
    }

    // Calculate analysis
    const analyses = calculateBudgetAnalysis(transactions, categoryLimits, period, referenceDate)
    
    const responseData: any = { analyses }
    
    if (includeAlerts) {
      const alerts = getBudgetAlerts(analyses, 80)
      responseData.alerts = alerts
    }

    return successResponse(responseData)
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/finance/budget-analysis')
  }
}

