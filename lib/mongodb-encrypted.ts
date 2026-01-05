/**
 * MongoDB Client with Field-Level Encryption (CSFLE)
 * 
 * This module creates an encrypted MongoDB client that automatically
 * encrypts/decrypts sensitive fields based on encryption schemas.
 */

import { MongoClient, Db } from 'mongodb'

// Dynamic import to avoid webpack resolution issues
let getKmsProviders: any
let getUserDataEncryptionKey: any
let getExistingUserDataEncryptionKey: any
let KEY_VAULT_NAMESPACE: string

if (typeof window === 'undefined') {
  // Server-side: Load real encryption module using require (not analyzed by webpack)
  const encryptionModule = require('./utils/encryption/csfle-key-management')
  getKmsProviders = encryptionModule.getKmsProviders
  getUserDataEncryptionKey = encryptionModule.getUserDataEncryptionKey
  getExistingUserDataEncryptionKey = encryptionModule.getExistingUserDataEncryptionKey
  KEY_VAULT_NAMESPACE = encryptionModule.KEY_VAULT_NAMESPACE
} else {
  // Client-side: Use stubs (should never happen)
  getKmsProviders = () => { throw new Error('Server-only') }
  getUserDataEncryptionKey = () => { throw new Error('Server-only') }
  getExistingUserDataEncryptionKey = () => { throw new Error('Server-only') }
  KEY_VAULT_NAMESPACE = ''
}
import {
  getFinanceTransactionsSchema,
  getWorkoutRoutinesSchema,
  getWorkoutLogsSchema,
  getFinanceRecurringTransactionsSchema,
} from './utils/encryption/csfle-schemas'

// Get MongoDB URI from environment variable
const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error(
    'MONGODB_URI environment variable is not set. ' +
    'Please add it to .env.local file.'
  )
}

const cleanUri = uri.trim().replace(/\s+/g, '').replace(/\r?\n/g, '')

// MongoDB connection options
const options = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
  maxPoolSize: 10,
  retryWrites: true,
  retryReads: true,
}

// Cache for encryption clients per user
const encryptionClientsCache = new Map<string, Promise<MongoClient>>()

/**
 * Create an encrypted MongoDB client for a specific user
 * Each user has their own encryption key, so we need separate clients
 */
export async function getEncryptedClient(userId: string): Promise<MongoClient> {
  // Check cache first
  if (encryptionClientsCache.has(userId)) {
    return encryptionClientsCache.get(userId)!
  }

  // Create new encrypted client
  const clientPromise = (async () => {
    // First, create a temporary client to get/create the user's encryption key
    const tempClient = new MongoClient(cleanUri, options)
    await tempClient.connect()

    try {
      // Get or create user's data encryption key
      let dataKeyId = await getExistingUserDataEncryptionKey(tempClient, userId)
      
      if (!dataKeyId) {
        // Create new key for user
        dataKeyId = await getUserDataEncryptionKey(tempClient, userId)
      }

      await tempClient.close()

      // Create encrypted client with schema map
      const encryptedClient = new MongoClient(cleanUri, {
        ...options,
        autoEncryption: {
          keyVaultNamespace: KEY_VAULT_NAMESPACE,
          kmsProviders: getKmsProviders(),
          schemaMap: {
            'levelup.finance_transactions': getFinanceTransactionsSchema(dataKeyId),
            'levelup.workout_routines': getWorkoutRoutinesSchema(dataKeyId),
            'levelup.workout_logs': getWorkoutLogsSchema(dataKeyId),
            'levelup.finance_recurring_transactions': getFinanceRecurringTransactionsSchema(dataKeyId),
          },
          // Bypass auto-encryption for queries that don't match schemas
          bypassAutoEncryption: false,
        },
      })

      await encryptedClient.connect()
      return encryptedClient
    } catch (error) {
      await tempClient.close()
      throw error
    }
  })()

  // Cache the promise
  encryptionClientsCache.set(userId, clientPromise)

  return clientPromise
}

/**
 * Get encrypted database for a specific user
 */
export async function getEncryptedDatabase(userId: string): Promise<Db> {
  const client = await getEncryptedClient(userId)
  
  // Extract database name from URI or use default
  let dbName = 'levelup'
  const dbMatch = cleanUri.match(/mongodb\+srv:\/\/[^/]+\/([^?]+)/)
  if (dbMatch && dbMatch[1]) {
    dbName = dbMatch[1]
  }
  
  return client.db(dbName)
}

/**
 * Cleanup: Close all encrypted clients
 */
export async function closeAllEncryptedClients(): Promise<void> {
  const clients = await Promise.all(Array.from(encryptionClientsCache.values()))
  await Promise.all(clients.map(client => client.close()))
  encryptionClientsCache.clear()
}

