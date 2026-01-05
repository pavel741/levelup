/**
 * Client-side stub for encryption modules
 * These modules are server-only and will be replaced during client builds
 */

import type { MongoClient } from 'mongodb'

export function getClientEncryption(_client: MongoClient): never {
  throw new Error('Encryption modules are server-only')
}

export async function getUserDataEncryptionKey(
  _client: MongoClient,
  _userId: string
): Promise<never> {
  throw new Error('Encryption modules are server-only')
}

export async function getExistingUserDataEncryptionKey(
  _client: MongoClient,
  _userId: string
): Promise<never> {
  throw new Error('Encryption modules are server-only')
}

export function getKmsProviders(): never {
  throw new Error('Encryption modules are server-only')
}

export const KEY_VAULT_NAMESPACE = ''
export const KMS_PROVIDER = 'local'

