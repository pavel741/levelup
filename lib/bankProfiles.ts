// Estonian Bank CSV Format Profiles
// Each bank has different column names and formats

export interface BankProfile {
  id: string
  name: string
  displayName: string
  columnMapping: {
    date?: string[]
    amount?: string[]
    description?: string[]
    type?: string[]
    recipientName?: string[]
    recipientAccount?: string[]
    referenceNumber?: string[]
    archiveId?: string[]
    selgitus?: string[]
    category?: string[]
    documentNumber?: string[]
    clientAccount?: string[]
    serviceFee?: string[]
    currency?: string[]
    personalId?: string[]
  }
  delimiter?: string // Override default delimiter detection
  skipRows?: number // Number of header rows to skip
  encoding?: string
  dateFormat?: string // Date format hint
  amountFormat?: 'comma' | 'dot' | 'space' // How amounts are formatted
  hasDebitCreditIndicator?: boolean // If true, all amounts are positive, D/C column indicates expense/income
}

export const ESTONIAN_BANK_PROFILES: BankProfile[] = [
  {
    id: 'coop',
    name: 'Coop',
    displayName: 'Coop Pank',
    columnMapping: {
      date: ['kuupäev', 'date', 'kuupaev'],
      amount: ['summa', 'amount', 'summa eur', 'summa (eur)'],
      description: ['selgitus', 'description', 'kirjeldus', 'märkused'],
      type: ['deebet/kreedit (d/c)', 'deebet/kreedit', 'd/k', 'debit/credit', 'd c', 'dc', 'tüüp', 'type', 'd', 'k', 'deebet', 'kreedit'],
      recipientName: ['saaja/maksja nimi', 'saaja/maksja', 'saaja', 'recipient', 'saaja nimi', 'vastaspool'],
      recipientAccount: ['saaja/maksja konto', 'saaja konto', 'maksja konto'],
      referenceNumber: ['viitenumber', 'reference', 'viitenr', 'ref'],
      archiveId: ['arhiveerimistunnus', 'archive id', 'archiveid'],
      selgitus: ['selgitus', 'details'],
      documentNumber: ['dokumendi number', 'document number'],
      clientAccount: ['kliendi konto', 'client account'],
      serviceFee: ['teenustasu', 'service fee'],
      currency: ['valuuta', 'currency'],
      personalId: ['isikukood või registrikood', 'isikukood', 'registrikood', 'personal id'],
    },
    delimiter: ';',
    dateFormat: 'DD.MM.YYYY',
    amountFormat: 'comma',
    // Coop Pank already has negative amounts in CSV, so no D/C indicator needed
  },
  {
    id: 'seb',
    name: 'SEB',
    displayName: 'SEB Pank',
    columnMapping: {
      date: ['kuupäev', 'date', 'kuupaev'],
      amount: ['summa', 'amount', 'summa eur', 'summa (eur)'],
      description: ['selgitus', 'description', 'kirjeldus', 'märkused'],
      type: ['deebet/kreedit (d/c)', 'deebet/kreedit', 'd/k', 'debit/credit', 'd c', 'dc', 'deebet', 'kreedit'],
      recipientName: ['saaja/maksja nimi', 'saaja/maksja', 'saaja', 'recipient', 'saaja nimi', 'vastaspool'],
      recipientAccount: ['saaja/maksja konto', 'saaja konto', 'maksja konto'],
      referenceNumber: ['viitenumber', 'reference', 'viitenr', 'ref'],
      archiveId: ['arhiveerimistunnus', 'archive id', 'archiveid'],
      selgitus: ['selgitus', 'details'],
      documentNumber: ['dokumendi number', 'dokumendi number', 'document number'],
      clientAccount: ['kliendi konto', 'client account'],
      serviceFee: ['teenustasu', 'service fee'],
      currency: ['valuuta', 'currency'],
      personalId: ['isikukood või registrikood', 'isikukood', 'registrikood', 'personal id'],
    },
    delimiter: ';',
    dateFormat: 'DD.MM.YYYY',
    amountFormat: 'comma',
    hasDebitCreditIndicator: true, // SEB uses D/C indicator, all amounts are positive
  },
  {
    id: 'swedbank',
    name: 'Swedbank',
    displayName: 'Swedbank',
    columnMapping: {
      date: ['kuupäev', 'date', 'kuupaev', 'tehingu kuupäev'],
      amount: ['summa', 'amount', 'summa eur', 'summa (eur)', 'deebet', 'kreedit'],
      description: ['kirjeldus', 'description', 'selgitus', 'märkused', 'tehingu kirjeldus'],
      recipientName: ['saaja', 'recipient', 'saaja nimi', 'maksja'],
      referenceNumber: ['viitenumber', 'reference', 'viitenr', 'ref'],
      archiveId: ['arhiveerimistunnus', 'archive id', 'archiveid'],
      selgitus: ['selgitus', 'details', 'lisainfo'],
    },
    delimiter: ';',
    dateFormat: 'DD.MM.YYYY',
    amountFormat: 'comma',
  },
  {
    id: 'lhv',
    name: 'LHV',
    displayName: 'LHV Pank',
    columnMapping: {
      date: ['kuupäev', 'date', 'kuupaev', 'tehingu kuupäev'],
      amount: ['summa', 'amount', 'summa eur', 'summa (eur)'],
      description: ['kirjeldus', 'description', 'selgitus', 'märkused'],
      type: ['deebet/kreedit (d/c)', 'deebet/kreedit', 'd/k', 'debit/credit', 'd c', 'dc', 'tüüp', 'type', 'd', 'k', 'deebet', 'kreedit'],
      recipientName: ['saaja/maksja nimi', 'saaja/maksja', 'saaja', 'recipient', 'saaja nimi', 'maksja nimi', 'vastaspool'],
      recipientAccount: ['saaja/maksja konto', 'saaja konto', 'maksja konto'],
      referenceNumber: ['viitenumber', 'reference', 'viitenr', 'ref'],
      archiveId: ['kande viide', 'arhiveerimistunnus', 'archive id', 'archiveid'],
      selgitus: ['selgitus', 'details', 'lisainfo'],
      documentNumber: ['dokumendi number', 'document number'],
      clientAccount: ['kliendi konto', 'client account'],
      serviceFee: ['teenustasu', 'service fee'],
      currency: ['valuuta', 'currency'],
      personalId: ['isikukood või registrikood', 'isikukood', 'registrikood', 'personal id'],
    },
    delimiter: ',', // LHV uses comma delimiter, not semicolon
    dateFormat: 'YYYY-MM-DD', // LHV uses ISO date format
    amountFormat: 'dot', // Amounts use dot as decimal separator (e.g., -8.93)
    // LHV CSV has signed amounts (negative for expenses, positive for income)
    // D/C column exists but amounts are already signed, so we can use it for validation
  },
  {
    id: 'luminor',
    name: 'Luminor',
    displayName: 'Luminor',
    columnMapping: {
      date: ['kuupäev', 'date', 'kuupaev', 'tehingu kuupäev'],
      amount: ['summa', 'amount', 'summa eur', 'summa (eur)'],
      description: ['kirjeldus', 'description', 'selgitus', 'märkused'],
      recipientName: ['saaja', 'recipient', 'saaja nimi'],
      referenceNumber: ['viitenumber', 'reference', 'viitenr'],
      archiveId: ['arhiveerimistunnus', 'archive id', 'archiveid'],
      selgitus: ['selgitus', 'details'],
    },
    delimiter: ';',
    dateFormat: 'DD.MM.YYYY',
    amountFormat: 'comma',
  },
  {
    id: 'tbb',
    name: 'TBB',
    displayName: 'Täitev Pank',
    columnMapping: {
      date: ['kuupäev', 'date', 'kuupaev'],
      amount: ['summa', 'amount', 'summa eur'],
      description: ['kirjeldus', 'description', 'selgitus'],
      recipientName: ['saaja', 'recipient'],
      referenceNumber: ['viitenumber', 'reference'],
      archiveId: ['arhiveerimistunnus', 'archive id'],
      selgitus: ['selgitus', 'details'],
    },
    delimiter: ';',
    dateFormat: 'DD.MM.YYYY',
    amountFormat: 'comma',
  },
  {
    id: 'generic',
    name: 'Generic',
    displayName: 'Other Bank / Generic CSV',
    columnMapping: {
      date: ['date', 'kuupäev', 'kuupaev', 'transaction date'],
      amount: ['amount', 'summa', 'value', 'sum'],
      description: ['description', 'kirjeldus', 'selgitus', 'memo', 'note'],
      recipientName: ['recipient', 'saaja', 'payee', 'to'],
      referenceNumber: ['reference', 'viitenumber', 'ref', 'reference number'],
      archiveId: ['archive id', 'arhiveerimistunnus', 'archiveid', 'id'],
      selgitus: ['selgitus', 'details', 'additional info'],
    },
  },
]

