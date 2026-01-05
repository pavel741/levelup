/**
 * MongoDB CSFLE Key Management
 * 
 * For development: Uses local key management (keys stored in MongoDB)
 * For production: Should be migrated to AWS KMS, Azure Key Vault, or GCP KMS
 */

import { MongoClient, Binary, ClientEncryption } from 'mongodb'

// Key management configuration
const KEY_VAULT_NAMESPACE = 'encryption.__keyVault'
const KMS_PROVIDER = 'local' // For dev - use 'aws', 'azure', or 'gcp' for production

// Local key management (development only)
// In production, use a proper KMS provider
let localMasterKey: Buffer | null = null
let clientEncryptionInstance: ClientEncryption | null = null

/**
 * Initialize local master key for development
 * In production, this should come from a KMS provider
 */
function getLocalMasterKey(): Buffer {
  if (!localMasterKey) {
    // Generate or load a local master key
    // For dev: Use a fixed key (stored in env var)
    // For production: NEVER use this - use KMS instead
    const keyFromEnv = process.env.MONGODB_LOCAL_MASTER_KEY
    
    if (keyFromEnv) {
      // Key should be base64 encoded 96-byte key
      localMasterKey = Buffer.from(keyFromEnv, 'base64')
    } else {
      // Generate a new key for dev (WARNING: This will be different each time!)
      // In production, you MUST use a KMS provider
      console.warn('⚠️ MONGODB_LOCAL_MASTER_KEY not set. Generating a temporary key for dev.')
      console.warn('⚠️ WARNING: This key will be lost on restart. Set MONGODB_LOCAL_MASTER_KEY in .env.local')
      localMasterKey = Buffer.alloc(96)
      require('crypto').randomFillSync(localMasterKey)
    }
    
    if (localMasterKey.length !== 96) {
      throw new Error('Local master key must be 96 bytes (base64 encoded)')
    }
  }
  
  return localMasterKey
}

/**
 * Get KMS provider configuration
 */
export function getKmsProviders() {
  if (process.env.NODE_ENV === 'production' && KMS_PROVIDER === 'local') {
    console.warn('⚠️ WARNING: Using local key management in production is not recommended!')
    console.warn('⚠️ Please configure a proper KMS provider (AWS KMS, Azure Key Vault, or GCP KMS)')
  }
  
  return {
    local: {
      key: getLocalMasterKey(),
    },
  }
}

/**
 * Get or create ClientEncryption instance
 */
export function getClientEncryption(client: MongoClient): ClientEncryption {
  if (!clientEncryptionInstance) {
    clientEncryptionInstance = new ClientEncryption(client, {
      keyVaultNamespace: KEY_VAULT_NAMESPACE,
      kmsProviders: getKmsProviders(),
    })
  }
  return clientEncryptionInstance
}

/**
 * Create or retrieve a data encryption key for a user
 * Each user gets their own encryption key
 */
export async function getUserDataEncryptionKey(
  client: MongoClient,
  userId: string
): Promise<Binary> {
  const encryption = getClientEncryption(client)
  
  // Check if key already exists for this user
  const keyVaultCollection = client
    .db('encryption')
    .collection('__keyVault')
  
  const existingKey = await keyVaultCollection.findOne({
    'keyAltNames': userId,
  })
  
  if (existingKey) {
    return existingKey._id as unknown as Binary
  }
  
  // Create a new data encryption key for this user
  const dataKeyId = await encryption.createDataKey('local', {
    keyAltNames: [userId],
  })
  
  console.log(`✅ Created encryption key for user: ${userId}`)
  return dataKeyId
}

/**
 * Get existing data encryption key for a user
 */
export async function getExistingUserDataEncryptionKey(
  client: MongoClient,
  userId: string
): Promise<Binary | null> {
  const keyVaultCollection = client
    .db('encryption')
    .collection('__keyVault')
  
  const keyDoc = await keyVaultCollection.findOne({
    'keyAltNames': userId,
  })
  
  if (keyDoc && keyDoc._id) {
    return keyDoc._id as unknown as Binary
  }
  
  return null
}

export { KEY_VAULT_NAMESPACE, KMS_PROVIDER }

