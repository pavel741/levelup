/**
 * Smart transaction categorization based on patterns in transaction data
 */

export interface CategorizationResult {
  category: string
  confidence: 'high' | 'medium' | 'low'
  reason?: string
}

/**
 * Categorize transaction based on description, reference number, and other fields
 */
export function categorizeTransaction(
  description: string = '',
  referenceNumber?: string,
  recipientName?: string,
  amount?: number
): CategorizationResult {
  const desc = (description || '').trim()
  const refNum = (referenceNumber || '').trim()
  const recipient = (recipientName || '').trim()
  const combinedText = `${desc} ${refNum} ${recipient}`.toLowerCase()

  // Define patterns early so they can be used throughout the function
  const posPattern = /pos\s*:/i
  const cardPattern = /\d{4}\s+\d{2}\*+\s+\*+\s+\d{4}|\d{4}\s+\d{2}\*+\s+\d{4}/

  // PRIORITY ORDER:
  // 1. Card payment patterns (POS:, card numbers, ATM:) - highest priority
  // 2. Reference number (viitenumber) - if present and not empty, it's Bills
  // 3. Other patterns (loans, utilities, etc.)
  
  // IMPORTANT: Check POS: and ATM: in description AND combined text (which includes recipient)
  // This ensures we catch POS: even if it's in different parts of the transaction data
  const hasPosPattern = posPattern.test(desc) || posPattern.test(combinedText)
  const hasCardPattern = cardPattern.test(desc)
  const hasAtmPattern = /^atm\s*:/i.test(desc) || /^atm\s+/i.test(desc) || /atm\s*:/i.test(combinedText)
  
  // Check for POS: prefix → Card Payment (highest priority for card payments)
  if (hasPosPattern) {
    return {
      category: 'Card Payment',
      confidence: 'high',
      reason: 'POS: prefix detected (card payment)',
    }
  }

  // Check for card number patterns → Card Payment
  if (hasCardPattern) {
    return {
      category: 'Card Payment',
      confidence: 'high',
      reason: 'Card number pattern detected',
    }
  }

  // Check for ATM: prefix → ATM Withdrawal
  if (hasAtmPattern) {
    return {
      category: 'ATM Withdrawal',
      confidence: 'high',
      reason: 'ATM: prefix detected',
    }
  }

  // 1. Check for reference number (viitenumber) → Bills
  // Rule: If viitenumber is not null/empty, it's a Bills transaction
  // BUT: Only if NO POS: or ATM: patterns were found above
  if (refNum && refNum.trim().length > 0) {
    // Clean the reference number (remove spaces)
    const cleanRefNum = refNum.replace(/\s+/g, '').trim()
    
    // If reference number exists and is not empty, it's a bill
    // Only validate it looks like a reference number (contains digits)
    // BUT: Double-check that we don't have POS: or ATM: patterns (should have been caught above)
    if (cleanRefNum.length > 0 && /\d/.test(cleanRefNum)) {
      // Final safety check: make sure we didn't miss POS: or ATM: patterns
      if (!hasPosPattern && !hasAtmPattern && !hasCardPattern) {
        return {
          category: 'Bills',
          confidence: 'high',
          reason: 'Reference number (viitenumber) detected',
        }
      }
    }
  }

  // 2. Check for loan patterns → Kodulaen category
  // Pattern: "laenu 33627" or similar loan references
  if (/laenu\s+\d+/i.test(combinedText) || /kodulaen/i.test(combinedText)) {
    return {
      category: 'Kodulaen',
      confidence: 'high',
      reason: 'Loan pattern detected',
    }
  }

  // 3. Check for utility/energy self-service → Kommunaalid category
  // Pattern: "iseteenindus.energia" (Estonian energy self-service)
  if (/iseteenindus\.energia/i.test(combinedText)) {
    return {
      category: 'Kommunaalid',
      confidence: 'high',
      reason: 'Energy self-service pattern detected',
    }
  }

  // 4. Check for PSD2/KLIX payment references → ESTO category
  // Pattern: "PSD2 - KLIX-521110689641" or similar payment references
  if (/psd2\s*-/i.test(combinedText) || /klix/i.test(combinedText)) {
    if (!posPattern.test(combinedText) && !cardPattern.test(desc)) {
      return {
        category: 'ESTO',
        confidence: 'high',
        reason: 'PSD2/KLIX payment reference detected',
      }
    }
  }

  // 5. Check description for reference number patterns
  // Estonian reference numbers: usually 7-20 digits, sometimes with spaces
  // Only categorize as Bills if NO card payment patterns were found above
  const refNumPattern = /\b\d{7,20}\b/
  if (refNumPattern.test(desc)) {
    // Check if it's not a card number or date
    const potentialRefNum = desc.match(refNumPattern)?.[0] || ''
    if (potentialRefNum.length >= 7 && potentialRefNum.length <= 20) {
      // Make sure it's not a date (YYYYMMDD format)
      if (!/^\d{8}$/.test(potentialRefNum) || !isValidDate(potentialRefNum)) {
        // Double-check: if description contains card payment patterns, don't categorize as Bills
        if (!cardPattern.test(desc) && !posPattern.test(desc)) {
          return {
            category: 'Bills',
            confidence: 'high',
            reason: 'Reference number pattern in description',
          }
        }
      }
    }
  }

  // 8. Check for explicit ATM patterns (without prefix) → ATM Withdrawal
  const atmPatterns = [
    /atm\s+withdrawal/i,
    /atm\s+transaction/i,
    /automaat/i,
    /^atm\s*:/i,
    /withdrawal\s+at\s+atm/i,
    /atm\s+.*\d{4}\s+\d{2}\*+/i, // ATM with card number pattern
    /automaat.*\d{4}\s+\d{2}\*+/i, // AUTOMAAT with card number pattern
  ]
  
  for (const pattern of atmPatterns) {
    if (pattern.test(combinedText)) {
      return {
        category: 'ATM Withdrawal',
        confidence: 'high',
        reason: 'ATM transaction detected',
      }
    }
  }

  // Check for ATM location patterns (common in Estonian banks)
  // Pattern: "ATM [location]" or "AUTOMAAT [location]" or "ATM: [location]"
  if (/^(atm|automaat)\s*:?\s+/i.test(desc)) {
    return {
      category: 'ATM Withdrawal',
      confidence: 'high',
      reason: 'ATM location pattern detected',
    }
  }

  // 9. Check for card number patterns WITHOUT "POS:" or "ATM:" prefix → Card Payment
  // Pattern: "5374 87** **** 4961, 17.12.2025 14:55:34" or "87** **** 4961, ..."
  // These are card payments (no POS: or ATM: prefix means it's a card payment)
  if (cardPattern.test(desc) && !posPattern.test(desc) && !/^atm\s*:/i.test(desc)) {
    // Check if it's followed by a date/time and merchant info (card payment)
    const dateTimePattern = /\d{1,2}\.\d{1,2}\.\d{4}\s+\d{1,2}:\d{2}(:\d{2})?/
    if (dateTimePattern.test(desc)) {
      // If it has merchant/store name after the timestamp, it's a card payment
      const hasMerchantInfo = desc.length > 40 // Likely has merchant info if description is long
      if (hasMerchantInfo) {
        return {
          category: 'Card Payment',
          confidence: 'high',
          reason: 'Card payment with timestamp and merchant info detected',
        }
      }
      return {
        category: 'Card Payment',
        confidence: 'medium',
        reason: 'Card payment with timestamp detected',
      }
    }
    // If it has a card pattern and merchant name, it's likely a card payment
    const hasMerchantInfo = desc.length > 30
    if (hasMerchantInfo) {
      return {
        category: 'Card Payment',
        confidence: 'medium',
        reason: 'Card number pattern with merchant info detected',
      }
    }
  }

  // 10. Check for common bill-related keywords and patterns
  const billKeywords = [
    'arve', // invoice
    'makse', // payment
    'viitenumber', // reference number
    'viitenumber:', // reference number:
    'reference number',
    'reference:',
    'invoice',
    'bill',
    'utility',
    'kommunaal', // utilities
    'elekter', // electricity
    'vesi', // water
    'gaas', // gas
    'internet',
    'telefon', // phone
    'tv',
    'rent', // rent
    'üür', // rent (Estonian)
    'iseteenindus.energia', // Estonian energy self-service
    'psd2', // Payment Services Directive 2 (usually bills)
    'klix', // Payment system (usually bills)
    'blid', // Payment reference (usually bills)
    'staycool', // Utility company
  ]

  for (const keyword of billKeywords) {
    if (combinedText.includes(keyword)) {
      // Check if it's not a card payment
      if (!posPattern.test(combinedText) && !cardPattern.test(desc)) {
        return {
          category: 'Bills',
          confidence: 'medium',
          reason: `Bill-related keyword: ${keyword}`,
        }
      }
    }
  }

  // Check for other payment reference patterns (like "Makse /BLID/...")
  if (/makse\s*\/|blid/i.test(desc)) {
    if (!posPattern.test(combinedText) && !cardPattern.test(desc)) {
      return {
        category: 'Bills',
        confidence: 'high',
        reason: 'Payment reference pattern detected',
      }
    }
  }

  // Check for long alphanumeric codes that look like payment references
  // Pattern: "1170812740 StayCool" or similar
  if (/^\d{8,}\s+[A-Z]/i.test(desc) || /^[A-Z0-9]{10,}\s/i.test(desc)) {
    if (!posPattern.test(combinedText) && !cardPattern.test(desc)) {
      return {
        category: 'Bills',
        confidence: 'medium',
        reason: 'Payment reference code pattern detected',
      }
    }
  }

  // 11. Check for card-related keywords (but not POS/ATM)
  const cardKeywords = [
    'kaart', // card (Estonian)
    'card payment',
    'purchase',
    'ost', // purchase (Estonian)
    'makse kaardiga', // payment with card
  ]

  for (const keyword of cardKeywords) {
    if (combinedText.includes(keyword)) {
      // Make sure it's not an ATM withdrawal
      if (!atmPatterns.some(p => p.test(combinedText))) {
        return {
          category: 'Card Payment',
          confidence: 'medium',
          reason: `Card-related keyword: ${keyword}`,
        }
      }
    }
  }

  // No specific pattern found
  return {
    category: 'Other',
    confidence: 'low',
    reason: 'No specific pattern detected',
  }
}

/**
 * Helper function to check if a string could be a valid date
 */
function isValidDate(dateStr: string): boolean {
  if (dateStr.length !== 8) return false
  
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6))
  const day = parseInt(dateStr.substring(6, 8))
  
  if (year < 1900 || year > 2100) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/**
 * Get suggested category for a transaction
 * Returns the category name or null if no suggestion
 */
export function getSuggestedCategory(
  description: string = '',
  referenceNumber?: string,
  recipientName?: string,
  amount?: number
): string | null {
  const result = categorizeTransaction(description, referenceNumber, recipientName, amount)
  
  // Only return high or medium confidence suggestions
  if (result.confidence === 'high' || result.confidence === 'medium') {
    return result.category
  }
  
  return null
}