/**
 * Detect which bank profile matches the CSV headers and sample data
 */
export function detectBankProfile(headers: string[], sampleData?: string[]): BankProfile | null {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/^["']+/, '').replace(/["']+$/, ''))
  const allHeadersText = normalizedHeaders.join(' ')
  
  // Pattern 1: Check for unique column combinations (highest priority)
  
  // LHV: Has "Kande viide" or "Konto teenusepakkuja viide" columns
  if (normalizedHeaders.includes('kande viide') || normalizedHeaders.includes('konto teenusepakkuja viide')) {
    const lhvProfile = ESTONIAN_BANK_PROFILES.find(p => p.id === 'lhv')
    if (lhvProfile) return lhvProfile
  }
  
  // COOP: Has "Kliendi nimi" column (unique to Coop)
  if (normalizedHeaders.includes('kliendi nimi')) {
    const coopProfile = ESTONIAN_BANK_PROFILES.find(p => p.id === 'coop')
    if (coopProfile) return coopProfile
  }
  
  // SEB: Has "Saaja panga kood" AND "Tüüp" columns (unique combination)
  if (normalizedHeaders.includes('saaja panga kood') && normalizedHeaders.includes('tüüp')) {
    const sebProfile = ESTONIAN_BANK_PROFILES.find(p => p.id === 'seb')
    if (sebProfile) return sebProfile
  }
  
  // Pattern 2: Check D/C column name differences
  // COOP uses "Deebet/Kreedit" (without "(D/C)")
  // SEB/LHV use "Deebet/Kreedit (D/C)" (with "(D/C)")
  const hasDcColumn = normalizedHeaders.some(h => h.includes('deebet/kreedit'))
  const hasDcWithParentheses = normalizedHeaders.some(h => h.includes('deebet/kreedit (d/c)'))
  
  if (hasDcColumn && !hasDcWithParentheses) {
    // Only "Deebet/Kreedit" without "(D/C)" - likely Coop
    const coopProfile = ESTONIAN_BANK_PROFILES.find(p => p.id === 'coop')
    if (coopProfile) return coopProfile
  }
  
  // Pattern 3: Check for explicit bank name matches
  // Check Coop first since it has similar column names to SEB
  const coopProfile = ESTONIAN_BANK_PROFILES.find(p => p.id === 'coop')
  if (coopProfile && (allHeadersText.includes('coop') || allHeadersText.includes('coop pank'))) {
    return coopProfile
  }
  
  // Check other banks by name
  for (const profile of ESTONIAN_BANK_PROFILES) {
    const bankNameLower = profile.name.toLowerCase()
    const bankDisplayNameLower = profile.displayName.toLowerCase()
    if (allHeadersText.includes(bankNameLower) || allHeadersText.includes(bankDisplayNameLower)) {
      return profile
    }
  }
  
  // Pattern 4: Analyze sample data if available (date format, amount format, archive ID format)
  if (sampleData && sampleData.length > 0) {
    const sampleRow = sampleData[0]
    
    // Check date format: LHV uses ISO format (YYYY-MM-DD), others use DD.MM.YYYY
    const isoDatePattern = /\d{4}-\d{2}-\d{2}/
    const dotDatePattern = /\d{2}\.\d{2}\.\d{4}/
    
    if (sampleRow.match(isoDatePattern) && !sampleRow.match(dotDatePattern)) {
      const lhvProfile = ESTONIAN_BANK_PROFILES.find(p => p.id === 'lhv')
      if (lhvProfile) return lhvProfile
    }
    
    // Check archive ID format: LHV uses long numeric (e.g., "2025010849780888")
    // SEB uses alphanumeric starting with "RO" (e.g., "RO4034453419L02")
    // Coop uses shorter alphanumeric (e.g., "1838A355")
    const lhvArchivePattern = /"\d{16}"/ // 16-digit numeric archive ID
    const sebArchivePattern = /"RO\d+[A-Z0-9]+"/ // Starts with RO
    const coopArchivePattern = /"[A-Z0-9]{8,10}"/ // 8-10 char alphanumeric
    
    if (sampleRow.match(lhvArchivePattern)) {
      const lhvProfile = ESTONIAN_BANK_PROFILES.find(p => p.id === 'lhv')
      if (lhvProfile) return lhvProfile
    }
    
    if (sampleRow.match(sebArchivePattern)) {
      const sebProfile = ESTONIAN_BANK_PROFILES.find(p => p.id === 'seb')
      if (sebProfile) return sebProfile
    }
    
    if (sampleRow.match(coopArchivePattern)) {
      const coopProfile = ESTONIAN_BANK_PROFILES.find(p => p.id === 'coop')
      if (coopProfile) return coopProfile
    }
  }
  
  // Pattern 5: Use scoring system as fallback
  let bestMatch: { profile: BankProfile; score: number } | null = null

  for (const profile of ESTONIAN_BANK_PROFILES) {
    let score = 0
    
    // Check each column type
    Object.entries(profile.columnMapping).forEach(([_columnType, possibleNames]) => {
      for (const header of normalizedHeaders) {
        for (const possibleName of possibleNames) {
          if (header === possibleName || header.includes(possibleName) || possibleName.includes(header)) {
            score += 1
            break
          }
        }
      }
    })

    // Bonus points for bank name matches in headers
    const bankNameLower = profile.name.toLowerCase()
    if (normalizedHeaders.some(h => h.includes(bankNameLower))) {
      score += 10
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { profile, score }
    }
  }

  // Only return if we have a reasonable match (at least 2 columns matched)
  if (bestMatch && bestMatch.score >= 2) {
    return bestMatch.profile
  }

  return null
}

/**
 * Get column index from headers using bank profile
 */
export function getColumnIndexFromProfile(
  headers: string[],
  profile: BankProfile,
  columnType: keyof BankProfile['columnMapping']
): number | null {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/^["']+/, '').replace(/["']+$/, ''))
  const possibleNames = profile.columnMapping[columnType] || []

  // First pass: try exact matches (more specific)
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const header = normalizedHeaders[i]
    for (const possibleName of possibleNames) {
      if (header === possibleName) {
        return i
      }
    }
  }

  // Second pass: try partial matches (less specific)
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const header = normalizedHeaders[i]
    for (const possibleName of possibleNames) {
      if (header.includes(possibleName) || possibleName.includes(header)) {
        return i
      }
    }
  }

  return null
}

