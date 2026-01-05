/**
 * Encryption Configuration
 * 
 * Defines which fields should be encrypted for each data type.
 * Only sensitive user data should be encrypted - metadata like IDs, dates, etc.
 * can remain unencrypted for querying and indexing purposes.
 * 
 * NOTE: This module is client-side only.
 */

'use client'

import type { Routine, WorkoutLog } from '@/types/workout'
import type { FinanceTransaction, FinanceRecurringTransaction } from '@/types/finance'

/**
 * Fields to encrypt in Routine objects
 * These contain sensitive user data that should be private
 * 
 * Note: Use encryptRoutine/decryptRoutine from routineEncryption.ts
 * for routines, as they handle the complex nested structure properly
 */
export const ROUTINE_ENCRYPTED_FIELDS: (keyof Routine)[] = [
  'name',           // Routine name
  'description',    // Routine description
  // Note: sessions.exercises[].notes are handled by encryptRoutine function
]

/**
 * Fields to encrypt in WorkoutLog objects
 * These contain sensitive user data that should be private
 */
export const WORKOUT_LOG_ENCRYPTED_FIELDS: (keyof WorkoutLog)[] = [
  'notes',
]

/**
 * Fields to encrypt in nested exercise objects within routines
 * Note: exerciseId should remain unencrypted for reference purposes
 */
export const EXERCISE_NOTES_ENCRYPTED_FIELDS = ['notes']

/**
 * Fields to encrypt in FinanceTransaction objects
 * These contain sensitive financial information
 */
export const FINANCE_TRANSACTION_ENCRYPTED_FIELDS: (keyof FinanceTransaction)[] = [
  'description',    // Transaction descriptions (merchant names, payment details)
  'account',        // Account names/identifiers
  // Note: recipientName is handled separately as it's a dynamic field
]

/**
 * Fields to encrypt in FinanceRecurringTransaction objects
 */
export const FINANCE_RECURRING_ENCRYPTED_FIELDS: (keyof FinanceRecurringTransaction)[] = [
  'name',         // Bill/payment name
  'description', // Description
  'paymentHistory', // Notes in payment history
]

/**
 * Configuration for what to encrypt
 * You can customize this based on your privacy requirements
 */
export const ENCRYPTION_CONFIG = {
  routines: {
    // Encrypt user-created content
    encryptFields: ROUTINE_ENCRYPTED_FIELDS,
    // Keep these unencrypted for querying/indexing:
    // - id, userId, createdAt, updatedAt, goal, difficulty, isTemplate, isPublic, etc.
  },
  workoutLogs: {
    encryptFields: WORKOUT_LOG_ENCRYPTED_FIELDS,
    // Keep these unencrypted:
    // - id, userId, date, startTime, endTime, duration, completed, etc.
  },
  financeTransactions: {
    encryptFields: FINANCE_TRANSACTION_ENCRYPTED_FIELDS,
    // Keep these unencrypted for querying/analytics:
    // - id, userId, date, amount, category, type, currency, tags
  },
  financeRecurring: {
    encryptFields: FINANCE_RECURRING_ENCRYPTED_FIELDS,
    // Keep these unencrypted:
    // - id, userId, amount, category, interval, nextDate, dueDate, isPaid, etc.
  },
} as const

/**
 * Helper to check if encryption is enabled
 * Can be used to disable encryption for testing or migration
 */
export function isEncryptionEnabled(): boolean {
  // You can add environment variable check here if needed
  // return process.env.NEXT_PUBLIC_ENABLE_ENCRYPTION !== 'false'
  return true
}

