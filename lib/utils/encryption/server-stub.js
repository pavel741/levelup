// Server-side stub for encryption modules
// This file is used by webpack to replace encryption modules on the server-side

module.exports = {
  // Key Manager
  initializeUserEncryptionKey: async () => null,
  getUserEncryptionKey: async () => null,
  hasEncryptionKey: () => false,
  removeUserEncryptionKey: () => {},
  ensureUserHasEncryptionKey: async () => null,
  
  // Config
  isEncryptionEnabled: () => false,
  ENCRYPTION_CONFIG: {
    routines: { encryptFields: [] },
    workoutLogs: { encryptFields: [] },
    financeTransactions: { encryptFields: [] },
    financeRecurring: { encryptFields: [] },
  },
  
  // Crypto
  generateEncryptionKey: async () => null,
  exportKey: async () => '',
  importKey: async () => null,
  encryptValue: async (value) => value,
  decryptValue: async (value) => value,
  encryptObject: async (obj) => obj,
  decryptObject: async (obj) => obj,
  
  // Routine Encryption
  encryptRoutine: async (routine) => routine,
  decryptRoutine: async (routine) => routine,
  
  // Finance Encryption
  encryptTransaction: async (transaction) => transaction,
  decryptTransaction: async (transaction) => transaction,
  encryptRecurringTransaction: async (transaction) => transaction,
  decryptRecurringTransaction: async (transaction) => transaction,
  encryptTransactions: async (transactions) => transactions,
  decryptTransactions: async (transactions) => transactions,
  encryptRecurringTransactions: async (transactions) => transactions,
  decryptRecurringTransactions: async (transactions) => transactions,
}

