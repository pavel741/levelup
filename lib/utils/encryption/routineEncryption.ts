/**
 * Specialized encryption functions for Routine objects
 * 
 * These functions handle the complex nested structure of routines,
 * encrypting only sensitive fields like notes while keeping metadata
 * (IDs, names, etc.) unencrypted for querying purposes.
 */

import type { Routine } from '@/types/workout'
import { encryptValue, decryptValue } from './crypto'

// CryptoKey is a global type from Web Crypto API
type CryptoKey = globalThis.CryptoKey

/**
 * Encrypt sensitive fields in a Routine
 * Only encrypts: name, description, and notes fields within exercises
 */
export async function encryptRoutine(routine: Routine, key: CryptoKey): Promise<Routine> {
  const encrypted: Routine = { ...routine }
  
  // Encrypt routine name
  if (routine.name) {
    encrypted.name = await encryptValue(routine.name, key)
  }
  
  // Encrypt routine description
  if (routine.description) {
    encrypted.description = await encryptValue(routine.description, key)
  }
  
  // Encrypt notes within exercises in sessions
  if (routine.sessions && Array.isArray(routine.sessions)) {
    encrypted.sessions = await Promise.all(
      routine.sessions.map(async (session) => {
        const encryptedSession = { ...session }
        
        if (session.exercises && Array.isArray(session.exercises)) {
          encryptedSession.exercises = await Promise.all(
            session.exercises.map(async (exercise) => {
              const encryptedExercise = { ...exercise }
              
              // Only encrypt the notes field, keep everything else (exerciseId, sets, etc.) unencrypted
              if (exercise.notes) {
                encryptedExercise.notes = await encryptValue(exercise.notes, key)
              }
              
              return encryptedExercise
            })
          )
        }
        
        return encryptedSession
      })
    )
  }
  
  // Handle legacy exercises array (deprecated but still supported)
  if (routine.exercises && Array.isArray(routine.exercises)) {
    encrypted.exercises = await Promise.all(
      routine.exercises.map(async (exercise) => {
        const encryptedExercise = { ...exercise }
        if (exercise.notes) {
          encryptedExercise.notes = await encryptValue(exercise.notes, key)
        }
        return encryptedExercise
      })
    )
  }
  
  return encrypted
}

/**
 * Decrypt sensitive fields in a Routine
 */
export async function decryptRoutine(routine: Routine, key: CryptoKey): Promise<Routine> {
  const decrypted: Routine = { ...routine }
  
  // Decrypt routine name
  if (routine.name) {
    try {
      decrypted.name = await decryptValue(routine.name, key)
    } catch (error) {
      // If decryption fails, assume it's plaintext (backward compatibility)
      console.warn('Failed to decrypt routine name, assuming plaintext:', error)
    }
  }
  
  // Decrypt routine description
  if (routine.description) {
    try {
      decrypted.description = await decryptValue(routine.description, key)
    } catch (error) {
      console.warn('Failed to decrypt routine description, assuming plaintext:', error)
    }
  }
  
  // Decrypt notes within exercises in sessions
  if (routine.sessions && Array.isArray(routine.sessions)) {
    decrypted.sessions = await Promise.all(
      routine.sessions.map(async (session) => {
        const decryptedSession = { ...session }
        
        if (session.exercises && Array.isArray(session.exercises)) {
          decryptedSession.exercises = await Promise.all(
            session.exercises.map(async (exercise) => {
              const decryptedExercise = { ...exercise }
              
              if (exercise.notes) {
                try {
                  decryptedExercise.notes = await decryptValue(exercise.notes, key)
                } catch (error) {
                  // If decryption fails, assume plaintext
                  console.warn('Failed to decrypt exercise notes, assuming plaintext:', error)
                }
              }
              
              return decryptedExercise
            })
          )
        }
        
        return decryptedSession
      })
    )
  }
  
  // Handle legacy exercises array
  if (routine.exercises && Array.isArray(routine.exercises)) {
    decrypted.exercises = await Promise.all(
      routine.exercises.map(async (exercise) => {
        const decryptedExercise = { ...exercise }
        if (exercise.notes) {
          try {
            decryptedExercise.notes = await decryptValue(exercise.notes, key)
          } catch (error) {
            console.warn('Failed to decrypt exercise notes, assuming plaintext:', error)
          }
        }
        return decryptedExercise
      })
    )
  }
  
  return decrypted
}

