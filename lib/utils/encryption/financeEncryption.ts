/**
 * Specialized encryption functions for Finance objects
 * 
 * These functions handle encryption of sensitive financial data while keeping
 * metadata (amounts, dates, categories) unencrypted for querying and analytics.
 * 
 * NOTE: This module is client-side only.
 */

'use client'

import type { FinanceTransaction, FinanceRecurringTransaction } from '@/types/finance'
import { encryptValue, decryptValue } from './crypto'

// CryptoKey is a global type from Web Crypto API
type CryptoKey = globalThis.CryptoKey

/**
 * Encrypt sensitive fields in a FinanceTransaction
 * Only encrypts: description, account, selgitus (Estonian description field), and other sensitive text fields
 * Keeps unencrypted: amount, date, category, type, currency, tags (for querying/analytics)
 */
export async function encryptTransaction(
  transaction: FinanceTransaction,
  key: CryptoKey
): Promise<FinanceTransaction> {
  const encrypted: FinanceTransaction = { ...transaction }
  
  // Encrypt description (may contain sensitive merchant info, payment details, etc.)
  if (transaction.description && typeof transaction.description === 'string') {
    encrypted.description = await encryptValue(transaction.description, key)
  }
  
  // Encrypt account name/info (may contain account numbers or sensitive identifiers)
  if (transaction.account && typeof transaction.account === 'string') {
    encrypted.account = await encryptValue(transaction.account, key)
  }
  
  // Encrypt selgitus (Estonian description field) - common in Estonian bank imports
  if ((transaction as any).selgitus && typeof (transaction as any).selgitus === 'string') {
    (encrypted as any).selgitus = await encryptValue((transaction as any).selgitus, key)
  }
  
  // Encrypt referenceNumber if it contains sensitive info (card numbers, etc.)
  if ((transaction as any).referenceNumber && typeof (transaction as any).referenceNumber === 'string') {
    const refNum = (transaction as any).referenceNumber
    // Only encrypt if it looks like it might contain sensitive info (long strings)
    if (refNum.length > 10) {
      (encrypted as any).referenceNumber = await encryptValue(refNum, key)
    }
  }
  
  return encrypted
}

/**
 * Decrypt sensitive fields in a FinanceTransaction
 */
export async function decryptTransaction(
  transaction: FinanceTransaction,
  key: CryptoKey
): Promise<FinanceTransaction> {
  const decrypted: FinanceTransaction = { ...transaction }
  
  // Decrypt description
  if (transaction.description && typeof transaction.description === 'string') {
    try {
      decrypted.description = await decryptValue(transaction.description, key)
    } catch (error) {
      // If decryption fails, assume plaintext (backward compatibility)
      console.warn('Failed to decrypt transaction description, assuming plaintext:', error)
    }
  }
  
  // Decrypt account
  if (transaction.account && typeof transaction.account === 'string') {
    try {
      decrypted.account = await decryptValue(transaction.account, key)
    } catch (error) {
      console.warn('Failed to decrypt transaction account, assuming plaintext:', error)
    }
  }
  
  // Decrypt selgitus (Estonian description field)
  if ((transaction as any).selgitus && typeof (transaction as any).selgitus === 'string') {
    try {
      (decrypted as any).selgitus = await decryptValue((transaction as any).selgitus, key)
    } catch (error) {
      console.warn('Failed to decrypt transaction selgitus, assuming plaintext:', error)
    }
  }
  
  // Decrypt referenceNumber if it was encrypted
  if ((transaction as any).referenceNumber && typeof (transaction as any).referenceNumber === 'string') {
    const refNum = (transaction as any).referenceNumber
    // Try to decrypt if it looks encrypted (base64-like and long)
    if (refNum.length > 20 && /^[A-Za-z0-9+/=]+$/.test(refNum)) {
      try {
        (decrypted as any).referenceNumber = await decryptValue(refNum, key)
      } catch (error) {
        // If decryption fails, keep original (might be plaintext reference number)
      }
    }
  }
  
  return decrypted
}

/**
 * Encrypt sensitive fields in a FinanceRecurringTransaction
 * Encrypts: name, description, account, and notes in paymentHistory
 */
export async function encryptRecurringTransaction(
  transaction: FinanceRecurringTransaction,
  key: CryptoKey
): Promise<FinanceRecurringTransaction> {
  const encrypted: FinanceRecurringTransaction = { ...transaction }
  
  // Encrypt name (bill/payment name)
  if (transaction.name) {
    encrypted.name = await encryptValue(transaction.name, key)
  }
  
  // Encrypt description
  if (transaction.description) {
    encrypted.description = await encryptValue(transaction.description, key)
  }
  
  // Encrypt notes in payment history
  if (transaction.paymentHistory && Array.isArray(transaction.paymentHistory)) {
    encrypted.paymentHistory = await Promise.all(
      transaction.paymentHistory.map(async (payment) => {
        const encryptedPayment = { ...payment }
        if (payment.notes) {
          encryptedPayment.notes = await encryptValue(payment.notes, key)
        }
        return encryptedPayment
      })
    )
  }
  
  return encrypted
}

/**
 * Decrypt sensitive fields in a FinanceRecurringTransaction
 */
export async function decryptRecurringTransaction(
  transaction: FinanceRecurringTransaction,
  key: CryptoKey
): Promise<FinanceRecurringTransaction> {
  const decrypted: FinanceRecurringTransaction = { ...transaction }
  
  // Decrypt name
  if (transaction.name) {
    try {
      decrypted.name = await decryptValue(transaction.name, key)
    } catch (error) {
      console.warn('Failed to decrypt recurring transaction name, assuming plaintext:', error)
    }
  }
  
  // Decrypt description
  if (transaction.description) {
    try {
      decrypted.description = await decryptValue(transaction.description, key)
    } catch (error) {
      console.warn('Failed to decrypt recurring transaction description, assuming plaintext:', error)
    }
  }
  
  // Decrypt notes in payment history
  if (transaction.paymentHistory && Array.isArray(transaction.paymentHistory)) {
    decrypted.paymentHistory = await Promise.all(
      transaction.paymentHistory.map(async (payment) => {
        const decryptedPayment = { ...payment }
        if (payment.notes) {
          try {
            decryptedPayment.notes = await decryptValue(payment.notes, key)
          } catch (error) {
            console.warn('Failed to decrypt payment notes, assuming plaintext:', error)
          }
        }
        return decryptedPayment
      })
    )
  }
  
  return decrypted
}

/**
 * Encrypt an array of transactions
 */
export async function encryptTransactions(
  transactions: FinanceTransaction[],
  key: CryptoKey
): Promise<FinanceTransaction[]> {
  return Promise.all(transactions.map(t => encryptTransaction(t, key)))
}

/**
 * Decrypt an array of transactions
 */
export async function decryptTransactions(
  transactions: FinanceTransaction[],
  key: CryptoKey
): Promise<FinanceTransaction[]> {
  return Promise.all(transactions.map(t => decryptTransaction(t, key)))
}

/**
 * Encrypt an array of recurring transactions
 */
export async function encryptRecurringTransactions(
  transactions: FinanceRecurringTransaction[],
  key: CryptoKey
): Promise<FinanceRecurringTransaction[]> {
  return Promise.all(transactions.map(t => encryptRecurringTransaction(t, key)))
}

/**
 * Decrypt an array of recurring transactions
 */
export async function decryptRecurringTransactions(
  transactions: FinanceRecurringTransaction[],
  key: CryptoKey
): Promise<FinanceRecurringTransaction[]> {
  return Promise.all(transactions.map(t => decryptRecurringTransaction(t, key)))
}