/**
 * Create column mapping from bank profile
 */
export function createColumnMappingFromProfile(
  headers: string[],
  profile: BankProfile
): any {
  const mapping: any = {
    type: null,
    description: null,
    amount: null,
    category: null,
    date: null,
    _foundColumns: [],
    _allHeaders: headers,
    _normalizedHeaders: headers.map(h => {
      let header = h.trim()
      header = header.replace(/^["']+/, '').replace(/["']+$/, '')
      return header.toLowerCase()
    }),
  }

  // Map each column type
  if (profile.columnMapping.date) {
    const index = getColumnIndexFromProfile(headers, profile, 'date')
    if (index !== null) {
      mapping.date = index
      mapping._foundColumns.push(`date: "${headers[index]}"`)
    }
  }

  if (profile.columnMapping.amount) {
    const index = getColumnIndexFromProfile(headers, profile, 'amount')
    if (index !== null) {
      mapping.amount = index
      mapping._foundColumns.push(`amount: "${headers[index]}"`)
    }
  }

  if (profile.columnMapping.description) {
    const index = getColumnIndexFromProfile(headers, profile, 'description')
    if (index !== null) {
      mapping.description = index
      mapping._foundColumns.push(`description: "${headers[index]}"`)
    }
  }

  if (profile.columnMapping.type) {
    const index = getColumnIndexFromProfile(headers, profile, 'type')
    if (index !== null) {
      mapping.type = index
      mapping._foundColumns.push(`type: "${headers[index]}"`)
    }
  }

  if (profile.columnMapping.recipientName) {
    const index = getColumnIndexFromProfile(headers, profile, 'recipientName')
    if (index !== null) {
      mapping._recipientName = index
      mapping._foundColumns.push(`recipientName: "${headers[index]}"`)
    }
  }

  if (profile.columnMapping.referenceNumber) {
    const index = getColumnIndexFromProfile(headers, profile, 'referenceNumber')
    if (index !== null) {
      mapping._referenceNumber = index
      mapping._foundColumns.push(`referenceNumber: "${headers[index]}"`)
    }
  }

  if (profile.columnMapping.archiveId) {
    const index = getColumnIndexFromProfile(headers, profile, 'archiveId')
    if (index !== null) {
      mapping._archiveId = index
      mapping._foundColumns.push(`archiveId: "${headers[index]}"`)
    }
  }

  if (profile.columnMapping.selgitus) {
    const index = getColumnIndexFromProfile(headers, profile, 'selgitus')
    if (index !== null) {
      mapping._selgitus = index
      mapping._foundColumns.push(`selgitus: "${headers[index]}"`)
    }
  }

  return mapping
}

