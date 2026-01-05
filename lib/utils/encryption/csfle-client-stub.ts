/**
 * Client-side stub for encryption modules
 * These modules are server-only and will be replaced during client builds
 */

import type { MongoClient, Binary, ClientEncryption } from 'mongodb'

// Return proper types so TypeScript doesn't complain
// These will never actually be called on client-side
export function getClientEncryption(_client: MongoClient): ClientEncryption {
  throw new Error('Encryption modules are server-only')
}

export async function getUserDataEncryptionKey(
  _client: MongoClient,
  _userId: string
): Promise<Binary> {
  throw new Error('Encryption modules are server-only')
}

export async function getExistingUserDataEncryptionKey(
  _client: MongoClient,
  _userId: string
): Promise<Binary | null> {
  throw new Error('Encryption modules are server-only')
}

export function getKmsProviders(): { local: { key: Buffer } } {
  throw new Error('Encryption modules are server-only')
}

export const KEY_VAULT_NAMESPACE = ''
export const KMS_PROVIDER = 'local'

