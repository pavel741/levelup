/**
 * Common data conversion utilities for MongoDB/Firestore
 */

/**
 * Convert MongoDB document to typed object (removes _id, handles dates)
 */
export function convertMongoDocument<T>(doc: any): T {
  const { _id, ...data } = doc
  return {
    ...data,
    id: data.id || _id?.toString(),
  } as T
}

/**
 * Convert Firestore Timestamp or Date to Date object
 */
export function toDate(value: any): Date {
  if (value instanceof Date) {
    return value
  }
  
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate()
  }
  
  if (typeof value === 'string') {
    return new Date(value)
  }
  
  return new Date(value)
}

/**
 * Remove undefined fields from object (Firestore doesn't accept undefined)
 */
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {}
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key]
    }
  })
  return cleaned
}

