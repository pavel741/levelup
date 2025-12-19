// CSV Import Utility - TypeScript version

type ColumnMapping = {
  type: number | null
  description: number | null
  amount: number | null
  category: number | null
  date: number | null
  _recipientName?: number
  _referenceNumber?: number
  _archiveId?: number
  _selgitus?: number  // Estonian "description" field
  _foundColumns: string[]
  _allHeaders: string[]
  _normalizedHeaders: string[]
}

export class CSVImportService {
  private _debugLogged = false

  /**
   * Detect CSV delimiter (comma or semicolon)
   */
  detectDelimiter(firstLine: string): string {
    const semicolonCount = (firstLine.match(/;/g) || []).length
    const commaCount = (firstLine.match(/,/g) || []).length
    return semicolonCount > commaCount ? ';' : ','
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  parseCSVLine(line: string, delimiter: string = ','): string[] {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
    values.push(current)
    return values
  }

  /**
   * Map CSV headers to expected columns
   */
  mapColumns(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {
      type: null,
      description: null,
      amount: null,
      category: null,
      date: null,
      _foundColumns: [],
      _allHeaders: headers,
      _normalizedHeaders: [],
    }

    const normalizedHeaders = headers.map((h) => {
      let header = h.trim()
      header = header.replace(/^["']+/, '').replace(/["']+$/, '')
      return header.toLowerCase()
    })
    mapping._normalizedHeaders = normalizedHeaders

    normalizedHeaders.forEach((normalized, index) => {
      const header = headers[index]

      if (
        normalized.includes('type') ||
        normalized.includes('transaction') ||
        normalized === 't' ||
        normalized === 'txn' ||
        normalized === 'tx' ||
        normalized.includes('deebet') ||
        normalized.includes('kreedit') ||
        normalized.includes('debit') ||
        normalized.includes('credit')
      ) {
        if (mapping.type === null) {
          mapping.type = index
          mapping._foundColumns.push(`type: "${header}"`)
        }
      } else if (
        normalized === 'saaja/maksja nimi' ||
        normalized === 'saaja maksja nimi' ||
        normalized === 'saaja nimi' ||
        normalized === 'maksja nimi' ||
        (normalized.includes('saaja') && normalized.includes('nimi')) ||
        (normalized.includes('maksja') && normalized.includes('nimi'))
      ) {
        if (mapping._recipientName === undefined) {
          mapping._recipientName = index
          mapping._foundColumns.push(`recipient/payer name: "${header}"`)
        }
      } else         if (normalized === 'selgitus' || normalized.includes('selgitus')) {
          // Map selgitus to its own field, not category
          if (mapping._selgitus === undefined) {
            mapping._selgitus = index
            mapping._foundColumns.push(`selgitus: "${header}"`)
          }
          // Also use it as category if category is not already set
          if (mapping.category === null) {
            mapping.category = index
            mapping._foundColumns.push(`category (selgitus): "${header}"`)
          }
        } else if (
        normalized.includes('category') ||
        normalized.includes('cat') ||
        normalized.includes('tag') ||
        normalized === 'c' ||
        normalized.includes('kategooria')
      ) {
        if (mapping.category === null) {
          mapping.category = index
          mapping._foundColumns.push(`category: "${header}"`)
        }
      } else if (
        normalized.includes('description') ||
        normalized.includes('desc') ||
        normalized.includes('note') ||
        normalized.includes('memo') ||
        normalized.includes('details') ||
        normalized.includes('item') ||
        normalized === 'd' ||
        normalized === 'n'
      ) {
        if (mapping.description === null) {
          mapping.description = index
          mapping._foundColumns.push(`description: "${header}"`)
        }
      } else if (
        normalized.includes('name') &&
        !normalized.includes('saaja') &&
        !normalized.includes('maksja')
      ) {
        if (mapping.description === null) {
          mapping.description = index
          mapping._foundColumns.push(`description: "${header}"`)
        }
      } else if (normalized.includes('kliendi nimi')) {
        if (mapping.description === null) {
          mapping.description = index
          mapping._foundColumns.push(`description: "${header}"`)
        }
      } else if (
        normalized.includes('amount') ||
        normalized.includes('value') ||
        normalized.includes('sum') ||
        normalized.includes('price') ||
        normalized.includes('cost') ||
        normalized.includes('total') ||
        normalized === 'a' ||
        normalized === 'amt' ||
        normalized === 'summa' ||
        normalized.includes('summa')
      ) {
        if (mapping.amount === null) {
          mapping.amount = index
          mapping._foundColumns.push(`amount: "${header}"`)
        }
      } else if (
        normalized.includes('date') ||
        normalized.includes('time') ||
        normalized.includes('when') ||
        normalized.includes('timestamp') ||
        normalized === 'dt' ||
        normalized.includes('kuupäev')
      ) {
        if (mapping.date === null) {
          mapping.date = index
          mapping._foundColumns.push(`date: "${header}"`)
        }
      } else if (
        normalized === 'viitenumber' ||
        normalized.includes('viitenumber') ||
        normalized.includes('reference') ||
        normalized.includes('ref') ||
        normalized === 'ref' ||
        normalized === 'refnum'
      ) {
        if (mapping._referenceNumber === undefined) {
          mapping._referenceNumber = index
          mapping._foundColumns.push(`reference number: "${header}"`)
        }
      } else if (
        normalized === 'arhiveerimistunnus' ||
        normalized.includes('arhiveerimistunnus') ||
        (normalized.includes('archive') && normalized.includes('id')) ||
        normalized === 'archiveid' ||
        normalized === 'archive_id' ||
        (normalized.includes('unique') && normalized.includes('id'))
      ) {
        if (mapping._archiveId === undefined) {
          mapping._archiveId = index
          mapping._foundColumns.push(`archive ID: "${header}"`)
        }
      }
    })

    return mapping
  }

  /**
   * Normalize date string to YYYY-MM-DD format
   */
  normalizeDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0]

    dateStr = dateStr.trim().replace(/^["']|["']$/g, '')

    // Try Estonian format with time: DD.MM.YYYY HH:MM:SS
    const estonianWithTime = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/
    const timeMatch = dateStr.match(estonianWithTime)
    if (timeMatch) {
      const day = String(timeMatch[1]).padStart(2, '0')
      const month = String(timeMatch[2]).padStart(2, '0')
      const year = timeMatch[3]
      const date = new Date(`${year}-${month}-${day}`)
      if (
        !isNaN(date.getTime()) &&
        date.getDate() == parseInt(timeMatch[1]) &&
        date.getMonth() + 1 == parseInt(timeMatch[2])
      ) {
        return `${year}-${month}-${day}`
      }
    }

    // Try Estonian format: DD.MM.YYYY or DD/MM/YYYY
    const estonianFormat = /^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/
    const estonianMatch = dateStr.match(estonianFormat)
    if (estonianMatch) {
      const day = String(estonianMatch[1]).padStart(2, '0')
      const month = String(estonianMatch[2]).padStart(2, '0')
      const year = estonianMatch[3]
      const date = new Date(`${year}-${month}-${day}`)
      if (
        !isNaN(date.getTime()) &&
        date.getDate() == parseInt(estonianMatch[1]) &&
        date.getMonth() + 1 == parseInt(estonianMatch[2])
      ) {
        return `${year}-${month}-${day}`
      }
    }

    // Try ISO format: YYYY-MM-DD
    const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/
    if (isoFormat.test(dateStr)) {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return dateStr
      }
    }

    // Try JavaScript Date parsing as fallback
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return new Date().toISOString().split('T')[0]
  }

  /**
   * Map CSV row to transaction object
   */
  mapRowToTransaction(
    row: Record<string, string>,
    columnMap: ColumnMapping
  ): {
    type: string
    description: string
    amount: number
    category: string
    date: string
    archiveId?: string
    referenceNumber?: string
    recipientName?: string
    selgitus?: string
  } {
    const headers = columnMap._normalizedHeaders || Object.keys(row)

    const getValue = (columnIndex: number | null | undefined): string | null => {
      if (columnIndex === null || columnIndex === undefined) return null
      const headerName = headers[columnIndex]
      if (!headerName) return null
      return row[headerName] || null
    }

    let type = getValue(columnMap.type)
    let description = getValue(columnMap.description)
    const amount = getValue(columnMap.amount)
    let category = getValue(columnMap.category)
    const recipientName =
      columnMap._recipientName !== undefined ? getValue(columnMap._recipientName) : null
    const referenceNumber =
      columnMap._referenceNumber !== undefined ? getValue(columnMap._referenceNumber) : null
    const archiveId = columnMap._archiveId !== undefined ? getValue(columnMap._archiveId) : null
    const selgitus = columnMap._selgitus !== undefined ? getValue(columnMap._selgitus) : null
    let date = getValue(columnMap.date)

    // Normalize type
    if (type) {
      type = type.toLowerCase().trim()
      if (
        type === 'income' ||
        type === 'in' ||
        type === 'i' ||
        type === '+' ||
        type === 'kreedit' ||
        type === 'credit' ||
        type === 'c' ||
        type === 'cr'
      ) {
        type = 'income'
      } else if (
        type === 'expense' ||
        type === 'exp' ||
        type === 'out' ||
        type === 'e' ||
        type === '-' ||
        type === 'deebet' ||
        type === 'debit' ||
        type === 'd' ||
        type === 'dr'
      ) {
        type = 'expense'
      } else {
        const amountNum = parseFloat(amount || '0')
        type = amountNum >= 0 ? 'income' : 'expense'
      }
    } else {
      const amountNum = parseFloat(amount || '0')
      type = amountNum >= 0 ? 'income' : 'expense'
    }

    // Use default description if not found
    if (!description || description.trim().length === 0) {
      if (recipientName && recipientName.trim().length > 0) {
        description = recipientName.trim()
      } else {
        description = 'Imported transaction'
      }
    }

    // Category handling - ALWAYS use smart categorization, even if category is provided
    // This ensures we don't use descriptions as categories
    const { getSuggestedCategory } = require('./transactionCategorizer')
    
    // Check if the provided category looks like a description (should be recategorized)
    const providedCategory = category && category.trim().length > 0 ? category.trim() : ''
    const looksLikeDescription = 
      providedCategory.includes('POS:') ||
      providedCategory.match(/\d{4}\s+\d{2}\*+/) ||
      providedCategory.includes('/') ||
      providedCategory.includes('\\') ||
      providedCategory.length > 50 ||
      providedCategory.match(/^[A-Z0-9\s#\/\\-]+$/) && providedCategory.length > 20 // Long alphanumeric strings
    
    // Always try to get a smart category
    const suggestedCategory = getSuggestedCategory(
      description,
      referenceNumber || undefined,
      recipientName || undefined,
      parseFloat(amount || '0')
    )
    
    if (suggestedCategory) {
      // Use suggested category if available
      category = suggestedCategory
    } else if (!looksLikeDescription && providedCategory && providedCategory !== 'Other') {
      // Use provided category only if it doesn't look like a description
      category = providedCategory
    } else {
      // Fallback to old logic for backward compatibility
      const descriptionLower = (description || '').toLowerCase()
      if (descriptionLower.includes('iseteenindus.energia')) {
        category = 'Bills'
      } else if (descriptionLower.includes('makse') || descriptionLower.includes('payment')) {
        category = 'Bills'
      } else if (recipientName && recipientName.trim().toLowerCase().startsWith('kaart')) {
        category = 'Card Payment'
      } else {
        category = 'Other'
      }
    }

    // Parse and normalize date
    if (date) {
      date = this.normalizeDate(date)
    } else {
      date = new Date().toISOString().split('T')[0]
    }

    // Parse amount - handle Estonian number format and negative amounts
    let amountNum = 0
    if (amount) {
      let cleaned = amount.toString().trim()
      // Check if amount starts with "-" or contains negative indicator
      const isNegative = cleaned.startsWith('-') || cleaned.startsWith('−') || cleaned.includes('−')
      
      if (cleaned.includes(',') && cleaned.includes(' ')) {
        cleaned = cleaned.replace(/\s/g, '').replace(',', '.')
      } else if (cleaned.includes(',')) {
        const commaIndex = cleaned.indexOf(',')
        const afterComma = cleaned.substring(commaIndex + 1)
        if (afterComma.length <= 2 && /^\d+$/.test(afterComma)) {
          cleaned = cleaned.replace(',', '.')
        } else {
          cleaned = cleaned.replace(/,/g, '')
        }
      } else {
        cleaned = cleaned.replace(/\s/g, '')
      }
      cleaned = cleaned.replace(/[^\d.-]/g, '')
      amountNum = parseFloat(cleaned)
      if (isNaN(amountNum)) {
        amountNum = 0
      }
      
      // If amount is negative or has negative indicator, ensure type is expense
      if (amountNum < 0 || isNegative) {
        type = 'expense'
        // Keep negative sign for expenses
        if (amountNum > 0 && isNegative) {
          amountNum = -amountNum
        }
      } else if (amountNum > 0 && !type) {
        // If positive and no type specified, default to income
        type = 'income'
      }
    }

    const transaction: {
      type: string
      description: string
      amount: number
      category: string
      date: string
      archiveId?: string
      referenceNumber?: string
      recipientName?: string
      selgitus?: string
    } = {
      type: type || 'expense',
      description: description.trim() || 'Imported transaction',
      // Preserve negative amounts for expenses, positive for income
      amount: amountNum,
      category: (category && category.trim()) ? category.trim() : 'Other',
      date: date,
    }

    if (archiveId && archiveId.trim().length > 0) {
      transaction.archiveId = archiveId.trim()
    }
    if (referenceNumber && referenceNumber.trim().length > 0) {
      transaction.referenceNumber = referenceNumber.trim()
    }
    if (recipientName && recipientName.trim().length > 0) {
      transaction.recipientName = recipientName.trim()
    }
    if (selgitus && selgitus.trim().length > 0) {
      transaction.selgitus = selgitus.trim()
    }

    return transaction
  }

  /**
   * Parse CSV file content
   */
  parseCSV(csvText: string): {
    transactions: Array<{
      type: string
      description: string
      amount: number
      category: string
      date: string
      archiveId?: string
      referenceNumber?: string
      recipientName?: string
      selgitus?: string
    }>
    columnMapping: ColumnMapping
  } {
    const lines = csvText.split('\n').filter((line) => line.trim())
    if (lines.length === 0) {
      throw new Error('CSV file is empty')
    }

    console.log(`📊 CSV parsing: Found ${lines.length} total lines (including header)`)

    const delimiter = this.detectDelimiter(lines[0])
    const headers = this.parseCSVLine(lines[0], delimiter)
    const normalizedHeaders = headers.map((h) => {
      let header = h.trim()
      header = header.replace(/^["']+/, '').replace(/["']+$/, '')
      return header.toLowerCase()
    })

    const columnMap = this.mapColumns(headers)
    columnMap._normalizedHeaders = normalizedHeaders
    columnMap._allHeaders = headers

    if (columnMap.amount === null) {
      throw new Error(`Could not find amount column. Found columns: ${headers.join(', ')}`)
    }

    const rows: Array<{
      type: string
      description: string
      amount: number
      category: string
      date: string
      archiveId?: string
      referenceNumber?: string
      recipientName?: string
    }> = []

    let skippedRows = 0
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter)
      if (values.length === 0 || values.every((v) => !v.trim())) {
        skippedRows++
        continue
      }

      const row: Record<string, string> = {}
      normalizedHeaders.forEach((header, index) => {
        let value = values[index]?.trim() || ''
        value = value.replace(/^["']+/, '').replace(/["']+$/, '')
        row[header] = value
      })

      rows.push(this.mapRowToTransaction(row, columnMap))
    }

    console.log(`✅ CSV parsing complete: ${rows.length} transactions parsed, ${skippedRows} empty rows skipped`)

    this._debugLogged = false

    return {
      transactions: rows,
      columnMapping: columnMap,
    }
  }
}

