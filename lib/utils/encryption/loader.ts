/**
 * Dynamic loader for encryption modules
 * This allows encryption to be loaded only client-side at runtime
 */

'use client'

// Type definitions for encryption functions
export type CryptoKey = globalThis.CryptoKey

let encryptionModules: {
  ensureUserHasEncryptionKey: (userId: string) => Promise<CryptoKey>
  isEncryptionEnabled: () => boolean
  encryptRoutine: (routine: any, key: CryptoKey) => Promise<any>
  decryptRoutine: (routine: any, key: CryptoKey) => Promise<any>
  encryptTransaction: (transaction: any, key: CryptoKey) => Promise<any>
  decryptTransaction: (transaction: any, key: CryptoKey) => Promise<any>
  encryptTransactions: (transactions: any[], key: CryptoKey) => Promise<any[]>
  decryptTransactions: (transactions: any[], key: CryptoKey) => Promise<any[]>
  encryptRecurringTransaction: (transaction: any, key: CryptoKey) => Promise<any>
  decryptRecurringTransactions: (transactions: any[], key: CryptoKey) => Promise<any[]>
  encryptObject: (obj: any, fields: string[], key: CryptoKey) => Promise<any>
  decryptObject: (obj: any, fields: string[], key: CryptoKey) => Promise<any>
} | null = null

let loadingPromise: Promise<void> | null = null

/**
 * Load encryption modules dynamically (client-side only)
 */
async function loadEncryptionModules(): Promise<void> {
  if (typeof window === 'undefined') {
    // Server-side: create no-op stubs
    encryptionModules = {
      ensureUserHasEncryptionKey: async () => null as any,
      isEncryptionEnabled: () => false,
      encryptRoutine: async (routine) => routine,
      decryptRoutine: async (routine) => routine,
      encryptTransaction: async (transaction) => transaction,
      decryptTransaction: async (transaction) => transaction,
      encryptTransactions: async (transactions) => transactions,
      decryptTransactions: async (transactions) => transactions,
      encryptRecurringTransaction: async (transaction) => transaction,
      decryptRecurringTransactions: async (transactions) => transactions,
      encryptObject: async (obj) => obj,
      decryptObject: async (obj) => obj,
    }
    return
  }

  if (encryptionModules) {
    return // Already loaded
  }

  if (loadingPromise) {
    return loadingPromise // Already loading
  }

  loadingPromise = (async () => {
    try {
      // Use Function constructor to create truly dynamic imports that webpack can't analyze
      // This prevents Next.js from trying to resolve these modules during server-side builds
      const dynamicImport = (moduleName: string) => {
        // Use Function constructor to prevent webpack from analyzing the import
        return new Function('specifier', 'return import(specifier)')(`./${moduleName}`)
      }
      
      const [
        keyManager,
        config,
        routineEncryption,
        financeEncryption,
        crypto,
      ] = await Promise.all([
        dynamicImport('keyManager'),
        dynamicImport('config'),
        dynamicImport('routineEncryption'),
        dynamicImport('financeEncryption'),
        dynamicImport('crypto'),
      ])

      encryptionModules = {
        ensureUserHasEncryptionKey: keyManager.ensureUserHasEncryptionKey,
        isEncryptionEnabled: config.isEncryptionEnabled,
        encryptRoutine: routineEncryption.encryptRoutine,
        decryptRoutine: routineEncryption.decryptRoutine,
        encryptTransaction: financeEncryption.encryptTransaction,
        decryptTransaction: financeEncryption.decryptTransaction,
        encryptTransactions: financeEncryption.encryptTransactions,
        decryptTransactions: financeEncryption.decryptTransactions,
        encryptRecurringTransaction: financeEncryption.encryptRecurringTransaction,
        decryptRecurringTransactions: financeEncryption.decryptRecurringTransactions,
        encryptObject: crypto.encryptObject,
        decryptObject: crypto.decryptObject,
      }
    } catch (error) {
      console.warn('Failed to load encryption modules:', error)
      // Fallback to no-op stubs
      encryptionModules = {
        ensureUserHasEncryptionKey: async () => null as any,
        isEncryptionEnabled: () => false,
        encryptRoutine: async (routine) => routine,
        decryptRoutine: async (routine) => routine,
        encryptTransaction: async (transaction) => transaction,
        decryptTransaction: async (transaction) => transaction,
        encryptTransactions: async (transactions) => transactions,
        decryptTransactions: async (transactions) => transactions,
        encryptRecurringTransaction: async (transaction) => transaction,
        decryptRecurringTransactions: async (transactions) => transactions,
        encryptObject: async (obj) => obj,
        decryptObject: async (obj) => obj,
      }
    }
  })()

  return loadingPromise
}

/**
 * Get encryption modules (loads them if not already loaded)
 */
export async function getEncryptionModules() {
  await loadEncryptionModules()
  if (!encryptionModules) {
    throw new Error('Encryption modules failed to load')
  }
  return encryptionModules
}

/**
 * Check if encryption is enabled (synchronous check)
 * Returns true on client-side by default (encryption is enabled in config)
 * Returns false on server-side (encryption modules are browser-only)
 */
export function isEncryptionEnabledSync(): boolean {
  // Always return false on server-side
  if (typeof window === 'undefined') {
    return false
  }
  // On client-side, encryption is enabled by default
  // If modules are loaded, use their check; otherwise assume enabled
  return encryptionModules?.isEncryptionEnabled() ?? true
}

