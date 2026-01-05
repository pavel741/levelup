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
): Promise<Binary | undefined | null> {
  if (!value) return value as Binary | undefined | null
  
  try {
    // Get or create user's encryption key
    let dataKeyId = await getExistingUserDataEncryptionKey(client, userId)
    if (!dataKeyId) {
      dataKeyId = await getUserDataEncryptionKey(client, userId)
    }
    
    const encryption = getClientEncryption(client)
    
    // Encrypt the value - this returns a Binary object with subtype 6
    const encrypted = await encryption.encrypt(value, {
      keyId: dataKeyId,
      algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
    })
    
    // Return Binary object directly - MongoDB will store it correctly
    // The Binary object already has subtype 6 (encrypted data)
    return encrypted
  } catch (error) {
    console.error('Encryption error in encryptValue:', error instanceof Error ? error.message : String(error))
    throw error // Re-throw so caller knows encryption failed
  }
}

/**
 * Decrypt a string value for a specific user
 */
export async function decryptValue(
  client: MongoClient,
  userId: string,
  encryptedValue: string | undefined | null | Binary
): Promise<string | undefined | null> {
  if (!encryptedValue) return encryptedValue as string | undefined | null
  
  // Handle Binary object directly (from MongoDB - best case)
  if (encryptedValue instanceof Binary) {
    try {
      const encryption = getClientEncryption(client)
      
      // Only decrypt if it's subtype 6 (encrypted data)
      if (encryptedValue.sub_type === 6) {
        const decrypted = await encryption.decrypt(encryptedValue)
        return decrypted as string
      } else {
        // Not encrypted, return as string
        return encryptedValue.toString('utf8')
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error)
      console.error(`Failed to decrypt Binary object (subtype: ${encryptedValue.sub_type}):`, errorMsg)
      
      // If decryption fails, try to return as string (might be unencrypted data stored as Binary)
      try {
        return encryptedValue.toString('utf8')
      } catch {
        return encryptedValue.toString('base64')
      }
    }
  }
  
  // Handle string (from old base64-encoded data or unencrypted data)
  if (typeof encryptedValue !== 'string') {
    return String(encryptedValue)
  }
  
  // Check if the value looks encrypted (base64 format and reasonable length)
  const isBase64 = encryptedValue.match(/^[A-Za-z0-9+/=]+$/)
  const isLikelyEncrypted = isBase64 && encryptedValue.length > 50 // Encrypted values are usually much longer
  
  if (!isLikelyEncrypted) {
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
    
    // Convert base64 string back to Binary with subtype 6 (required for CSFLE)
    const buffer = Buffer.from(encryptedValue, 'base64')
    const encryptedBinary = new Binary(buffer, 6) // Subtype 6 = encrypted data
    
    // Decrypt the value
    const decrypted = await encryption.decrypt(encryptedBinary)
    return decrypted as string
  } catch (error: any) {
    // Decryption failed, assume unencrypted (backward compatibility)
    const errorMsg = error?.message || String(error)
    console.warn(`⚠️ Failed to decrypt value (assuming unencrypted): ${errorMsg}`)
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
      // encryptValue returns Binary object - store it directly
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
      const originalValue = decrypted[field]
      
      try {
        const decryptedValue = await decryptValue(client, userId, originalValue)
        
        // Ensure we return a string, not a Binary object
        // This is important for JSON serialization
        // Type assertion needed because decryptValue should return string | undefined | null
        if (decryptedValue && typeof decryptedValue === 'object' && 'sub_type' in decryptedValue) {
          // Safety check: if somehow a Binary object was returned, convert it
          const binaryValue = decryptedValue as any as Binary
          console.error(`decryptValue returned Binary for field ${field} - this shouldn't happen!`)
          decrypted[field] = binaryValue.toString('utf8')
        } else {
          decrypted[field] = decryptedValue
        }
      } catch (error: any) {
        console.error(`Failed to decrypt field "${field}":`, error?.message || error)
        // If it's a Binary object and decryption failed, try to convert to string
        if (originalValue instanceof Binary) {
          try {
            decrypted[field] = originalValue.toString('utf8')
          } catch {
            decrypted[field] = originalValue.toString('base64')
          }
        } else {
          // Keep original value if decryption fails
          decrypted[field] = originalValue
        }
      }
    }
  }
  
  return decrypted
}

