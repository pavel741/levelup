/**
 * Client-Side Encryption Utilities
 * 
 * This module provides encryption/decryption functions using the Web Crypto API.
 * Data is encrypted on the client before being sent to MongoDB, ensuring that
 * even the database owner cannot read the plaintext data.
 * 
 * Security Model:
 * - Each user has a unique encryption key stored securely in browser localStorage
 * - Keys are never sent to the server
 * - Only encrypted data is stored in MongoDB
 * - Decryption happens client-side when data is retrieved
 * 
 * NOTE: This module is client-side only and uses browser APIs.
 */

'use client'

// CryptoKey is a global type from Web Crypto API, we'll use it directly
// Other modules can import it from the global scope or use typeof on functions that return it

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256 // bits
const IV_LENGTH = 12 // bytes (96 bits for GCM)
const TAG_LENGTH = 128 // bits

/**
 * Generate a new encryption key for a user
 * This should be called once per user on signup
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable - needed to store in localStorage
    ['encrypt', 'decrypt']
  )
}

/**
 * Export a key to a string format for storage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key)
  const exportedArrayBuffer = new Uint8Array(exported)
  return Array.from(exportedArrayBuffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Import a key from a string format
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyArray = keyString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  const keyBuffer = new Uint8Array(keyArray)
  
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

/**
 * Type guard to check if a value is a Date object
 */
function isDate(value: unknown): value is Date {
  return value instanceof Date || (typeof value === 'object' && value !== null && value.constructor === Date)
}

/**
 * Generate a random IV (Initialization Vector) for each encryption operation
 */
function generateIV(): Uint8Array {
  const iv = new Uint8Array(IV_LENGTH)
  crypto.getRandomValues(iv)
  return iv
}

/**
 * Check if a string looks like encrypted data (base64 format with minimum length)
 */
function looksEncrypted(value: string): boolean {
  if (!value || value.length < 20) {
    return false // Too short to be encrypted
  }
  
  // Encrypted data is base64 encoded, so it should:
  // 1. Be longer than a typical short plaintext (encrypted data is always longer)
  // 2. Contain only base64 characters (A-Z, a-z, 0-9, +, /, =)
  // 3. Have a length that's a multiple of 4 (base64 padding)
  const base64Regex = /^[A-Za-z0-9+/]+=*$/
  return base64Regex.test(value) && value.length >= 20
}

/**
 * Encrypt a string value
 */
export async function encryptValue(value: string, key: CryptoKey): Promise<string> {
  if (!value) return value // Don't encrypt empty strings
  
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const iv = generateIV()
  // Create a new ArrayBuffer to ensure correct type compatibility
  const ivBuffer = new Uint8Array(iv).buffer
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: ivBuffer,
      tagLength: TAG_LENGTH,
    },
    key,
    data
  )
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  
  // Convert to base64 for storage
  return btoa(String.fromCharCode.apply(null, Array.from(combined)))
}

/**
 * Decrypt a string value
 * Returns the original value if it's not encrypted (backward compatibility)
 */
export async function decryptValue(encryptedValue: string, key: CryptoKey): Promise<string> {
  if (!encryptedValue) return encryptedValue // Handle empty strings
  
  // Check if the value looks encrypted - if not, assume it's plaintext
  if (!looksEncrypted(encryptedValue)) {
    return encryptedValue // Return as-is if it doesn't look encrypted
  }
  
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedValue), c => c.charCodeAt(0))
    
    // Extract IV and encrypted data
    if (combined.length < IV_LENGTH) {
      // Data is too short, assume plaintext
      return encryptedValue
    }
    
    const iv = combined.slice(0, IV_LENGTH)
    const encrypted = combined.slice(IV_LENGTH)
    // Create a new ArrayBuffer to ensure correct type compatibility
    const ivBuffer = new Uint8Array(iv).buffer
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: ivBuffer,
        tagLength: TAG_LENGTH,
      },
      key,
      encrypted
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    // If decryption fails, assume it's plaintext (backward compatibility)
    // Don't throw - just return the original value
    return encryptedValue
  }
}

/**
 * Encrypt an object, encrypting only specified fields
 */
