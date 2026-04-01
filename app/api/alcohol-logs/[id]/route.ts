import { NextRequest } from 'next/server'
import { getSecureUserIdFromRequest, successResponse, handleApiError } from '@/lib/utils'
import { requireAlcoholCutbackUser } from '@/lib/alcoholAdminServer'
import { deleteAlcoholLog } from '@/lib/alcoholLogsMongo'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userIdResult = await getSecureUserIdFromRequest(request, {
      allowQueryParam: false,
      validateOwnership: true,
    })
    if ('error' in userIdResult) return userIdResult.error

    const forbidden = requireAlcoholCutbackUser(userIdResult.userId)
    if (forbidden) return forbidden

    await deleteAlcoholLog(userIdResult.userId, params.id)
    return successResponse({ success: true })
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/alcohol-logs/[id]')
  }
}
