/**
 * Client-side check: show alcohol cutback UI only for the configured Firebase user id.
 */
export function isAlcoholCutbackAdmin(userId: string | null | undefined): boolean {
  const allowed = process.env.NEXT_PUBLIC_ALCOHOL_CUTBACK_USER_ID
  if (!allowed || !userId) return false
  return userId === allowed
}
