/**
 * Client API for alcohol logs (auth token; server enforces admin user id)
 */

import type { AlcoholLog } from '@/types/alcoholLog'
import { authenticatedFetch } from '@/lib/utils/api/api-client'

const API_BASE = '/api/alcohol-logs'

export async function fetchAlcoholLogs(): Promise<AlcoholLog[]> {
  const response = await authenticatedFetch(API_BASE, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to load alcohol logs')
  }
  const data = await response.json()
  const raw = data.data ?? data
  const list = Array.isArray(raw) ? raw : []
  return list.map((row: Record<string, unknown>) => {
    const created = row.createdAt
    const updated = row.updatedAt
    return {
      ...(row as unknown as AlcoholLog),
      createdAt:
        created instanceof Date ? created : new Date(String(created ?? 0)),
      updatedAt:
        updated instanceof Date ? updated : new Date(String(updated ?? 0)),
    }
  })
}

export async function createAlcoholLog(entry: {
  date: string
  drinks: number
  notes?: string
}): Promise<string> {
  const response = await authenticatedFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to save entry')
  }
  const data = await response.json()
  return data.data?.id ?? data.id
}

export async function deleteAlcoholLog(logId: string): Promise<void> {
  const response = await authenticatedFetch(`${API_BASE}/${logId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to delete entry')
  }
}
