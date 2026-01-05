/**
 * Body Measurements API
 * Client-side wrapper for body measurements operations
 */

import type { BodyMeasurement } from '@/types/bodyMeasurements'
import { authenticatedFetch } from '@/lib/utils/api/api-client'

const API_BASE = '/api/body-measurements'

export const getBodyMeasurements = async (_userId: string): Promise<BodyMeasurement[]> => {
  // userId parameter kept for backward compatibility but not used (comes from auth token)
  const response = await authenticatedFetch(API_BASE, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch body measurements')
  }

  const data = await response.json()
  return data.data || []
}

export const addBodyMeasurement = async (
  _userId: string,
  measurement: Omit<BodyMeasurement, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  // userId parameter kept for backward compatibility but not sent (comes from auth token)
  const response = await authenticatedFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(measurement),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add body measurement')
  }

  const data = await response.json()
  return data.data?.id || data.id
}

export const updateBodyMeasurement = async (
  _userId: string,
  measurementId: string,
  updates: Partial<BodyMeasurement>
): Promise<void> => {
  // userId parameter kept for backward compatibility but not sent (comes from auth token)
  const response = await authenticatedFetch(`${API_BASE}/${measurementId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update body measurement')
  }
}

export const deleteBodyMeasurement = async (_userId: string, measurementId: string): Promise<void> => {
  // userId parameter kept for backward compatibility but not sent (comes from auth token)
  const response = await authenticatedFetch(`${API_BASE}/${measurementId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete body measurement')
  }
}

