/**
 * Body Measurements API
 * Client-side wrapper for body measurements operations
 */

import type { BodyMeasurement } from '@/types/bodyMeasurements'

const API_BASE = '/api/body-measurements'

export const getBodyMeasurements = async (userId: string): Promise<BodyMeasurement[]> => {
  const response = await fetch(`${API_BASE}?userId=${userId}`, {
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
  userId: string,
  measurement: Omit<BodyMeasurement, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...measurement }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add body measurement')
  }

  const data = await response.json()
  return data.data?.id || data.id
}

export const updateBodyMeasurement = async (
  userId: string,
  measurementId: string,
  updates: Partial<BodyMeasurement>
): Promise<void> => {
  const response = await fetch(`${API_BASE}/${measurementId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...updates }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update body measurement')
  }
}

export const deleteBodyMeasurement = async (userId: string, measurementId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/${measurementId}?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete body measurement')
  }
}