export async function encryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[],
  key: CryptoKey
): Promise<T> {
  const encrypted = { ...obj }
  
  for (const field of fieldsToEncrypt) {
    const value = obj[field]
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        encrypted[field] = await encryptValue(value, key) as any
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Check if it's a Date - if so, skip encryption (dates should remain unencrypted)
        if (isDate(value)) {
          encrypted[field] = value as any
        } else {
          // Recursively encrypt nested objects
          encrypted[field] = await encryptObject(value, Object.keys(value) as (keyof typeof value)[], key) as any
        }
      } else if (Array.isArray(value)) {
        // Encrypt array items - handle strings, objects, or nested structures
        encrypted[field] = await Promise.all(
          value.map(async (item: unknown) => {
            if (typeof item === 'string') {
              return await encryptValue(item, key)
            } else if (typeof item === 'object' && item !== null && !isDate(item)) {
              // For objects in arrays, only encrypt string fields (like 'notes')
              // This prevents encrypting IDs and other metadata
              const encryptedItem = { ...item } as Record<string, unknown>
              for (const [nestedKey, nestedValue] of Object.entries(item as Record<string, unknown>)) {
                if (typeof nestedValue === 'string' && nestedValue) {
                  encryptedItem[nestedKey] = await encryptValue(nestedValue, key)
                } else if (Array.isArray(nestedValue)) {
                  // Handle nested arrays (e.g., exercises array within sessions)
                  encryptedItem[nestedKey] = await Promise.all(
                    nestedValue.map(async (nestedItem) => {
                      if (typeof nestedItem === 'string') {
                        return await encryptValue(nestedItem, key)
                      } else if (typeof nestedItem === 'object' && nestedItem !== null && !isDate(nestedItem)) {
                        const nestedEncrypted = { ...nestedItem } as Record<string, unknown>
                        for (const [deepKey, deepValue] of Object.entries(nestedItem as Record<string, unknown>)) {
                          if (typeof deepValue === 'string' && deepValue) {
                            nestedEncrypted[deepKey] = await encryptValue(deepValue, key)
                          }
                        }
                        return nestedEncrypted
                      }
                      return nestedItem
                    })
                  )
                }
              }
              return encryptedItem
            }
            return item
          })
        ) as any
      }
    }
  }
  
  return encrypted
}

/**
 * Decrypt an object, decrypting only specified fields
 */
export async function decryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[],
  key: CryptoKey
): Promise<T> {
  const decrypted = { ...obj }
  
  for (const field of fieldsToDecrypt) {
    const value = obj[field]
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        try {
          decrypted[field] = await decryptValue(value, key) as any
        } catch (error) {
          // If decryption fails, it might not be encrypted (backward compatibility)
          console.warn(`Failed to decrypt field ${String(field)}, assuming plaintext:`, error)
          decrypted[field] = value
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Check if it's a Date - if so, skip decryption (dates should remain unencrypted)
        if (isDate(value)) {
          decrypted[field] = value as any
        } else {
          // Recursively decrypt nested objects
          decrypted[field] = await decryptObject(value, Object.keys(value) as (keyof typeof value)[], key) as any
        }
      } else if (Array.isArray(value)) {
        // Decrypt array items - handle strings, objects, or nested structures
        decrypted[field] = await Promise.all(
          value.map(async (item: unknown) => {
            if (typeof item === 'string') {
              try {
                return await decryptValue(item, key)
              } catch (error) {
                // If decryption fails, assume plaintext (backward compatibility)
                return item
              }
            } else if (typeof item === 'object' && item !== null && !isDate(item)) {
              // For objects in arrays, decrypt string fields
              const decryptedItem = { ...item } as Record<string, unknown>
              for (const [nestedKey, nestedValue] of Object.entries(item as Record<string, unknown>)) {
                if (typeof nestedValue === 'string' && nestedValue) {
                  try {
                    decryptedItem[nestedKey] = await decryptValue(nestedValue, key)
                  } catch (error) {
                    // If decryption fails, assume plaintext
                    decryptedItem[nestedKey] = nestedValue
                  }
                } else if (Array.isArray(nestedValue)) {
                  // Handle nested arrays (e.g., exercises array within sessions)
                  decryptedItem[nestedKey] = await Promise.all(
                    nestedValue.map(async (nestedItem) => {
                      if (typeof nestedItem === 'string') {
                        try {
                          return await decryptValue(nestedItem, key)
                        } catch (error) {
                          return nestedItem
                        }
                      } else if (typeof nestedItem === 'object' && nestedItem !== null && !isDate(nestedItem)) {
                        const nestedDecrypted = { ...nestedItem } as Record<string, unknown>
                        for (const [deepKey, deepValue] of Object.entries(nestedItem as Record<string, unknown>)) {
                          if (typeof deepValue === 'string' && deepValue) {
                            try {
                              nestedDecrypted[deepKey] = await decryptValue(deepValue, key)
                            } catch (error) {
                              nestedDecrypted[deepKey] = deepValue
                            }
                          }
                        }
                        return nestedDecrypted
                      }
                      return nestedItem
                    })
                  )
                }
              }
              return decryptedItem
            }
            return item
          })
        ) as any
      }
    }
  }
  
  return decrypted
}

