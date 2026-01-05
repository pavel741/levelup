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
  
  // Encrypt recipientName (may contain sensitive recipient information)
  const recipientName = (transaction as any).recipientName
  if (recipientName && typeof recipientName === 'string') {
    const encryptedRecipientName = await encryptValue(recipientName, key)
    ;(encrypted as any).recipientName = encryptedRecipientName
  }
  
  // Encrypt selgitus (Estonian description field) - common in Estonian bank imports
  const selgitus = (transaction as any).selgitus
  if (selgitus && typeof selgitus === 'string') {
    const encryptedSelgitus = await encryptValue(selgitus, key)
    ;(encrypted as any).selgitus = encryptedSelgitus
  }
  
  // Encrypt referenceNumber if it contains sensitive info (card numbers, etc.)
  const referenceNumber = (transaction as any).referenceNumber
  if (referenceNumber && typeof referenceNumber === 'string') {
    // Only encrypt if it looks like it might contain sensitive info (long strings)
    if (referenceNumber.length > 10) {
      const encryptedRef = await encryptValue(referenceNumber, key)
      ;(encrypted as any).referenceNumber = encryptedRef
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
  
  // Decrypt description (decryptValue now handles plaintext gracefully)
  if (transaction.description && typeof transaction.description === 'string') {
    decrypted.description = await decryptValue(transaction.description, key)
  }
  
  // Decrypt account (decryptValue now handles plaintext gracefully)
  if (transaction.account && typeof transaction.account === 'string') {
    decrypted.account = await decryptValue(transaction.account, key)
  }
  
  // Decrypt recipientName (decryptValue now handles plaintext gracefully)
  const recipientName = (transaction as any).recipientName
  if (recipientName && typeof recipientName === 'string') {
    (decrypted as any).recipientName = await decryptValue(recipientName, key)
  }
  
  // Decrypt selgitus (decryptValue now handles plaintext gracefully)
  const selgitus = (transaction as any).selgitus
  if (selgitus && typeof selgitus === 'string') {
    (decrypted as any).selgitus = await decryptValue(selgitus, key)
  }
  
  // Decrypt referenceNumber if it was encrypted (decryptValue handles plaintext gracefully)
  const referenceNumber = (transaction as any).referenceNumber
  if (referenceNumber && typeof referenceNumber === 'string') {
    (decrypted as any).referenceNumber = await decryptValue(referenceNumber, key)
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
  
  // Decrypt name (decryptValue now handles plaintext gracefully)
  if (transaction.name) {
    decrypted.name = await decryptValue(transaction.name, key)
  }
  
  // Decrypt description (decryptValue now handles plaintext gracefully)
  if (transaction.description) {
    decrypted.description = await decryptValue(transaction.description, key)
  }
  
  // Decrypt notes in payment history (decryptValue now handles plaintext gracefully)
  if (transaction.paymentHistory && Array.isArray(transaction.paymentHistory)) {
    decrypted.paymentHistory = await Promise.all(
      transaction.paymentHistory.map(async (payment) => {
        const decryptedPayment = { ...payment }
        if (payment.notes) {
          decryptedPayment.notes = await decryptValue(payment.notes, key)
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

