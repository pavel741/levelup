/**
 * MongoDB CSFLE Encryption Schemas
 * 
 * Defines which fields should be encrypted in each collection
 */

import { Binary } from 'mongodb'

/**
 * Get encryption schema for finance_transactions collection
 */
export function getFinanceTransactionsSchema(dataKeyId: Binary) {
  return {
    bsonType: 'object',
    encryptMetadata: {
      keyId: [dataKeyId],
    },
    properties: {
      description: {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
        },
      },
      account: {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
        },
      },
      recipientName: {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
        },
      },
      selgitus: {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
        },
      },
    },
  }
}

/**
 * Get encryption schema for workout_routines collection
 */
export function getWorkoutRoutinesSchema(dataKeyId: Binary) {
  return {
    bsonType: 'object',
    encryptMetadata: {
      keyId: [dataKeyId],
    },
    properties: {
      name: {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
        },
      },
      description: {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
        },
      },
      'exercises.notes': {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
        },
      },
      'sessions.exercises.notes': {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
        },
      },
    },
  }
}

/**
 * Get encryption schema for workout_logs collection
 */
export function getWorkoutLogsSchema(dataKeyId: Binary) {
  return {
    bsonType: 'object',
    encryptMetadata: {
      keyId: [dataKeyId],
    },
    properties: {
      notes: {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
        },
      },
      'exercises.notes': {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
        },
      },
    },
  }
}

/**
 * Get encryption schema for finance_recurring_transactions collection
 */
export function getFinanceRecurringTransactionsSchema(dataKeyId: Binary) {
  return {
    bsonType: 'object',
    encryptMetadata: {
      keyId: [dataKeyId],
    },
    properties: {
      name: {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
        },
      },
      description: {
        encrypt: {
          bsonType: 'string',
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
        },
      },
    },
  }
}

