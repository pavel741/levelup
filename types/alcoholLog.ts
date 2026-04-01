/**
 * Alcohol intake log (admin-only feature in app)
 */

export interface AlcoholLog {
  id: string
  userId: string
  /** Calendar day YYYY-MM-DD */
  date: string
  /** Standard drinks / units for that day */
  drinks: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}
