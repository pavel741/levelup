/**
 * Multi-Currency Support
 * Handles currency conversion and multi-currency transactions
 */

// Exchange rates (would typically come from an API in production)
// Using approximate rates - in production, fetch from exchange rate API
const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1.0, // Base currency
  USD: 1.08,
  GBP: 0.85,
  SEK: 11.5,
  DKK: 7.45,
  NOK: 11.8,
  PLN: 4.3,
  CHF: 0.95,
  JPY: 160.0,
}

export interface CurrencyConversion {
  originalAmount: number
  originalCurrency: string
  convertedAmount: number
  targetCurrency: string
  exchangeRate: number
  date: Date
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number> = EXCHANGE_RATES
): number {
  if (fromCurrency === toCurrency) return amount
  if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return amount

  // Convert to base currency (EUR), then to target currency
  const baseAmount = amount / exchangeRates[fromCurrency]
  return baseAmount * exchangeRates[toCurrency]
}

/**
 * Get exchange rate between two currencies
 */
export function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number> = EXCHANGE_RATES
): number {
  if (fromCurrency === toCurrency) return 1.0
  if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return 1.0

  return exchangeRates[toCurrency] / exchangeRates[fromCurrency]
}

/**
 * Format currency amount with symbol
 */
export function formatCurrencyWithSymbol(
  amount: number,
  currency: string = 'EUR'
): string {
  const currencyMap: Record<string, { symbol: string; code: string }> = {
    EUR: { symbol: '€', code: 'EUR' },
    USD: { symbol: '$', code: 'USD' },
    GBP: { symbol: '£', code: 'GBP' },
    SEK: { symbol: 'kr', code: 'SEK' },
    DKK: { symbol: 'kr', code: 'DKK' },
    NOK: { symbol: 'kr', code: 'NOK' },
    PLN: { symbol: 'zł', code: 'PLN' },
    CHF: { symbol: 'CHF', code: 'CHF' },
    JPY: { symbol: '¥', code: 'JPY' },
  }

  const currencyInfo = currencyMap[currency] || currencyMap.EUR
  const locale = currency === 'USD' ? 'en-US' : currency === 'GBP' ? 'en-GB' : 'et-EE'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyInfo.code,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount)
}

/**
 * Detect currency from transaction data
 */
export function detectCurrency(transaction: {
  currency?: string
  description?: string
  amount?: number
}): string {
  // Check explicit currency field
  if (transaction.currency) {
    return transaction.currency.toUpperCase()
  }

  // Try to detect from description
  const description = (transaction.description || '').toUpperCase()
  const currencyPatterns: Record<string, RegExp> = {
    USD: /\$|USD|US\s*DOLLAR/i,
    GBP: /£|GBP|POUND/i,
    EUR: /€|EUR|EURO/i,
    SEK: /SEK|SWEDISH/i,
    DKK: /DKK|DANISH/i,
    NOK: /NOK|NORWEGIAN/i,
    PLN: /PLN|POLISH|ZŁ/i,
    CHF: /CHF|SWISS/i,
    JPY: /¥|JPY|YEN/i,
  }

  for (const [currency, pattern] of Object.entries(currencyPatterns)) {
    if (pattern.test(description)) {
      return currency
    }
  }

  // Default to EUR
  return 'EUR'
}

/**
 * Normalize all transactions to a base currency
 */
export function normalizeToBaseCurrency(
  transactions: Array<{ amount: number; currency?: string; [key: string]: any }>,
  baseCurrency: string = 'EUR'
): Array<{ amount: number; originalCurrency: string; convertedAmount: number; [key: string]: any }> {
  return transactions.map((tx) => {
    const detectedCurrency = detectCurrency(tx)
    const originalAmount = Math.abs(Number(tx.amount) || 0)
    const convertedAmount = convertCurrency(originalAmount, detectedCurrency, baseCurrency)
    
    // Preserve sign
    const sign = Number(tx.amount) < 0 ? -1 : 1

    return {
      ...tx,
      amount: sign * convertedAmount,
      originalAmount: sign * originalAmount,
      originalCurrency: detectedCurrency,
      convertedAmount: sign * convertedAmount,
    }
  })
}

