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
 * Only encrypts: description, account
 * Keeps unencrypted: amount, date, category, type, currency, tags (for querying/analytics)
 */
export async function encryptTransaction(
  transaction: FinanceTransaction,
  key: CryptoKey
): Promise<FinanceTransaction> {
  const encrypted: FinanceTransaction = { ...transaction }
  
  // Encrypt description (may contain sensitive merchant info, payment details, etc.)
  if (transaction.description) {
    encrypted.description = await encryptValue(transaction.description, key)
  }
  
  // Encrypt account name/info (may contain account numbers or sensitive identifiers)
  if (transaction.account) {
    encrypted.account = await encryptValue(transaction.account, key)
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
  if (transaction.description) {
    try {
      decrypted.description = await decryptValue(transaction.description, key)
    } catch (error) {
      // If decryption fails, assume plaintext (backward compatibility)
      console.warn('Failed to decrypt transaction description, assuming plaintext:', error)
    }
  }
  
  // Decrypt account
  if (transaction.account) {
    try {
      decrypted.account = await decryptValue(transaction.account, key)
    } catch (error) {
      console.warn('Failed to decrypt transaction account, assuming plaintext:', error)
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

