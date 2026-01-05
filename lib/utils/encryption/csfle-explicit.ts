/**
 * MongoDB CSFLE Explicit Encryption/Decryption
 * 
 * This module provides explicit encryption/decryption functions for user-specific data.
 * Each user has their own encryption key, so we use explicit encryption rather than
 * automatic schema-based encryption.
 */

import { MongoClient, Binary } from 'mongodb'

// Dynamic import to avoid webpack resolution issues
// Only load encryption functions on server-side
let getClientEncryption: any
let getUserDataEncryptionKey: any
let getExistingUserDataEncryptionKey: any

if (typeof window === 'undefined') {
  // Server-side: Load real encryption module using require (not analyzed by webpack)
  const encryptionModule = require('./csfle-key-management')
  getClientEncryption = encryptionModule.getClientEncryption
  getUserDataEncryptionKey = encryptionModule.getUserDataEncryptionKey
  getExistingUserDataEncryptionKey = encryptionModule.getExistingUserDataEncryptionKey
} else {
  // Client-side: Use stubs (should never happen, but safety)
  getClientEncryption = () => {
    throw new Error('Encryption modules are server-only')
  }
  getUserDataEncryptionKey = () => {
    throw new Error('Encryption modules are server-only')
  }
  getExistingUserDataEncryptionKey = () => {
    throw new Error('Encryption modules are server-only')
  }
}

/**
 * Encrypt a string value for a specific user
 */
export async function encryptValue(
  client: MongoClient,
  userId: string,
  value: string | undefined | null
): Promise<string | undefined | null> {
  if (!value) return value
  
  try {
    // Get or create user's encryption key
    let dataKeyId = await getExistingUserDataEncryptionKey(client, userId)
    if (!dataKeyId) {
      console.log(`🔑 Creating encryption key for user: ${userId}`)
      dataKeyId = await getUserDataEncryptionKey(client, userId)
    } else {
      console.log(`🔑 Using existing encryption key for user: ${userId}`)
    }
    
    const encryption = getClientEncryption(client)
    
    // Encrypt the value
    console.log(`🔐 Encrypting value for user ${userId}, length: ${value.length}`)
    const encrypted = await encryption.encrypt(value, {
      keyId: dataKeyId,
      algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
    })
    
    // Convert Binary to base64 string for storage
    const result = encrypted.toString('base64')
    console.log(`✅ Encrypted value successfully, result length: ${result.length}`)
    return result
  } catch (error) {
    console.error('❌ Encryption error in encryptValue:', error)
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    throw error // Re-throw so caller knows encryption failed
  }
}

/**
 * Decrypt a string value for a specific user
 */
export async function decryptValue(
  client: MongoClient,
  userId: string,
  encryptedValue: string | undefined | null
): Promise<string | undefined | null> {
  if (!encryptedValue) return encryptedValue
  
  // Check if the value looks encrypted (base64 format)
  if (!encryptedValue.match(/^[A-Za-z0-9+/=]+$/)) {
    // Not encrypted, return as-is (backward compatibility)
    return encryptedValue
  }
  
  try {
    // Get user's encryption key
    const dataKeyId = await getExistingUserDataEncryptionKey(client, userId)
    if (!dataKeyId) {
      // No key found, assume unencrypted
      return encryptedValue
    }
    
    const encryption = getClientEncryption(client)
    
    // Convert base64 string back to Binary
    // Binary constructor: new Binary(buffer, subtype)
    // Subtype 0 is the default binary subtype
    const buffer = Buffer.from(encryptedValue, 'base64')
    const encryptedBinary = new Binary(buffer, 0)
    
    // Decrypt the value
    const decrypted = await encryption.decrypt(encryptedBinary)
    return decrypted as string
  } catch (error) {
    // Decryption failed, assume unencrypted (backward compatibility)
    console.warn('Failed to decrypt value, assuming unencrypted:', error)
    return encryptedValue
  }
}

/**
 * Encrypt multiple fields in an object
 */
export async function encryptObjectFields(
  client: MongoClient,
  userId: string,
  obj: Record<string, any>,
  fieldsToEncrypt: string[]
): Promise<Record<string, any>> {
  const encrypted = { ...obj }
  
  for (const field of fieldsToEncrypt) {
    if (field in encrypted && encrypted[field] != null) {
      encrypted[field] = await encryptValue(client, userId, encrypted[field])
    }
  }
  
  return encrypted
}

/**
 * Decrypt multiple fields in an object
 */
export async function decryptObjectFields(
  client: MongoClient,
  userId: string,
  obj: Record<string, any>,
  fieldsToDecrypt: string[]
): Promise<Record<string, any>> {
  const decrypted = { ...obj }
  
  for (const field of fieldsToDecrypt) {
    if (field in decrypted && decrypted[field] != null) {
      decrypted[field] = await decryptValue(client, userId, decrypted[field])
    }
  }
  
  return decrypted
}

