import { NextRequest } from 'next/server'
import {
  getSecureUserIdFromRequest,
  errorResponse,
  successResponse,
  handleApiError,
} from '@/lib/utils'
import { requireAlcoholCutbackUser } from '@/lib/alcoholAdminServer'
import { addAlcoholLog, getAlcoholLogs } from '@/lib/alcoholLogsMongo'
import { validateDateString, validateNumber, sanitizeString } from '@/lib/utils/validation/input-validation'

export async function GET(request: NextRequest) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })
    if ('error' in userIdResult) return userIdResult.error

    const forbidden = requireAlcoholCutbackUser(userIdResult.userId)
    if (forbidden) return forbidden

    const logs = await getAlcoholLogs(userIdResult.userId)
    return successResponse(logs)
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/alcohol-logs')
  }
}

export async function POST(request: NextRequest) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })
    if ('error' in userIdResult) return userIdResult.error

    const forbidden = requireAlcoholCutbackUser(userIdResult.userId)
    if (forbidden) return forbidden

    const body = await request.json()
    const dateRaw = body?.date
    const date = validateDateString(dateRaw)
    if (!date) {
      return errorResponse('Invalid date', 400, 'Use YYYY-MM-DD', 'VALIDATION_ERROR')
    }

    const drinks = validateNumber(body?.drinks, { min: 0, max: 99 })
    if (drinks === null) {
      return errorResponse('Invalid drinks', 400, 'Enter a number between 0 and 99', 'VALIDATION_ERROR')
    }

    let notes: string | undefined
    if (body?.notes != null && body.notes !== '') {
      const n = sanitizeString(String(body.notes), 500)
      notes = n || undefined
    }

    const id = await addAlcoholLog(userIdResult.userId, { date, drinks, notes })
    return successResponse({ id })
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/alcohol-logs')
  }
}
