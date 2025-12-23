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
    id: 'seb',
    name: 'SEB',
    displayName: 'SEB Pank',
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
      recipientName: ['saaja', 'recipient', 'saaja nimi', 'maksja nimi'],
      referenceNumber: ['viitenumber', 'reference', 'viitenr', 'ref'],
      archiveId: ['arhiveerimistunnus', 'archive id', 'archiveid'],
      selgitus: ['selgitus', 'details', 'lisainfo'],
    },
    delimiter: ';',
    dateFormat: 'DD.MM.YYYY',
    amountFormat: 'comma',
  },
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
 * Detect which bank profile matches the CSV headers
 */
export function detectBankProfile(headers: string[]): BankProfile | null {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/^["']+/, '').replace(/["']+$/, ''))
  
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

    // Bonus points for exact bank name matches in headers
    const bankNameLower = profile.name.toLowerCase()
    if (normalizedHeaders.some(h => h.includes(bankNameLower))) {
      score += 5
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

  for (let i = 0; i < normalizedHeaders.length; i++) {
    const header = normalizedHeaders[i]
    for (const possibleName of possibleNames) {
      if (header === possibleName || header.includes(possibleName) || possibleName.includes(header)) {
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
    _normalizedHeaders: headers.map(h => h.trim().toLowerCase()),
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

